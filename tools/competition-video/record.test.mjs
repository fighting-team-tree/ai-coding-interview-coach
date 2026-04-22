import test from "node:test";
import assert from "node:assert/strict";

import { computeViewportScrollTop } from "./record.mjs";

test("computeViewportScrollTop positions an element around the target viewport ratio", () => {
  const target = computeViewportScrollTop({
    currentScrollY: 820,
    elementTop: 560,
    elementHeight: 120,
    viewportHeight: 1080,
    targetRatio: 0.4,
  });

  assert.equal(target, 1008);
});

test("computeViewportScrollTop clamps to the top of the page", () => {
  const target = computeViewportScrollTop({
    currentScrollY: 0,
    elementTop: 80,
    elementHeight: 60,
    viewportHeight: 1080,
    targetRatio: 0.4,
  });

  assert.equal(target, 0);
});
