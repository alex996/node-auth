import assert from "node:assert";
import crypto from "node:crypto";
import test, { before, describe } from "node:test";
import {
  createTestUser,
  fakeInbox,
  getCookie,
  sleep,
  testAgent,
  testCookie,
} from "../setup.js";

describe("POST /password/reset", () => {
  const password = "whatever";
  const idTokenRegex = /\/password\/reset\?id=(\d{1,})&token=([\w\-]{43})/;

  before(createTestUser);

  test("happy path", async () => {
    const email = "jim@example.com";

    const registerRes = await testAgent
      .post("/register")
      .send({ name: "Jim", email, password: "test" });
    const cookie = getCookie(registerRes)!;

    await testAgent.post("/password/email").send({ email });

    await sleep(5);

    const [, id, token] = fakeInbox[email]![1].message.html.match(idTokenRegex);

    const res = await testAgent
      .post("/password/reset")
      .send({ id: +id, token, password });
    assert.strictEqual(res.status, 200);

    const meRes = await testAgent.get("/me").set("Cookie", [cookie]);
    assert.strictEqual(meRes.status, 401); // auto-logged out

    const loginRes = await testAgent.post("/login").send({ email, password });
    assert.strictEqual(loginRes.status, 200);
  });

  test("already logged in", async () => {
    const res = await testAgent
      .post("/password/reset")
      .set("Cookie", [testCookie]);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.message, "Forbidden");
  });

  test("empty body", async () => {
    const res = await testAgent.post("/password/reset").send({});

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(Object.keys(res.body.body), [
      "_errors",
      "id",
      "token",
      "password",
    ]);
  });

  test("invalid token", async () => {
    const res = await testAgent.post("/password/reset").send({
      id: 1,
      token: crypto.randomBytes(32).toString("base64url"),
      password,
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, "Token is invalid");
  });

  test("using someone else's token", async () => {
    const email = "rick@example.com";

    await testAgent
      .post("/register")
      .send({ name: "Rick", email, password: "test" });

    await testAgent.post("/password/email").send({ email });

    await sleep(5);

    const [, , token] = fakeInbox[email]![1].message.html.match(idTokenRegex);

    const res = await testAgent
      .post("/password/reset")
      .send({ id: 1, token, password });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, "Token is invalid");
  });

  test("token invalidation", async () => {
    const email = "tim@example.com";

    await testAgent
      .post("/register")
      .send({ name: "Tim", email, password: "test" });

    await testAgent.post("/password/email").send({ email });
    await testAgent.post("/password/email").send({ email });

    await sleep(5);

    const [, id, token1] =
      fakeInbox[email]![1].message.html.match(idTokenRegex);
    const [, , token2] = fakeInbox[email]![2].message.html.match(idTokenRegex);

    const res1 = await testAgent
      .post("/password/reset")
      .send({ id: +id, token: token1, password });
    assert.strictEqual(res1.status, 200); // older token still works

    const res2 = await testAgent
      .post("/password/reset")
      .send({ id: +id, token: token2, password });
    assert.strictEqual(res2.status, 400);
    assert.strictEqual(res2.body.message, "Token is invalid");
  });
});
