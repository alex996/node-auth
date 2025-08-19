import bcrypt from "bcrypt";
import type { Express, Request } from "express";
import crypto from "node:crypto";
import type { SendMailOptions } from "nodemailer";
import * as z from "zod";
import { env, TOKEN_EXPIRES_IN_HRS, WEB_ORIGIN } from "../config.js";
import { db, type ResetToken } from "../db.js";
import { auth, guest, validate } from "../middleware.js";
import { prehash, zodEmail, zodPassword } from "./auth.js";
import { addHours, sendEmail, zod32Bytes } from "./email.js";

export async function passwordRoutes(app: Express) {
  app.post(
    "/password/email",
    guest,
    validate({
      body: z.strictObject({
        email: zodEmail,
      }),
    }),
    async (req, res) => {
      // Beware of email enumeration.
      const userId = db
        .prepare<string, number>(`select id from users where email = ?`)
        .pluck()
        .get(req.body.email);
      if (!userId) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Email not found",
            path: ["body", "email"],
          },
        ]);
      }

      const token = crypto.randomBytes(32);
      const expDate = addHours(new Date(), TOKEN_EXPIRES_IN_HRS);

      // We treat reset tokens like passwords, so we don't store them in plaintext.
      const tokenHash = signToken(token);

      // FIXME you probably want to store tokens in a key-value store with auto-expiration
      db.prepare("insert into reset_tokens values (null, ?, ?, ?)").run(
        userId,
        tokenHash,
        expDate.getTime()
      );

      sendEmail(
        req.app.locals.mailer,
        passwordResetEmail(req.body.email, token.toString("base64url"), userId)
      );

      res.json({ message: "OK" });
    }
  );

  app.post(
    "/password/reset",
    guest,
    validate({
      body: z.strictObject({
        id: z.number().int().positive(),
        token: zod32Bytes,
        password: zodPassword,
      }),
    }),
    async (req, res) => {
      const { id, token, password } = req.body;

      const tokenHash = signToken(Buffer.from(token, "base64url"));

      // where body = ? is not timing-safe.
      const userTokens = db
        .prepare<number, ResetToken>(
          `select * from reset_tokens where user_id = ?`
        )
        .all(id);
      const resetToken = userTokens.find((t) =>
        crypto.timingSafeEqual(t.body, tokenHash)
      ); // TODO change to timing-safe for/of without break?

      if (!resetToken) {
        return res.status(400).json({ message: "Token is invalid" });
      }
      if (resetToken.expired_at <= Date.now()) {
        return res.status(400).json({ message: "Token has expired" });
      }

      const hash = await bcrypt.hash(prehash(password), env.BCRYPT_COST_FACTOR);
      db.prepare("update users set password_hash = ? where id = ?").run(
        hash,
        id
      );

      // Invalidate all user reset tokens
      db.prepare("delete from reset_tokens where user_id = ?").run(id);

      destroyAllUserSessions(req, id);

      res.json({ message: "OK" });
    }
  );

  // TODO
  // app.post("/password/change", auth, validate({}), async (req, res) => {})

  app.post(
    "/password/confirm",
    auth,
    validate({
      body: z.strictObject({
        password: zodPassword,
      }),
    }),
    async (req, res) => {
      const hash = db
        .prepare<number, string>(`select password_hash from users where id = ?`)
        .pluck()
        .get(req.session.userId!)!;

      const matches = await bcrypt.compare(prehash(req.body.password), hash);
      if (!matches) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Password is incorrect",
            path: ["body", "password"],
          },
        ]);
      }

      req.session.confirmedAt = Date.now();

      res.json({ message: "OK" });
    }
  );
}

const signToken = (token: Buffer) =>
  crypto.createHmac("sha256", env.SIGNING_KEY).update(token).digest();

function passwordResetEmail(
  to: string,
  token: string,
  userId: number
): SendMailOptions {
  const url = `${WEB_ORIGIN}/password/reset?id=${userId}&token=${token}`;
  return {
    from: env.MAIL_FROM,
    to,
    subject: "Reset your password",
    html: `
      <p>To reset your password, click the link below.</p>
      <a href="${url}">${url}</a>
    `.trim(),
  };
}

// FIXME don't use MemoryStore in production. For example,
// in Redis, you can scan for keys by pattern and delete them
// https://stackoverflow.com/a/23399125
export function destroyAllUserSessions(req: Request, userId: number) {
  // @ts-expect-error
  for (const key in req.sessionStore.sessions) {
    if (key.startsWith(`${userId}-`)) {
      req.sessionStore.destroy(key);
    }
  }
}
