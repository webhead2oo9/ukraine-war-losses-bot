import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { createImageOnlyForm } from "../src/discord.js";

test("Discord form contains only the PNG attachment", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "losses-discord-test-"));
  const imagePath = path.join(directory, "report.png");
  try {
    await writeFile(imagePath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const form = await createImageOnlyForm(imagePath);
    assert.deepEqual([...form.keys()], ["files[0]"]);
    assert.equal(form.get("payload_json"), null);
    assert.equal(form.get("files[0]").type, "image/png");
    assert.equal(form.get("files[0]").name, "report.png");
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
