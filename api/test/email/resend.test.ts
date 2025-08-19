import assert from "node:assert";
import test, { before, describe } from "node:test";
import {
  createTestUser,
  fakeInbox,
  getCookie,
  sleep,
  testAgent,
  testCookie,
} from "../setup.js";

describe("POST /email/resend", () => {
  before(createTestUser);

  test("happy path", async () => {
    const email = "janedoe@example.com";
    const registerRes = await testAgent
      .post("/register")
      .send({ name: "Jane", email, password: "test" });
    const cookie = getCookie(registerRes)!;

    const res = await testAgent.post("/email/resend").set("Cookie", [cookie]);
    assert.strictEqual(res.status, 200);

    await sleep(5); // until the 2nd email is sent

    assert.match(
      fakeInbox[email]![1]!.message.html,
      /\/email\/verify\?id=\d{1,}&expiredAt=\d{13,}&signature=[\w\-]{43}/
    );
  });

  test("not logged in", async () => {
    const res = await testAgent.post("/email/resend");

    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.message, "Unauthorized");
  });

  test("already verified", async () => {
    const res = await testAgent
      .post("/email/resend")
      .set("Cookie", [testCookie]);
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, "Email is already verified");
  });
});
