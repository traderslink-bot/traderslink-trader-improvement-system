import {
  addExactRatios,
  createExactRatio,
  decimalToExactRatio,
  validateExactDecimal,
  type ExactRatio,
} from "../../../domain/exact";
import type {
  AnalyticalRow,
  SimulationFeeAuthority,
  SimulationFeeComponentKind,
} from "../../dataset";

export type ResizeNetAuthority =
  | "exact"
  | "incomplete"
  | "unavailable"
  | "estimated";

export interface ExactSimulationAmount {
  readonly numerator: string;
  readonly denominator: string;
  readonly currency: AnalyticalRow["currency"];
}

export interface ResizeEconomics {
  readonly disposition:
    | "executed_resized"
    | "excluded_zero_simulated_size"
    | "resize_unavailable_quantity"
    | "executed_resized_net_incomplete"
    | "executed_resized_net_unavailable"
    | "executed_resized_net_estimated";
  readonly reasonCode: string;
  readonly originalQuantity: string | null;
  readonly simulatedQuantity: string | null;
  readonly sizeRatio: Readonly<{
    readonly numerator: string;
    readonly denominator: string;
  }> | null;
  readonly roundingPolicy: "floor_toward_zero_to_whole_share_v1";
  readonly minimumSizePolicy: "exclude_below_one_share_v1";
  readonly originalGrossPnl: ExactSimulationAmount;
  readonly simulatedGrossPnl: ExactSimulationAmount | null;
  readonly simulatedGrossPnlAuthority: "exact" | "unavailable";
  readonly actualCharges: string;
  readonly feeAuthority: SimulationFeeAuthority;
  readonly simulatedCharges: ExactSimulationAmount | null;
  readonly simulatedChargesAuthority: ResizeNetAuthority;
  readonly actualNetPnl: string;
  readonly actualNetPnlAuthority: "accepted_historical_net_v1";
  readonly simulatedNetPnl: ExactSimulationAmount | null;
  readonly simulatedNetPnlAuthority: ResizeNetAuthority;
  readonly fixedChargesRetained: ExactSimulationAmount | null;
  readonly variableChargesRecalculated: ExactSimulationAmount | null;
  readonly limitationCodes: readonly string[];
}

function ratio(value: string): ExactRatio {
  const parsed = validateExactDecimal(value);
  if (!parsed.ok) throw new Error(parsed.error.code);
  const converted = decimalToExactRatio(parsed.value);
  if (!converted.ok) throw new Error(converted.error.code);
  return converted.value;
}

function multiply(left: ExactRatio, right: ExactRatio): ExactRatio {
  const result = createExactRatio(
    (BigInt(left.numerator) * BigInt(right.numerator)).toString(),
    (BigInt(left.denominator) * BigInt(right.denominator)).toString(),
  );
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

function add(left: ExactRatio, right: ExactRatio): ExactRatio {
  const result = addExactRatios(left, right);
  if (!result.ok) throw new Error(result.error.code);
  return result.value;
}

function amount(
  value: ExactRatio,
  currency: AnalyticalRow["currency"],
): ExactSimulationAmount {
  return Object.freeze({
    numerator: value.numerator,
    denominator: value.denominator,
    currency,
  });
}

function base(
  row: AnalyticalRow,
): Pick<
  ResizeEconomics,
  | "roundingPolicy"
  | "minimumSizePolicy"
  | "originalGrossPnl"
  | "actualCharges"
  | "feeAuthority"
  | "actualNetPnl"
  | "actualNetPnlAuthority"
> {
  return {
    roundingPolicy: "floor_toward_zero_to_whole_share_v1",
    minimumSizePolicy: "exclude_below_one_share_v1",
    originalGrossPnl: amount(ratio(row.grossPnl), row.currency),
    actualCharges: row.signedCharges,
    feeAuthority: row.feeAuthority,
    actualNetPnl: row.netPnl,
    actualNetPnlAuthority: "accepted_historical_net_v1",
  };
}

function unavailableQuantity(
  row: AnalyticalRow,
  reasonCode: string,
): ResizeEconomics {
  return Object.freeze({
    ...base(row),
    disposition: "resize_unavailable_quantity",
    reasonCode,
    originalQuantity:
      row.shareQuantity.state === "available"
        ? row.shareQuantity.quantity
        : null,
    simulatedQuantity: null,
    sizeRatio: null,
    simulatedGrossPnl: null,
    simulatedGrossPnlAuthority: "unavailable",
    simulatedCharges: null,
    simulatedChargesAuthority: "unavailable",
    simulatedNetPnl: null,
    simulatedNetPnlAuthority: "unavailable",
    fixedChargesRetained: null,
    variableChargesRecalculated: null,
    limitationCodes: Object.freeze([reasonCode]),
  });
}

function deriveResizedFeeAuthority(
  authority: SimulationFeeAuthority,
): ResizeNetAuthority {
  if (
    "components" in authority &&
    authority.components.some(
      (component) => component.kind === "unknown_undecomposed",
    )
  ) {
    return "unavailable";
  }
  switch (authority.state) {
    case "broker_reported_complete":
    case "account_policy_calculated":
    case "explicitly_zero":
      return "exact";
    case "broker_reported_partial":
      return "incomplete";
    case "estimated":
      return "estimated";
    case "not_included":
    case "unavailable":
      return "unavailable";
  }
}

function scalesWithSize(kind: SimulationFeeComponentKind): boolean {
  return kind === "quantity_variable" ||
    kind === "notional_variable" ||
    kind === "sell_side_regulatory";
}

export function calculateResizeEconomics(row: AnalyticalRow): ResizeEconomics {
  if (row.shareQuantity.state !== "available") {
    return unavailableQuantity(
      row,
      "ti_v3_simulation_resize_quantity_authority_unavailable",
    );
  }
  if (!/^(?:0|[1-9][0-9]*)$/.test(row.shareQuantity.quantity)) {
    return unavailableQuantity(
      row,
      "ti_v3_simulation_resize_whole_share_quantity_required",
    );
  }
  const original = BigInt(row.shareQuantity.quantity);
  if (original <= BigInt(0)) {
    return unavailableQuantity(
      row,
      "ti_v3_simulation_resize_positive_quantity_required",
    );
  }
  const simulated = original / BigInt(2);
  const sizeRatio = createExactRatio(
    simulated.toString(),
    original.toString(),
  );
  if (!sizeRatio.ok) throw new Error(sizeRatio.error.code);
  const gross = amount(
    multiply(ratio(row.grossPnl), sizeRatio.value),
    row.currency,
  );
  if (simulated < BigInt(1)) {
    const zeroAmount = amount(ratio("0"), row.currency);
    return Object.freeze({
      ...base(row),
      disposition: "excluded_zero_simulated_size",
      reasonCode: "ti_v3_simulation_resize_zero_simulated_size",
      originalQuantity: original.toString(),
      simulatedQuantity: "0",
      sizeRatio: Object.freeze({
        numerator: sizeRatio.value.numerator,
        denominator: sizeRatio.value.denominator,
      }),
      simulatedGrossPnl: gross,
      simulatedGrossPnlAuthority: "exact",
      simulatedCharges: zeroAmount,
      simulatedChargesAuthority: "exact",
      simulatedNetPnl: zeroAmount,
      simulatedNetPnlAuthority: "exact",
      fixedChargesRetained: zeroAmount,
      variableChargesRecalculated: zeroAmount,
      limitationCodes: Object.freeze([
        "ti_v3_simulation_resize_zero_simulated_size",
      ]),
    });
  }

  const resizedFeeAuthority = deriveResizedFeeAuthority(row.feeAuthority);
  let fixed = ratio("0");
  let variable = ratio("0");
  const exactFees = resizedFeeAuthority === "exact";
  if (row.feeAuthority.state !== "explicitly_zero") {
    if ("components" in row.feeAuthority) {
      for (const component of row.feeAuthority.components) {
        if (component.kind === "unknown_undecomposed") {
          continue;
        }
        const componentAmount = ratio(component.signedAmount);
        if (scalesWithSize(component.kind)) {
          variable = add(
            variable,
            multiply(componentAmount, sizeRatio.value),
          );
        } else {
          fixed = add(fixed, componentAmount);
        }
      }
    }
  }
  const simulatedChargesRatio = add(fixed, variable);
  const simulatedCharges = amount(simulatedChargesRatio, row.currency);
  const simulatedNet = exactFees
    ? amount(
        add(
          {
            numerator: gross.numerator,
            denominator: gross.denominator,
          } as ExactRatio,
          simulatedChargesRatio,
        ),
        row.currency,
      )
    : null;
  const disposition = exactFees
    ? "executed_resized"
    : resizedFeeAuthority === "incomplete"
      ? "executed_resized_net_incomplete"
      : resizedFeeAuthority === "estimated"
        ? "executed_resized_net_estimated"
        : "executed_resized_net_unavailable";
  const reasonCode = exactFees
    ? "ti_v3_simulation_resize_executed_exact_net"
    : resizedFeeAuthority === "incomplete"
      ? "ti_v3_simulation_resize_net_incomplete"
      : resizedFeeAuthority === "estimated"
        ? "ti_v3_simulation_resize_net_estimated"
        : "ti_v3_simulation_resize_net_unavailable";
  return Object.freeze({
    ...base(row),
    disposition,
    reasonCode,
    originalQuantity: original.toString(),
    simulatedQuantity: simulated.toString(),
    sizeRatio: Object.freeze({
      numerator: sizeRatio.value.numerator,
      denominator: sizeRatio.value.denominator,
    }),
    simulatedGrossPnl: gross,
    simulatedGrossPnlAuthority: "exact",
    simulatedCharges: exactFees ? simulatedCharges : null,
    simulatedChargesAuthority: resizedFeeAuthority,
    simulatedNetPnl: simulatedNet,
    simulatedNetPnlAuthority: resizedFeeAuthority,
    fixedChargesRetained: amount(fixed, row.currency),
    variableChargesRecalculated: amount(variable, row.currency),
    limitationCodes: Object.freeze(
      exactFees
        ? []
        : [
            reasonCode,
            ...(row.feeAuthority.state === "not_included"
              ? ["ti_v3_simulation_fees_not_included_not_zero"]
              : []),
            ...(row.feeAuthority.state === "unavailable"
              ? ["ti_v3_simulation_fees_unavailable_not_zero"]
              : []),
            ...(
              "components" in row.feeAuthority &&
              row.feeAuthority.components.some(
                (component) =>
                  component.kind === "unknown_undecomposed",
              )
                ? ["ti_v3_simulation_legacy_undecomposed_fee"]
                : []
            ),
          ].sort(),
    ),
  });
}

export function exactSimulationAmountToDecimal(
  value: ExactSimulationAmount,
): string | null {
  let denominator = BigInt(value.denominator);
  let twos = 0;
  let fives = 0;
  while (denominator % BigInt(2) === BigInt(0)) {
    denominator /= BigInt(2);
    twos += 1;
  }
  while (denominator % BigInt(5) === BigInt(0)) {
    denominator /= BigInt(5);
    fives += 1;
  }
  if (denominator !== BigInt(1)) return null;
  const scale = twos > fives ? twos : fives;
  if (scale > 24) return null;
  const scaledNumerator =
    BigInt(value.numerator) *
    BigInt(2) ** BigInt(scale - twos) *
    BigInt(5) ** BigInt(scale - fives);
  const negative = scaledNumerator < BigInt(0);
  const magnitude = negative ? -scaledNumerator : scaledNumerator;
  const digits = magnitude.toString().padStart(scale + 1, "0");
  const candidate = scale === 0
    ? digits
    : `${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
  const parsed = validateExactDecimal(
    `${negative && magnitude !== BigInt(0) ? "-" : ""}${candidate}`,
  );
  return parsed.ok ? parsed.value : null;
}
