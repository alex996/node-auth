import t from "tap";
import request from "supertest";
import { app, fakeInbox } from "../setup";
import { confirmationUrl } from "../../src/routes";

t.test("/email/verify - happy path", async (t) => {
  const email = "jake@gmail.com";

  const register = await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Jake" })
    .expect(201);

  const [, link] = fakeInbox[email][0].message.html.match(
    /<a href="http:\/\/localhost(.+)">/
  );

  await request(app).post(link).expect(200);

  const cookie = register.headers["set-cookie"][0].split(/;/, 1)[0];

  await request(app).get("/me/verified").set("Cookie", [cookie]).expect(200);
});

t.test("/email/verify - missing params", async (t) => {
  const res = await request(app).post("/email/verify").expect(400);

  t.equal(
    res.body.validation.query.message,
    '"id" is required. "expires" is required. "signature" is required'
  );
});

t.test("/email/verify - tampered URL", async (t) => {
  const url = confirmationUrl(1).replace(
    /http:\/\/localhost(.+expires)=\d*(.+)/,
    "$1=1626737260105$2" // custom expiration timestamp
  );

  const res = await request(app).post(url).expect(400);

  t.equal(res.body.message, "URL is invalid");
});

t.test("/email/verify - expired URL", async (t) => {
  const [, url] = confirmationUrl(1, 1626737676114).match(
    /http:\/\/localhost(.+)/
  )!;

  const res = await request(app).post(url).expect(400);

  t.equal(res.body.message, "URL has expired");
});

t.test("/email/verify - invalid user ID (user doesn't exist)", async (t) => {
  const [, url] = confirmationUrl(999).match(/http:\/\/localhost(.+)/)!;

  const res = await request(app).post(url).expect(400);

  t.equal(res.body.message, "Email is incorrect or already verified");
});

t.test("/email/verify - already verified", async (t) => {
  const email = "gary@gmail.com";

  await request(app)
    .post("/register")
    .send({ email, password: "123456", name: "Gary" })
    .expect(201);

  const [, link] = fakeInbox[email][0].message.html.match(
    /<a href="http:\/\/localhost(.+)">/
  );

  await request(app).post(link).expect(200);

  const res = await request(app).post(link).expect(400);

  t.equal(res.body.message, "Email is incorrect or already verified");
});
