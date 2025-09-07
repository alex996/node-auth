import bcrypt from "bcrypt";
import type { Express, Request, Response } from "express";
import crypto from "node:crypto";
import * as z from "zod";
import { COOKIE_OPTS, env } from "../config.js";
import { db, serializeUser, type User } from "../db.js";
import { auth, guest, validate } from "../middleware.js";
import { sendEmail, verificationEmail } from "./email.js";

export const zodEmail = z.email().max(254).trim(); // https://stackoverflow.com/a/574698

export const zodPassword = z.string().max(255);

export async function authRoutes(app: Express) {
  const emailAndPassword = z.strictObject({
    email: zodEmail,
    password: zodPassword,
  });

  app.post(
    "/register",
    guest,
    validate({
      body: z.strictObject({
        ...emailAndPassword.shape,
        name: z.string().max(255).trim(),
      }),
    }),
    async (req, res) => {
      const { name, email, password } = req.body;

      const exists = db
        .prepare<string, 1>(`select 1 from users where email = ?`)
        .pluck()
        .get(email);
      if (exists === 1) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Email is already taken",
            path: ["body", "email"],
          },
        ]);
      }

      const hash = await bcrypt.hash(prehash(password), env.BCRYPT_COST_FACTOR);

      const user = db
        .prepare<string[], User>(
          "insert into users values (null, ?, ?, ?, null) returning *"
        )
        .get(name, email, hash)!;

      sendEmail(req.app.locals.mailer, verificationEmail(email, user.id));

      logIn(user, req, res);
    },
    // Here's a different approach, to prevent enumeration attacks.
    // (DEAD CODE, not commented for type checking).
    // https://security.stackexchange.com/q/47679
    // https://security.stackexchange.com/q/69370
    async (req, res) => {
      const { name, email, password } = req.body;

      const hash = await bcrypt.hash(prehash(password), env.BCRYPT_COST_FACTOR);

      const insertResult = db
        .prepare(
          "insert into users values (null, ?, ?, ?, null) on conflict (email) do nothing"
        )
        .run(name, email, hash);

      // We don't create a session because it would give away the user was just created.
      res.json({ message: "OK" });

      if (insertResult.changes === 1) {
        const userId = db
          .prepare<string, number>("select id from users where email = ?")
          .pluck()
          .get(email)!; // use then/catch instead of await
        sendEmail(req.app.locals.mailer, verificationEmail(email, userId));
      }
      // If the user already exists, don't send any email because this could be abused.
    }
  );

  app.post(
    "/login",
    guest,
    validate({
      body: emailAndPassword,
    }),
    async (req, res) => {
      const { email, password } = req.body;

      const user = db
        .prepare<string, User>("select * from users where email = ?")
        .get(email);
      if (!user) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Email is incorrect",
            path: ["body", "email"],
          },
        ]);
      }

      // bcrypt.compare() is not timing-safe, but it need not be.
      // https://github.com/kelektiv/node.bcrypt.js/issues/720
      // The generated hash can't be predicted, so the attacker
      // can't learn anything from the time of this comparison.
      // https://github.com/bcrypt-ruby/bcrypt-ruby/pull/43
      const matches = await bcrypt.compare(
        prehash(password),
        user.password_hash
      );
      if (!matches) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Password is incorrect",
            path: ["body", "password"],
          },
        ]);
      }

      logIn(user, req, res);
    },
    // Here's a different approach, to prevent enumeration attacks.
    // (DEAD CODE, not commented for type checking).
    async (req, res) => {
      const { email, password } = req.body;

      const user = db
        .prepare<string, User>("select * from users where email = ?")
        .get(email);

      // const fallbackHash = await bcrypt.hash("whatever", env.BCRYPT_COST_FACTOR);
      const fallbackHash =
        "$2b$12$VktGc1bsLO8th6pEgSOFROA4UkZ0otVZViRWwMAaTcqfJOtjE2aaK";
      const hash = user?.password_hash || fallbackHash;
      const pwdMatches = await bcrypt.compare(prehash(password), hash);

      // && and || operators short-circuit (return early).
      // Use bitwise & and | for a constant-time comparison.
      if (+!user | +!pwdMatches) {
        return res.status(401).json({ message: "Incorrect email or password" });
      }

      logIn(user!, req, res);
    }
  );

  app.post("/logout", auth, logOut);
}

/*
  Bcrypt uses only the first 72 bytes, any extra bytes are ignored:
  https://github.com/kelektiv/node.bcrypt.js#security-issues-and-concerns
  A user could log in even if the remainder of the password doesn't match.

  To prevent this, you can limit the password length to 72 bytes:
  - Zod: z.string().refine((val) => Buffer.byteLength(val) <= 72)
    - Note that .max() compares characters, not bytes https://github.com/colinhacks/zod/issues/3355
  - Valibot: v.maxBytes(72)
  - Joi: Joi.string().max(72, "utf8")

  To allow longer passwords, you can prehash them https://security.stackexchange.com/q/6623
  SHA256 always produces a string that's 256 bits (32 bytes) long.
  In base64, that's ceil(32 / 3) * 4 = 44 bytes which meets the 72 byte limit.
*/
export const prehash = (password: string) =>
  crypto.createHash("sha256").update(password).digest("base64");

// https://github.com/expressjs/session/issues/865
function logIn(user: User, req: Request, res: Response) {
  // A new session is created on each request (but is not saved
  // unless saveUninitialized is true).
  // When genid() was called, req.session.userId was undefined.
  req.session.userId = user.id;
  // Now genid() will use req.session.userId we've just set.
  req.session.regenerate((err) => {
    if (err) throw err;

    // The new session is uninitialized, we need to repopulate it.
    req.session.userId = user.id;

    res.json(serializeUser(user));
  });
}

export function logOut(req: Request, res: Response) {
  req.session.destroy((err) => {
    if (err) throw err;

    // https://expressjs.com/en/5x/api.html#res.clearCookie
    res.clearCookie(env.SESSION_COOKIE_NAME, COOKIE_OPTS);

    res.json({ message: "OK" });
  });
}
