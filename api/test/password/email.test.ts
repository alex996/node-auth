import assert from "node:assert";
import test, { before, describe } from "node:test";
import {
  createTestUser,
  fakeInbox,
  sleep,
  testAgent,
  testCookie,
  testLogin,
} from "../setup.js";

describe("POST /password/email", () => {
  before(createTestUser);

  test("happy path", async () => {
    const res = await testAgent
      .post("/password/email")
      .send({ email: testLogin.email });

    assert.strictEqual(res.status, 200);

    await sleep(5);

    const linkRegex = /\/password\/reset\?id=\d{1,}&token=[\w\-]{43}/;
    assert.match(fakeInbox[testLogin.email]![0].message.html, linkRegex);

    // "Resend" works too
    await testAgent.post("/password/email").send({ email: testLogin.email });

    await sleep(5);

    assert.match(fakeInbox[testLogin.email]![1].message.html, linkRegex);
  });

  test("already logged in", async () => {
    const res = await testAgent
      .post("/password/email")
      .set("Cookie", [testCookie])
      .send({ email: testLogin.email });

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.message, "Forbidden");
  });

  test("empty body", async () => {
    const res = await testAgent.post("/password/email").send({});

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body.body.email._errors, [
      "Invalid input: expected string, received undefined",
    ]);
  });

  test("invalid email", async () => {
    const res = await testAgent
      .post("/password/email")
      .send({ email: "bogus@example.com" });

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body.body.email._errors, ["Email not found"]);
  });
});
