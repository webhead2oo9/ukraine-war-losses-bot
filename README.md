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
`DISCORD_WEBHOOK_URL`. The workflow checks the feed at 00:17, 03:17, 09:17,
15:17, and 18:17 UTC. It accepts the newest unposted report when it is dated
today or yesterday in Kyiv, allowing the next poll to recover an unusually late
update. Future-dated or older reports are skipped. The workflow commits the new
posting state after a successful webhook response; later checks exit without
rendering when that date was already posted.

Tests run on pushes and pull requests rather than on every scheduled retry.
State-only commits made by the workflow do not trigger another test run.

Manual workflow runs default to a dry render and do not contact Discord.

The state push is retried three times. As with any automation spanning two
independent services, there is still a very small duplicate-delivery window if
Discord accepts a post but the workflow is interrupted before GitHub persists
the new state.

## Data limitations

Only categories present in the upstream JSON are rendered. For example, the
Ministry's current graphic includes ground robotic complexes, but the upstream
dataset does not currently expose that field.

Daily changes are calculated only when the two newest reports have consecutive
dates. If an upstream day is missing, the job fails rather than labeling a
multi-day difference as a change for "today."
