import { MemoryStore } from "express-session";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import nodemailer from "nodemailer";
import { createApp } from "./app.js";
import { env, MAIL_OPTS } from "./config.js";

const mailer = nodemailer.createTransport(MAIL_OPTS);

const store = new MemoryStore(); // FIXME REPLACE IN PROD

const app = createApp(mailer, store);

if (env.IN_PROD) {
  http
    .createServer((req, res) => {
      res.writeHead(301, {
        Location: `https://${req.headers.host}${req.url}`,
      });
      res.end();
    })
    .listen(80, () => console.log("Listening on port 80"));
  // https://nodejs.org/api/https.html#httpscreateserveroptions-requestlistener
  https
    .createServer(
      {
        key: fs.readFileSync("./private-key.pem"),
        cert: fs.readFileSync("./certificate.cert"),
      },
      app
    )
    .listen(443, () => console.log("Listening on port 443"));
} else {
  app.listen(env.DEV_PORT, () =>
    console.log(`http://localhost:${env.DEV_PORT}`)
  );
}
