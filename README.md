# Ukraine War Losses Bot

Generates an English 1080 x 1280 PNG showing estimated Russian losses in
Ukraine and posts it to Discord on a daily schedule. The webhook message
contains only the image attachment, with no accompanying text, embed, or
mentions.

This is an unofficial, independently operated project. It is not affiliated
with or endorsed by the Ukrainian government, the Ministry of Defence of
Ukraine, or the maintainers of the upstream dataset.

## Data sources and methodology

This project does not scrape social media posts or manually transcribe the
daily figures. It uses the public
[`lod-db/orc-losses`](https://github.com/lod-db/orc-losses) dataset:

- Data file: [`russian-losses.json`](https://raw.githubusercontent.com/lod-db/orc-losses/main/russian-losses.json)
- English schema: [`russian-losses.en.schema.json`](https://github.com/lod-db/orc-losses/blob/main/schema/russian-losses.en.schema.json)
- Upstream project documentation: [`lod-db/orc-losses` README](https://github.com/lod-db/orc-losses#readme)

The upstream maintainers compile their dataset from official reports published
by the [Ministry of Defence of Ukraine](https://mod.gov.ua/). Every daily JSON
record contains a `sourceUri` linking to the corresponding Ministry report, so
the original source for a displayed figure can be traced directly.

For each run, the bot:

1. Downloads the upstream JSON file over HTTPS.
2. Validates the records and sorts them by date.
3. Selects the two newest records with consecutive calendar dates.
4. Calculates each change as `newest cumulative total - previous cumulative total`.
5. Renders the totals and calculated changes into the PNG.
6. Uploads only that PNG to the configured Discord webhook.

The bot refuses to label a multi-day difference as a daily change. If the two
newest reports are not consecutive, generation fails safely. Scheduled posting
also rejects future-dated data and reports older than one day, while allowing a
late report to be recovered on the following day's first check.

Figures are estimates reported during an active conflict and may be revised.
This repository republishes the upstream values as provided and does not
independently verify them. The source and data provider are identified in the
image footer.

## Clone and install

Requires Node.js 22 or newer.

```bash
git clone https://github.com/webhead2oo9/ukraine-war-losses-bot.git
cd ukraine-war-losses-bot
npm install
```

## Local preview

```bash
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

## License

The bot's source code and original image layout are available under the
[MIT License](LICENSE). The upstream dataset and linked source material remain
subject to their respective licenses and terms.
