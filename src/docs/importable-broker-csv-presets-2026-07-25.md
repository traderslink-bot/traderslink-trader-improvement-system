# Importable broker CSV presets

Date: 2026-07-25

## Purpose

This change expands the broker CSV ingestion surface without duplicating the existing hardened generic parser. Each broker preset supplies explicit canonical column mappings and then delegates parsing, validation, grouping, fingerprinting, diagnostics, options handling, and parser hardening to `parseBrokerExecutionCsv`.

## Added presets

| Preset ID | Display name | Source level | Confidence | Important notes |
| --- | --- | --- | --- | --- |
| `das_trader_pro` | DAS Trader Pro Executions | Execution | Observed | Supports `Symbol` and `Symb`; date must be present somewhere in the export. |
| `sterling_trader_pro` | Sterling Trader Pro Executions | Execution | Observed | Sterling exports are configurable. |
| `thinkorswim_trade_history` | thinkorswim Trade Account History | Execution | Observed | Options remain controlled by `optionsHandling`. |
| `questrade_iq_edge` | Questrade IQ Edge Executions | Execution | Observed | Uses execution time rather than order placement time. |
| `alpaca_trade_activities` | Alpaca Trade Activities | Execution | Official | Accepts CSV serialization of documented trade activity records. |
| `tradezero_historical_fills` | TradeZero Historical Fills | Execution | Official | Intended for individual historical fill records. |
| `tradervue_generic_executions` | Tradervue Generic Execution Format | Execution | Official | Uses the documented six-column generic execution shape plus optional costs. |
| `fidelity_account_history` | Fidelity Account History | Transaction | Observed | Non-trade activity is skipped by action filtering. |
| `tastytrade_transaction_history` | tastytrade Transaction History | Transaction | Observed | Includes dedicated option-related columns. |
| `trading212_history` | Trading 212 History | Transaction | Observed | Extra localized columns are allowed. |
| `swissquote_transaction_history` | Swissquote Transaction History | Transaction | Observed | Semicolon-delimited examples are supported. |

## Public API

The CSV package now exports:

- `IMPORTABLE_BROKER_PRESETS`
- `parseImportableBrokerCsv`
- `ImportableBrokerPreset`
- `ImportableBrokerPresetId`
- `ParseImportableBrokerCsvArgs`

## Simulation coverage

`src/lib/execution-sources/csv/__tests__/importable-broker-presets.test.ts` creates a synthetic buy and sell execution for every added preset and verifies:

- both rows are accepted;
- no row is rejected;
- the executions group into one closed long trade;
- the symbol is preserved;
- execution sides normalize to `buy` then `sell`;
- the broker-specific display label is returned.

The scenarios are intentionally synthetic. They confirm deterministic mapping and trade grouping, not that every historical variation of every broker export has been observed.

## Architecture decision

The existing `BrokerExecutionCsvFormat` union was not enlarged. The new presets wrap `generic_execution_csv` with explicit mappings. This avoids modifying the large core parser for every broker and allows future formats to be added as data-driven presets.

The underlying result still reports `generic_execution_csv` as the resolved parser because that is the parser actually used. `brokerLabel`, `stableHeaderConfidence`, `sourceLabel`, and diagnostic broker notes identify the selected preset.

The import selector and server-side save/decision-review boundaries accept the preset IDs, resolve them to `generic_execution_csv`, and merge their explicit mappings with any user correction. This keeps the durable import contract on the existing hardened parser while allowing the added brokers to be selected in the product.

## Known limitations

1. Broker exports can change without notice and may vary by region, account type, language, desktop/web route, or user-selected columns.
2. Transaction-history exports may contain dividends, deposits, withdrawals, transfers, interest, or corporate actions. These rows depend on action filtering and should not be treated as executions.
3. DAS exports that contain only a time and no date cannot produce a trustworthy execution timestamp.
4. Alpaca activity rows are accepted only when the activity type represents a fill, and TradeZero `canceled=true` records are skipped. Other broker-specific status variants still need real-export calibration.
5. Options are rejected by default unless the caller deliberately selects another `optionsHandling` policy.
6. Real broker samples should be added to the private calibration fixture process as they become available.

## Recommended next calibration work

For each broker, collect at least one anonymized real export containing:

- a partial fill;
- multiple entries and exits;
- commissions and fees;
- premarket or after-hours executions;
- a canceled or non-trade row when the export includes them;
- a symbol containing punctuation or an option contract when relevant.

Real samples should be run through the existing dry-run and saved-import calibration workflows before the preset is described as fully calibrated.
