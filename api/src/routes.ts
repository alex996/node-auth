import { Router } from "express";
import { compare, hash } from "bcrypt";
import { validate, loginSchema, registerSchema } from "./validation";
import { db } from "./db";
import { auth, guest } from "./middleware";
import { SESSION_COOKIE, PASSWORD_SALT_ROUNDS } from "./config";

export const router = Router();

// Health

router.get("/", (req, res) => res.json({ message: "OK" }));

// Login

// NOTE login is idempotent, so we don't apply `guest` middleware
// https://stackoverflow.com/a/18263884
router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  // TODO this lookup isn't constant time, so it can leak information
  // (ex: when the email doesn't exist). When using a DB like Postgres,
  // index the `email` field so that the query is timing-safe.
  const user = db.users.find((user) => user.email === email);

  // NOTE to mitigate a timing attack, we still hash the password
  // even if the user doesn't exist. That said, bcrypt's compare() itself
  // is *not* timing-safe https://github.com/kelektiv/node.bcrypt.js/issues/720
  // This is fine because the generated hash can't be predicted,
  // so the attacker can't learn anything based on the time of this comparison
  // https://github.com/bcrypt-ruby/bcrypt-ruby/pull/43
  const fakeHash =
    "$2b$12$tLn0rFkPBoE1WCpdM6MjR.t/h6Wzql1kAd27FecEDtjRYsTFlYlWa"; // 'test'
  const pwdMatches = await compare(password, user?.password || fakeHash);

  if (!user || !pwdMatches) {
    // Return 401 for invalid creds https://stackoverflow.com/a/32752617
    return res.status(401).json({
      message: "Email or password is invalid",
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

  const user = {
    id: db.users.length + 1,
    email,
    password: await hash(password, PASSWORD_SALT_ROUNDS),
    name,
  };

  db.users.push(user);

  req.session.userId = user.id;

  res.status(201).json({ message: "OK" });
});
