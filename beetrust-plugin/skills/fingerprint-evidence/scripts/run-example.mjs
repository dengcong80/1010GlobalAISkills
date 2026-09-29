const reference = { methylglyoxal: 0.62, dihydroxyacetone: 0.18, moisture: 0.55 };
const sampleCsv = Object.entries(reference).map(([name, value]) => `${name},${value}`).join("\n");

const aliases = { mgo: "methylglyoxal", dha: "dihydroxyacetone", water: "moisture" };
const sample = Object.fromEntries(sampleCsv.split(/\r?\n/).map((line) => {
  const [rawName, rawValue] = line.split(",").map((part) => part.trim().toLowerCase());
  return [aliases[rawName] ?? rawName, Number(rawValue)];
}));
const distances = Object.entries(reference).map(([name, expected]) => ({
  name,
  expected,
  observed: sample[name],
  relativeDistance: Math.abs(sample[name] - expected) / Math.max(Math.abs(expected), 0.000001)
}));
const maxDistance = Math.max(...distances.map(({ relativeDistance }) => relativeDistance));
const similarity = Math.max(0, 1 - maxDistance);

console.log(JSON.stringify({
  skill: "fingerprint-evidence",
  result: {
    status: maxDistance <= 0.1 ? "PASS" : maxDistance <= 0.2 ? "REVIEW" : "BLOCKED",
    batchId: "example-batch",
    referenceBatchId: "example-reference",
    features: distances,
    similarity: Number(similarity.toFixed(4)),
    confidence: Number((similarity * (distances.length / Object.keys(reference).length)).toFixed(4)),
    anomalies: [],
    evidenceRefs: ["fingerprint-evidence-example"],
    disclaimer: "Prototype triage output; not an accredited laboratory result."
  }
}, null, 2));
