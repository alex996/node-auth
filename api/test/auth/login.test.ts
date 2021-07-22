import t from "tap";
import request from "supertest";
import { app } from "../setup";

t.test("/login - happy path", async (t) => {
  await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200)
    .expect("Set-Cookie", /sid=.+; Expires=.+; HttpOnly; SameSite=Strict/);
});

t.test("/login - missing credentials", async (t) => {
  const res = await request(app).post("/login").expect(400);

  t.equal(
    res.body.validation.body.message,
    '"email" is required. "password" is required'
  );
});

t.test("/login - invalid email (user doesn't exist)", async (t) => {
  const res = await request(app)
    .post("/login")
    .send({ email: "bogus@gmail.com", password: "test" })
    .expect(401);

  t.equal(res.body.message, "Email or password is incorrect");
});

t.test("/login - invalid password (user does exist)", async (t) => {
  const res = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "wrong" })
    .expect(401);

  t.equal(res.body.message, "Email or password is incorrect");
});

t.test("/login - already logged in", async (t) => {
  const payload = { email: "test@gmail.com", password: "test" };

  const req = await request(app).post("/login").send(payload).expect(200);

  await request(app)
    .post("/login")
    .set("Cookie", [req.headers.sid])
    .send(payload)
    .expect(200)
    .expect("Set-Cookie", /sid=.+; Expires=.+; HttpOnly; SameSite=Strict/);
});
