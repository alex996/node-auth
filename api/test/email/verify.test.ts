import assert from "node:assert";
import test, { before, describe } from "node:test";
import { LINK_EXPIRES_IN_HRS } from "../../src/config.js";
import { addHours, signUrl, verificationUrl } from "../../src/routes/email.js";
import {
  createTestUser,
  fakeInbox,
  getCookie,
  sleep,
  testAgent,
  testCookie,
} from "../setup.js";

describe("POST /email/verify", () => {
  before(createTestUser);

  test("happy path", async () => {
    const email = "mike@example.com";
    const registerRes = await testAgent
      .post("/register")
      .send({ name: "Mike", email, password: "test" });
    const cookie = getCookie(registerRes)!;
    assert.strictEqual(registerRes.body.verified_at, null);

    await sleep(5); // until the email is sent

    const unverifiedRes = await testAgent
      .get("/me/verified")
      .set("Cookie", [cookie]);
    assert.strictEqual(unverifiedRes.status, 403);
    assert.strictEqual(unverifiedRes.body.message, "Forbidden");

    const [, , expiredAt, signature] = fakeInbox[email]![0]!.message.html.match(
      /id=(\d{1,})&expiredAt=(\d{13,})&signature=([\w\-]{43})/
    );
    const res = await testAgent
      .post("/email/verify")
      .set("Cookie", [cookie])
      .send({ expiredAt: +expiredAt, signature });
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body === "number");

    const verifiedRes = await testAgent
      .get("/me/verified")
      .set("Cookie", [cookie]);
    assert.strictEqual(verifiedRes.status, 200);
  });

  test("not logged in", async () => {
    const res = await testAgent.post("/email/verify");

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, "Unauthorized");
  });

  test("empty body", async () => {
    const res = await testAgent
      .post("/email/verify")
      .set("Cookie", [testCookie])
      .send({});

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(Object.keys(res.body.body), [
      "_errors",
      "expiredAt",
      "signature",
    ]);
  });

  const signatureRegex = /signature=(.+)$/;

  test("tampered URL", async () => {
    const [, signature] = signUrl(verificationUrl(1)).match(signatureRegex)!;

    const res = await testAgent
      .post("/email/verify")
      .set("Cookie", [testCookie])
      .send({ expiredAt: new Date().getTime(), signature }); // custom expiration
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, "URL is invalid");
  });

  test("expired URL", async () => {
    const expDate = addHours(new Date(), -LINK_EXPIRES_IN_HRS);
    const expiredAt = expDate.getTime();

    const [, signature] = signUrl(verificationUrl(1, expiredAt)).match(
      signatureRegex
    )!;

    const res = await testAgent
      .post("/email/verify")
      .set("Cookie", [testCookie])
      .send({ expiredAt, signature });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, "URL has expired");
  });

  const idSignatureRegex = /expiredAt=(\d{13,})&signature=(.+)$/;

  test("already verified", async () => {
    const [, expiredAt, signature] = signUrl(verificationUrl(1)).match(
      idSignatureRegex
    )!;

    const res = await testAgent
      .post("/email/verify")
      .set("Cookie", [testCookie])
      .send({ expiredAt: +expiredAt!, signature });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, "Email is already verified");
  });

  test("using someone else's URL", async () => {
    const [, expiredAt, signature] = signUrl(verificationUrl(999)).match(
      idSignatureRegex
    )!;

    const res = await testAgent
      .post("/email/verify")
      .set("Cookie", [testCookie])
      .send({ expiredAt: +expiredAt!, signature });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, "URL is invalid"); // because it was signed with user ID 1
  });
});
