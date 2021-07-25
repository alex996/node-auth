import t from "tap";
import request from "supertest";
import { randomBytes } from "crypto";
import { app, fakeInbox } from "../setup";

t.test("/password/reset - happy path", async (t) => {
  const email = "samuel@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Samuel" })
    .expect(201);

  await request(app).post("/password/email").send({ email }).expect(200);

  const [, link] = fakeInbox[email][1].message.html.match(
    /<a href="http:\/\/localhost(.+)">/
  );

  const password = "789012";

  await request(app).post(link).send({ password }).expect(200);

  await request(app).post("/login").send({ email, password }).expect(200);
});

t.test("/password/reset - already authenticated", async (t) => {
  const email = "test@gmail.com";

  const login = await request(app)
    .post("/login")
    .send({ email, password: "test" })
    .expect(200);
  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  const res = await request(app)
    .post("/password/reset")
    .set("Cookie", [cookie])
    .send({ email })
    .expect(403);

  t.equal(res.body.message, "Forbidden");
});

t.test("/password/reset - missing body and params", async (t) => {
  const res = await request(app).post("/password/reset").expect(400);

  t.equal(res.body.validation.body.message, '"password" is required');
  t.equal(
    res.body.validation.query.message,
    '"id" is required. "token" is required'
  );
});

t.test("/password/reset - invalid token", async (t) => {
  const res = await request(app)
    .post(`/password/reset?id=1&token=${randomBytes(40).toString("hex")}`)
    .send({ password: "test" })
    .expect(401);

  t.equal(res.body.message, "Token or ID is invalid");
});

t.test("/password/reset - invalid user ID", async (t) => {
  const email = "francis@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Francis" })
    .expect(201);

  await request(app).post("/password/email").send({ email }).expect(200);

  const [, link] = fakeInbox[email][1].message.html.match(
    /<a href="http:\/\/localhost(.+)">/
  );

  const res = await request(app)
    .post(link.replace(/id=\d{1,}/, "id=1"))
    .send({ password: "test" })
    .expect(401);

  t.equal(res.body.message, "Token or ID is invalid");
});

t.test("/password/verify - token invalidation", async (t) => {
  const email = "tim@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Tim" })
    .expect(201);

  await request(app).post("/password/email").send({ email }).expect(200);

  await request(app).post("/password/email").send({ email }).expect(200);

  const regex = /<a href="http:\/\/localhost(.+)">/;
  const [, link1] = fakeInbox[email][1].message.html.match(regex);
  const [, link2] = fakeInbox[email][2].message.html.match(regex);

  const password = "789012";

  await request(app).post(link1).send({ password }).expect(200); // older token still works

  const res = await request(app).post(link2).send({ password }).expect(401);

  t.equal(res.body.message, "Token or ID is invalid");
});
