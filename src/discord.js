import { readFile } from "node:fs/promises";
import path from "node:path";

export async function createImageOnlyForm(imagePath) {
  const fileName = path.basename(imagePath);
  const form = new FormData();
  form.append("files[0]", new Blob([await readFile(imagePath)], { type: "image/png" }), fileName);
  return form;
}

export async function postToDiscord({ webhookUrl, imagePath }) {
  if (!/^https:\/\/(discord(?:app)?\.com|discord\.com)\/api\/webhooks\//.test(webhookUrl)) {
    throw new Error("DISCORD_WEBHOOK_URL does not look like a Discord webhook URL.");
  }

  const response = await fetch(`${webhookUrl}?wait=true`, {
    method: "POST",
    body: await createImageOnlyForm(imagePath)
  });
  if (!response.ok) {
    const details = (await response.text()).slice(0, 500);
    throw new Error(`Discord webhook failed: HTTP ${response.status} ${details}`);
  }
  return response.json();
}
