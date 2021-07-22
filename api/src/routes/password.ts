import { Router } from "express";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { SendMailOptions } from "nodemailer";
import { guest } from "../middleware";
import { validate, sendResetSchema, resetPasswordSchema } from "../validation";
import { db } from "../db";
import { hmacSha256, compress } from "../utils";
import { hashPassword } from "./auth";
import {
  APP_KEY,
  PWD_RESET_TOKEN_BYTES,
  PWD_RESET_EXPIRATION_HOURS,
  APP_ORIGIN,
  MAIL_FROM,
} from "../config";

const router = Router();

router.post(
  "/password/email",
  guest,
  validate(sendResetSchema),
  async (req, res) => {
    const { email } = req.body;

    const user = db.users.find((user) => user.email === email);

    if (!user) {
      // TODO throw Joi error if possible, assuming the above check is async
      return res.status(400).json({
        message: "Email does not exist",
      });
    }

    const token = randomBytes(PWD_RESET_TOKEN_BYTES).toString("hex");
    const expiresAt = dayjs()
      .add(PWD_RESET_EXPIRATION_HOURS, "hour")
      .toISOString();

    // NOTE we treat reset tokens like passwords, so we don't store
    // them in plaintext. Instead, we hash and sign them with a secret.
    db.passwordResets.push({
      id: db.passwordResets.length + 1,
      userId: user.id,
      token: hmacSha256(token, APP_KEY),
      expiresAt,
    });

    const { mailer } = req.app.locals;
    await mailer.sendMail(passwordResetEmail(email, token, user.id));

    res.json({ message: "OK" });
  }
);

router.post(
  "/password/reset",
  guest,
  validate(resetPasswordSchema),
  async (req, res) => {
    const { token, id } = req.query;
    const { password } = req.body;

    const hashedToken = hmacSha256(String(token), APP_KEY);
    const resetToken = db.passwordResets.find(
      (reset) => reset.userId === Number(id) && reset.token === hashedToken
    );

    const user = db.users.find((user) => user.id === Number(id));

    // Technically, if the reset token is found, the user itself
    // must also exist. But we're being extra defensivive here.
    if (!resetToken || !user) {
      return res.status(401).json({ message: "Token or ID is invalid" });
    }

    user.password = await hashPassword(password);

    // Invalidate all user reset tokens
    db.passwordResets = db.passwordResets.filter(
      (reset) => reset.userId !== Number(id)
    );

    res.json({ message: "OK" });
  }
);

function passwordResetEmail(
  to: string,
  token: string,
  userId: number
): SendMailOptions {
  const url = `${APP_ORIGIN}/password/reset?id=${userId}&token=${token}`;
  return {
    from: MAIL_FROM,
    to,
    subject: "Reset your password",
    html: compress(`
      <p>To reset your password, POST to the link below.</p>
      <a href="${url}">${url}</a>
    `), // TODO should be a link to the front-end
  };
}

export { router as password };
