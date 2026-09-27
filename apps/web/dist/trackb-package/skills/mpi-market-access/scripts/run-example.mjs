import { checkMpiMarketAccess } from "../../../dist/skills/mpi-market-access/index.js";

const evidence = { listedBeekeeper: true, harvestDeclaration: true, rmp: true, omar: "AVAILABLE", exportCertificate: true, tradeCertification: true, declarationDate: "2026-09-05", evidenceFreshnessDays: 12, ruleVersion: "MPI-AU-2026.09" };
console.log(JSON.stringify({ skill: "mpi-market-access", result: checkMpiMarketAccess("Australia", evidence) }, null, 2));
