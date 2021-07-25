import { Router } from "express";
import dayjs from "dayjs";
import { SendMailOptions } from "nodemailer";
import { validate, verifyEmailSchema, resendEmailSchema } from "../validation";
import { db } from "../db";
import { safeEqual, hmacSha256, compress } from "../utils";
import {
  APP_ORIGIN,
  APP_SECRET,
  MAIL_EXPIRES_IN_DAYS,
  MAIL_FROM,
} from "../config";

const router = Router();

// Email verification

// NOTE both routes could be behind `auth` middleware in which case
// we wouldn't need to ask for the user ID or email.
router.post("/email/verify", validate(verifyEmailSchema), (req, res) => {
  const { id, expires } = req.query;

  const expectedUrl = confirmationUrl(Number(id), Number(expires));
  const actualUrl = `${APP_ORIGIN}${req.originalUrl}`;

  if (!safeEqual(expectedUrl, actualUrl)) {
    return res.status(400).json({ message: "URL is invalid" });
  }

  if (Number(expires) <= Date.now()) {
    return res.status(400).json({ message: "URL has expired" });
  }

  const user = db.users.find((user) => user.id === Number(id));

  if (!user || user.verifiedAt) {
    return res
      .status(400)
      .json({ message: "Email is incorrect or already verified" });
  }

  user.verifiedAt = new Date().toISOString();

  res.json({ message: "OK" });
});

// Email resend

router.post("/email/resend", validate(resendEmailSchema), async (req, res) => {
  const { email } = req.body;
  const user = db.users.find((user) => user.email === email);

  if (!user || user.verifiedAt) {
    return res
      .status(400)
      .json({ message: "Email is incorrect or already verified" });
  }

  const { mailer } = req.app.locals;
  await mailer.sendMail(confirmationEmail(email, user.id));

  res.json({ message: "OK" });
});

// Utils

export function confirmationUrl(userId: number, expiresInMs?: number) {
  expiresInMs =
    expiresInMs || dayjs().add(MAIL_EXPIRES_IN_DAYS, "day").valueOf();

  const url = `${APP_ORIGIN}/email/verify?id=${userId}&expires=${expiresInMs}`;
  const signature = hmacSha256(url, APP_SECRET); // 256 bits = 32 bytes, 32 * 2 = 64 chars

  return `${url}&signature=${signature}`;
}

export function confirmationEmail(to: string, userId: number): SendMailOptions {
  const url = confirmationUrl(userId);

  return {
    from: MAIL_FROM,
    to,
    subject: "Confirm your email",
    html: compress(`
      <p>To verify your email, POST to the link below.</p>
      <a href="${url}">${url}</a>
    `), // TODO should be a link to the front-end
  };
}

export { router as email };
