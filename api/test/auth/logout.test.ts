import assert from "node:assert";
import test, { before, describe } from "node:test";
import { createTestUser, getCookie, testAgent, testLogin } from "../setup.js";

describe("POST /logout", () => {
  before(createTestUser);

  test("happy path", async () => {
    const loginRes = await testAgent.post("/login").send(testLogin);
    const cookie = getCookie(loginRes);
    assert.ok(typeof cookie === "string");

    const res = await testAgent.post("/logout").set("Cookie", [cookie]);
    assert.strictEqual(res.status, 200);
    assert.match(res.headers["set-cookie"]?.[0]!, /sid=;/);

    const meRes = await testAgent.get("/me").set("Cookie", [cookie]);
    assert.strictEqual(meRes.status, 401);
  });

  test("not logged in", async () => {
    const res = await testAgent.post("/logout");

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, "Unauthorized");
  });

  test("invalid or expired cookie", async () => {
    const res = await testAgent
      .post("/logout")
      .set("Cookie", [
        "sid=s%3A1-72JvmsWh4S1qUun8a7Dh4Mh8QdNY31u0.FrwZBwXd6mSWXocz77hy0%2FvKBWovHj7DnvZR2SHrZh8",
      ]);

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, "Unauthorized");
    assert.match(res.headers["set-cookie"]?.[0]!, /sid=;/);
  });
});
