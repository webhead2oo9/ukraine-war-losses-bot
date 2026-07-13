import test from "node:test";
import assert from "node:assert/strict";
import { createSvg } from "../src/render.js";

test("English report SVG includes totals and positive changes", () => {
  const svg = createSvg({
    date: "2026-07-13",
    metrics: [
      { key: "personnel", label: "Personnel", total: 1420690, change: 1600 }
    ]
  });
  assert.match(svg, /ESTIMATED RUSSIAN/);
  assert.match(svg, /1,420,690/);
  assert.match(svg, /\+1,600 TODAY/);
  assert.doesNotMatch(svg, /[А-Яа-яІіЇїЄє]/);
});

test("English report SVG distinguishes corrections from no change", () => {
  const svg = createSvg({
    date: "2026-07-13",
    metrics: [
      { key: "tanks", label: "Tanks", total: 100, change: -2 },
      { key: "ships", label: "Ships and boats", total: 10, change: 0 }
    ]
  });
  assert.match(svg, /−2 TODAY/);
  assert.match(svg, /NO CHANGE TODAY/);
});
