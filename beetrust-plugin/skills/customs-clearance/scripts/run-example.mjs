const shipment = {
  caseId: "example-case",
  seller: "Synthetic NZ exporter",
  buyer: "Synthetic AU importer",
  origin: "New Zealand",
  destination: "Australia",
  currency: "NZD",
  lines: [{ sku: "MH-250", description: "UMF Mānuka honey 250g", quantity: 1000, unit: "jars", unitValueNzd: 12, netWeightKg: 250 }],
  freightNzd: 800,
  insuranceNzd: 100,
  dutyRate: 0,
  levyRate: 0.01,
  exportGstRate: 0,
  classificationEvidence: true
};
const merchandiseValue = shipment.lines.reduce((total, line) => total + line.quantity * line.unitValueNzd, 0);
const landedValue = merchandiseValue + shipment.freightNzd + shipment.insuranceNzd;
const levy = landedValue * shipment.levyRate;

console.log(JSON.stringify({
  skill: "customs-clearance",
  result: {
    status: shipment.classificationEvidence ? "PASS" : "BLOCKED",
    hsCandidates: [{ code: "0409.00", description: "Natural honey", basis: "Honey product description" }],
    totals: { merchandiseValue, freight: shipment.freightNzd, insurance: shipment.insuranceNzd, landedValue, levy, estimatedTotal: landedValue + levy, currency: shipment.currency },
    invoiceDraft: { seller: shipment.seller, buyer: shipment.buyer, destination: shipment.destination, lines: shipment.lines },
    packingListDraft: { caseId: shipment.caseId, netWeightKg: shipment.lines.reduce((total, line) => total + line.netWeightKg, 0), packages: shipment.lines[0].quantity },
    tswDraft: { submissionStatus: "DRAFT_ONLY", destination: shipment.destination, hsCode: "0409.00" },
    sourceUrls: ["https://www.customs.govt.nz/"],
    evidenceRefs: ["customs-snapshot-example"],
    assumptions: ["HS code and rates are candidates for broker confirmation.", "No customs submission was made."]
  }
}, null, 2));
