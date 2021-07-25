import t from "tap";
import request from "supertest";
import { app } from "../setup";

t.test("/logout - happy path", async (t) => {
  const req = await request(app)
    .post("/login")
    .send({ email: "test@gmail.com", password: "test" })
    .expect(200);
  const cookie = req.headers["set-cookie"][0].split(/;/, 1)[0];

  await request(app)
    .post("/logout")
    .set("Cookie", [cookie])
    .expect(200)
    .expect("Set-Cookie", /sid=;/);

  await request(app).get("/me").set("Cookie", [cookie]).expect(401);
});

t.test("/logout - not logged in", async (t) => {
  const res = await request(app).post("/logout").expect(401);

  t.equal(res.body.message, "Unauthorized");
});

t.test("/logout - invalid or expired cookie", async (t) => {
  const res = await request(app)
    .post("/logout")
    .set("Cookie", [
      "sid=s%3AT_Pkrw6AvSQ3LfOYC9q0EnE1uqWQhJbp.hTs%2BqXXHbFMn2dxgSKBWd%2F%2FEQ8xwnV3KKsA9IwVJ7nU",
    ])
    // .expect("Set-Cookie", /sid=;/) // TODO should unset invalid cookie
    .expect(401);

  t.equal(res.body.message, "Unauthorized");
});
