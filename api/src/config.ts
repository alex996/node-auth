import type { SessionOptions } from "express-session";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport/index.js";
import uid from "uid-safe";
import * as z from "zod";

export const ONE_HOUR_MS = 1000 * 60 * 60;
const ONE_WEEK_MS = ONE_HOUR_MS * 24 * 7; // https://news.ycombinator.com/item?id=37173339

// For HMAC-256 the key should contain at least 32 bytes of entropy.
// require("crypto").randomBytes(32).toString("base64")
const toBuffer = (val: string) => Buffer.from(val, "base64");
const minEntory = (buf: Buffer) => buf.length >= 32;

// https://zod.dev/api
// With z.object(), all properties are required by default, and
// unrecognized keys are stripped from the parsed result.
const ProcessEnv = z.object({
  SESSION_SIGNING_KEY: z.string().transform(toBuffer).refine(minEntory),
  SESSION_LIFETIME_MS: z.number().int().positive().default(ONE_WEEK_MS),
  SESSION_COOKIE_NAME: z.string().default("sid"),

  SIGNING_KEY: z.string().transform(toBuffer).refine(minEntory),

  BCRYPT_COST_FACTOR: z.number().int().positive().default(12),

  DEV_PORT: z.number().int().positive().default(3000),
  DEV_QUIET: z.stringbool().default(false), // to suppress emails
  IN_PROD: z.stringbool().default(false), // HTTPS, etc.

  WEB_HOST: z.string().default("localhost:4000"),

  DB_FILENAME: z.string().default(":memory:"),

  MAIL_HOST: z.string(),
  MAIL_PORT: z.number().int().positive().default(587),
  MAIL_USER: z.string(),
  MAIL_PASSWORD: z.string(),
  MAIL_FROM: z.email(),
});

export const env = ProcessEnv.parse(process.env);

export const WEB_ORIGIN = `http${env.IN_PROD ? "s" : ""}://${env.WEB_HOST}`;

// TODO adjust for your needs
export const LINK_EXPIRES_IN_HRS = 12;
export const PWD_CONFIRMED_FOR_MS = ONE_HOUR_MS * 2;
export const TOKEN_EXPIRES_IN_HRS = 2;

// https://github.com/expressjs/session#api
// Defaults are commented
export const SESSION_OPTS: SessionOptions = {
  cookie: {
    // domain: undefined, // current domain
    // expires: undefined, // non-persistent cookie
    // httpOnly: true,
    maxAge: env.SESSION_LIFETIME_MS,
    // path: "/", // root path of the domain
    sameSite: true,
    secure: env.IN_PROD, // if true, front-end must use HTTPS too
  },
  // The prefix will be used to log out of all sessions.
  genid: (req) => `${req.session?.userId || 0}-${uid.sync(24)}`,
  name: env.SESSION_COOKIE_NAME,
  // proxy: undefined, // based on "trust proxy"
  resave: false, // don't save if session isn't modified during the request
  rolling: true, // resets expiration countdown on each request
  saveUninitialized: false, // don't save a new, unmodified session
  secret: env.SESSION_SIGNING_KEY,
  // store: MemoryStore,
};

// https://nodemailer.com/
export const MAIL_OPTS: SMTPTransport.Options = {
  host: env.MAIL_HOST,
  port: env.MAIL_PORT,
  secure: env.IN_PROD,
  auth: {
    user: env.MAIL_USER,
    pass: env.MAIL_PASSWORD,
  },
};

export type Mailer = ReturnType<typeof nodemailer.createTransport>;
