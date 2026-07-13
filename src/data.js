export const DATA_URL =
  "https://raw.githubusercontent.com/lod-db/orc-losses/main/russian-losses.json";

export const METRICS = [
  { key: "personnel", label: "Personnel" },
  { key: "fixedWingAircraft", label: "Aircraft" },
  { key: "rotaryWingAircraft", label: "Helicopters" },
  { key: "tanks", label: "Tanks" },
  { key: "afvs", label: "Armored combat vehicles" },
  { key: "uavs", label: "Operational-tactical UAVs" },
  { key: "artillery", label: "Artillery systems" },
  { key: "airDefense", label: "Air defense systems" },
  { key: "rocketSystems", label: "Multiple-launch rocket systems" },
  { key: "unarmoredVehicles", label: "Vehicles and fuel tanks" },
  { key: "specialEquipment", label: "Special equipment" },
  { key: "missiles", label: "Cruise missiles" },
  { key: "ships", label: "Ships and boats" },
  { key: "submarines", label: "Submarines" }
];

function isMetricValue(value) {
  return value === null || (Number.isInteger(value) && value >= 0);
}

export function validateDataset(data) {
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error("The upstream dataset must contain at least two daily records.");
  }

  for (const [index, entry] of data.entries()) {
    if (!entry || typeof entry !== "object") {
      throw new Error(`Record ${index} is not an object.`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
      throw new Error(`Record ${index} has an invalid date.`);
    }
    if (typeof entry.sourceUri !== "string" || !entry.sourceUri.startsWith("https://")) {
      throw new Error(`Record ${index} has an invalid source URL.`);
    }
    for (const { key } of METRICS) {
      if (!isMetricValue(entry[key])) {
        throw new Error(`Record ${index} has an invalid ${key} value.`);
      }
    }
  }

  return data;
}

export function newestPair(data) {
  validateDataset(data);
  const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
  if (sorted[0].date === sorted[1].date) {
    throw new Error(`The two newest records both use ${sorted[0].date}.`);
  }
  return [sorted[0], sorted[1]];
}

export function buildReport(current, previous) {
  if (current.date <= previous.date) {
    throw new Error("The current record must be newer than the previous record.");
  }

  return {
    date: current.date,
    previousDate: previous.date,
    sourceUri: current.sourceUri,
    metrics: METRICS.map(({ key, label }) => {
      const total = current[key];
      const prior = previous[key];
      return {
        key,
        label,
        total,
        change: total === null || prior === null ? null : total - prior
      };
    })
  };
}

export async function fetchReport(url = DATA_URL) {
  const response = await fetch(url, {
    headers: { "user-agent": "ukraine-war-losses-discord/0.1" }
  });
  if (!response.ok) {
    throw new Error(`Could not download upstream data: HTTP ${response.status}.`);
  }
  const [current, previous] = newestPair(await response.json());
  return buildReport(current, previous);
}

export function dateInKyiv(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Kyiv",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const part = (type) => parts.find((item) => item.type === type).value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
