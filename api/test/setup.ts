import nodemailer from "nodemailer";
import { createApp } from "../src/app";

// https://nodemailer.com/transports/stream/
const mailer = nodemailer.createTransport({
  jsonTransport: true,
});

export const fakeInbox: Record<string, any[]> = {};

const sendMail = mailer.sendMail.bind(mailer);
mailer.sendMail = async (opts) => {
  const info = await sendMail(opts);
  info.message = JSON.parse(info.message); // String => JSON

  const key = String(opts.to);
  if (!fakeInbox[key]) {
    fakeInbox[key] = [];
  }
  fakeInbox[key].push(info);

  return info;
};

export const app = createApp(mailer);
