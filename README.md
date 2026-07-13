# Daily Ukraine War Loss Summary

Generates an English 1080×1280 PNG from the two newest records in
[`lod-db/orc-losses`](https://github.com/lod-db/orc-losses), calculates each daily
increase, and optionally posts the result to a Discord webhook.

The image is an unofficial automated summary. Its footer identifies the Ministry
of Defence of Ukraine as the original source and `lod-db/orc-losses` as the data
provider.

## Local preview

Requires Node.js 22 or newer.

```bash
npm install
npm test
npm run generate
```

The generated PNG is written to `output/` and a dry run never contacts Discord.

## Post to Discord

Create a Discord webhook, set its URL as an environment variable, then run:

```bash
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..." npm run post
```

On PowerShell:

```powershell
$env:DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/..."
npm.cmd run post
```

The last successfully posted upstream date is stored in
`state/last-posted-date.txt`, preventing later scheduled retries from posting the
same report twice.

## GitHub Actions

Add the webhook URL as a repository Actions secret named
`DISCORD_WEBHOOK_URL`. The workflow checks the feed at 06:17, 07:17, and 08:17
UTC. It posts only when the latest record matches the current date in Kyiv and
commits the new posting state after a successful webhook response.

Manual workflow runs default to a dry render and do not contact Discord.

## Data limitations

Only categories present in the upstream JSON are rendered. For example, the
Ministry's current graphic includes ground robotic complexes, but the upstream
dataset does not currently expose that field.
