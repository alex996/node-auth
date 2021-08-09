# node-auth

Authentication boilerplate for Node.js.

## Background

Originally inspired by [Your Node.js authentication tutorial is (probably) wrong](https://medium.com/hackernoon/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46). Although its critique is on point, the article sadly doesn't offer any concrete solutions. This repo is my attempt to address those remarks in code. You can also find some of my research [here](https://github.com/alex996/presentations/blob/master/node-auth.md).

## Features

- login, logout, and registration
- email verification (`"Confirm your email"`)
- password reset (`"Forgot password"`)
- password confirmation (`"Re-enter your password"`)
- persistent login (`"Remember me"`)
- account lockout (`"Too many failed login attempts"`)
- rate limiting (`"Too many requests"`)

## Development

First, create a `.env` file:

```sh
cd api
cp .env.example .env
```

Next, populate `APP_SECRET`, which you can generate like so:

```js
$ node
> require('crypto').randomBytes(32).toString('base64')
```

Make sure to also populate `MAIL_*` variables. For example, you can sign up for a free service like [Mailtrap](https://mailtrap.io/) or [Ethereal](https://ethereal.email/). Using Ethereal you can even create an account right from your terminal:

```js
$ node
> require('nodemailer').createTestAccount().then(console.log)
```

Finally, boot the server:

```sh
npm run dev
```

## Integration tests

> Tip: just read the first test in each file to follow the happy path. Other tests cover non-standard scenarios.

```sh
npm test
```

## API

| Method | URI               | Middleware |
| ------ | ----------------- | ---------- |
| POST   | /register         | guest      |
| POST   | /login            |            |
| POST   | /logout           | auth       |
| POST   | /email/verify     |            |
| POST   | /email/resend     |            |
| POST   | /password/email   |            |
| POST   | /password/reset   |            |
| POST   | /password/confirm | auth       |

## curl

> Tip: run `echo '-w "\n"' >> ~/.curlrc` to [auto-add a newline](https://stackoverflow.com/a/14614203) to response body.

```sh
# Auth

curl -d '{"email":"test@gmail.com","password":"test"}' -H 'Content-Type: application/json' \
  localhost:3000/login

curl -X POST \
  -b 'sid=s%3AT_Pkrw6AvSQ3LfOYC9q0EnE1uqWQhJbp.hTs%2BqXXHbFMn2dxgSKBWd%2F%2FEQ8xwnV3KKsA9IwVJ7nU' \
  localhost:3000/logout

curl -d '{"email":"alex@gmail.com","password":"test","name":"Alex"}' \
  -H 'Content-Type: application/json' localhost:3000/register

# Email verification

curl -X POST \
  'localhost:3000/email/verify?id=2&expires=1626766452957&signature=ddd8e0451ef93172b5345e0f7d1e8a5e85b69bca2b2aeed80a14848d0d2fb2df'

curl -d '{"email":"alex@gmail.com"}' -H 'Content-Type: application/json' localhost:3000/email/resend

# Password recovery

curl -d '{"email":"alex@gmail.com"}' -H 'Content-Type: application/json' localhost:3000/password/email

curl -d '{"password":"123456"}' -H 'Content-Type: application/json' \
  'localhost:3000/password/reset?id=2&token=78f3065ed0b350b1ee1ea80162c2e2f4908fb5bc9d42c22e08202d2e79a0d180a59a86bf9885a002'

# Password confirmation

curl -d '{"password":"test"}' \
  -b 'sid=s%3AT_Pkrw6AvSQ3LfOYC9q0EnE1uqWQhJbp.hTs%2BqXXHbFMn2dxgSKBWd%2F%2FEQ8xwnV3KKsA9IwVJ7nU' \
  localhost:3000/password/confirm
```

## Disclaimer

I am not a security expert. There is only so much I know, so there are likely things I missed. If you see something that doesn't make sense, poses a vulnerability, or otherwise needs improvement, please feel free to open an issue or submit a PR. All contributions are welcome!
