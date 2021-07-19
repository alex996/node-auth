import { Router } from "express";
import { validate, loginSchema } from "./validation";
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

  if (!user) {
    // 401 for invalid creds https://stackoverflow.com/a/32752617
    return res.status(401).json({
      message: "Email or password is invalid",
    });
  }

  req.session.userId = user.id;

  res.json({ message: "OK" });
});
