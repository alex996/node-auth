import type { Mailer } from "./config.ts";
import type { User } from "./db.ts";

declare module "express-session" {
  interface SessionData {
    userId?: number;
    confirmedAt: number; // ms
  }
}

// TODO how to declare app.locals separately from res.locals?
declare global {
  namespace Express {
    interface Locals {
      mailer: Mailer;
      user?: User;
    }
  }
}

export {};
