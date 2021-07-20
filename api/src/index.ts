import nodemailer from "nodemailer";
import { MAIL_OPTS } from "./config";
import { createApp } from "./app";
import { APP_PORT, APP_ORIGIN } from "./config";

const mailer = nodemailer.createTransport(MAIL_OPTS);

const app = createApp(mailer);

app.listen(APP_PORT, () => console.log(APP_ORIGIN));
