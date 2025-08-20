# node-auth

Authentication boilerplate for Node.js.

## Usage

```sh
cd api

cp .env.test .env
# Set DEV_QUIET=true to suppress emails (and log contents to stdout)

npm run dev
```

See [http.sh](./api/http.sh) (read-only) for example requests.

```sh
cd web

npm run dev
```

To test emails, use a free service like [Mailtrap](https://mailtrap.io/) or [Ethereal](https://ethereal.email/). For example, you can create an Ethereal account from your terminal:

```js
$ node
> require('nodemailer').createTestAccount().then(console.log)
```

## Things to decide

**Do you want an [absolute timeout](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#absolute-timeout)?** The choice depends on the nature of the app (banking, social media, etc.). Note that abrupt logouts result in poor UX and data corruption (ex: user makes request A, but is automatically logged out before they can make a follow-up request B, resulting in a broken state). Your app could present a dialog, e.g. "Your session will expire in X minutes" along with a button to "Keep me signed in" or "Log off now".

**Do you want the session to roll?** This means that the expiration will reset on each request, indicating that the user is active.

**Do you want to prevent account enumeration?** This is relevant to a staff-only admin panel (to prevent phishing), a political site, a government or healthcare portal, etc. You'd need to protect the sign-up, login, verification, and password reset endpoints. (Although an internal website may not even need a registration form (ex: employee accounts are added manually by an admin), or it could be hosted on a company VPN). See comments in [auth.ts](./api/src/routes/auth.ts) for examples. Beware that mitigations degrade UX. Turnstile/Captcha, rate limiting, etc. alone don't prevent a targeted attack.

**How do you want to verify users?** Option 1: sign them up and email a link (either signed, or with a token). Choose whether to log them in, or have the login route return an error until they're verified. Option 2: when they click Sign Up, email an OTP (or a link), and ask them to enter it to proceed. This way, a user is not created until they're verified.

**Do you want unverified users to log in?** If so, you'd want to restrict your website's functionality until they verify their email. This can improve UX; the user is auto-logged in on signup, which saves them an extra step, and showing a sneak peak of the dashboard can give encouragement, as full access is just a click away (email link). However, bots can sign up without verification, so apply aggressive rate-limiting and/or Captcha.

## Things to consider

**Session hijacking.** Many YouTube channels (notably, [Linus Tech Tips](https://youtu.be/yGXaAWbzl5A)) have been compromised by malware lately. An infostealer (typically, an EXE disguised as a PDF) will steal cookies from your browser, and allow a remote attacker to take over your accounts. A simple mitigation would be device fingerprinting, i.e. check if an incoming request is from a verified device, and if not, ask to reconfirm the password, or send an email to approve the new (suspicious) login. This assumes that the attacker will make a request with your session cookie from their own computer/IP. At the very least, when the hacker tries to change your password or MFA to lock you out, the app should show a password prompt/MFA challenge.

**Multi-factor authentication (MFA).** Data breaches are common, and many passwords are shared. Consider time-based one-time passcodes (TOTP) to protect accounts. SMS is weak, usually unencrypted, and vulnerable to SIM swapping. Phone numbers change, so it's easy to get locked out of your account. If you send SMS, put measures against SMS pumping.

**Inactive accounts.** Send a prior notice and delete inactive accounts to comply with EU's GDPR.

**Additional features**. Change your password (while logged in), persistent login (remember me), account lockout (too many failed login attempts), log out on all devices (clear all user sessions), etc.

## Things to fix

Search for FIXME and TODO. This includes:

- **Session store.** Replace `MemoryStore` with [connect-redis](https://www.npmjs.com/package/connect-redis) (Redis/Valkey).
- **Database**. Use a database server like Postgres. Consider using an ORM (see [this video](https://youtu.be/4QN1BzxF8wM) for a quick tour).
- **Rate-limiting.** Use [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) or [rate-limiter-flexible](https://www.npmjs.com/package/rate-limiter-flexible). Consider exponential backoff instead of a fixed window.
- **Logger**. Something like [pino](https://www.npmjs.com/package/pino).

## A note about tests

Tests are run using the Node.js test runner. `--test-isolation=mode` defaults to `'process'`, meaning each test file is run in a separate child process. `--test-concurrency` defaults to `os.availableParallelism() - 1`. Each test file is executed as if it was a regular script. [Docs](https://nodejs.org/api/test.html#test-runner-execution-model).

Other tools like Ava work differently. Assume that each test file is run in a separate process (keep that in mind when using shared exports), and tests within a file are run concurrently (don't depend on other tests because you don't know in what order they will run).

## Further reading

[OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
