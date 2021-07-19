import { Router } from "express";
import { createHmac } from "crypto";
import dayjs from "dayjs";
import { validate, verifyEmailSchema, resendEmailSchema } from "../validation";
import { db } from "../db";
import { safeEqual } from "../utils";
import { EMAIL_EXPIRATION_DAYS, APP_ORIGIN, APP_KEY } from "../config";

const router = Router();

// Email verification

router.post("/email/verify", validate(verifyEmailSchema), (req, res) => {
  const { id, expires } = req.query;
  const user = db.users.find((user) => user.id === Number(id));

  if (!user || user.verifiedAt) {
    return res
      .status(400)
      .json({ message: "Email is invalid or already verified" });
  }

  const expectedUrl = confirmationUrl(Number(id), Number(expires));
  const actualUrl = `${APP_ORIGIN}${req.originalUrl}`;

  if (!safeEqual(expectedUrl, actualUrl)) {
    return res.status(400).json({ message: "URL is invalid" });
  }

  if (Number(expires) <= Date.now()) {
    res.status(400).json({ message: "URL has expired" });
  }

  user.verifiedAt = new Date().toISOString();

  res.json({ message: "OK" });
});

// Email resend

router.post("/email/resend", validate(resendEmailSchema), (req, res) => {
  const { email } = req.body;
  const user = db.users.find((user) => user.email === email);

  if (!user || user.verifiedAt) {
    return res
      .status(400)
      .json({ message: "Email is invalid or already verified" });
  }

  // TODO resend email

  res.json({ message: "OK" });
});

// Utils

export function confirmationUrl(userId: number, expiresInMs?: number) {
  expiresInMs =
    expiresInMs || dayjs().add(EMAIL_EXPIRATION_DAYS, "day").valueOf();

  const url = `${APP_ORIGIN}/email/verify?id=${userId}&expires=${expiresInMs}`;
  const signature = createHmac("sha256", APP_KEY).update(url).digest("hex"); // 32 * 2 = 64 chars

  return `${url}&signature=${signature}`;
}

export { router as verify };
