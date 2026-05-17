import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("recommendation weights stay calibrated", async () => {
  const source = await readFile(
    new URL("../src/lib/recommendations/constants.ts", import.meta.url),
    "utf8"
  );

  assert.match(source, /clicks:\s*3/);
  assert.match(source, /readingTime:\s*0\.05/);
  assert.match(source, /bookmarks:\s*12/);
  assert.match(source, /categoryView:\s*0\.75/);
});

test("feed ranking weights sum to one", async () => {
  const source = await readFile(
    new URL("../src/lib/recommendations/constants.ts", import.meta.url),
    "utf8"
  );
  const matches = Array.from(
    source.matchAll(/(userEmbedding|behavior|recency|trending):\s*([0-9.]+)/g)
  );
  const total = matches.reduce((sum, match) => sum + Number(match[2]), 0);

  assert.ok(Math.abs(total - 1) < Number.EPSILON * 10);
});
