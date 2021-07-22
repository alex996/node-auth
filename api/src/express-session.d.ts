import session from "express-session";

declare module "express-session" {
  export interface SessionData {
    userId?: number; // ID int
    confirmedAt: number; // timestamp in ms
  }
}
