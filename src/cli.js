import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fetchReport, dateInKyiv, isRecentReportDate } from "./data.js";
import { postToDiscord } from "./discord.js";
import { renderPng } from "./render.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const STATE_PATH = path.join(ROOT, "state", "last-posted-date.txt");

function hasFlag(name) {
  return process.argv.includes(name);
}

async function readLastPostedDate() {
  try {
    return (await readFile(STATE_PATH, "utf8")).trim();
  } catch (error) {
    if (error.code === "ENOENT") return "";
    throw error;
  }
}

async function main() {
  const dryRun = hasFlag("--dry-run");
  const requireRecent = hasFlag("--require-recent");
  const report = await fetchReport();
  const today = dateInKyiv();

  if (requireRecent && !isRecentReportDate(report.date, today)) {
    console.log(
      `Upstream data is ${report.date}; expected an unposted report from ${today} or the preceding day.`
    );
    return;
  }

  if (!dryRun && (await readLastPostedDate()) === report.date) {
    console.log(`${report.date} has already been posted; nothing to do.`);
    return;
  }

  const outputDirectory = path.join(ROOT, "output");
  const outputPath = path.join(outputDirectory, `russian-losses-${report.date}.png`);
  await mkdir(outputDirectory, { recursive: true });
  await renderPng(report, outputPath);
  console.log(`Rendered ${outputPath}`);

  if (dryRun) {
    console.log("Dry run complete; Discord was not contacted.");
    return;
  }

  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error("DISCORD_WEBHOOK_URL is required unless --dry-run is used.");
  }

  await postToDiscord({ webhookUrl, imagePath: outputPath });
  await writeFile(STATE_PATH, `${report.date}\n`, "utf8");
  console.log(`Posted ${report.date} to Discord and updated state.`);
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
