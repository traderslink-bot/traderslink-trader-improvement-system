"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import {
  Alert,
  Box,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import {
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../../dashboard-template";

type ExecutionDraft = {
  fees: string;
  id: number;
  price: string;
  quantity: string;
  side: "BUY" | "SELL";
  symbol: string;
  time: string;
};

function newExecution(id: number, side: "BUY" | "SELL"): ExecutionDraft {
  return {
    fees: "",
    id,
    price: "",
    quantity: "",
    side,
    symbol: "",
    time: "",
  };
}

export function ExecutionEntryCard({ sessionDate }: { sessionDate: string }) {
  const [nextId, setNextId] = useState(3);
  const [rows, setRows] = useState<ExecutionDraft[]>([
    newExecution(1, "BUY"),
    newExecution(2, "SELL"),
  ]);
  const [state, setState] = useState<
    | { kind: "idle" }
    | { kind: "saving" }
    | { kind: "saved"; count: number }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  function update(
    id: number,
    field: keyof Omit<ExecutionDraft, "id">,
    value: string,
  ) {
    setRows((current) =>
      current.map((row) =>
        row.id === id ? { ...row, [field]: value } : row,
      ),
    );
    setState({ kind: "idle" });
  }

  function addExecution() {
    setRows((current) => [...current, newExecution(nextId, "BUY")]);
    setNextId((current) => current + 1);
    setState({ kind: "idle" });
  }

  function removeExecution(id: number) {
    setRows((current) =>
      current.length === 1
        ? current
        : current.filter((row) => row.id !== id),
    );
    setState({ kind: "idle" });
  }

  const complete = rows.every(
    (row) =>
      row.symbol.trim() &&
      row.time &&
      Number(row.quantity) > 0 &&
      Number(row.price) > 0 &&
      (row.fees === "" || Number(row.fees) >= 0),
  );

  async function saveExecutions() {
    if (!complete || state.kind === "saving") return;
    setState({ kind: "saving" });
    try {
      const response = await fetch(
        "/api/intelligence/day-session-executions/v1",
        {
          body: JSON.stringify({
            date: sessionDate,
            executions: rows.map((row) => ({
              fees: row.fees,
              price: row.price,
              quantity: row.quantity,
              side: row.side,
              symbol: row.symbol.trim().toUpperCase(),
              time: row.time,
            })),
          }),
          headers: { "content-type": "application/json" },
          method: "POST",
        },
      );
      const result = (await response.json()) as {
        acceptedExecutionCount?: number;
        error?: { code?: string };
      };
      if (!response.ok || result.acceptedExecutionCount === undefined) {
        throw new Error(
          result.error?.code ===
            "ti_v3_preview_database_configuration_invalid"
            ? "The separate Neon preview database is not configured yet."
            : "The executions could not be saved.",
        );
      }
      setState({ kind: "saved", count: result.acceptedExecutionCount });
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "The executions could not be saved.",
      });
    }
  }

  return (
    <DashboardPanel
      eyebrow={sessionDate}
      title="Enter trades"
    >
      <Typography color="text.secondary" variant="body2">
        Add every buy and sell from this trading day. Completed trades and P/L
        are reconstructed after saving.
      </Typography>

      <Stack spacing={1.5} sx={{ mt: 2.5 }}>
        {rows.map((row, index) => (
          <Box
            key={row.id}
            sx={{
              alignItems: { md: "center" },
              bgcolor: "action.hover",
              border: 1,
              borderColor: "divider",
              borderRadius: 1,
              display: "grid",
              gap: 1.25,
              gridTemplateColumns: {
                xs: "1fr 1fr",
                md: "80px minmax(110px, .8fr) 110px minmax(110px, .7fr) minmax(100px, .65fr) minmax(100px, .65fr) minmax(90px, .55fr) 40px",
              },
              p: 1.5,
            }}
          >
            <Typography
              color="text.secondary"
              sx={{
                fontWeight: 700,
                gridColumn: { xs: "1 / -1", md: "auto" },
              }}
              variant="caption"
            >
              Execution {index + 1}
            </Typography>
            <TextField
              label="Symbol"
              onChange={(event) =>
                update(row.id, "symbol", event.target.value.toUpperCase())
              }
              placeholder="NVDA"
              size="small"
              value={row.symbol}
            />
            <TextField
              label="Side"
              onChange={(event) =>
                update(row.id, "side", event.target.value)
              }
              select
              size="small"
              value={row.side}
            >
              <MenuItem value="BUY">Buy</MenuItem>
              <MenuItem value="SELL">Sell</MenuItem>
            </TextField>
            <TextField
              label="Time"
              onChange={(event) => update(row.id, "time", event.target.value)}
              size="small"
              slotProps={{ htmlInput: { step: 1 } }}
              type="time"
              value={row.time}
            />
            <TextField
              label="Quantity"
              onChange={(event) =>
                update(row.id, "quantity", event.target.value)
              }
              size="small"
              slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }}
              value={row.quantity}
            />
            <TextField
              label="Price"
              onChange={(event) => update(row.id, "price", event.target.value)}
              size="small"
              slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }}
              value={row.price}
            />
            <TextField
              label="Fees"
              onChange={(event) => update(row.id, "fees", event.target.value)}
              placeholder="Optional"
              size="small"
              slotProps={{ htmlInput: { inputMode: "decimal", min: 0 } }}
              value={row.fees}
            />
            <IconButton
              aria-label={`Remove execution ${index + 1}`}
              disabled={rows.length === 1}
              onClick={() => removeExecution(row.id)}
              size="small"
            >
              <DeleteOutlineRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        ))}
      </Stack>

      <DashboardSecondaryAction
        fullWidth
        onClick={addExecution}
        startIcon={<AddRoundedIcon />}
        sx={{ justifyContent: "flex-start", mt: 1.5 }}
      >
        Add execution
      </DashboardSecondaryAction>

      {state.kind === "saved" ? (
        <Alert severity="success" sx={{ mt: 2 }}>
          {state.count} execution{state.count === 1 ? "" : "s"} saved to the
          isolated preview database.
        </Alert>
      ) : null}
      {state.kind === "error" ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {state.message}
        </Alert>
      ) : null}

      <Box
        sx={{
          alignItems: { sm: "center" },
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1.5,
          justifyContent: "space-between",
          mt: 2.5,
        }}
      >
        <Typography color="text.secondary" variant="body2">
          Times use Eastern Time. P/L and round trips are never entered
          manually.
        </Typography>
        <DashboardPrimaryAction
          disabled={!complete || state.kind === "saving"}
          onClick={() => void saveExecutions()}
        >
          {state.kind === "saving" ? "Saving trades..." : "Save trades"}
        </DashboardPrimaryAction>
      </Box>
    </DashboardPanel>
  );
}
