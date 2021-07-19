import { Router } from "express";
import { validate, loginSchema, registerSchema } from "./validation";
import { db } from "./db";
import { auth, guest } from "./middleware";
import { SESSION_COOKIE } from "./config";

export const router = Router();

// Health

router.get("/", (req, res) => res.json({ message: "OK" }));

// Login

// NOTE login is idempotent, so we don't apply `guest` middleware
// https://stackoverflow.com/a/18263884
router.post("/login", validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  const user = db.users.find((user) => user.email === email);

  // TODO hash + safeCompare password
  if (!user || user.password !== password) {
    // 401 for invalid creds https://stackoverflow.com/a/32752617
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

router.post("/register", guest, validate(registerSchema), (req, res) => {
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
    password, // TODO hash
    name,
  };

  db.users.push(user);

  req.session.userId = user.id;

  res.status(201).json({ message: "OK" });
});
