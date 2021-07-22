import t from "tap";
import request from "supertest";
import { app, fakeInbox } from "../setup";

t.test("/password/email - happy path", async (t) => {
  const email = "mark@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Mark" })
    .expect(201);

  await request(app).post("/password/email").send({ email }).expect(200);

  t.match(
    fakeInbox[email][1].message.html,
    /\/password\/reset\?id=\d{1,}&token=[a-z\d]{80}/
  );
});

t.test("/password/email - already authenticated", async (t) => {
  const email = "test@gmail.com";

  const login = await request(app)
    .post("/login")
    .send({ email, password: "test" })
    .expect(200);
  const cookie = login.headers["set-cookie"][0].split(/;/, 1)[0];

  const res = await request(app)
    .post("/password/email")
    .set("Cookie", [cookie])
    .send({ email })
    .expect(403);

  t.equal(res.body.message, "Forbidden");
});

t.test("/password/email - missing body", async (t) => {
  const res = await request(app).post("/password/email").expect(400);

  t.equal(res.body.validation.body.message, '"email" is required');
});

t.test("/password/email - invalid email", async (t) => {
  const res = await request(app)
    .post("/password/email")
    .send({ email: "bogus@gmail.com" })
    .expect(400);

  t.equal(res.body.message, "Email does not exist");
});

t.test("/password/email - multiple tokens", async (t) => {
  const email = "rob@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Rob" })
    .expect(201);

  await request(app).post("/password/email").send({ email }).expect(200);

  await request(app).post("/password/email").send({ email }).expect(200);

  t.match(
    fakeInbox[email][2].message.html,
    /\/password\/reset\?id=\d{1,}&token=[a-z\d]{80}/
  );
});
