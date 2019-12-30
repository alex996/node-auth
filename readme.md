# node-auth

Authentication boilerplate in Node.js with security and scalability in mind.

## Features

- [x] login/logout/register + session expiry
- [x] email verification (`"Confirm your email"`)
- [x] password reset (`"Forgot password"`)
- [ ] password confirmation (`"Re-enter your password"`)
- [ ] persistent login (`"Remember me"`)
- [ ] account lockout (`"Too many failed login attempts"`)
- [ ] rate limiting (`"Too many requests"`)

## Prerequisites

- `node` and `npm` (e.g. using `nvm`)
- `docker` and `docker-compose`
  - could also use a local `mongodb-org` and `redis-server`
  - otherwise, a remote service e.g. Atlas/mLab and Redis Labs

## Setup

```sh
# (Linux) Must export UID to have the right permissions
export UID

# Boot MongoDB & Redis containers, and launch a local Express server
npm run up
```

## API

Method    | URI               | Middleware
:-------- | :---------------- | :---------
POST      | /register         | guest
POST      | /login            | guest
POST      | /logout           | auth
GET\|HEAD | /home             | auth
POST      | /email/verify     |
POST      | /email/resend     |
POST      | /password/email   |
POST      | /password/reset   |
POST      | /password/confirm | auth

## curl

```sh
curl localhost:3000/register -H 'Content-Type: application/json' -d \
  '{"email":"alex@gmail.com","name":"Alex","password":"Secret12","passwordConfirmation":"Secret12"}'

curl localhost:3000/login -H 'Content-Type: application/json' -d \
  '{"email":"alex@gmail.com","password":"Secret12"}'

curl -X POST localhost:3000/logout --cookie \
  'sid=s%3Aly4gTFBASuA0T1h0HLls7l6bKv-TUii2.N2GGaZ5GbJnOOdwRjtIYdckmbvoqRw3QvL1d3MOINr8'

curl localhost:3000/home --cookie \
  'sid=s%3Aly4gTFBASuA0T1h0HLls7l6bKv-TUii2.N2GGaZ5GbJnOOdwRjtIYdckmbvoqRw3QvL1d3MOINr8'

curl -X POST 'localhost:3000/email/verify?id=...&token=...&expires=...&signature=...'

curl localhost:3000/email/resend -H 'Content-Type: application/json' -d '{"email":"alex@gmail.com"}'

curl localhost:3000/password/email -H 'Content-Type: application/json' -d '{"email":"alex@gmail.com"}'

curl 'localhost:3000/password/reset?id=...&token=...' \
  -H 'Content-Type: application/json' -d '{"password":"Secret12","passwordConfirmation":"Secret12"}'

curl localhost:3000/password/confirm -H 'Content-Type: application/json' -d '{"password":"Secret12"}' \
  --cookie 'sid=s%3Aly4gTFBASuA0T1h0HLls7l6bKv-TUii2.N2GGaZ5GbJnOOdwRjtIYdckmbvoqRw3QvL1d3MOINr8'
```

## Schema

```ts
interface User {
  _id: ObjectId
  name: string
  email: string
  password: string
  verifiedAt: Date
  createdAt: Date
  updatedAt: Date
}

interface PasswordReset {
  _id: ObjectId
  userId: ObjectId
  token: string
  expiredAt: Date
  createdAt: Date
}

// Same schema as PasswordReset, but conceptually
// a different model with its own methods
interface RememberMe {
  _id: ObjectId
  userId: ObjectId
  token: string
  expiredAt: Date
  createdAt: Date
}
```

## Security

### Email Confirmation

- activation link
  - expires in 12h (_temporary_)
  - signed with HMAC SHA256 (_unforgeable_)
- user email
  - hashed with SHA1 (_unpredictable_)

### Password Reset

- reset token
  - pseudo-random string of 80 hex chars (_unpredictable_)
  - signed with HMAC SHA256 before storing in DB (_doesn't compromise accounts_)
  - expires in 1h (_short-lived_)
- reset link
  - when used, invalidates old tokens (_one-time use_)

### Remember Me

- remember me token
  - pseudo-random string of 80 hex chars (_unpredictable_)
  - signed with HMAC SHA256 before storing in DB (_doesn't compromise accounts_)
  - expires in 1 week (_long-lived_)
- remember me cookie
  - signed with HMAC SHA256 (_unforgeable_)
  - creates a new user session unless already authenticated

## Inspiration

Originally prompted by [Your Node.js authentication tutorial is (probably) wrong](https://medium.com/hackernoon/your-node-js-authentication-tutorial-is-wrong-f1a3bf831a46). Although its critique is on point, the article sadly doesn't offer any concrete solutions. This repo is my attempt to address those remarks in code.

## Contributions

I only know so much, so there are likely things I missed. If you see something that doesn't make sense, poses a vulnerability, or otherwise needs improvement, please feel free to open an issue or submit a PR. All contributions are welcome!
