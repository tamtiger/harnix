# Kế hoạch triển khai — Bốn capability harness

## Checklist implementation

- [x] `CAP01-S1` — RED sidecar/canonicalization/binding fixtures.
- [x] `CAP01-S2` — GREEN selection snapshot creation, validation và atomic persistence.
- [x] `CAP01-S3` — RED→GREEN content + selection drift aggregation và legacy precedence.
- [x] `CAP01-S4` — RED→GREEN inspect/Continue/hook read-only, no repo-map I/O.
- [x] `CAP02-S1` — RED ready-trace grammar, coverage và diagnostic fixtures.
- [x] `CAP02-S2` — GREEN bounded deterministic parser/auditor.
- [x] `CAP02-S3` — RED→GREEN hidden audit action và Full ready enforcement/legacy matrix.
- [x] `CAP02-S4` — Brainstorm/Continue/template behavior và bootstrap compatibility.
- [x] `CAP03-S1` — RED malicious/benign learning corpus và boundary escape fixtures.
- [x] `CAP03-S2` — GREEN analyzer/hash/serialized renderer/review metadata.
- [x] `CAP03-S3` — RED→GREEN Doctor category aggregation, redaction và no-fix.
- [x] `CAP03-S4` — Journal/memory compatibility, Unicode và release secret scans.
- [x] `CAP04-S1` — RED safe import resolver, ambiguity, traversal và cap fixtures.
- [x] `CAP04-S2` — GREEN bounded directed graph/reverse graph builder.
- [x] `CAP04-S3` — RED→GREEN ranker v2 expansion/bonus/reasons và v1 parity.
- [x] `CAP04-S4` — Golden ranking eval, CLI integration, safety và resource bounds.
- [x] `CROSS-S1` — Đồng bộ product/workflow/research/mapping/skills/templates, bump patch và changelog.
- [x] `CROSS-S2` — Compliance review rồi quality/security review; rerun focused/broader gates.
- [x] `CROSS-S3` — Exact acceptance mục 11, fresh digests/evidence và finish persistence.

Tất cả checklist item thuộc active TaskRecord. Thứ tự bắt buộc là CAP-01 → CAP-02 → CAP-03 → CAP-04 → cross gates; không chuyển `verifying` giữa các CAP.

## Slice trace

### Slice `CAP01-S1`
Criteria: `legacy-safety-compatibility`, `selection-snapshot-contract`
Checks: `selection-contract-focused`
Paths: `src/core/context/**`, `src/core/repo-map/**`, `test/unit/context.test.ts`, `test/unit/repo-map/service.test.ts`

Viết RED cho hash canonical bất biến theo input order; task/config/guide/version/inventory/result đổi làm digest/reason đổi; reject corrupt/future/task mismatch/result mismatch/unsafe path; failed write giữ previous valid artifact.

### Slice `CAP01-S2`
Criteria: `selection-snapshot-contract`
Checks: `selection-contract-focused`
Paths: `src/commands/internal-workflow.ts`, `src/core/context/selection-freshness.ts`, `src/core/tasks/task.ts`

Tạo module snapshot, mở rộng typed `TaskArtifacts.context`, derive signals ở command layer, validate cache/manifest trước write và persist `context.json` + sidecar atomically/safe-resolved.

### Slice `CAP01-S3`
Criteria: `legacy-safety-compatibility`, `selection-drift-inspection`
Checks: `selection-workflow-focused`
Paths: `src/core/context/context.ts`, `src/core/context/selection-freshness.ts`, `src/core/workflow.ts`, `test/workflow/internal-workflow.test.ts`

Kết hợp content/selection channels; `selectionChanges` always-present/sorted; khóa precedence table và logical error redaction.

### Slice `CAP01-S4`
Criteria: `legacy-safety-compatibility`, `selection-drift-inspection`
Checks: `selection-workflow-focused`
Paths: `src/commands/internal-context.ts`, `src/commands/internal-workflow.ts`, `src/skills/harnix-continue/SKILL.md`, `test/workflow/internal-context.test.ts`, `test/workflow/routing.test.ts`

Project drift qua inspect/continue, stale bắt buộc replan. Spy tests chứng minh hook ngoài project no-op và không gọi repo-map/sidecar; bounded caps giữ nguyên.

### Slice `CAP02-S1`
Criteria: `ready-trace-contract`
Checks: `ready-trace-focused`
Paths: `src/core/tasks/ready-trace.ts`, `test/unit/ready-trace.test.ts`

RED table gồm valid, missing/duplicate/unknown criterion/slice/check, orphan coverage, unsafe path, unresolved-marker, code fence, size/line/slice/ref limits và diagnostic ordering.

### Slice `CAP02-S2`
Criteria: `ready-trace-contract`
Checks: `ready-trace-focused`
Paths: `src/core/tasks/ready-trace.ts`, `src/core/tasks/task.ts`

Implement line-state parser, exact grammar/report enums và all-diagnostics stable sort; không Markdown dependency/execution/body echo.

### Slice `CAP02-S3`
Criteria: `ready-trace-contract`, `ready-trace-enforcement`
Checks: `ready-trace-focused`
Paths: `src/cli-program.ts`, `src/commands/internal-workflow.ts`, `test/migration/**`, `test/workflow/internal-workflow.test.ts`

Thêm exclusive hidden `--audit-ready`, cùng auditor trong ready gate; tests new Full/Lite/existing ready/completed/unfinished replan, read-only và JSON contract.

### Slice `CAP02-S4`
Criteria: `ready-trace-enforcement`
Checks: `ready-trace-focused`
Paths: `src/skills/harnix-brainstorm/SKILL.md`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `test/workflow/skill-sources.test.ts`, `test/workflow/templates.test.ts`

Cập nhật source skills/templates và eval: audit trước ready, không LLM judge, không auto rewrite, không approval gate thứ hai; active bootstrap task không retroactive fail.

### Slice `CAP03-S1`
Criteria: `learning-doctor-safety`, `learning-review-boundary`
Checks: `learning-guard-focused`
Paths: `test/unit/learning-safety.test.ts`, `test/unit/journal.test.ts`

RED corpus gồm fake boundary, Markdown fence, override phrase, shell line, URL, credential canary, oversized, Unicode/multiline benign; assert no raw authority block hoặc value leak.

### Slice `CAP03-S2`
Criteria: `learning-review-boundary`
Checks: `learning-guard-focused`
Paths: `src/core/journal/learning-safety.ts`, `src/core/journal/promotion.ts`, `test/unit/learning-safety.test.ts`

Implement bounded categories, exact hash, sorted metadata và JSON-string renderer; giữ eligibility/LearningCandidate v1, no spec write.

### Slice `CAP03-S3`
Criteria: `learning-doctor-safety`
Checks: `learning-guard-focused`
Paths: `src/commands/doctor.ts`, `src/core/journal/journal.ts`, `test/integration/doctor.test.ts`

Aggregate one redacted warning per journal file, `fixable:false`; Doctor fix không handler/write. Malformed historical line vẫn skip/report theo semantics hiện có.

### Slice `CAP03-S4`
Criteria: `learning-doctor-safety`, `learning-review-boundary`
Checks: `learning-guard-focused`
Paths: `test/integration/memory.test.ts`, `test/safety/release-scanner.test.ts`, `test/unit/journal.test.ts`

Prove memory/journal query compatibility, benign round-trip, deterministic proposal/Doctor order và no secret/machine path in output/tarball fixtures.

### Slice `CAP04-S1`
Criteria: `repo-map-graph-ranking`, `repo-map-ranking-compatibility`
Checks: `repo-map-ranking-focused`
Paths: `src/core/repo-map/graph.ts`, `test/unit/repo-map/graph-ranking.test.ts`

RED exact/extension/index resolution, bare/external/absolute/traversal omission, >4 ambiguity, node/edge/candidate/depth caps và deterministic truncation.

### Slice `CAP04-S2`
Criteria: `repo-map-graph-ranking`
Checks: `repo-map-ranking-focused`
Paths: `src/core/repo-map/graph.ts`, `src/core/repo-map/types.ts`

Implement sorted adjacency/reverse adjacency and capped resolver over validated records; no filesystem/source/network/persisted graph.

### Slice `CAP04-S3`
Criteria: `repo-map-graph-ranking`, `repo-map-ranking-compatibility`
Checks: `repo-map-ranking-focused`
Paths: `src/core/repo-map/search.ts`, `src/core/repo-map/service.ts`, `test/unit/repo-map/graph-ranking.test.ts`, `test/unit/repo-map/service.test.ts`

Giữ ranker v1 golden; default v2 expands seeds depth 2, applies exact capped bonus/reasons, score/path tie-break và public limit.

### Slice `CAP04-S4`
Criteria: `repo-map-ranking-compatibility`
Checks: `repo-map-ranking-focused`
Paths: `test/integration/repo-map/incremental.test.ts`, `test/integration/repo-map/internal.test.ts`, `test/safety/**`, `test/unit/repo-map/graph-ranking.test.ts`

Dual v1/v2 eval: không giảm existing query và cải thiện ít nhất hai dependency query; CLI/cache JSON unchanged; full safety/limits/footprint/cold-path regressions.

### Slice `CROSS-S1`
Criteria: `program-docs-release`
Checks: `docs-release-focused`, `program-quality-security`
Paths: `CHANGELOG.md`, `docs/**`, `package.json`, `src/skills/**`, `src/templates/**`

Sau bốn CAP green, cập nhật frozen contracts/research mapping và canonical prose. Dùng documented TDD exception cho docs/generated parity với skill/template tests, build/typecheck/release scan. Bump patch từ version thực tế đúng một lần và update changelog trước completion.

### Slice `CROSS-S2`
Criteria: `learning-doctor-safety`, `learning-review-boundary`, `program-docs-release`, `ready-trace-contract`, `ready-trace-enforcement`, `repo-map-graph-ranking`, `repo-map-ranking-compatibility`, `verification`
Checks: `program-quality-security`
Paths: `docs/**`, `scripts/**`, `src/**`, `test/**`

Compliance review kiểm scope/frozen contracts/compatibility/privacy/no-I/O/trace; sửa finding bằng regression test. Sau đó quality/security review kiểm atomicity, parser bounds, injection boundary, graph exhaustion, maintainability. Rerun mọi focused check sau sửa.

### Slice `CROSS-S3`
Criteria: `legacy-safety-compatibility`, `program-docs-release`, `selection-drift-inspection`, `selection-snapshot-contract`, `verification`
Checks: `exact-acceptance`
Paths: `CHANGELOG.md`, `docs/**`, `package.json`, `pnpm-lock.yaml`, `scripts/**`, `src/**`, `test/**`

Snapshot each required check, persist fresh passing evidence/digest, mark criteria met/waived đúng contract, rồi chạy exact acceptance và finish only khi output/exit code mới green.

## Focused commands

```text
pnpm exec vitest run test/unit/context.test.ts test/unit/repo-map/service.test.ts
pnpm exec vitest run test/workflow/internal-workflow.test.ts test/workflow/internal-context.test.ts test/workflow/routing.test.ts test/workflow/skill-sources.test.ts test/safety
pnpm exec vitest run test/unit/ready-trace.test.ts test/workflow/internal-workflow.test.ts test/workflow/skill-sources.test.ts test/workflow/templates.test.ts test/migration test/safety
pnpm exec vitest run test/unit/learning-safety.test.ts test/unit/journal.test.ts test/integration/memory.test.ts test/integration/doctor.test.ts test/safety/release-scanner.test.ts
pnpm exec vitest run test/unit/repo-map/graph-ranking.test.ts test/unit/repo-map/service.test.ts test/integration/repo-map/incremental.test.ts test/integration/repo-map/internal.test.ts test/safety
```

## Broader gates

```text
pnpm build
pnpm lint
pnpm typecheck
pnpm test:workflow
pnpm test:safety
pnpm test:integration
pnpm test:unit
pnpm scan:release
```

## Exact acceptance

```text
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:acceptance
pnpm pack:check
pnpm smoke:tarball
pnpm measure:init
pnpm measure:footprint
pnpm scan:release
git diff --check
```

## TDD, preservation và stop conditions

- Mỗi behavior slice ghi RED output đúng failure trước production edit, rồi GREEN nhỏ nhất và refactor khi green.
- Sau ba failed hypotheses cùng symptom, dừng và replan/debug theo workflow.
- Giữ nguyên task research/journal user-owned đang dirty; không reset/delete/overwrite unrelated changes.
- Không chạm real user home/network; global tests dùng injected fake homes.
- Không commit/branch/worktree/push/publish/PR.
- Không claim CAP hoặc task complete từ stale/partial output; không chuyển verifying cho đến khi 16 CAP slices green.
