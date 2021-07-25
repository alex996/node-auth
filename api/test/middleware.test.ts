import t from "tap";
import request from "supertest";
import { app } from "./setup";

t.test("/ - headers", async (t) => {
  const res = await request(app).get("/").expect(200);

  t.notOk(res.headers["x-powered-by"]);
});

t.test("/bogus - not found", async (t) => {
  await request(app).get("/bogus").expect(404);
});

t.test("/register - malformed JSON", async (t) => {
  await request(app)
    .post("/register")
    .set("Content-Type", "application/json")
    .send('{"email":"test@gmail.com}')
    .expect(400);
});

t.test("/me - unauthenticated", async (t) => {
  await request(app).get("/me").expect(401);
});

t.test("/me/verified - email unverified", async (t) => {
  await request(app).get("/me/verified").expect(401);

  const login = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200);

  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  await request(app).get("/me/verified").set("Cookie", [cookie]).expect(403);
});

t.test("/me/verified - password unconfirmed", async (t) => {
  await request(app).get("/me/confirmed").expect(401);

  const login = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200);

  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  await request(app).get("/me/confirmed").set("Cookie", [cookie]).expect(403);
});
