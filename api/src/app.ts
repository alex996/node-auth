import "express-async-errors";
import express from "express";
import session from "express-session";
import { errors } from "celebrate";
import { SESSION_OPTS } from "./config";
import { validate, loginSchema } from "./validation";
import { notFound, serverError } from "./middleware";

const app = express();

app.use(session(SESSION_OPTS));

app.use(express.json());

app.get("/", (req, res) => res.json({}));

app.post("/login", validate(loginSchema), (req, res) => {
  const { email, password } = req.body;

  req.session.userId = 1;

  res.json({ message: "OK" });
});

app.use(notFound);

app.use(errors());

app.use(serverError);

export { app };
