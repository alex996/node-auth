import t from "tap";
import request from "supertest";
import { app } from "../src/app";

t.test("/bogus - not found", async (t) => {
  await request(app).get("/bogus").expect(404);
});

t.test("/register - malformed JSON", async (t) => {
  await request(app)
    .post("/register")
    .set("Content-Type", "application/json")
    .send('{"email":"test@gmail.com}')
    .expect(400);
});
