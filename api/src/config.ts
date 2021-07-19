import { SessionOptions } from "express-session";

const {
  NODE_ENV = "development",

  SESSION_COOKIE = "sid",
  // NOTE Re-gen for prod! ex: crypto.randomBytes(16).toString('hex')
  SESSION_SECRET = "b2967d2927034d431d510820ea6363c2",
} = process.env;

export { SESSION_COOKIE };

const IN_PROD = NODE_ENV === "production";

const ONE_HOUR_IN_MS = 1_000 * 60 * 60;
const ONE_WEEK_IN_MS = 7 * 24 * ONE_HOUR_IN_MS;

export const SESSION_OPTS: SessionOptions = {
  cookie: {
    // domain, // current domain (Same-Origin, no CORS)
    httpOnly: true,
    maxAge: ONE_WEEK_IN_MS,
    sameSite: "strict",
    secure: IN_PROD,
  },
  name: SESSION_COOKIE,
  resave: false, // whether to save the session if it wasn't modified during the request
  rolling: true, // whether to (re-)set cookie on every response
  saveUninitialized: false, // whether to save empty sessions to the store
  secret: SESSION_SECRET,
};
