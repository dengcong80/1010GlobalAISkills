import { compareFingerprint } from "../../../dist/skills/fingerprint-evidence/index.js";

const reference = { methylglyoxal: 0.62, dihydroxyacetone: 0.18, moisture: 0.55 };
const sampleCsv = Object.entries(reference).map(([name, value]) => `${name},${value}`).join("\n");
console.log(JSON.stringify({ skill: "fingerprint-evidence", result: compareFingerprint({ batchId: "example-batch", sampleCsv, reference, referenceBatchId: "example-reference" }) }, null, 2));
