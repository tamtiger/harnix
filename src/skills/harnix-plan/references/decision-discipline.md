# Decision discipline

Five core disciplines to preserve verified decisions, respect user intent, assess real risk, scout before asking, and keep the codebase clean.

## 1. Verified decisions

Never overturn or silently mutate a decision that has already been verified by passing tests and user acceptance without a reproduction of a concrete defect or explicit user direction. A passing check is evidence; aesthetic preference or unprompted refactoring is not.

## 2. User decisions

Respect user-specified constraints, architecture choices, and explicit decisions as authoritative boundaries. When the user chooses an approach among tradeoffs, do not unilaterally replace it with an alternative pattern unless it causes a fatal contract violation.

## 3. Realistic threat model

Before acting on a security warning or speculative flaw:
- Determine what the code actually stores, protects, and exposes.
- Fix only real, observable failure modes.
- Briefly note non-issues rather than rewriting working code to satisfy a generic checklist.
- Ask clarification when a potential risk is legitimate but depends on product intent.

## 4. Scout first

With questions that can be answered by inspecting the repository, search and verify the source code first before asking the user. Come to the user with concrete findings, evidence, and options, never lazy ignorance.

## 5. Stable code artifacts

Keep production code completely free of temporary prompt instructions, task markers, or harness ceremony. Business logic belongs in the source; workflow state belongs exclusively in `.harnix/`.

## 6. Operating envelope and tier matrix

Classify modifications into three distinct authorization tiers:
- **Autonomous tier**: local implementation changes that do not alter public API contracts, do not mutate database schemas, and do not reconfigure auth or external infrastructure. Agent implements and verifies automatically.
- **Review-required tier**: actions modifying public API contracts, database migrations, authentication/authorization policies, external cloud integrations, or quality gate outputs. Must enforce human review sign-off before merge.
- **Blocked tier**: direct production database operations, raw secret manipulation, unverified infrastructure mutation, or actions that cannot be rolled back via version control. Agent must never initiate independently.

## 7. Mandatory hardening and backend sequence

Trigger the hardening review stage whenever work involves:
1. User identity, credentials, or payment data.
2. Authentication/authorization endpoints.
3. Adding new third-party dependencies.
4. Any change marked review-required or blocked.

For backend implementation, order slices systematically: `Entity + Migration → Repository → Service → Controller → Tests`. Use 3-point estimation `(O + 4M + P)/6` with buffer for uncertain tasks.
