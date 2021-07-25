import { Router } from "express";
import { db } from "../db";
import { auth, verified, pwdConfirmed } from "../middleware";

const router = Router();

router.get("/", (req, res) => res.json({ message: "OK" })); // health

router.get("/me", auth, (req, res) => {
  return res.json(db.users.find((user) => user.id === req.session.userId));
});

// NOTE how both auth *and* verified are applied in that order.
// This ensures that unauthorized reqs return 401, while unverified 403.
router.get("/me/verified", auth, verified, (req, res) =>
  res.json({ message: "OK" })
);

router.get("/me/confirmed", auth, pwdConfirmed, (req, res) =>
  res.json({ message: "OK" })
);

export { router as demo };
