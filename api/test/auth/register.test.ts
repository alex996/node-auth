import t from "tap";
import request from "supertest";
import { app, fakeInbox } from "../setup";

t.test("/register - happy path", async (t) => {
  const email = "alex@gmail.com";

  const res = await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Alex" })
    .expect(201)
    .expect("Set-Cookie", /sid=.+; Expires=.+; HttpOnly; SameSite=Strict/);

  t.match(
    fakeInbox[email][0].message.html,
    /\/email\/verify\?id=\d{1,}&expires=\d{13,}&signature=[a-z\d]{64}/
  );

  const cookie = res.headers["set-cookie"][0].split(/;/, 1)[0];

  await request(app).get("/me").set("Cookie", [cookie]).expect(200);
});

t.test("/register - missing body", async (t) => {
  const res = await request(app).post("/register").expect(400);

  t.equal(
    res.body.validation.body.message,
    '"email" is required. "password" is required. "name" is required'
  );
});

t.test("/register - email already taken", async (t) => {
  const res = await request(app)
    .post("/register")
    .send({ email: "test@gmail.com", password: "123456", name: "Test" })
    .expect(400);

  t.equal(res.body.message, "Email is already taken");
});

t.test("/register - already logged in", async (t) => {
  const login = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200);
  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  const res = await request(app)
    .post("/register")
    .set("Cookie", [cookie])
    // .send({}) // doesn't matter what the body is
    .expect(403);

  t.equal(res.body.message, "Forbidden");
});

t.test("/register - invalid/expired cookie", async (t) => {
  await request(app)
    .post("/register")
    .set("Cookie", [
      "sid=s%3AT_Pkrw6AvSQ3LfOYC9q0EnE1uqWQhJbp.hTs%2BqXXHbFMn2dxgSKBWd%2F%2FEQ8xwnV3KKsA9IwVJ7nU",
    ])
    .send({ email: "max@gmail.com", password: "123456", name: "Max" })
    .expect(201)
    .expect("Set-Cookie", /sid=.+; Expires=.+; HttpOnly; SameSite=Strict/);
});
