import t from "tap";
import request from "supertest";
import { app } from "../setup";

t.test("/password/confirm - happy path", async (t) => {
  const password = "test";

  const login = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password })
    .expect(200);

  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  await request(app)
    .post("/password/confirm")
    .set("Cookie", [cookie])
    .send({ password })
    .expect(200);

  await request(app).get("/me/confirmed").set("Cookie", [cookie]).expect(200);
});

t.test("/password/confirm - guest (unauthorized)", async (t) => {
  const res = await request(app).post("/password/confirm").expect(401);

  t.equal(res.body.message, "Unauthorized");
});

t.test("/password/confirm - missing body", async (t) => {
  const login = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200);

  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  const res = await request(app)
    .post("/password/confirm")
    .set("Cookie", [cookie])
    .expect(400);

  t.equal(res.body.validation.body.message, '"password" is required');
});

t.test("/password/confirm - incorrect password", async (t) => {
  const login = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200);

  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  const res = await request(app)
    .post("/password/confirm")
    .set("Cookie", [cookie])
    .send({ password: "bogus" })
    .expect(401);

  t.equal(res.body.message, "Password is incorrect");
});
