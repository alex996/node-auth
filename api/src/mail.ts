import nodemailer, { SendMailOptions } from 'nodemailer'
import { SMTP_OPTIONS, MAIL_FROM } from './config'

const transporter = nodemailer.createTransport(SMTP_OPTIONS)

export const sendMail = (options: SendMailOptions) => transporter.sendMail({
  ...options,
  from: MAIL_FROM
})
