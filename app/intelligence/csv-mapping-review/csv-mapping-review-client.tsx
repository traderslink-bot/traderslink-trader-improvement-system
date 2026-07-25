"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyGenericCsvMappingReview,
  createCsvSavedMappingTemplate,
  inferGenericCsvSchema,
  matchCsvSavedMappingTemplate,
  type BrokerExecutionCsvCanonicalField,
  type BrokerExecutionCsvColumnMapping,
  type CsvSavedMappingTemplate,
  type CsvSchemaInferenceResult,
} from "@/src/lib/execution-sources/csv";

const STORAGE_KEY = "traderslink.csv-mapping-templates.v1";

const DESTINATIONS: Array<{
  value: BrokerExecutionCsvCanonicalField | "ignore";
  label: string;
}> = [
  { value: "ignore", label: "Ignore this column" },
  { value: "symbol", label: "Symbol" },
  { value: "timestamp", label: "Date and time" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "side", label: "Buy or sell" },
  { value: "quantity", label: "Quantity" },
  { value: "price", label: "Execution price" },
  { value: "status", label: "Status" },
  { value: "orderId", label: "Order ID" },
  { value: "executionId", label: "Execution ID" },
  { value: "assetType", label: "Asset type" },
  { value: "description", label: "Description" },
  { value: "commission", label: "Commission" },
  { value: "fees", label: "Fees" },
  { value: "netAmount", label: "Net amount" },
  { value: "currency", label: "Currency" },
];

function parseStoredTemplates(value: string | null): CsvSavedMappingTemplate[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CsvSavedMappingTemplate =>
        typeof item === "object" &&
        item !== null &&
        (item as CsvSavedMappingTemplate).contractVersion ===
          "generic_csv_mapping_template_v1",
    );
  } catch {
    return [];
  }
}

function mappingByHeader(
  mapping: BrokerExecutionCsvColumnMapping,
): Record<string, BrokerExecutionCsvCanonicalField> {
  const result: Record<string, BrokerExecutionCsvCanonicalField> = {};
  for (const field of Object.keys(mapping) as BrokerExecutionCsvCanonicalField[]) {
    const value = mapping[field];
    const headers = Array.isArray(value) ? value : value ? [value] : [];
    for (const header of headers) result[header] = field;
  }
  return result;
}

function mappingFromSelections(
  selections: Record<string, BrokerExecutionCsvCanonicalField | "ignore">,
): BrokerExecutionCsvColumnMapping {
  const result: BrokerExecutionCsvColumnMapping = {};
  for (const [header, field] of Object.entries(selections)) {
    if (field === "ignore") continue;
    const current = result[field];
    const values = Array.isArray(current) ? current : current ? [current] : [];
    result[field] = [...values, header];
  }
  return result;
}

function confidenceClass(confidence: string): string {
  if (confidence === "high") return "text-emerald-300";
  if (confidence === "medium") return "text-amber-300";
  return "text-rose-300";
}

export default function CsvMappingReviewClient() {
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [inference, setInference] = useState<CsvSchemaInferenceResult | null>(null);
  const [selections, setSelections] = useState<
    Record<string, BrokerExecutionCsvCanonicalField | "ignore">
  >({});
  const [sideMappings, setSideMappings] = useState<Record<string, "buy" | "sell">>(
    {},
  );
  const [timezone, setTimezone] = useState("America/New_York");
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<CsvSavedMappingTemplate[]>([]);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    setTemplates(parseStoredTemplates(window.localStorage.getItem(STORAGE_KEY)));
  }, []);

  const review = useMemo(() => {
    if (!inference || !csvText) return null;
    return applyGenericCsvMappingReview({
      csvText,
      inference,
      corrections: mappingFromSelections(selections),
      ignoredHeaders: Object.entries(selections)
        .filter(([, field]) => field === "ignore")
        .map(([header]) => header),
      sideValueMapping: sideMappings,
      timestampTimezone: timezone,
    });
  }, [csvText, inference, selections, sideMappings, timezone]);

  async function loadFile(file: File) {
    const text = await file.text();
    const nextInference = inferGenericCsvSchema(text);
    const savedMatch = matchCsvSavedMappingTemplate(nextInference, templates);
    const initialMapping = savedMatch?.template.columnMapping ?? nextInference.proposedMapping;
    const initialSelections: Record<
      string,
      BrokerExecutionCsvCanonicalField | "ignore"
    > = {};
    const byHeader = mappingByHeader(initialMapping);
    for (const header of nextInference.headers) {
      initialSelections[header] = byHeader[header] ?? "ignore";
    }
    const initialSideMappings = savedMatch?.template.sideValueMapping ??
      Object.fromEntries(
        nextInference.valueMappings
          .filter((item) => item.normalizedValue)
          .map((item) => [item.sourceValue, item.normalizedValue as "buy" | "sell"]),
      );

    setCsvText(text);
    setFileName(file.name);
    setInference(nextInference);
    setSelections(initialSelections);
    setSideMappings(initialSideMappings);
    setTimezone(savedMatch?.template.timestampTimezone ?? "America/New_York");
    setTemplateName(savedMatch?.template.name ?? file.name.replace(/\.csv$/iu, ""));
    setNotice(
      savedMatch
        ? `Matched saved format “${savedMatch.template.name}” at ${Math.round(savedMatch.score * 100)}%.`
        : null,
    );
  }

  function changeSelection(
    header: string,
    value: BrokerExecutionCsvCanonicalField | "ignore",
  ) {
    setSelections((current) => {
      const next = { ...current };
      if (value !== "ignore") {
        for (const [otherHeader, otherValue] of Object.entries(next)) {
          if (otherHeader !== header && otherValue === value) next[otherHeader] = "ignore";
        }
      }
      next[header] = value;
      return next;
    });
  }

  function saveTemplate() {
    if (!inference || !review) return;
    const template = createCsvSavedMappingTemplate({
      name: templateName,
      inference,
      effectiveMapping: review.effectiveMapping,
      sideValueMapping: sideMappings,
      timestampTimezone: timezone,
    });
    const next = [template, ...templates.filter((item) => item.id !== template.id)];
    setTemplates(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setNotice(`Saved mapping format “${template.name}”.`);
  }

  const duplicateDestinationFields = useMemo(() => {
    const counts = new Map<string, number>();
    for (const value of Object.values(selections)) {
      if (value === "ignore") continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1).map(([field]) => field);
  }, [selections]);

  return (
    <main className="mx-auto min-h-screen max-w-7xl space-y-6 bg-zinc-950 px-4 py-8 text-zinc-100 sm:px-6">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-sky-300">
          Trader Intelligence CSV Import
        </p>
        <h1 className="text-3xl font-semibold">Review an unknown CSV format</h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          Upload a broker CSV. The system proposes how each source column maps into
          accepted execution fields, highlights uncertainty, and previews the trades
          before anything is saved.
        </p>
      </header>

      <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
        <label className="block text-sm font-medium text-zinc-200" htmlFor="csv-file">
          Broker CSV file
        </label>
        <input
          id="csv-file"
          type="file"
          accept=".csv,text/csv,text/plain"
          className="mt-3 block w-full rounded-lg border border-zinc-700 bg-zinc-950 p-3 text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void loadFile(file);
          }}
        />
        {fileName ? <p className="mt-2 text-sm text-zinc-400">Loaded: {fileName}</p> : null}
        {notice ? <p className="mt-3 text-sm text-sky-300">{notice}</p> : null}
      </section>

      {inference ? (
        <>
          <section className="grid gap-4 sm:grid-cols-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Format status</p>
              <p className="mt-2 text-lg font-semibold capitalize">{review?.status ?? inference.status}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Confidence</p>
              <p className={`mt-2 text-lg font-semibold capitalize ${confidenceClass(inference.overallConfidence)}`}>
                {inference.overallConfidence}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Header row</p>
              <p className="mt-2 text-lg font-semibold">{inference.headerRowIndex + 1}</p>
            </div>
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">Delimiter</p>
              <p className="mt-2 text-lg font-semibold">
                {inference.delimiter === "\t" ? "Tab" : inference.delimiter}
              </p>
            </div>
          </section>

          <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60">
            <div className="border-b border-zinc-800 p-5">
              <h2 className="text-xl font-semibold">Column mappings</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Confirm uncertain fields. A destination can only be assigned to one source column.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="bg-zinc-950/70 text-xs uppercase tracking-wide text-zinc-500">
                  <tr>
                    <th className="px-4 py-3">CSV column</th>
                    <th className="px-4 py-3">Sample values</th>
                    <th className="px-4 py-3">Suggested confidence</th>
                    <th className="px-4 py-3">Import as</th>
                  </tr>
                </thead>
                <tbody>
                  {inference.columns.map((column) => (
                    <tr key={column.header} className="border-t border-zinc-800 align-top">
                      <td className="px-4 py-4 font-medium text-zinc-100">{column.header}</td>
                      <td className="max-w-md px-4 py-4 text-zinc-400">
                        {column.profile.sampleValues.length > 0
                          ? column.profile.sampleValues.join(", ")
                          : "No sample values"}
                      </td>
                      <td className={`px-4 py-4 capitalize ${confidenceClass(column.confidence)}`}>
                        {column.confidence}
                        {column.requiresReview ? " · review" : ""}
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={selections[column.header] ?? "ignore"}
                          onChange={(event) =>
                            changeSelection(
                              column.header,
                              event.target.value as BrokerExecutionCsvCanonicalField | "ignore",
                            )
                          }
                          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                        >
                          {DESTINATIONS.map((destination) => (
                            <option key={destination.value} value={destination.value}>
                              {destination.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {inference.valueMappings.length > 0 ? (
            <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-xl font-semibold">Buy and sell values</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {inference.valueMappings.map((item) => (
                  <label key={item.sourceValue} className="rounded-lg border border-zinc-800 p-3">
                    <span className="block text-sm text-zinc-400">Source value</span>
                    <span className="mt-1 block font-medium">{item.sourceValue}</span>
                    <select
                      value={sideMappings[item.sourceValue] ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSideMappings((current) => {
                          const next = { ...current };
                          if (value === "buy" || value === "sell") next[item.sourceValue] = value;
                          else delete next[item.sourceValue];
                          return next;
                        });
                      }}
                      className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                    >
                      <option value="">Needs review</option>
                      <option value="buy">Buy</option>
                      <option value="sell">Sell</option>
                    </select>
                  </label>
                ))}
              </div>
            </section>
          ) : null}

          <section className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-xl font-semibold">Import settings</h2>
              <label className="mt-4 block text-sm text-zinc-300">
                Timestamp timezone
                <input
                  value={timezone}
                  onChange={(event) => setTimezone(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                />
              </label>
              <label className="mt-4 block text-sm text-zinc-300">
                Saved format name
                <input
                  value={templateName}
                  onChange={(event) => setTemplateName(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                />
              </label>
              <button
                type="button"
                onClick={saveTemplate}
                disabled={!review || review.status === "blocked" || duplicateDestinationFields.length > 0}
                className="mt-4 w-full rounded-lg bg-sky-500 px-4 py-2.5 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Remember this CSV format
              </button>
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-xl font-semibold">Live import preview</h2>
              {duplicateDestinationFields.length > 0 ? (
                <p className="mt-3 text-sm text-rose-300">
                  Resolve duplicate destinations: {duplicateDestinationFields.join(", ")}.
                </p>
              ) : null}
              {review?.conflicts.length ? (
                <div className="mt-3 space-y-2">
                  {review.conflicts.map((conflict, index) => (
                    <p key={`${conflict.code}-${index}`} className="text-sm text-amber-300">
                      {conflict.message}
                    </p>
                  ))}
                </div>
              ) : null}
              {review?.importResult ? (
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="rounded-lg bg-zinc-950 p-3">
                      <p className="text-xs text-zinc-500">Accepted rows</p>
                      <p className="mt-1 text-lg font-semibold">{review.importResult.acceptedExecutionCount}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-950 p-3">
                      <p className="text-xs text-zinc-500">Rejected rows</p>
                      <p className="mt-1 text-lg font-semibold">{review.importResult.rejectedRowCount}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-950 p-3">
                      <p className="text-xs text-zinc-500">Skipped rows</p>
                      <p className="mt-1 text-lg font-semibold">{review.importResult.skippedRowCount}</p>
                    </div>
                    <div className="rounded-lg bg-zinc-950 p-3">
                      <p className="text-xs text-zinc-500">Detected trades</p>
                      <p className="mt-1 text-lg font-semibold">{review.importResult.requestCount}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-sm">
                      <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="py-2 pr-3">Time</th>
                          <th className="py-2 pr-3">Symbol</th>
                          <th className="py-2 pr-3">Side</th>
                          <th className="py-2 pr-3">Shares</th>
                          <th className="py-2 pr-3">Price</th>
                          <th className="py-2 pr-3">Commission</th>
                          <th className="py-2">Fees</th>
                        </tr>
                      </thead>
                      <tbody>
                        {review.importResult.executions.slice(0, 20).map((execution, index) => (
                          <tr key={`${execution.timestamp}-${execution.symbol}-${index}`} className="border-t border-zinc-800">
                            <td className="py-2 pr-3 text-zinc-400">{execution.timestamp}</td>
                            <td className="py-2 pr-3 font-medium">{execution.symbol}</td>
                            <td className="py-2 pr-3 capitalize">{execution.side}</td>
                            <td className="py-2 pr-3">{execution.shares}</td>
                            <td className="py-2 pr-3">{execution.price}</td>
                            <td className="py-2 pr-3">{execution.commission ?? "—"}</td>
                            <td className="py-2">{execution.fees ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-400">
                  Complete the required mappings to generate a deterministic preview.
                </p>
              )}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
