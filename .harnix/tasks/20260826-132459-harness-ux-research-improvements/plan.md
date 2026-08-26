# Plan: Research harness và cải tiến UX theo bằng chứng

- [x] `UPSTREAM-REVALIDATION` — Revalidate frozen/current Trellis, ECC, Superpowers và ghi feature delta có nguồn.
- [x] `LANDSCAPE-EVIDENCE` — Discovery, shortlist và deep-dive harness landscape cùng real-world UX evidence.
- [x] `CAPABILITY-SELECTION` — Tái hiện gap Harnix, chấm điểm và chốt batch P0/P1 coherent.
- [x] `PROVENANCE-CONTRACT` — Thiết lập mapping bắt buộc và deterministic provenance completeness regression.
- [x] `IMPLEMENTATION-BATCH` — Triển khai batch status/provenance ban đầu bằng RED–GREEN–REFACTOR.
- [x] `STATUS-OBSERVABILITY` — Thêm public bounded status và deterministic next-action/attention bằng TDD.
- [x] `REPLAN-REENTRY` — Sửa guarded ready re-entry để task mở rộng scope không mắc kẹt ở replan.
- [x] `TASK-INDEX` — Thêm public bounded resilient task index bằng TDD.
- [x] `REPO-IMPACT` — Thêm exact-path dependency impact từ repo-map cache bằng TDD.
- [x] `TASK-AUDIT` — Thêm public deterministic readiness/completion audit bằng TDD.
- [x] `DOCS-RELEASE` — Đồng bộ provenance/docs/version/CHANGELOG, review và chạy full release gates.

### Slice `UPSTREAM-REVALIDATION`

Criteria: `ac-upstream-revalidation`
Checks: `research-source-traceability`
Paths: `docs/UPSTREAM_BASELINE.md` `docs/UPSTREAM_MAPPING.md` `docs/HARNESS_RESEARCH.md` `.harnix/tasks/20260826-132459-harness-ux-research-improvements/research/upstream-revalidation.md`

Đối chiếu frozen refs với current branch/release, ghi ngày, license, feature delta, issue/release evidence và phần đã có/chưa có trong Harnix. Không thêm remote hoặc vendored checkout vào repository.

### Slice `LANDSCAPE-EVIDENCE`

Criteria: `ac-landscape-evidence`
Checks: `research-source-traceability`
Paths: `.harnix/tasks/20260826-132459-harness-ux-research-improvements/research/harness-landscape.md` `.harnix/tasks/20260826-132459-harness-ux-research-improvements/research/real-world-ux-evidence.md`

Dùng current primary sources, tiêu chí top không phụ thuộc stars, shortlist 8–12 và deep-dive tối thiểu 5. Mỗi apply candidate cần hai lớp evidence, gồm tín hiệu sử dụng thực tế.

### Slice `CAPABILITY-SELECTION`

Criteria: `ac-capability-selection` `ac-product-boundaries`
Checks: `product-boundary-safety` `research-source-traceability`
Paths: `docs/HARNIX_PRD.md` `docs/HARNIX_WORKFLOW.md` `docs/IMPLEMENTATION_PLAN.md` `.harnix/tasks/20260826-132459-harness-ux-research-improvements/research/capability-decision-matrix.md`

Tái hiện gap trong Harnix, xác định metric trước/sau, chấm điểm và chọn một batch coherent có rollback/test path; defer/reject phần không đủ evidence hoặc phá boundary.

### Slice `PROVENANCE-CONTRACT`

Criteria: `ac-provenance-completeness`
Checks: `provenance-completeness` `provenance-registry-contract`
Paths: `docs/HARNESS_RESEARCH.md` `docs/UPSTREAM_BASELINE.md` `docs/UPSTREAM_MAPPING.md` `NOTICE` `test/workflow/provenance.test.ts`

Thêm deterministic regression buộc implemented feature mapping có nguồn/ref/date/license/evidence/adaptation/code/test/status và mọi target path tồn tại; cập nhật NOTICE/baseline chỉ khi nghĩa vụ nguồn yêu cầu.

### Slice `IMPLEMENTATION-BATCH`

Criteria: `ac-implementation-quality` `ac-product-boundaries`
Checks: `acceptance-suite` `product-boundary-safety` `static-quality`
Paths: `src/**` `test/**`

Sau research, bổ sung criterion/check mới cho từng feature mà không sửa obligation đã frozen; persist replan/ready trace, rồi observed RED → minimal GREEN → refactor và focused verification bằng fake repositories/homes.

### Slice `DOCS-RELEASE`

Criteria: `ac-docs-release` `ac-implementation-quality` `ac-product-boundaries` `ac-provenance-completeness`
Checks: `acceptance-suite` `provenance-completeness` `release-gates` `static-quality` `version-docs-sync`
Paths: `.harnix/.template-hashes.json` `CHANGELOG.md` `README.md` `docs/**` `package.json` `scripts/**` `src/skills/**` `test/**`

Chạy compliance trước quality/security review, xử lý mọi finding, tăng patch 1.0.13, đồng bộ canonical skill/self-host metadata và chạy exact acceptance sequence trước finish. Không commit/push.
### Slice `STATUS-OBSERVABILITY`

Criteria: `ac-status-observability` `ac-status-safety`
Checks: `status-contract`
Paths: `docs/HARNIX_PRD.md` `src/cli-program.ts` `src/commands/status.ts` `src/core/status.ts` `test/integration/status.test.ts` `test/unit/status.test.ts` `test/workflow/cli-contract.test.ts`

Viết failing tests cho exact JSON shape, evidence freshness và action precedence; sau đó thêm pure projection và public wrapper nhỏ nhất. Integration dùng fake initialized repository, injected clock, snapshot cây trước/sau và giới hạn payload; không đọc profile thật hoặc gọi network.

### Slice `TASK-INDEX`

Criteria: `ac-task-index` `ac-implementation-quality`
Checks: `task-index-contract`
Paths: `docs/HARNIX_PRD.md` `src/cli-program.ts` `src/commands/tasks.ts` `src/core/tasks/task-index.ts` `test/integration/tasks.test.ts` `test/unit/task-index.test.ts` `test/workflow/cli-contract.test.ts`

Viết failing tests cho schema/filter/order/scan cap, active pin, malformed isolation, privacy và no-write; sau đó thêm core index thuần đọc cùng CLI wrapper nhỏ nhất. Không index artifact hoặc journal body. Khóa `scope=project`, `status=ready|partial`, active-resolution và summary-count precedence trước implementation.

### Slice `REPO-IMPACT`

Criteria: `ac-repo-impact` `ac-implementation-quality`
Checks: `repo-impact-contract`
Paths: `docs/HARNIX_PRD.md` `src/cli-program.ts` `src/commands/repo-map-internal.ts` `src/core/repo-map/impact.ts` `src/core/repo-map/service.ts` `src/core/repo-map/types.ts` `test/integration/repo-map/internal.test.ts` `test/unit/repo-map/impact.test.ts` `test/workflow/cli-contract.test.ts`

Viết failing tests cho exact target, reverse BFS/cycle/distance, ordering, depth/limit bounds, failure states và no-write; sau đó reuse graph/cache v1. Không refresh, scan source hoặc đổi extractor/cache contract.

### Slice `TASK-AUDIT`

Criteria: `ac-task-audit` `ac-implementation-quality`
Checks: `task-audit-contract`
Paths: `docs/HARNIX_PRD.md` `src/cli-program.ts` `src/commands/audit.ts` `src/core/tasks/task-audit.ts` `test/integration/audit.test.ts` `test/unit/task-audit.test.ts` `test/workflow/cli-contract.test.ts`

Viết failing tests cho no-active, Lite/Full, artifact-unavailable, criterion/check IDs, v2 freshness, privacy, payload và no-write; sau đó compose ready-trace với required-check evaluator. Không heuristic recommendation, execution, fix hoặc transition. Khóa exact nested fields và completion-ready criterion partition trước implementation.


### Slice `REPLAN-REENTRY`

Criteria: `ac-replan-reentry` `ac-implementation-quality`
Checks: `replan-reentry-contract`
Paths: `docs/HARNIX_WORKFLOW.md` `src/commands/internal-workflow.ts` `src/core/tasks/task.ts` `src/core/workflow.ts` `src/skills/harnix-brainstorm/SKILL.md` `src/skills/harnix-continue/SKILL.md` `src/skills/harnix-implement/SKILL.md` `test/workflow/internal-workflow.test.ts` `test/workflow/routing.test.ts` `test/workflow/skill-sources.test.ts`

Thêm regression quan sát fail cho `in_progress|verifying/replan -> ready/ready`, xác nhận ready gate vẫn bắt buộc và non-replan backward transitions vẫn reject. Implement guarded exception tại workflow save thay vì nới generic transition table, rồi cập nhật canonical/self-host workflow guidance.
