"use client";

import { useEffect, useMemo, useState } from "react";
import {
  applyGenericCsvMappingReview,
  createCsvSavedMappingTemplate,
  inferGenericCsvSchema,
  matchCsvSavedMappingTemplate,
  resolveCsvMappingTimestampTimezone,
  type BrokerExecutionCsvCanonicalField,
  type BrokerExecutionCsvColumnMapping,
  type CsvSchemaInferenceResult,
} from "@/src/lib/execution-sources/csv";

const STORAGE_KEY = "traderslink.csv-mapping-templates.v1";
const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Toronto",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "UTC",
] as const;

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

interface CsvMappingReviewClientProps {
  accountLabel: string;
  accountTimezone: string;
  importDefaultTimezone: string;
  accountId: string;
}

interface PersistentTemplate {
  contractVersion: "owner_csv_mapping_template_v1";
  id: string;
  accountId: string;
  name: string;
  normalizedHeaders: string[];
  delimiter: string;
  columnMapping: BrokerExecutionCsvColumnMapping;
  sideValueMapping: Record<string, "buy" | "sell">;
  timestampTimezone?: string;
  optionsHandling?: "reject" | "skip" | "allow";
}

function parseStoredTemplates(value: string | null): PersistentTemplate[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is PersistentTemplate =>
        typeof item === "object" &&
        item !== null &&
        (item as { contractVersion?: string }).contractVersion ===
          "generic_csv_mapping_template_v1",
    );
  } catch {
    return [];
  }
}

function templateForMatching(template: PersistentTemplate) {
  return { ...template, delimiter: template.delimiter as "," | ";" | "\t", contractVersion: "generic_csv_mapping_template_v1" as const, createdAt: "", updatedAt: "" };
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
    result[field] = header;
  }
  return result;
}

function confidenceClass(confidence: string): string {
  if (confidence === "high") return "text-emerald-300";
  if (confidence === "medium") return "text-amber-300";
  return "text-rose-300";
}

function formatInTimezone(timestamp: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    }).format(new Date(timestamp));
  } catch {
    return timestamp;
  }
}

function timestampToUtcString(value: unknown): string {
  if (typeof value === "string") return value;
  const date = value instanceof Date ? value : new Date(value as number);
  return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
}

export default function CsvMappingReviewClient({
  accountLabel,
  accountTimezone,
  importDefaultTimezone,
  accountId,
}: CsvMappingReviewClientProps) {
  const accountImportTimezone = importDefaultTimezone || accountTimezone;
  const [csvText, setCsvText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [inference, setInference] = useState<CsvSchemaInferenceResult | null>(null);
  const [selections, setSelections] = useState<
    Record<string, BrokerExecutionCsvCanonicalField | "ignore">
  >({});
  const [sideMappings, setSideMappings] = useState<Record<string, "buy" | "sell">>({});
  const [useTimezoneOverride, setUseTimezoneOverride] = useState(false);
  const [savedTemplateTimezone, setSavedTemplateTimezone] = useState<
    string | undefined
  >();
  const [timezoneOverride, setTimezoneOverride] = useState(accountImportTimezone);
  const [customTimezone, setCustomTimezone] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templates, setTemplates] = useState<PersistentTemplate[]>(() =>
    typeof window === "undefined"
      ? []
      : parseStoredTemplates(window.localStorage.getItem(STORAGE_KEY)),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [continuing, setContinuing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/csv-mapping-templates/list", { cache: "no-store" })
      .then(async (response) => {
        const document = await response.json() as { templates?: PersistentTemplate[]; error?: { message?: string } };
        if (!response.ok || !Array.isArray(document.templates)) throw new Error(document.error?.message ?? "Could not load saved CSV formats.");
        if (!cancelled) setTemplates(document.templates);
      })
      .catch((error: unknown) => {
        if (!cancelled) setServerError(error instanceof Error ? error.message : "Could not load saved CSV formats.");
      });
    return () => { cancelled = true; };
  }, []);

  const importTimezoneOverride = useTimezoneOverride
    ? timezoneOverride === "custom"
      ? customTimezone.trim()
      : timezoneOverride
    : undefined;
  const effectiveTimezone =
    resolveCsvMappingTimestampTimezone({
      importOverride: importTimezoneOverride,
      savedTemplateOverride: savedTemplateTimezone,
      accountImportDefault: importDefaultTimezone,
      accountTimezone,
    }) ?? "America/New_York";

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
      timestampTimezone: effectiveTimezone,
    });
  }, [csvText, inference, selections, sideMappings, effectiveTimezone]);

  async function loadFile(file: File) {
    const text = await file.text();
    const nextInference = inferGenericCsvSchema(text);
    const savedMatch = matchCsvSavedMappingTemplate(nextInference, templates.map(templateForMatching));
    const initialMapping =
      savedMatch?.columnMapping ?? nextInference.proposedMapping;
    const byHeader = mappingByHeader(initialMapping);
    const initialSelections: Record<
      string,
      BrokerExecutionCsvCanonicalField | "ignore"
    > = {};
    for (const header of nextInference.headers) {
      initialSelections[header] = byHeader[header] ?? "ignore";
    }
    const initialSideMappings = savedMatch?.template.sideValueMapping ??
      Object.fromEntries(
        nextInference.valueMappings
          .filter((item) => item.normalizedValue)
          .map((item) => [item.sourceValue, item.normalizedValue as "buy" | "sell"]),
      );
    const savedTimezone = savedMatch?.template.timestampTimezone;

    setCsvText(text);
    setFileName(file.name);
    setInference(nextInference);
    setSelections(initialSelections);
    setSideMappings(initialSideMappings);
    setSavedTemplateTimezone(savedTimezone);
    setSelectedTemplateId(savedMatch?.template.id);
    setUseTimezoneOverride(false);
    if (savedTimezone) {
      if ((COMMON_TIMEZONES as readonly string[]).includes(savedTimezone)) {
        setTimezoneOverride(savedTimezone);
        setCustomTimezone("");
      } else {
        setTimezoneOverride("custom");
        setCustomTimezone(savedTimezone);
      }
    } else {
      setTimezoneOverride(accountImportTimezone);
      setCustomTimezone("");
    }
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

  async function saveTemplate() {
    if (!inference || !review) return;
    const template = createCsvSavedMappingTemplate({
      name: templateName,
      inference,
      effectiveMapping: review.effectiveMapping,
      sideValueMapping: sideMappings,
      timestampTimezone:
        importTimezoneOverride ?? savedTemplateTimezone,
    });
    setSavingTemplate(true);
    setServerError(null);
    try {
      const response = await fetch(selectedTemplateId ? `/api/csv-mapping-templates/${encodeURIComponent(selectedTemplateId)}` : "/api/csv-mapping-templates", {
        method: selectedTemplateId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ template }),
      });
      const document = await response.json() as { template?: PersistentTemplate; error?: { message?: string } };
      if (!response.ok || !document.template) throw new Error(document.error?.message ?? "Could not save the CSV format.");
      setTemplates((current) => [document.template!, ...current.filter((item) => item.id !== document.template!.id)]);
      setSelectedTemplateId(document.template.id);
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Could not save the CSV format.");
      return;
    } finally {
      setSavingTemplate(false);
    }
    setNotice(`Saved mapping format “${template.name}”.`);
  }

  async function deleteTemplate() {
    if (!selectedTemplateId) return;
    const response = await fetch(`/api/csv-mapping-templates/${encodeURIComponent(selectedTemplateId)}`, { method: "DELETE" });
    if (!response.ok && response.status !== 204) {
      setServerError("Could not delete the saved CSV format.");
      return;
    }
    setTemplates((current) => current.filter((item) => item.id !== selectedTemplateId));
    setSelectedTemplateId(undefined);
    setSavedTemplateTimezone(undefined);
    setNotice("Deleted saved CSV format.");
  }

  async function continueImport() {
    if (!review || !inference || review.status === "blocked" || duplicateDestinationFields.length > 0) return;
    setContinuing(true);
    setServerError(null);
    try {
      const response = await fetch("/api/csv-mapping-review/continue", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csvText, columnMapping: review.effectiveMapping, sideValueMapping: sideMappings, ignoredHeaders: Object.entries(selections).filter(([, field]) => field === "ignore").map(([header]) => header), timezoneOverride: importTimezoneOverride, templateId: selectedTemplateId }),
      });
      const document = await response.json() as { href?: string; error?: { message?: string }; message?: string };
      if (!response.ok || !document.href) throw new Error(document.error?.message ?? document.message ?? "Import continuation was rejected.");
      window.location.assign(document.href);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Import continuation was rejected.");
    } finally {
      setContinuing(false);
    }
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
        <p className="text-sm text-zinc-400">Active account: <span className="text-zinc-100">{accountLabel}</span> ({accountId}) · inherited timezone {accountImportTimezone}</p>
      </header>

      {serverError ? <p className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">{serverError}</p> : null}

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
            {[
              ["Format status", review?.status ?? inference.status],
              ["Confidence", inference.overallConfidence],
              ["Header row", String(inference.headerRowIndex + 1)],
              ["Delimiter", inference.delimiter === "\t" ? "Tab" : inference.delimiter],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
                <p className={`mt-2 text-lg font-semibold capitalize ${label === "Confidence" ? confidenceClass(value) : ""}`}>
                  {value}
                </p>
              </div>
            ))}
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
                        {column.confidence}{column.requiresReview ? " · review" : ""}
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
              <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm font-medium text-zinc-200">Timestamp timezone</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Using {accountImportTimezone} from {accountLabel}. Timezone-less broker timestamps are converted to UTC for storage.
                </p>
                {savedTemplateTimezone && !useTimezoneOverride ? (
                  <p className="mt-2 text-xs text-sky-300">
                    This saved CSV format uses {savedTemplateTimezone}.
                  </p>
                ) : null}
                <label className="mt-3 flex items-center gap-2 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={useTimezoneOverride}
                    onChange={(event) => setUseTimezoneOverride(event.target.checked)}
                  />
                  Change for this import
                </label>
                {useTimezoneOverride ? (
                  <div className="mt-3 space-y-3">
                    <select
                      value={timezoneOverride}
                      onChange={(event) => setTimezoneOverride(event.target.value)}
                      className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                    >
                      {COMMON_TIMEZONES.map((timezone) => (
                        <option key={timezone} value={timezone}>{timezone}</option>
                      ))}
                      <option value="custom">Custom IANA timezone</option>
                    </select>
                    {timezoneOverride === "custom" ? (
                      <input
                        value={customTimezone}
                        onChange={(event) => setCustomTimezone(event.target.value)}
                        placeholder="Example: America/Halifax"
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                      />
                    ) : null}
                    <p className="text-xs text-amber-300">
                      This override is saved with the CSV format only when enabled.
                    </p>
                  </div>
                ) : null}
              </div>

              <label className="mt-4 block text-sm text-zinc-300">
                Saved format
                <select
                  value={selectedTemplateId ?? ""}
                  onChange={(event) => {
                    const template = templates.find((item) => item.id === event.target.value);
                    setSelectedTemplateId(template?.id);
                    setSavedTemplateTimezone(template?.timestampTimezone);
                    if (template) setTemplateName(template.name);
                  }}
                  className="mt-2 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2"
                >
                  <option value="">No saved format selected</option>
                  {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
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
                disabled={!review || review.status === "blocked" || duplicateDestinationFields.length > 0 || savingTemplate}
                className="mt-4 w-full rounded-lg bg-sky-500 px-4 py-2.5 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {savingTemplate ? "Saving format…" : selectedTemplateId ? "Update saved CSV format" : "Remember this CSV format"}
              </button>
              {selectedTemplateId ? <button type="button" onClick={() => void deleteTemplate()} className="mt-2 w-full rounded-lg border border-rose-900 px-4 py-2 text-sm text-rose-300">Delete selected format</button> : null}
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-5">
              <h2 className="text-xl font-semibold">Live import preview</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Displayed in {accountTimezone}; UTC remains the stored execution timestamp.
              </p>
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
                    {[
                      ["Accepted rows", review.importResult.acceptedExecutionCount],
                      ["Rejected rows", review.importResult.rejectedRowCount],
                      ["Skipped rows", review.importResult.skippedRowCount],
                      ["Detected trades", review.importResult.requestCount],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-lg bg-zinc-950 p-3">
                        <p className="text-xs text-zinc-500">{label}</p>
                        <p className="mt-1 text-lg font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-sm">
                      <thead className="text-left text-xs uppercase tracking-wide text-zinc-500">
                        <tr>
                          <th className="py-2 pr-3">Account time</th>
                          <th className="py-2 pr-3">UTC</th>
                          <th className="py-2 pr-3">Symbol</th>
                          <th className="py-2 pr-3">Side</th>
                          <th className="py-2 pr-3">Shares</th>
                          <th className="py-2 pr-3">Price</th>
                          <th className="py-2 pr-3">Commission</th>
                          <th className="py-2">Fees</th>
                        </tr>
                      </thead>
                      <tbody>
                        {review.importResult.executions.slice(0, 20).map((execution, index) => {
                          const timestamp = timestampToUtcString(execution.timestamp);
                          return (
                            <tr key={`${timestamp}-${execution.symbol}-${index}`} className="border-t border-zinc-800">
                              <td className="py-2 pr-3 text-zinc-200">{formatInTimezone(timestamp, accountTimezone)}</td>
                              <td className="py-2 pr-3 text-xs text-zinc-500">{timestamp}</td>
                              <td className="py-2 pr-3 font-medium">{execution.symbol}</td>
                              <td className="py-2 pr-3 capitalize">{execution.side}</td>
                              <td className="py-2 pr-3">{execution.shares}</td>
                              <td className="py-2 pr-3">{execution.price}</td>
                              <td className="py-2 pr-3">{execution.commission ?? "—"}</td>
                              <td className="py-2">{execution.fees ?? "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <button
                    type="button"
                    onClick={() => void continueImport()}
                    disabled={review.status === "blocked" || review.importResult.rejectedRowCount > 0 || duplicateDestinationFields.length > 0 || continuing}
                    className="w-full rounded-lg bg-emerald-400 px-4 py-3 font-medium text-zinc-950 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {continuing ? "Creating controlled import…" : "Continue Import"}
                  </button>
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
