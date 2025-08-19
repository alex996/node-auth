import type { RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import type { ParsedQs } from "qs";
import type { ZodType } from "zod";
import * as z from "zod";
import { env, PWD_CONFIRMED_FOR_MS } from "./config.js";
import { db, type User } from "./db.js";

// Inspired by express-zod-safe and zod-express-middleware.
// https://zod.dev/library-authors#how-to-accept-user-defined-schemas
// TODO add headers, cookies, signedCookies
// FIXME req.query is not writable
export function validate<
  TParams extends ZodType<ParamsDictionary>,
  TBody extends ZodType,
  TQuery extends ZodType<ParsedQs>
>(shape: {
  params?: TParams;
  body?: TBody;
  query?: TQuery;
}): RequestHandler<z.output<TParams>, any, z.output<TBody>, z.output<TQuery>> {
  const schema = z.object(shape);
  return async (req, res, next) => {
    await schema.parseAsync(req);
    next();
  };
}

export const guest: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};

export const auth: RequestHandler = (req, res, next) => {
  if (!req.session.userId) {
    if (req.headers.cookie?.includes(`${env.SESSION_COOKIE_NAME}=s%3A`)) {
      // The cookie is likely expired. Clear it.
      res.clearCookie(env.SESSION_COOKIE_NAME);
    }
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const verified: RequestHandler = (req, res, next) => {
  if (req.session.userId) {
    const user = db
      .prepare<number, User>("select * from users where id = ?")
      .get(req.session.userId);

    if (user?.verified_at) {
      res.locals.user = user;

      return next();
    }
  }

  return res.status(403).json({ message: "Forbidden" });
};

// This could also be an OTP challenge.
export const pwdConfirmed: RequestHandler = (req, res, next) => {
  const { confirmedAt } = req.session;

  if (!confirmedAt || confirmedAt + PWD_CONFIRMED_FOR_MS <= Date.now()) {
    return res.status(403).json({ message: "Forbidden" });
  }

  next();
};
