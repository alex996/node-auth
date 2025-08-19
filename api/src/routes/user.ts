import type { Express } from "express";
import { db, serializeUser, type User } from "../db.js";
import { auth, pwdConfirmed, verified } from "../middleware.js";
import { logOut } from "./auth.js";
import { destroyAllUserSessions } from "./password.js";

export async function userRoutes(app: Express) {
  app.get("/me", auth, (req, res) => {
    const user = db
      .prepare<number, User>("select * from users where id = ?")
      .get(req.session.userId!)!;
    res.json(serializeUser(user));
  });

  app.get("/me/verified", auth, verified, (req, res) => {
    const user = res.locals.user!;
    res.json({ message: "OK" });
  });

  app.get("/me/confirmed", auth, pwdConfirmed, (req, res) => {
    res.json({ message: "OK" });
  });

  // "Right to be forgotten" (GDPR Article 17).
  app.delete("/me", auth, pwdConfirmed, (req, res) => {
    const userId = req.session.userId!;

    const deleteResult = db
      .prepare("delete from users where id = ?")
      .run(userId);
    if (deleteResult.changes !== 1) throw new Error("unreachable");

    destroyAllUserSessions(req, userId);

    logOut(req, res);
  });
}
