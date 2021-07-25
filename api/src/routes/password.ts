import { Router } from "express";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { SendMailOptions } from "nodemailer";
import { guest, auth } from "../middleware";
import {
  validate,
  sendResetSchema,
  resetPasswordSchema,
  confirmPasswordSchema,
} from "../validation";
import { db } from "../db";
import { hmacSha256, safeEqual, compress } from "../utils";
import { hashPassword, comparePassword } from "./auth";
import {
  APP_SECRET,
  PWD_RESET_TOKEN_BYTES,
  PWD_RESET_EXPIRES_IN_HOURS,
  APP_ORIGIN,
  MAIL_FROM,
} from "../config";

const router = Router();

// Password reset request

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
      .add(PWD_RESET_EXPIRES_IN_HOURS, "hour")
      .toISOString();

    // NOTE we treat reset tokens like passwords, so we don't store
    // them in plaintext. Instead, we hash and sign them with a secret.
    db.passwordResets.push({
      id: db.passwordResets.length + 1,
      userId: user.id,
      token: hmacSha256(token, APP_SECRET),
      expiresAt,
    });

    const { mailer } = req.app.locals;
    await mailer.sendMail(passwordResetEmail(email, token, user.id));

    res.json({ message: "OK" });
  }
);

// Password reset submission

router.post(
  "/password/reset",
  guest,
  validate(resetPasswordSchema),
  async (req, res) => {
    const { token, id } = req.query;
    const { password } = req.body;

    const hashedToken = hmacSha256(String(token), APP_SECRET);
    const resetToken = db.passwordResets.find(
      (reset) =>
        reset.userId === Number(id) && safeEqual(reset.token, hashedToken)
    );

    if (!resetToken) {
      return res.status(401).json({ message: "Token or ID is invalid" });
    }

    const user = db.users.find((user) => user.id === Number(id));
    if (!user) throw new Error(`User id = ${id} not found`); // unreachable
    user.password = await hashPassword(password);

    // Invalidate all user reset tokens
    db.passwordResets = db.passwordResets.filter(
      (reset) => reset.userId !== Number(id)
    );

    res.json({ message: "OK" });
  }
);

// Password confirmation

router.post(
  "/password/confirm",
  auth,
  validate(confirmPasswordSchema),
  async (req, res) => {
    const { password } = req.body;
    const { userId } = req.session;

    const user = db.users.find((user) => user.id === userId);
    if (!user) throw new Error(`User id = ${userId} not found`); // unreachable

    const pwdMatches = await comparePassword(password, user.password);

    if (!pwdMatches) {
      return res.status(401).json({ message: "Password is incorrect" });
    }

    req.session.confirmedAt = Date.now();

    res.json({ message: "OK" });
  }
);

// Utils

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
