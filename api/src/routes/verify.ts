import { Router } from "express";
import { timingSafeEqual, createHmac } from "crypto";
import dayjs from "dayjs";
import { validate, verifyEmailSchema, resendEmailSchema } from "../validation";
import { db } from "../db";
import { EMAIL_EXPIRATION_DAYS, APP_ORIGIN, APP_KEY } from "../config";

const router = Router();

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

  if (!safeCompare(expectedUrl, actualUrl)) {
    return res.status(400).json({ message: "URL signature is invalid" });
  }

  user.verifiedAt = new Date().toISOString();

  res.json({ message: "OK" });
});

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

export function confirmationUrl(userId: number, expiresInMs?: number) {
  expiresInMs =
    expiresInMs || dayjs().add(EMAIL_EXPIRATION_DAYS, "day").valueOf();

  const url = `${APP_ORIGIN}/email/verify?id=${userId}&expires=${expiresInMs}`;
  const signature = createHmac("sha256", APP_KEY).update(url).digest("hex"); // 32 * 2 = 64 chars

  return `${url}&signature=${signature}`;
}

// Perform constant-time string comparison against a timing attack
function safeCompare(a: string, b: string) {
  const aBuff = Buffer.from(a);
  const bBuff = Buffer.from(b);

  const sameLength = aBuff.length === bBuff.length;
  const sameContents = timingSafeEqual(aBuff, sameLength ? bBuff : aBuff);

  return Number(sameLength) + Number(sameContents) === 2;
}

export { router as verify };
