# Plan — Audit runtime và triển khai HX-TARGET-01

- [x] `LOG-INVENTORY` — Khóa cutoff, kiểm kê và line-parse toàn bộ rollout/Harnix history liên quan.
- [x] `TIMELINE-BASELINE` — Chuẩn hóa run trace, temporal version map và baseline định lượng.
- [x] `SIMULATION-MATRIX` — Chạy 48 contract runs và 36 actual CLI runs trên 12 scenario.
- [x] `FINDING-VERIFY` — Deduplicate symptom, reproduce current mechanism và phân ownership.
- [x] `ROADMAP-DESIGN` — Chấm điểm và khóa exact contract cho selected/deferred slices.
- [x] `READY-REVIEW` — Kiểm tra arithmetic, consistency, privacy, dấu giữ chỗ và ready grammar.
## Implementation checklist — `HX-TARGET-01`

- [x] `TARGET-CONTRACT-RED` — Thêm deterministic fixture matrix và chứng minh generated surfaces hiện thiếu precedence/no-fallback clauses.
- [x] `TARGET-SURFACES-GREEN` — Tạo canonical fragment, cập nhật project/global/skill surfaces và giữ default discovery/parity xanh.
- [x] `TARGET-DOCS-PROVENANCE` — Đồng bộ canonical docs/README và ghi origin `harnix-self-audit` không overclaim upstream.
- [x] `TARGET-SELFHOST-RELEASE` — Reconcile self-host có ownership, bump patch/changelog và chạy full release gate.

### Slice `LOG-INVENTORY`

Criteria: `ac-log-coverage`, `ac-safety-privacy`

Checks: `log-coverage-quality`, `privacy-safety-quality`

Paths: `.harnix/tasks`, `.harnix/workspace`, `docs/HARNIX_WORKFLOW.md`

Đóng băng cutoff trước turn audit; dùng Codex API metadata để biết phần UI-visible, line-parse local rollout để bù giới hạn pagination, đối chiếu task/journal/sidecar. Persist alias và số đo, không persist raw prompt/output/path vật lý.

### Slice `TIMELINE-BASELINE`

Criteria: `ac-timeline-baseline`, `ac-finding-quality`

Checks: `timeline-baseline-quality`, `findings-root-cause-quality`

Paths: `.harnix/tasks`, `.harnix/workspace`, `CHANGELOG.md`, `package.json`

Map timestamp sang version era bằng Git/package timeline; chuẩn hóa mỗi main/worker/guardian run thành route-state-action-read/write-result trace. Duration thiếu ghi `unknown`; aggregate elapsed không được gọi là wall-clock effort khi worker overlap.

### Slice `SIMULATION-MATRIX`

Criteria: `ac-simulation-coverage`, `ac-safety-privacy`, `ac-timeline-baseline`

Checks: `simulation-evidence-quality`, `privacy-safety-quality`, `timeline-baseline-quality`

Paths: `docs/IMPLEMENTATION_PLAN.md`, `scripts`, `src`, `test`

Chạy routing, init, happy path, interruption, resume, context, checks, debug/replan, global lifecycle, privacy/safety, commit-policy proxy và efficiency trong disposable roots. Test-level critical scenarios lặp năm lần; actual CLI lặp ba lần mỗi scenario và thu exit/state/write signature.

### Slice `FINDING-VERIFY`

Criteria: `ac-finding-quality`, `ac-improvement-plan`

Checks: `findings-root-cause-quality`, `improvement-plan-readiness`

Paths: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `src`, `test`

Đối chiếu historical symptom với current source/test và simulation. Đóng các issue đã sửa, đưa scheduler/login/trust về đúng host owner, chỉ giữ current candidate có mechanism hoặc reproducible failure rõ ràng.

### Slice `ROADMAP-DESIGN`

Criteria: `ac-improvement-plan`, `ac-ready-quality`

Checks: `improvement-plan-readiness`, `ready-artifact-quality`

Paths: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `src`, `test`

Khóa thứ tự triển khai:

1. `HX-TARGET-01`: RED agent-routing fixtures, sửa activation/global templates, chạy routing/platform/safety gates.
2. `HX-FRESHNESS-01`: RED semantic digest + mixed-sidecar fixtures, triển khai snapshot v2 dual-read, chạy checks/workflow/migration/safety gates.
3. `HX-PREFLIGHT-01`: RED no-write/redaction/route fixtures, thêm hidden preflight và stage-skill guidance, chạy workflow/platform/agent eval.
4. `HX-TRACE-01`: RED event/recovery/saturation/privacy fixtures, thêm sidecar + public command, chạy CLI/workflow/safety/acceptance/pack gates.
5. Đánh giá `HX-DELEGATION-01` bằng agent eval riêng; chưa đạt deterministic threshold thì giữ deferred.

Mỗi task implementation phải test-first, không gộp schema-heavy freshness và trace trong cùng commit. Nếu tham khảo behavior từ harness khác, cập nhật `docs/HARNESS_RESEARCH.md`, `docs/UPSTREAM_MAPPING.md`, baseline/license khi cần ngay trong slice đó.

### Slice `READY-REVIEW`

Criteria: `ac-log-coverage`, `ac-timeline-baseline`, `ac-simulation-coverage`, `ac-finding-quality`, `ac-improvement-plan`, `ac-safety-privacy`, `ac-ready-quality`

Checks: `log-coverage-quality`, `timeline-baseline-quality`, `simulation-evidence-quality`, `findings-root-cause-quality`, `improvement-plan-readiness`, `privacy-safety-quality`, `ready-artifact-quality`

Paths: `.harnix/tasks`, `docs`, `src`, `test`

Kiểm tra `15 + 27 + 40 = 82`, byte/line/tool subtotals, `48 + 36 = 84` simulation runs, 12-scenario coverage, repeated signature, selected/deferred consistency, machine-path/secret/raw-prompt absence và exact Criteria/Checks/Paths. Persist qua hidden workflow, chạy `workflow --audit-ready`, giữ task ở `ready`, không sửa production.
### Slice `TARGET-CONTRACT-RED`

Criteria: `ac-target-authority-contract`, `ac-target-no-fallback`, `ac-target-regression-safety`

Checks: `target-contract-tests`, `target-routing-safety`

Paths: `src/templates/harnix/activation.ts`, `test/unit/activation-instructions.test.ts`, `test/workflow/routing.test.ts`

Viết RED trước cho sáu scenario. Test phải fail vì current text chưa nói explicit target thắng ambient, chưa cấm path từ untrusted content và chưa có no-fallback/multi-root rule; không tạo production parser chỉ để làm test pass.

### Slice `TARGET-SURFACES-GREEN`

Criteria: `ac-target-authority-contract`, `ac-target-no-fallback`, `ac-target-regression-safety`, `ac-target-surface-parity`

Checks: `target-contract-tests`, `target-routing-safety`

Paths: `src/configurators/antigravity.ts`, `src/configurators/codex.ts`, `src/configurators/kiro.ts`, `src/skills/harnix-*/SKILL.md`, `src/templates/harnix/activation.ts`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `test/platform/global-adapters.test.ts`, `test/workflow/skill-sources.test.ts`, `test/workflow/templates.test.ts`

Export một canonical instruction fragment và reuse trong TypeScript-rendered surfaces. Update semantic-equivalent guard trong bảy canonical skill; assert installed skill bytes vẫn identical giữa platform. Preserve context hook command, timeout, no-op và root-relative managed-file contracts.

### Slice `TARGET-DOCS-PROVENANCE`

Criteria: `ac-target-docs-provenance`, `ac-target-surface-parity`

Checks: `target-contract-tests`, `target-docs-provenance`

Paths: `README.md`, `docs/HARNESS_RESEARCH.md`, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/UPSTREAM_MAPPING.md`, `test/workflow/provenance.test.ts`

Document exact authority/precedence/failure behavior và self-audit origin. External provenance feature-ID set và `NOTICE` phải giữ nguyên nếu không dùng external behavior/content; nếu implementation quyết định adapt nguồn ngoài, dừng replan và bổ sung registry/source/license/evidence trong cùng change.

### Slice `TARGET-SELFHOST-RELEASE`

Criteria: `ac-target-regression-safety`, `ac-target-release-readiness`, `ac-target-surface-parity`

Checks: `target-contract-tests`, `target-docs-provenance`, `target-release-gate`, `target-routing-safety`

Paths: `.harnix/.template-hashes.json`, `.harnix/workflow.md`, `AGENTS.md`, `CHANGELOG.md`, `README.md`, `package.json`, `scripts/version-sync.mjs`, `src/skills/harnix-*/SKILL.md`

Reconcile `.harnix/workflow.md` chỉ khi current hash còn khớp manifest; preserve root AGENTS user-owned sections. Sau focused GREEN, chạy version sync patch + CHANGELOG, build và toàn bộ gate theo check. Check checklist item chỉ sau evidence tương ứng; không commit tự động.

## Implementation order và stop conditions

Thứ tự bắt buộc là RED → surfaces GREEN → docs/provenance → self-host/release. Nếu test cho thấy phải parse natural language, đổi hook event schema, ghi real profile hoặc thay external provenance ownership, checkpoint trở lại `replan` thay vì mở rộng ngầm. Sau khi task này hoàn tất mới tạo task riêng cho `HX-FRESHNESS-01`.

## Replan checklist — completion hardening

- [x] `SELF-REFERENCE-FRESHNESS` — RED/GREEN cho active `task.json` self-match, raw hashing task khác và post-save freshness.
- [x] `TARGET-FAIL-CLOSED-FIXTURES` — RED/GREEN cho existing/canonical safe target wording và structured scenario/canary matrix.
- [x] `COMPLETION-REVERIFY` — Đã đồng bộ docs/version/changelog và hoàn tất lượt pre-close của toàn bộ required checks/release gate; lượt final tiếp theo khóa evidence theo planning hash này.

### Slice `SELF-REFERENCE-FRESHNESS`

Criteria: `ac-verification-self-reference`

Checks: `verification-self-reference`

Paths: `src/core/verification/input-freshness.ts`, `src/commands/internal-workflow.ts`, `test/unit/verification-inputs.test.ts`, `test/workflow/internal-workflow.test.ts`, `test/integration/checks.test.ts`

Viết RED chứng minh glob match active `task.json` tạo circular digest và save pass evidence lập tức stale. GREEN loại đúng canonical active-task path khỏi raw entries, giữ task khác raw-hashed, không đổi schema/sidecar, rồi kiểm tra post-save report là `passed`.

### Slice `TARGET-FAIL-CLOSED-FIXTURES`

Criteria: `ac-target-missing-fail-closed`, `ac-target-scenario-fixtures`

Checks: `target-scenario-contract`, `target-contract-tests`, `target-routing-safety`

Paths: `src/templates/harnix/activation.ts`, `src/skills/harnix-*/SKILL.md`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `test/unit/activation-instructions.test.ts`, `test/workflow/routing.test.ts`

Viết RED cho exact existing/realpath/safety clause và structured expected action/read-set matrix. GREEN cập nhật canonical fragment cùng bảy skill/surface parity; không thêm runtime parser, public API, hook-time write hoặc external provenance.

### Slice `COMPLETION-REVERIFY`

Criteria: `ac-target-release-readiness`, `ac-verification-self-reference`, `ac-target-missing-fail-closed`, `ac-target-scenario-fixtures`

Checks: `verification-self-reference`, `target-scenario-contract`, `target-contract-tests`, `target-routing-safety`, `target-docs-provenance`, `target-release-gate`

Paths: `.harnix/.template-hashes.json`, `.harnix/workflow.md`, `AGENTS.md`, `CHANGELOG.md`, `README.md`, `docs`, `package.json`, `src`, `test`

Sau focused GREEN, tăng patch version thêm một lần cho completion hardening, đồng bộ bảy skill metadata và self-host managed artifacts, chạy compliance trước quality/security, rồi rerun đủ 13 required checks với pre/post snapshot khớp và finish trong cửa sổ một giờ.
