import { deterministicId } from "../../crypto.js";
export const TRIGGER_WORDS = ["FINGERPRINT", "LAB_CSV", "SCIENCE_CHECK", "BATCH_SIMILARITY"];
const DEFAULT_TOLERANCE = 0.05;
const FEATURE_UNITS = {
    methylglyoxal: "mg/kg",
    dihydroxyacetone: "mg/kg",
    hydroxymethylfurfural: "mg/kg",
    sugarProfile: "ratio",
    pollenDNA: "ratio",
    moisture: "%",
    conductivity: "mS/cm",
    delta13C: "‰"
};
export function extractFeatures(sampleCsv) {
    const features = {};
    for (const rawLine of sampleCsv.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith("#") || /^feature\s*[,;\t]/i.test(line))
            continue;
        const match = line.match(/^\s*([A-Za-z][A-Za-z0-9_-]*)\s*[,;\t:]\s*(-?\d+(?:\.\d+)?)\s*(?:[A-Za-z%‰/]+)?\s*$/);
        if (match)
            features[normaliseName(match[1])] = Number(match[2]);
    }
    return features;
}
function normaliseName(name) {
    const compact = name.replace(/[-_ ]/g, "").toLowerCase();
    const aliases = { mg: "methylglyoxal", methylglyoxal: "methylglyoxal", dha: "dihydroxyacetone", dihydroxyacetone: "dihydroxyacetone", hmf: "hydroxymethylfurfural", hydroxymethylfurfural: "hydroxymethylfurfural", sugarprofile: "sugarProfile", pollendna: "pollenDNA", moisture: "moisture", conductivity: "conductivity", delta13c: "delta13C" };
    return aliases[compact] ?? name;
}
export function compareFingerprint(input) {
    const sample = extractFeatures(input.sampleCsv);
    const allNames = [...new Set([...Object.keys(input.reference), ...Object.keys(sample)])];
    const anomalies = [];
    let distance = 0;
    let comparable = 0;
    const features = [];
    for (const name of allNames) {
        const referenceValue = input.reference[name];
        const sampleValue = sample[name];
        if (referenceValue === undefined || sampleValue === undefined || !Number.isFinite(referenceValue) || !Number.isFinite(sampleValue)) {
            anomalies.push(`${name}: missing from sample or reference`);
            continue;
        }
        const tolerance = Math.max(DEFAULT_TOLERANCE, Math.abs(referenceValue) * 0.05);
        const delta = Math.abs(sampleValue - referenceValue);
        const scale = Math.max(Math.abs(referenceValue), 1);
        distance += delta / scale;
        comparable += 1;
        features.push({ name, value: sampleValue, unit: FEATURE_UNITS[name] ?? "indexed", tolerance });
        if (delta > tolerance)
            anomalies.push(`${name}: delta ${delta.toFixed(4)} exceeds tolerance ${tolerance.toFixed(4)}`);
    }
    const completeness = allNames.length === 0 ? 0 : comparable / allNames.length;
    const similarity = comparable === 0 ? 0 : Math.max(0, Math.min(1, 1 - distance / comparable));
    const confidence = Math.max(0, Math.min(1, 0.35 * completeness + 0.65 * similarity));
    const status = similarity >= 0.97 && anomalies.length === 0 && completeness >= 0.9 ? "PASS" : similarity >= 0.85 && completeness >= 0.75 ? "REVIEW" : "BLOCKED";
    return {
        status,
        batchId: input.batchId,
        referenceBatchId: input.referenceBatchId,
        features,
        similarity: round(similarity),
        confidence: round(confidence),
        anomalies,
        anomaliesDetected: anomalies.length > 0,
        evidenceRefs: [deterministicId("lab-evidence", { batchId: input.batchId, sample: input.sampleCsv, referenceBatchId: input.referenceBatchId })],
        disclaimer: "Prototype similarity scoring supports triage; it is not a laboratory certificate, UMF licence or MPI assurance."
    };
}
function round(value) {
    return Math.round(value * 10000) / 10000;
}
