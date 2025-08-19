import assert from "node:assert";
import test, { before, describe } from "node:test";
import {
  createTestUser,
  fakeInbox,
  getCookie,
  testAgent,
  testCookie,
  testLogin,
} from "../setup.js";

describe("POST /register", () => {
  const name = "Joe Doe";
  const email = "joedoe@example.com";
  const password = "secret12";

  before(createTestUser);

  test("happy path", async () => {
    const res = await testAgent.post("/register").send({
      name,
      email,
      password,
    });

    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.body.id === "number");
    assert.partialDeepStrictEqual(res.body, {
      name,
      email,
      verified_at: null,
    });
    assert.match(
      res.headers["set-cookie"]?.[0]!,
      /sid=s%3A[^;]+; Path=\/; Expires=[^;]+; HttpOnly; SameSite=Strict/
    );
    const cookie = getCookie(res)!;
    assert.ok(cookie.startsWith(`sid=s%3A${res.body.id}`));

    const resMe = await testAgent.get("/me").set("Cookie", [cookie]);
    assert.strictEqual(resMe.status, 200);

    assert.match(
      fakeInbox[email]![0]!.message.html,
      /\/email\/verify\?id=\d{1,}&expiredAt=\d{13,}&signature=[\w\-]{43}/
    );
  });

  test("empty body", async () => {
    const res = await testAgent.post("/register").send({});

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(Object.keys(res.body.body), [
      "_errors",
      "email",
      "password",
      "name",
    ]);
  });

  test("already logged in", async () => {
    const res = await testAgent.post("/register").set("Cookie", [testCookie]);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.message, "Forbidden");
  });

  test("email already taken", async () => {
    const res = await testAgent
      .post("/register")
      .send({ name, email: testLogin.email, password });

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body.body.email._errors, [
      "Email is already taken",
    ]);
  });
});
