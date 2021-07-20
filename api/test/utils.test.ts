import t from "tap";
import { safeEqual, compress } from "../src/utils";

t.test("safeEqual() - happy path", async (t) => {
  t.ok(safeEqual("some_string", "some_string"));
});

t.test("safeEqual() - unequal strings, same length", async (t) => {
  t.notOk(safeEqual("some_string", "some_abcxyz"));
});

t.test("safeEqual() - unequal strings, variable length", async (t) => {
  t.notOk(safeEqual("some_string", "some_other_string"));
});

//

t.test("compress() - happy path", async (t) => {
  const unminified = `
    <article>
      <h2>Title</h2>
      <p>Lorem ipsum dolor</p>
    </article>
  `;
  const minified = `<article><h2>Title</h2><p>Lorem ipsum dolor</p></article>`;

  t.equal(compress(unminified), minified);
});
