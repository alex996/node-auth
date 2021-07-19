import t from "tap";
import request from "supertest";
import { app } from "../src/app";

t.test("/ - headers", async (t) => {
  const res = await request(app).get("/").expect(200);

  t.notOk(res.headers["x-powered-by"]);
});
