import { MemoryStore } from "express-session";
import nodemailer from "nodemailer";
import type JSONTransport from "nodemailer/lib/json-transport/index.js";
import request, { type Response } from "supertest";
import { createApp } from "../src/app.js";
import { env } from "../src/config.js";
import { db } from "../src/db.js";
import { addHours } from "../src/routes/email.js";

// https://nodemailer.com/transports/stream/
const mailer = nodemailer.createTransport({
  jsonTransport: true,
  skipEncoding: true, // don't JSON.stringify()
});

export const fakeInbox: Record<string, Info[]> = {};

interface Info extends JSONTransport.SentMessageInfo {
  message: any;
}

const sendMail = mailer.sendMail.bind(mailer);
mailer.sendMail = async (opts) => {
  const info = await sendMail(opts);

  const key = String(opts.to);
  if (!fakeInbox[key]) fakeInbox[key] = [];
  fakeInbox[key].push(info);

  return info;
};

const store = new MemoryStore();

const app = createApp(mailer, store);

export const testAgent = request(app);

export const testLogin = {
  email: "test@example.com",
  password: "secret",
};

const sessionId = "1-5KwcJNf7q0alEJiNYcF8njO9_td-LL7N";
export const testCookie = `sid=s%3A${sessionId}.QTFO9pjMFjh0RPRd24j2bFpZw6ht0%2BrU6wx4aaObbFU`;

export const createTestUser = () => {
  db.prepare(
    "insert into users values (null, ?, ?, ?, ?) on conflict (email) do nothing"
  ).run(
    "Test",
    testLogin.email,
    "$2b$12$lJufFGv/KGta01ff1Fs4lusP6ZIp1.yvmr/sh1XBvk4lyQJfFanji",
    new Date().getTime()
  );

  // Each login request adds latency (from hashing the password).
  // To save time, we'll just log in the test user by default.

  // const req = { sessionStore: store } as Request;
  // store.generate(req);
  // req.session.userId = 1;
  // req.session.save();
  // console.log(store.sessions);

  // @ts-expect-error
  store.sessions[sessionId] = `{"cookie":{"originalMaxAge":${
    env.SESSION_LIFETIME_MS
  },"expires":"${addHours(
    new Date(),
    1
  ).toISOString()}","secure":false,"httpOnly":true,"path":"/","sameSite":true},"userId":1}`;
};

export const getCookie = (res: Response) =>
  res.headers["set-cookie"]?.[0]?.split(/;/, 1)[0];

export const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));
