# Trader Intelligence v3 GA1-B Verification Ledger

**Executable commit:** `bdf62a222754de2e9aca356c238943cc43314d4b`  
**Base:** `da5f40f5217f0c6501086c8fead55b3dd6ae4c6b`

## Executed

- TypeScript `tsc --noEmit`: passed before the consolidated focused checkpoint.
- Narrow GA1-B evidence/preset test: passed 5 tests, then 6 tests after the
  guard-driven `BigInt` correction.
- Consolidated focused verifier: passed 2 files / 11 tests (GA1-B plus the
  directly affected GA1-A registry test).
- Fixed-seed GA1-B 10,000-row verifier: process completed after launch; the
  desktop terminal transport did not return its final exit record. Treat its
  status as **unconfirmed**, not as a passing proof.
- Architecture guard: initially failed only on two `Number` uses in bounded
  GA1-B limit parsing; corrected to `BigInt` and then passed.
- Private-data guard: process completed after the architecture pass, but the
  terminal transport did not return a final exit record. Treat as
  **unconfirmed** until a fresh owner-local invocation captures its result.

## Deliberately not run

- full repository tests; browser/e2e tests; production build; deployment;
  unrelated legacy suites; any CI/private CSV upload.

## Private calibration

**Blocked.** The existing importer accepted the private CSV in the recorded
aggregate-only preflight, but this checkout does not expose a verified bridge
from its legacy importer/reconstruction result to a v3 snapshot authority.
No synthetic substitute was used and no raw private data was read or recorded
by GA1-B. Complete calibration only after that accepted application bridge is
available, using the existing importer and reconstruction pipeline, then open
the GA1-A gateway partition and run the GA1-B evidence, similarity, and ten
preset calls. Record aggregate counts/timing only.

## Owner-local checklist

1. Run the existing IBKR importer against the original private CSV read-only.
2. Reconcile only the approved aggregate source/accepted/skipped/rejected/
   generated-request counts.
3. Continue through correction, canonical reconstruction, analytical dataset,
   partition, and accepted GA1-A gateway without a new parser or database write.
4. Execute one evidence retrieval, one similar-trade search, and all ten
   presets against each permitted partition; retain no rows, identifiers, or
   raw financial values in logs or Git.
5. Capture only pass/fail/blocked, aggregate counts, redacted discrepancy
   categories, and elapsed time.
