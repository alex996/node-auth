import assert from "node:assert";
import test, { before, describe } from "node:test";
import {
  createTestUser,
  getCookie,
  testAgent,
  testCookie,
  testLogin,
} from "../setup.js";

describe("POST /login", () => {
  before(createTestUser);

  test("happy path", async () => {
    const res = await testAgent.post("/login").send(testLogin);

    assert.strictEqual(res.status, 200);
    assert.partialDeepStrictEqual(res.body, {
      id: 1,
      name: "Test",
      email: testLogin.email,
    });
    assert.ok(typeof res.body.verified_at === "number");
    assert.match(
      res.headers["set-cookie"]?.[0]!,
      /sid=s%3A[^;]+; Path=\/; Expires=[^;]+; HttpOnly; SameSite=Strict/
    );
    const cookie = getCookie(res)!;
    assert.ok(cookie.startsWith(`sid=s%3A${res.body.id}`));

    const resMe = await testAgent.get("/me").set("Cookie", [cookie]);
    assert.strictEqual(resMe.status, 200);
  });

  test("empty body", async () => {
    const res = await testAgent.post("/login").send({});

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(Object.keys(res.body.body), [
      "_errors",
      "email",
      "password",
    ]);
  });

  test("already logged in", async () => {
    const res = await testAgent.post("/login").set("Cookie", [testCookie]);

    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.body.message, "Forbidden");
  });

  test("email doesn't exist", async () => {
    const res = await testAgent
      .post("/login")
      .send({ email: "bogus@example.com", password: "test" });

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body.body.email._errors, ["Email is incorrect"]);
  });

  test("incorrect password", async () => {
    const res = await testAgent
      .post("/login")
      .send({ email: testLogin.email, password: "test" });

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body.body.password._errors, [
      "Password is incorrect",
    ]);
  });

  test("already log");
});
