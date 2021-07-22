import { Router } from "express";
import { compare, hash } from "bcrypt";
import { createHash } from "crypto";
import { validate, loginSchema, registerSchema } from "../validation";
import { db, User } from "../db";
import { auth, guest } from "../middleware";
import { SESSION_COOKIE, BCRYPT_SALT_ROUNDS } from "../config";
import { confirmationEmail } from "./email";

const router = Router();

// Login

// NOTE login is idempotent, so we don't apply `guest` middleware
// https://stackoverflow.com/a/18263884
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  // TODO this lookup isn't constant time, so it can leak information
  // (ex: when the email doesn't exist). When using a DB like Postgres,
  // index the `email` field so that your query is timing-safe.
  const user = db.users.find((user) => user.email === email);

  // NOTE even if the user doesn't exist, we still hash the plaintext
  // password. Although inefficient, this helps mitigate a timing attack.
  const fakeHash =
    "$2b$12$tLn0rFkPBoE1WCpdM6MjR.t/h6Wzql1kAd27FecEDtjRYsTFlYlWa"; // 'test'
  const pwdHash = user?.password || fakeHash;
  const pwdMatches = await comparePassword(password, pwdHash);

  // NOTE bcrypt's compare() is *not* timing-safe
  // https://github.com/kelektiv/node.bcrypt.js/issues/720
  // This is fine because the generated hash can't be predicted, so the
  // attacker can't learn anything based on the time of this comparison
  // https://github.com/bcrypt-ruby/bcrypt-ruby/pull/43
  if (!user || !pwdMatches) {
    // Return 401 for invalid creds https://stackoverflow.com/a/32752617
    return res.status(401).json({
      message: "Email or password is incorrect",
    });
  }

  req.session.userId = user.id;

  res.json({ message: "OK" });
});

// Logout

router.post("/logout", auth, (req, res) => {
  req.session.destroy((err) => {
    if (err) throw err;

    res.clearCookie(SESSION_COOKIE);

    res.json({ message: "OK" });
  });
});

// Register

router.post("/register", guest, validate(registerSchema), async (req, res) => {
  const { email, password, name } = req.body;

  const userExists = db.users.some((user) => user.email === email);

  if (userExists) {
    // TODO throw Joi error if possible, assuming the above check is async
    return res.status(400).json({
      message: "Email is already taken",
    });
  }

  // Create the user
  const user: User = {
    id: db.users.length + 1,
    email,
    password: await hashPassword(password),
    name,
    verifiedAt: null,
  };
  db.users.push(user);

  // Authenticate
  req.session.userId = user.id;

  // Send the email
  const { mailer } = req.app.locals;
  await mailer.sendMail(confirmationEmail(email, user.id));

  res.status(201).json({ message: "OK" });
});

// Utils

// NOTE bcrypt truncates the input string after 72 bytes, meaning
// you can still log in with just the first 72 bytes of your password.
// To prevent this, we prehash plaintext passwords before running them
// through bcrypt. https://security.stackexchange.com/q/6623
export const comparePassword = (plaintextPassword: string, hash: string) =>
  compare(sha256(plaintextPassword), hash);

export const hashPassword = (plaintextPassword: string) =>
  hash(sha256(plaintextPassword), BCRYPT_SALT_ROUNDS);

// NOTE SHA256 always produces a string that's 256 bits (or 32 bytes) long.
// In base64, that's ceil(32 / 3) * 4 = 44 bytes which meets the 72 byte limit.
const sha256 = (plaintext: string) =>
  createHash("sha256").update(plaintext).digest("base64");

export { router as auth };
