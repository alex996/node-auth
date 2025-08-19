import express, { type ErrorRequestHandler } from "express";
import session, { type Store } from "express-session";
import * as z from "zod";
import { SESSION_OPTS, type Mailer } from "./config.js";
import {
  authRoutes,
  emailRoutes,
  passwordRoutes,
  userRoutes,
} from "./routes/index.js";

export function createApp(mailer: Mailer, store: Store) {
  const app = express();

  app.locals.mailer = mailer;

  app.disable("x-powered-by");

  app.use(express.json());

  app.use(session({ ...SESSION_OPTS, store }));

  // FIXME express-rate-limit

  app.get("/", (req, res) => {
    res.json({ message: "OK" });
  });

  // This pattern prevents extra Router() calls in each file.
  // The URI, middleware, and handler are all defined in one place.
  authRoutes(app);

  userRoutes(app);

  emailRoutes(app);

  passwordRoutes(app);

  app.use((req, res, next) => {
    res.status(404).json({ message: "Not Found" });
  });

  app.use(((err, req, res, next) => {
    if (err instanceof z.ZodError) {
      // TODO adjust for your needs https://zod.dev/error-formatting
      return res.status(400).json(z.formatError(err));
    }
    if (err instanceof SyntaxError) {
      return res.status(400).json({ message: "Malformed JSON" });
    }

    console.error(err);

    res.status(500).json({ message: "Server Error" });
  }) as ErrorRequestHandler);

  return app;
}
