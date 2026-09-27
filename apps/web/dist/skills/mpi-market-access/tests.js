import { assertCase, assertEqual, runCases } from "../../test-utils.js";
import { checkMpiMarketAccess } from "./index.js";
const good = { listedBeekeeper: true, harvestDeclaration: true, rmp: true, omar: "AVAILABLE", exportCertificate: true, tradeCertification: true, declarationDate: "2026-09-01", evidenceFreshnessDays: 10, ruleVersion: "MPI-AU-2026.09" };
export function runTests() {
    return runCases("mpi-market-access", [
        () => assertEqual(checkMpiMarketAccess("Australia", good).status, "PASS", "Australia pass"),
        () => assertEqual(checkMpiMarketAccess("AU", good).status, "PASS", "ISO market alias"),
        () => assertEqual(checkMpiMarketAccess("China", good).status, "BLOCKED", "China requires stronger evidence"),
        () => assertEqual(checkMpiMarketAccess("United Kingdom", good).status, "BLOCKED", "UK requires stronger evidence"),
        () => assertEqual(checkMpiMarketAccess("Unknown", good).status, "BLOCKED", "unknown destination blocks"),
        () => assertCase(checkMpiMarketAccess("Australia", good).checks.length >= 7, "all checks present"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, listedBeekeeper: false }).missingEvidence.includes("Listed beekeeper"), "beekeeper missing"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, harvestDeclaration: false }).missingEvidence.includes("Harvest declaration"), "harvest missing"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, rmp: false }).missingEvidence.includes("Risk Management Programme (RMP)"), "RMP missing"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, omar: "MISSING" }).missingEvidence.includes("OMAR / destination requirement"), "OMAR missing"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, exportCertificate: false }).missingEvidence.includes("Export certificate"), "certificate missing"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, tradeCertification: false }).missingEvidence.includes("Trade certification"), "trade certification missing"),
        () => assertEqual(checkMpiMarketAccess("Australia", { ...good, evidenceFreshnessDays: 366 }).status, "BLOCKED", "stale evidence"),
        () => assertEqual(checkMpiMarketAccess("Australia", { ...good, evidenceFreshnessDays: -1 }).status, "BLOCKED", "invalid freshness"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, omar: "EXPIRED" }).missingEvidence.length > 0, "expired OMAR"),
        () => assertEqual(checkMpiMarketAccess("Australia", { ...good, ruleVersion: "MPI-AU-2025.01" }).status, "BLOCKED", "rule conflict"),
        () => assertCase(checkMpiMarketAccess("Australia", good).evidenceRefs.every((ref) => ref.startsWith("mpi-evidence_")), "evidence refs"),
        () => assertCase(checkMpiMarketAccess("Australia", good).sourceUrls.length >= 2, "source urls"),
        () => assertEqual(checkMpiMarketAccess("Australia", good).ruleVersion, "MPI-AU-2026.09", "rule version"),
        () => assertCase(checkMpiMarketAccess("Australia", good).disclaimer.includes("prototype"), "disclaimer"),
        () => assertCase(checkMpiMarketAccess("Australia", good).checks.every((check) => check.reason.length > 0), "check reasons"),
        () => assertCase(checkMpiMarketAccess("Australia", good).checks.every((check) => check.evidenceRef.length > 10), "check evidence"),
        () => assertEqual(checkMpiMarketAccess("Australia", { ...good, listedBeekeeper: false, harvestDeclaration: false }).missingEvidence.length, 2, "two missing"),
        () => assertEqual(checkMpiMarketAccess("Australia", { ...good, evidenceFreshnessDays: 365 }).status, "PASS", "boundary freshness"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, tradeCertification: false }).checks.some((check) => check.status === "BLOCKED"), "blocked check state"),
        () => assertCase(checkMpiMarketAccess("Australia", { ...good, ruleVersion: undefined }).status === "PASS", "optional rule version")
    ]);
}
