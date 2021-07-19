import t from "tap";
import request from "supertest";
import { app } from "../src/app";

t.test("/login - happy path", async (t) => {
  await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200)
    .expect("Set-Cookie", /sid=.+; HttpOnly; SameSite=Strict/);
});

t.test("/login - missing credentials", async (t) => {
  const res = await request(app).post("/login").expect(400);

  t.equal(
    res.body.validation.body.message,
    '"email" is required. "password" is required'
  );
});

t.todo("/login - invalid credentials");
