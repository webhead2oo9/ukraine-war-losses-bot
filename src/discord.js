import { readFile } from "node:fs/promises";
import path from "node:path";

function displayDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));
}

export async function postToDiscord({ webhookUrl, report, imagePath }) {
  if (!/^https:\/\/(discord(?:app)?\.com|discord\.com)\/api\/webhooks\//.test(webhookUrl)) {
    throw new Error("DISCORD_WEBHOOK_URL does not look like a Discord webhook URL.");
  }

  const fileName = path.basename(imagePath);
  const form = new FormData();
  form.append(
    "payload_json",
    JSON.stringify({
      content: `**Estimated Russian losses — ${displayDate(report.date)}**\nDaily changes are shown in orange. [View the original source](${report.sourceUri})`,
      embeds: [
        {
          image: { url: `attachment://${fileName}` },
          footer: { text: "Automated summary • Data: lod-db/orc-losses" }
        }
      ],
      allowed_mentions: { parse: [] }
    })
  );
  form.append("files[0]", new Blob([await readFile(imagePath)], { type: "image/png" }), fileName);

  const response = await fetch(`${webhookUrl}?wait=true`, { method: "POST", body: form });
  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Discord webhook failed: HTTP ${response.status} ${details}`);
  }
  return response.json();
}
