import { SessionOptions } from "express-session";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export const {
  NODE_ENV = "development",

  APP_PORT = 3000,
  APP_HOSTNAME = "localhost",
  // NOTE APP_SECRET is used to sign the session ID cookie,
  // the email verification URL, and the password reset token.
  // It may be prudent to use different secrets for each.
  APP_SECRET = "", // crypto.randomBytes(32).toString('base64')

  SESSION_COOKIE = "sid",

  MAIL_HOST = "",
  MAIL_PORT = "",
  MAIL_USERNAME = "",
  MAIL_PASSWORD = "",
} = process.env;

export const IN_PROD = NODE_ENV === "production";
const IN_DEV = NODE_ENV === "development";
const IN_TEST = NODE_ENV === "test";

// Assert required variables are passed
[
  "APP_SECRET",
  IN_PROD && "APP_HOSTNAME",
  !IN_TEST && "MAIL_HOST",
  !IN_TEST && "MAIL_PORT",
  !IN_TEST && "MAIL_USERNAME",
  !IN_TEST && "MAIL_PASSWORD",
].forEach((secret) => {
  if (secret && !process.env[secret]) {
    throw new Error(`${secret} is missing from process.env`);
  }
});

// App

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
  secret: APP_SECRET,
};

// Bcrypt

export const BCRYPT_SALT_ROUNDS = 12;

// Mail

export const MAIL_OPTS: SMTPTransport.Options = {
  host: MAIL_HOST,
  port: +MAIL_PORT,
  secure: IN_PROD,
  auth: {
    user: MAIL_USERNAME,
    pass: MAIL_PASSWORD,
  },
};

export const MAIL_EXPIRES_IN_DAYS = 1;
export const MAIL_FROM = `noreply@${APP_HOSTNAME}`;

// Passwords

export const PWD_RESET_TOKEN_BYTES = 40;
export const PWD_RESET_EXPIRES_IN_HOURS = 12;
export const PWD_CONFIRM_EXPIRES_IN_MS = 2 * ONE_HOUR_IN_MS;
