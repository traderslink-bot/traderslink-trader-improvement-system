# Trader Intelligence v3 GA0-B planning and next-session handoff

**Date:** 2026-07-19 America/Toronto  
**Purpose:** continuation handoff for the independent planner/auditor  
**Planning branch:** `agent/trader-intelligence-v3-ga0-b-plan`  
**Accepted GA0-A3 merge:** `72ca53940403dfab63979d403bd6b479539f41db`

## 1. Status

GA0-A1, GA0-A2, and GA0-A3 are independently accepted and merged.

The next active program is GA0-B — Deterministic Proof.

The controlling detailed implementation plan is:

`src/docs/trader-intelligence-v3-ga0-b-deterministic-proof-implementation-plan-2026-07-19.md`

Current status is recorded without deleting historical detail:

- active entry point: `plan.md`;
- latest accepted transition addendum:
  `src/docs/trader-intelligence-v3-project-log-addendum-ga0-b-2026-07-19.md`;
- preserved detailed historical log:
  `src/docs/trader-intelligence-v3-project-log.md`.

## 2. Product focus

The primary objective remains a professional AI-powered trading journal.

GA0-B is the minimum deterministic bridge needed so later UI and AI can answer
questions using exact code-owned facts.

The first proof questions are:

1. Why am I losing money on Fridays?
2. What happens if I stop trading after two consecutive losses?

Do not redirect the program into unrelated local privacy or network-security
work. Preserve accepted safeguards while prioritizing financial correctness,
analytical evidence, maintainability, performance, and progress toward visible
AI functionality.

## 3. Delivery sequence

- GA0-B1: read-only analytical dataset and proof contracts.
- GA0-B2: weekday deterministic proof.
- GA0-B3: consecutive-loss daily-stop simulation proof.
- GA0-B4: deterministic proof closeout.

Each slice uses a separate branch, draft PR, Codex implementation, independent
audit, acceptance, and merge before the next slice.

## 4. Mandatory process for every Codex prompt

Every Codex implementation or remediation prompt must explicitly require:

1. focused tests during development;
2. no repository-wide TypeScript after each module;
3. one TypeScript run near the final executable checkpoint;
4. no local full repository test without a concrete reason;
5. no Playwright unless browser-facing code changed;
6. no repeated build;
7. a final detailed Markdown handoff committed to the repository;
8. a complete ready-to-paste auditor prompt in that handoff and in Codex's final
   response;
9. draft PR only;
10. no self-merge, thread resolution, deployment, or next-slice work.

The independent auditor treats the handoff as evidence, not proof.

## 5. GA0-B1 next action

Create from current `main`:

`agent/trader-intelligence-v3-ga0-b1-read-model`

Implement only GA0-B1 as defined in the active plan.

Required handoff path:

`src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md`

Stop after opening the draft PR and publishing the handoff.

## 6. New-session auditor responsibilities

In the next chat session, the assistant is the independent planner/auditor and
Codex is the implementation engineer.

The assistant should:

- verify this plan exists on current `main`;
- inspect any status changes made after this handoff;
- give the owner one complete GA0-B1 Codex prompt;
- ensure the prompt contains the mandatory testing and handoff protocol;
- independently audit the resulting draft PR and handoff;
- record findings in GitHub and a stable repository file when remediation is
  required;
- give the owner the next Codex remediation prompt;
- resolve accepted threads and merge only after independent acceptance;
- repeat the process for B2, B3, and B4;
- keep the main focus on reaching owner-testable AI functionality.

## 7. Ready-to-paste new-chat prompt

```text
Continue as the independent senior planner, software architect, financial-domain auditor, and QA lead for Trader Intelligence v3.

Repository:
traderslink-bot/traderslink-trader-improvement-system

Accepted GA0-A3 merge:
72ca53940403dfab63979d403bd6b479539f41db

The next active program is GA0-B — Deterministic Proof.

Read these files completely in order:

1. AGENTS.md
2. plan.md
3. src/docs/trader-intelligence-v3-project-log-addendum-ga0-b-2026-07-19.md
4. src/docs/trader-intelligence-v3-project-log.md for preserved detailed history
5. src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md
6. src/docs/trader-intelligence-v3-ga0-b-deterministic-proof-implementation-plan-2026-07-19.md
7. src/docs/trader-intelligence-v3-ga0-b-planning-and-next-session-handoff-2026-07-19.md

Confirm that GA0-A1, GA0-A2, and GA0-A3 are accepted and merged and that current main contains the GA0-B plan.

Use the same operating process as before:

- You are the independent planner and auditor.
- Codex is the implementation engineer.
- You give me complete prompts to paste into Codex.
- Codex works on one scoped branch and draft PR at a time.
- Codex uses focused tests during implementation, does not rerun repository-wide TypeScript after each module, and runs TypeScript once near the final executable checkpoint.
- Codex does not run the local full repository test suite without a concrete broad-regression reason.
- Codex does not run Playwright unless browser-facing code changes.
- GitHub CI performs broad repository checks.
- The final substantive action in every Codex run must be to create or update a detailed Markdown implementation/audit handoff in the repository.
- Every Codex handoff and final response must include a complete ready-to-paste prompt telling you exactly where the handoff is and what to audit.
- You independently inspect the full diff, implementation, tests, adversarial paths, unresolved review threads, and current-head CI.
- You return accept, accept with required fixes, or reject.
- Codex does not resolve audit threads, merge, deploy, or begin the next slice.
- You resolve accepted threads and merge only after independent acceptance.

The product focus remains a professional AI-powered trading journal. Continue strong foundation work when it improves correctness, reliability, maintainability, performance, or future AI quality, but do not redirect work into unnecessary local privacy/network-security expansion. The owner is the only current tester and is not concerned about disposable local test data.

Start with GA0-B1 only:

Branch:
agent/trader-intelligence-v3-ga0-b1-read-model

Goal:
Implement the snapshot-bound read-only analytical dataset and shared deterministic proof contracts defined in the GA0-B plan.

Required Codex handoff path:
src/docs/trader-intelligence-v3-ga0-b1-read-model-implementation-and-audit-handoff-2026-07-19.md

First independently review the GA0-B plan for readiness and scope consistency. Then give me the complete prompt to paste into Codex for GA0-B1. Do not implement the code yourself in this chat unless I explicitly ask you to use Codex/GitHub to do so.
```

## 8. Planning closeout

This file and the detailed GA0-B plan are planning artifacts. They do not claim
that GA0-B1 implementation has begun.

No model, analytics tool, chart, UI, market-data integration, migration,
deployment, or production-security work was added by the planning change.
