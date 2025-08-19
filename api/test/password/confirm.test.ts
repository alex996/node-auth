import assert from "node:assert";
import test, { before, describe } from "node:test";
import { createTestUser, testAgent, testCookie, testLogin } from "../setup.js";

describe("POST /register", () => {
  before(createTestUser);

  test("happy path", async () => {
    const res = await testAgent
      .post("/password/confirm")
      .set("Cookie", [testCookie])
      .send({ password: testLogin.password });
    assert.strictEqual(res.status, 200);

    const confirmedRes = await testAgent
      .get("/me/confirmed")
      .set("Cookie", [testCookie]);
    assert.strictEqual(confirmedRes.status, 200);
  });

  test("not logged in", async () => {
    const res = await testAgent.post("/password/confirm");

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, "Unauthorized");
  });

  test("empty body", async () => {
    const res = await testAgent
      .post("/password/confirm")
      .set("Cookie", [testCookie])
      .send({});

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body.body.password._errors, [
      "Invalid input: expected string, received undefined",
    ]);
  });

  test("incorrect password", async () => {
    const res = await testAgent
      .post("/password/confirm")
      .set("Cookie", [testCookie])
      .send({ password: "bogus" });

    assert.strictEqual(res.status, 400);
    assert.deepStrictEqual(res.body.body.password._errors, [
      "Password is incorrect",
    ]);
  });
});
