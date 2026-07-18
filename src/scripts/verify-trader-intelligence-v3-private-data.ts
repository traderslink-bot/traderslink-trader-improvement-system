import {
  collectTraderIntelligenceFinalTreeRecords,
  collectTraderIntelligencePrHistoryRecords,
  scanTraderIntelligencePrivateData,
} from "../lib/trader-intelligence-v3/testing";

const localOnly = process.argv.includes("--local-only");
const historyOnly = process.argv.includes("--history-only");
const records = [
  ...(historyOnly ? [] : collectTraderIntelligenceFinalTreeRecords()),
  ...(localOnly ? [] : collectTraderIntelligencePrHistoryRecords()),
];

const findings = scanTraderIntelligencePrivateData(records);
if (findings.length > 0) {
  process.stderr.write(`${JSON.stringify({ ok: false, findings }, null, 2)}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `${JSON.stringify({
      ok: true,
      scannedRecordCount: records.length,
      scannedFinalTreeRecordCount: records.filter(
        (record) => record.sourceKind !== "pr_history",
      ).length,
      scannedPrHistoryBlobCount: records.filter(
        (record) => record.sourceKind === "pr_history",
      ).length,
    })}\n`,
  );
}
