import t from "tap";
import request from "supertest";
import { app, fakeInbox } from "../setup";

t.test("/email/resend - happy path", async (t) => {
  const email = "homer@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Homer" })
    .expect(201);

  await request(app).post("/email/resend").send({ email }).expect(200);

  t.match(
    fakeInbox[email][1].message.html,
    /\/email\/verify\?id=\d{1,}&expires=\d{13,}&signature=[a-z\d]{64}/
  );
});

t.test("/email/resend - missing body", async (t) => {
  const res = await request(app).post("/email/resend").expect(400);

  t.equal(res.body.validation.body.message, '"email" is required');
});

t.test("/email/resend - non-existing email", async (t) => {
  const res = await request(app)
    .post("/email/resend")
    .send({ email: "bogus@gmail.com" })
    .expect(400);

  t.equal(res.body.message, "Email is incorrect or already verified");
});

t.test("/email/resend - already verified", async (t) => {
  const email = "josh@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Josh" })
    .expect(201);

  const [, link] = fakeInbox[email][0].message.html.match(
    /<a href="http:\/\/localhost(.+)">/
  );

  await request(app).post(link).expect(200);

  const res = await request(app)
    .post("/email/resend")
    .send({ email })
    .expect(400);

  t.equal(res.body.message, "Email is incorrect or already verified");
});
