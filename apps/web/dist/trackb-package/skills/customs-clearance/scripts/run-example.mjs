import { runCustomsSkill } from "../../../dist/skills/customs-clearance/index.js";

const result = await runCustomsSkill({ caseId: "example-case", seller: "Synthetic NZ exporter", buyer: "Synthetic AU importer", origin: "New Zealand", destination: "Australia", currency: "NZD", lines: [{ sku: "MH-250", description: "UMF Mānuka honey 250g", quantity: 1000, unit: "jars", unitValueNzd: 12, netWeightKg: 250 }], freightNzd: 800, insuranceNzd: 100, dutyRate: 0, levyRate: 0.01, exportGstRate: 0, classificationEvidence: true });
console.log(JSON.stringify({ skill: "customs-clearance", result }, null, 2));
