import { SessionOptions } from "express-session";

const {
  NODE_ENV = "development",

  SESSION_COOKIE = "sid",
  SESSION_SECRET = "", // crypto.randomBytes(16).toString('hex')

  APP_PORT = 3000,
  APP_HOSTNAME = "localhost",
  APP_KEY = "", // crypto.randomBytes(32).toString('base64')
} = process.env;

// Assert required variables are passed
["SESSION_SECRET", "APP_KEY"].forEach((secret) => {
  if (!process.env[secret]) {
    throw new Error(`${secret} is missing from process.env`);
  }
});

export { SESSION_COOKIE, APP_PORT, APP_KEY };

// App

const IN_PROD = NODE_ENV === "production";
const IN_DEV = NODE_ENV === "development";

const APP_PROTOCOL = IN_PROD ? "https" : "http";
const APP_HOST = `${APP_HOSTNAME}${IN_DEV ? `:${APP_PORT}` : ""}`;
export const APP_ORIGIN = `${APP_PROTOCOL}://${APP_HOST}`;

// Session

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

// Bcrypt

export const BCRYPT_SALT_ROUNDS = 12;
