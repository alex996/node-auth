import type { Express } from "express";
import crypto from "node:crypto";
import type { SendMailOptions } from "nodemailer";
import * as z from "zod";
import {
  env,
  LINK_EXPIRES_IN_HRS,
  ONE_HOUR_MS,
  WEB_ORIGIN,
  type Mailer,
} from "../config.js";
import { db, type User } from "../db.js";
import { auth, validate } from "../middleware.js";

export const zod32Bytes = z
  .string()
  .length(43) // base64url, 44 - 1 (padding)
  .regex(/^[\w\-]*$/, { error: "Invalid string: must be alphanumeric" }); // https://stackoverflow.com/a/6102251

// There may be reasons not to put these routes behind `auth`.
// Ex: you don't want to log the user in until they're verified.
export function emailRoutes(app: Express) {
  app.post(
    "/email/verify",
    auth,
    validate({
      body: z.strictObject({
        expiredAt: z.number().int().positive(), // Unix
        signature: zod32Bytes,
      }),
    }),
    (req, res) => {
      const { expiredAt, signature } = req.body;
      const userId = req.session.userId!;

      const url = verificationUrl(userId, expiredAt);

      if (!safeEqual(signature, urlSignature(url))) {
        return res.status(400).json({ message: "URL is invalid" });
      }

      if (expiredAt <= Date.now()) {
        return res.status(400).json({ message: "URL has expired" });
      }

      const verifiedAt = new Date().getTime();
      const updateResult = db
        .prepare(
          "update users set verified_at = ? where id = ? and verified_at is null"
        )
        .run(verifiedAt, userId);
      if (updateResult.changes !== 1) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      res.json(verifiedAt);
    }
  );

  // Adding `auth` precludes email enumeration; otherwise, you need to handle it.
  app.post("/email/resend", auth, async (req, res) => {
    const user = db
      .prepare<number, User>("select * from users where id = ?")
      .get(req.session.userId!)!;

    if (user.verified_at) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    sendEmail(req.app.locals.mailer, verificationEmail(user.email, user.id));

    res.json({ message: "OK" });
  });
}

export function verificationEmail(to: string, userId: number): SendMailOptions {
  const url = signUrl(verificationUrl(userId));

  return {
    from: env.MAIL_FROM,
    to,
    subject: "Confirm your email",
    html: `
      <p>To verify your email, click the link below.</p>
      <a href="${url}">${url}</a>
    `.trim(),
  };
}

export function verificationUrl(userId: number, expiredAtMs?: number) {
  if (!expiredAtMs) {
    const expDate = addHours(new Date(), LINK_EXPIRES_IN_HRS);
    expiredAtMs = expDate.getTime();
  }
  return `${WEB_ORIGIN}/email/verify?id=${userId}&expiredAt=${expiredAtMs}`;
}

export function signUrl(url: string) {
  const delimiter = url.includes("?") ? "&" : "?";
  return `${url}${delimiter}signature=${urlSignature(url)}`;
}

// "When encoding a Buffer to a string, this encoding will omit padding."
// https://nodejs.org/api/buffer.html#buffers-and-character-encodings
const urlSignature = (url: string) =>
  crypto.createHmac("sha256", env.SIGNING_KEY).update(url).digest("base64url");

export async function sendEmail(mailer: Mailer, mailOpts: SendMailOptions) {
  if (env.DEV_QUIET) {
    console.log(mailOpts);
    return;
  }
  try {
    return await mailer.sendMail(mailOpts); // await is on purpose https://stackoverflow.com/a/42750371
  } catch (e) {
    console.error(e);
  }
}

export function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  // crypto.timingSafeEqual() requires buffers of the same length.
  // We short-circuit when they have unequal lengths. This will leak
  // the length of our secret string. However, this function is intended
  // for hashes, which have fixed length depending on the algorithm.
  // https://github.com/nodejs/node/issues/17178
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Works with DST unlike setHours https://stackoverflow.com/a/35175523
export function addHours(date: Date, hours: number) {
  date.setTime(date.getTime() + hours * ONE_HOUR_MS);
  return date;
}
