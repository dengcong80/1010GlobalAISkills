import { assertCase, assertEqual, runCases } from "../../test-utils.js";
import { compareFingerprint, extractFeatures } from "./index.js";
const reference = { methylglyoxal: 0.62, dihydroxyacetone: 0.18, hydroxymethylfurfural: 0.31, sugarProfile: 0.44, pollenDNA: 0.28, moisture: 0.55, conductivity: 0.17, delta13C: 0.39 };
const csv = Object.entries(reference).map(([name, value]) => `${name},${value}`).join("\n");
export function runTests() {
    return runCases("fingerprint-evidence", [
        () => assertEqual(Object.keys(extractFeatures("methylglyoxal,0.62")).length, 1, "csv parse"),
        () => assertEqual(extractFeatures("# comment\nmethylglyoxal,0.62").methylglyoxal, 0.62, "comment skip"),
        () => assertEqual(extractFeatures("feature,value\nmoisture;0.55").moisture, 0.55, "semicolon parse"),
        () => assertEqual(extractFeatures("DHA: 0.18").dihydroxyacetone, 0.18, "alias parse"),
        () => assertEqual(extractFeatures("HMF\t0.31").hydroxymethylfurfural, 0.31, "tab parse"),
        () => assertEqual(extractFeatures("pollen-dna,0.28").pollenDNA, 0.28, "hyphen alias parse"),
        () => assertEqual(Object.keys(extractFeatures("")).length, 0, "empty parse"),
        () => assertEqual(Object.keys(extractFeatures("not a row")).length, 0, "bad row ignored"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).status, "PASS", "matching batch passes"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).similarity > 0.99, "matching similarity"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).confidence > 0.9, "matching confidence"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).anomaliesDetected, false, "matching anomalies flag"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: "methylglyoxal,2", reference, referenceBatchId: "r" }).status, "BLOCKED", "large mismatch blocks"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: "methylglyoxal,0.70\ndihydroxyacetone,0.18", reference, referenceBatchId: "r" }).anomalies.length > 0, "anomaly generated"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: "methylglyoxal,0.70\ndihydroxyacetone,0.18", reference, referenceBatchId: "r" }).anomaliesDetected, true, "anomalies flag"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: "methylglyoxal,0.63\ndihydroxyacetone,0.18\nhydroxymethylfurfural,0.31\nsugarProfile,0.44\npollenDNA,0.28\nmoisture,0.55\nconductivity,0.17\ndelta13C,0.39", reference, referenceBatchId: "r" }).status, "PASS", "small delta passes"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: "methylglyoxal,0.62", reference, referenceBatchId: "r" }).status, "BLOCKED", "incomplete sample blocks"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: "methylglyoxal,0.62", reference, referenceBatchId: "r" }).anomalies.some((item) => item.includes("missing")), "missing feature noted"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).evidenceRefs[0].startsWith("lab-evidence_"), "evidence ref"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).batchId, "b", "batch id"),
        () => assertEqual(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).referenceBatchId, "r", "reference id"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).features.every((feature) => feature.tolerance > 0), "tolerances"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).disclaimer.includes("not a laboratory certificate"), "scientific disclaimer"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: "methylglyoxal,0.62\nunknown,1", reference, referenceBatchId: "r" }).anomalies.some((item) => item.startsWith("unknown")), "unknown feature"),
        () => assertCase(compareFingerprint({ batchId: "b", sampleCsv: csv, reference: {}, referenceBatchId: "r" }).status === "BLOCKED", "empty reference blocks"),
        () => assertCase(Number.isFinite(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).similarity), "finite similarity"),
        () => assertCase(Number.isFinite(compareFingerprint({ batchId: "b", sampleCsv: csv, reference, referenceBatchId: "r" }).confidence), "finite confidence")
    ]);
}
