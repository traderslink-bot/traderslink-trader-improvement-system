"use client";

import { useEffect, useState } from "react";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";

type RepairAction = "Save correction" | "Keep as imported" | "Exclude row" | "Reset to source";

type PreviewRow = {
  id: string;
  row: string;
  time: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: string;
  price: string;
  fees: string;
  currency: string;
  commission: string;
  orderId: string;
  executionId: string;
  action: RepairAction;
  message: string;
};

type RepairStatement = Readonly<{
  persistenceDigest: string;
  broker: string;
  rows: readonly Readonly<{
    sourceRowNumber: string;
    status: "accepted" | "rejected" | "skipped";
    symbol: string | null;
    timestamp: string | null;
    side: string | null;
    quantity: string | null;
    price: string | null;
    fees: string | null;
    currency: string | null;
    commission: string | null;
    orderId: string | null;
    executionId: string | null;
    issues: readonly Readonly<{ message: string }>[];
  }>[];
}>;

function repairRows(statement: RepairStatement | null): readonly PreviewRow[] {
  if (statement === null) return [];
  return statement.rows
    .filter((row) => row.status === "rejected" || row.issues.length > 0)
    .map((row) => ({
      id: `${statement.persistenceDigest}:${row.sourceRowNumber}`,
      row: row.sourceRowNumber,
      time: row.timestamp ?? "",
      symbol: row.symbol ?? "",
      side: row.side?.toLowerCase().includes("sell") ? "Sell" : "Buy",
      quantity: row.quantity ?? "",
      price: row.price ?? "",
      fees: row.fees ?? "",
      currency: row.currency ?? "USD",
      commission: row.commission ?? "",
      orderId: row.orderId ?? "",
      executionId: row.executionId ?? "",
      action: row.status === "rejected" ? "Exclude row" : "Save correction",
      message: row.issues.map((issue) => issue.message).join(" ") || "This statement row needs attention.",
    }));
}

const ACTIONS: readonly RepairAction[] = [
  "Save correction",
  "Keep as imported",
  "Exclude row",
  "Reset to source",
];

function updateRowField<K extends keyof PreviewRow>(
  rows: readonly PreviewRow[],
  id: string,
  field: K,
  value: PreviewRow[K],
): readonly PreviewRow[] {
  return rows.map((row) =>
    row.id === id ? ({ ...row, [field]: value } as PreviewRow) : row,
  );
}

export function DataDecisionsRepairPreview() {
  const [statement, setStatement] = useState<RepairStatement | null>(null);
  const [rows, setRows] = useState<readonly PreviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/intelligence/import-repair/v1", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((packet: { statements?: readonly RepairStatement[] }) => {
        if (!active) return;
        const selected = packet.statements?.[0] ?? null;
        setStatement(selected);
        setRows(repairRows(selected));
      })
      .catch(() => active && setLoadError("Import Repair is unavailable right now."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function deleteStatement() {
    if (statement === null || deleting) return;
    setDeleting(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/intelligence/import-repair/v1", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persistenceDigest: statement.persistenceDigest }),
      });
      if (!response.ok) throw new Error("delete failed");
      const refreshed = await fetch("/api/intelligence/import-repair/v1", {
        cache: "no-store",
      });
      const packet = refreshed.ok
        ? await refreshed.json() as { statements?: readonly RepairStatement[] }
        : {};
      const selected = packet.statements?.[0] ?? null;
      setStatement(selected);
      setRows(repairRows(selected));
      setDeleteOpen(false);
      setNotice("Statement deleted. V3 was rebuilt from the statements that remain.");
    } catch {
      setLoadError("The statement could not be deleted. No confirmed change was applied.");
    } finally {
      setDeleting(false);
    }
  }

  async function saveAndRecheck() {
    if (statement === null || saving || deleting) return;
    setSaving(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/intelligence/import-repair/v1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contractVersion: "ti_v3_import_repair_mutation_v1",
          persistenceDigest: statement.persistenceDigest,
          rows: rows.map((row) => ({
            sourceRowNumber: row.row,
            action: row.action === "Save correction"
              ? "save_correction"
              : row.action === "Keep as imported"
                ? "keep_as_imported"
                : row.action === "Exclude row"
                  ? "exclude_row"
                  : "reset_to_source",
            values: row.action === "Save correction" ? {
              timestamp: row.time,
              symbol: row.symbol,
              side: row.side.toLowerCase(),
              quantity: row.quantity,
              price: row.price,
              currency: row.currency,
              commission: row.commission || null,
              fees: row.fees || null,
              orderId: row.orderId || null,
              executionId: row.executionId || null,
            } : null,
          })),
        }),
      });
      const packet = await response.json();
      if (!response.ok || !packet.statement) {
        throw new Error(packet.error?.message ?? "save failed");
      }
      setStatement(packet.statement);
      setRows(repairRows(packet.statement));
      setNotice("Import Repair saved the decisions and rebuilt V3.");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Import Repair could not save the changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPage>
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography component="h1" variant="h1">Data Decisions</Typography>
            <Chip label="Import Repair beta" size="small" variant="outlined" />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Fix import problems here before V3 uses the statement in your trade pages and analytics.
          </Typography>
        </Stack>

        <Alert severity="info">Import Repair changes only the selected isolated V3 statement. Saving or deleting rebuilds V3 from the verified statements that remain.</Alert>
        {loadError ? <Alert severity="warning">{loadError}</Alert> : null}
        {notice ? <Alert severity="success">{notice}</Alert> : null}

        <DashboardPanel
          action={<Button color="error" onClick={() => setDeleteOpen(true)} startIcon={<DeleteOutlineRoundedIcon />} variant="outlined">Delete statement</Button>}
          title={statement ? `${statement.broker} statement` : "Imported statement"}
        >
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              {loading ? "Loading statement rows..." : statement ? "Import Repair shows the exact broker statement rows that need attention." : "Import a new statement to see its exact broker rows here."}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Chip color={rows.length > 0 ? "warning" : "default"} label={`${rows.length} rows to review`} size="small" variant="outlined" />
              <Chip label={statement ? "Original broker rows saved" : "No repair record yet"} size="small" variant="outlined" />
              <Chip label="No changes saved" size="small" variant="outlined" />
            </Stack>
          </Stack>
        </DashboardPanel>

        <DashboardPanel
          action={<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button onClick={() => { setRows(repairRows(statement)); setNotice("Edits reset. No statement data was changed."); }} startIcon={<ReplayRoundedIcon />} variant="outlined">Reset edits</Button>
            <Button disabled={saving || deleting || statement === null} onClick={() => void saveAndRecheck()} startIcon={<SaveRoundedIcon />} variant="contained">{saving ? "Saving..." : "Save and recheck import"}</Button>
          </Stack>}
          title="Import Repair"
        >
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              Each row explains what needs attention. Edit the values shown by your broker, choose how to handle the row, then save and recheck the statement.
            </Typography>
            <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1.5 }}>
              <Table size="small" sx={{ minWidth: 1120 }}>
                <TableHead><TableRow>
                  <TableCell>Statement row</TableCell><TableCell>What needs attention</TableCell><TableCell>Date and time</TableCell><TableCell>Symbol</TableCell><TableCell>Side</TableCell><TableCell align="right">Quantity</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Fees</TableCell><TableCell>Use this row</TableCell>
                </TableRow></TableHead>
                <TableBody>{rows.map((row) => <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 700 }}>{row.row}</TableCell>
                  <TableCell sx={{ minWidth: 260 }}><Typography variant="body2">{row.message}</Typography></TableCell>
                  <EditableCell label={`Date and time for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "time", value))} value={row.time} width={185} />
                  <EditableCell label={`Symbol for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "symbol", value.toUpperCase()))} value={row.symbol} width={100} />
                  <TableCell sx={{ minWidth: 110 }}><TextField aria-label={`Side for statement row ${row.row}`} fullWidth onChange={(event) => setRows((current) => updateRowField(current, row.id, "side", event.target.value as PreviewRow["side"]))} select size="small" value={row.side}><MenuItem value="Buy">Buy</MenuItem><MenuItem value="Sell">Sell</MenuItem></TextField></TableCell>
                  <EditableCell align="right" label={`Quantity for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "quantity", value))} value={row.quantity} width={100} />
                  <EditableCell align="right" label={`Price for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "price", value))} value={row.price} width={100} />
                  <EditableCell align="right" label={`Fees for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "fees", value))} value={row.fees} width={100} />
                  <TableCell sx={{ minWidth: 180 }}><TextField aria-label={`Action for statement row ${row.row}`} fullWidth onChange={(event) => setRows((current) => updateRowField(current, row.id, "action", event.target.value as RepairAction))} select size="small" value={row.action}>{ACTIONS.map((action) => <MenuItem key={action} value={action}>{action}</MenuItem>)}</TextField></TableCell>
                </TableRow>)}{!loading && rows.length === 0 ? <TableRow><TableCell colSpan={9}><Typography color="text.secondary" variant="body2">No repair rows are available. Older imports need to be imported again once to retain their original broker-row details.</Typography></TableCell></TableRow> : null}</TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
              <Chip color="info" label="Open position" size="small" variant="outlined" />
              <Typography color="text.secondary" sx={{ flexGrow: 1 }} variant="body2">A position still open at the end of a statement is not an import error. Its completed-trade result appears after you import the statement containing its exit.</Typography>
            </Stack>
          </Stack>
        </DashboardPanel>

        <DashboardPanel title="Financial-data rules">
          <Stack spacing={1.25}>
            <Typography color="text.secondary" variant="body2">The current rule cards remain here. Import Repair adds the exact rows and editable values behind a rule; it does not replace your existing choices.</Typography>
            <DashboardUnavailableState compact description="New import rules will appear here. In the beta, their affected statement rows open in Import Repair." title="No rules waiting" />
          </Stack>
        </DashboardPanel>
      </Stack>

      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteOpen(false)} open={deleteOpen}>
        <DialogTitle>Delete this statement?</DialogTitle>
        <DialogContent><Typography color="text.secondary" variant="body2">This removes this one statement and its executions from isolated V3 test data, then rebuilds V3 from the statements that remain.</Typography></DialogContent>
        <DialogActions><Button disabled={deleting || saving} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" disabled={deleting || saving || statement === null} onClick={() => void deleteStatement()} variant="contained">{deleting ? "Deleting..." : "Delete statement"}</Button></DialogActions>
      </Dialog>
    </DashboardPage>
  );
}

function EditableCell({ align, label, onChange, value, width }: { align?: "right"; label: string; onChange: (value: string) => void; value: string; width: number }) {
  return <TableCell align={align} sx={{ minWidth: width }}><TextField aria-label={label} fullWidth onChange={(event) => onChange(event.target.value)} size="small" value={value} /></TableCell>;
}
