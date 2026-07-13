import sharp from "sharp";

const WIDTH = 1080;
const HEIGHT = 1280;
const ORANGE = "#f5a10b";
const WHITE = "#f7f4e9";
const MUTED = "#b8b5a8";

const escapeXml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

const formatNumber = (value) =>
  value === null ? "—" : new Intl.NumberFormat("en-US").format(value);

const formatDate = (date) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC"
  }).format(new Date(`${date}T12:00:00Z`));

function wrapLabel(label, maxCharacters = 21) {
  const words = label.toUpperCase().split(" ");
  const lines = [];
  for (const word of words) {
    const candidate = lines.length ? `${lines.at(-1)} ${word}` : word;
    if (lines.length && candidate.length > maxCharacters) {
      lines.push(word);
    } else if (lines.length) {
      lines[lines.length - 1] = candidate;
    } else {
      lines.push(word);
    }
  }
  return lines.slice(0, 2);
}

function metricMarkup(metric, index) {
  const column = index % 3;
  const row = Math.floor(index / 3);
  const x = 76 + column * 326;
  const y = 402 + row * 160;
  const hasChange = metric.change !== null && metric.change !== 0;
  const change = hasChange
    ? `${metric.change > 0 ? "+" : "−"}${formatNumber(Math.abs(metric.change))}`
    : "";
  const totalSize = formatNumber(metric.total).length > 8 ? 43 : 49;
  const labelLines = wrapLabel(metric.label);
  const labelSize = 20;
  const label = labelLines
    .map((line, lineIndex) => `<tspan x="0" dy="${lineIndex === 0 ? 0 : 25}">${escapeXml(line)}</tspan>`)
    .join("");

  return `
    <g transform="translate(${x} ${y})">
      <text class="number" x="0" y="0" font-size="${totalSize}">${escapeXml(formatNumber(metric.total))}</text>
      ${change ? `<text class="change" x="0" y="35">${escapeXml(change)} TODAY</text>` : metric.change === null ? `<text class="unchanged" x="0" y="35">CHANGE UNAVAILABLE</text>` : `<text class="unchanged" x="0" y="35">NO CHANGE TODAY</text>`}
      <text class="label" x="0" y="70" font-size="${labelSize}">${label}</text>
    </g>`;
}

export function createSvg(report) {
  const metrics = report.metrics.map(metricMarkup).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#292d24"/>
      <stop offset="1" stop-color="#3c3a2b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ORANGE}"/>
      <stop offset="1" stop-color="#ffd15a"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1280" fill="url(#background)"/>
  <path d="M-110 1170 L345 130 L545 130 L235 1280 Z" fill="#ffffff" opacity="0.025"/>
  <path d="M555 1280 L776 116 L945 116 L822 1280 Z" fill="#000000" opacity="0.10"/>
  <path d="M770 1280 L1080 530 L1160 490 L1160 1280 Z" fill="${ORANGE}" opacity="0.035"/>
  <rect x="76" y="76" width="86" height="7" rx="3.5" fill="url(#accent)"/>
  <text x="76" y="133" class="eyebrow">SINCE 24 FEBRUARY 2022  /  AS OF ${escapeXml(formatDate(report.date).toUpperCase())}</text>
  <text x="76" y="210" class="title">ESTIMATED RUSSIAN</text>
  <text x="76" y="275" class="title">LOSSES IN UKRAINE</text>
  <line x1="76" y1="329" x2="1004" y2="329" stroke="#ffffff" opacity="0.14"/>
  ${metrics}
  <line x1="76" y1="1174" x2="1004" y2="1174" stroke="#ffffff" opacity="0.14"/>
  <text x="76" y="1227" class="footer">SOURCE: MINISTRY OF DEFENCE OF UKRAINE</text>
  <text x="1004" y="1227" class="footer right">DATA: LOD-DB / ORC-LOSSES</text>
  <style>
    text { font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif; }
    .title { fill: ${ORANGE}; font-size: 58px; font-weight: 800; letter-spacing: 0.5px; }
    .eyebrow { fill: ${MUTED}; font-size: 20px; font-weight: 600; letter-spacing: 0.8px; }
    .number { fill: ${WHITE}; font-weight: 700; letter-spacing: -1.8px; }
    .change { fill: ${ORANGE}; font-size: 19px; font-weight: 750; }
    .unchanged { fill: #817f73; font-size: 16px; font-weight: 650; }
    .label { fill: ${WHITE}; font-weight: 650; }
    .footer { fill: ${MUTED}; font-size: 15px; font-weight: 600; letter-spacing: 0.3px; }
    .right { text-anchor: end; }
  </style>
</svg>`;
}

export async function renderPng(report, outputPath) {
  const svg = createSvg(report);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outputPath);
  return outputPath;
}
