import { Router } from "express";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { hash } from "bcrypt";
import { SendMailOptions } from "nodemailer";
import { guest } from "../middleware";
import { validate, sendResetSchema, resetPasswordSchema } from "../validation";
import { db } from "../db";
import { hmacSha256, sha256, compress } from "../utils";
import {
  APP_KEY,
  PWD_RESET_EXPIRATION_DAYS,
  BCRYPT_SALT_ROUNDS,
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

    const token = randomBytes(40).toString("hex");
    const expiresAt = dayjs()
      .add(PWD_RESET_EXPIRATION_DAYS, "day")
      .toISOString();

    // NOTE it is more secure to *not* store the user ID. This way, if our DB is
    // compromised, the attacker would have to match each token to its user account.
    db.passwordResets.push({
      id: db.passwordResets.length + 1,
      // NOTE we treat reset tokens like passwords, hence we don't store
      // plaintext tokens. Instead, we hash and sign them with a secret.
      token: hashedToken(token, user.id),
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

    const expectedToken = hashedToken(String(token), Number(id));
    const resetToken = db.passwordResets.find(
      (reset) => reset.token === expectedToken
    );

    const user = db.users.find((user) => user.id === user.id);

    // Technically, if the reset token is found, the user must
    // also exist, but we're being extra defensive here.
    if (!resetToken || !user) {
      return res.status(401).json({ message: "Token or ID is invalid" });
    }

    user.password = await hash(sha256(password), BCRYPT_SALT_ROUNDS);

    res.json({ message: "OK" });
  }
);

function hashedToken(plaintextToken: string, userId: number) {
  return hmacSha256(`${plaintextToken}${userId}`, APP_KEY);
}

function passwordResetEmail(
  to: string,
  token: string,
  userId: number
): SendMailOptions {
  const url = `${APP_ORIGIN}/password/reset?token=${token}&id=${userId}`;
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
