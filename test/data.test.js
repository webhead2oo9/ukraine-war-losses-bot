import test from "node:test";
import assert from "node:assert/strict";
import { buildReport, newestPair, validateDataset } from "../src/data.js";

const record = (date, personnel, tanks) => ({
  date,
  sourceUri: `https://example.com/${date}`,
  personnel,
  tanks,
  afvs: 20,
  artillery: 30,
  airDefense: 4,
  rocketSystems: 5,
  unarmoredVehicles: 60,
  fixedWingAircraft: 7,
  rotaryWingAircraft: 8,
  uavs: 90,
  ships: 10,
  submarines: 1,
  specialEquipment: 12,
  missiles: 13
});

test("newestPair sorts records newest first", () => {
  const older = record("2026-07-12", 100, 10);
  const newer = record("2026-07-13", 120, 11);
  assert.deepEqual(newestPair([older, newer]), [newer, older]);
});

test("buildReport calculates daily changes", () => {
  const report = buildReport(
    record("2026-07-13", 120, 11),
    record("2026-07-12", 100, 10)
  );
  assert.equal(report.metrics.find(({ key }) => key === "personnel").change, 20);
  assert.equal(report.metrics.find(({ key }) => key === "tanks").change, 1);
});

test("validateDataset rejects malformed metrics", () => {
  const broken = record("2026-07-13", "120", 11);
  assert.throws(
    () => validateDataset([broken, record("2026-07-12", 100, 10)]),
    /invalid personnel/
  );
});
