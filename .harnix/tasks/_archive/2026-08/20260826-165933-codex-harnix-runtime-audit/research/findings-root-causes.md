# Finding registry và root-cause analysis

## Current Harnix findings

| ID | Evidence class | Owner | Severity | Confidence | Frequency signal | Disposition |
|---|---|---|---|---|---|---|
| F-CUR-01 | current-code-confirmed | Harnix-core | high | high | mọi required check của Full task | select `HX-FRESHNESS-01` |
| F-CUR-02 | historical-observed + current-code-confirmed | Harnix-guidance | high | high về mechanism, medium về recurrence | 1 explicit wrong-target run | select `HX-TARGET-01` |
| F-CUR-03 | current-code-confirmed | Harnix-core | medium-high | high | toàn bộ 38 completed tasks chỉ có completion journal | select `HX-TRACE-01` |
| F-CUR-04 | current-code-confirmed + historical-correlation | Harnix-guidance/core | medium | medium-high | mọi ordinary request theo current activation text | select `HX-PREFLIGHT-01` |
| F-CUR-05 | current-code-confirmed | Harnix-core | medium | high về code, low về observed pain | evidence pass quá một giờ | defer `HX-EVIDENCE-POLICY-01` |

## `F-CUR-01` — Raw-byte planning artifacts tạo circular staleness

- Root cause: `computeVerificationInputSnapshot` tự thêm `plan.md` và `prd.md` cho mọi Full check rồi hash raw bytes. Workflow lại yêu cầu cập nhật checkbox/ghi evidence sau focused verification.
- Reproduction mechanism: bất kỳ byte change nào ở hai artifact, kể cả `[ ]`→`[x]` hoặc trailing whitespace, đổi `inputDigest`; `checks`/finish so snapshot mới với sidecar cũ và trả stale.
- Historical evidence: nhiều full-gate rerun, một immutable verification artifact còn whitespace không thể sửa mà không vô hiệu hóa evidence. History là impact signal, không phải sole proof.
- User impact: vừa hoàn tất check đã phải rerun vì bookkeeping; tăng elapsed/tool/output và làm agent khó phân biệt semantic drift với ceremony drift.
- Waste metric: exact checkbox-only recurrence chưa được host log đo trực tiếp; exposed population là mọi Full required check. Không gán con số tiết kiệm giả.
- Proposal: sidecar v2 với `planning-contract-v1`, dual-read v1 và fail-closed parser như design.
- RED tests: checkbox-only/trailing-whitespace-only không stale; AC text, check mapping, Paths hoặc body semantic stale; malformed marker fail closed; mixed v1/v2 immutable.
- Affected paths: `src/core/verification/input-freshness.ts`, `src/core/verification/check-report.ts`, `src/commands/internal-workflow.ts`, verification/task audit tests và workflow docs.
- Compatibility risk: canonicalizer quá rộng có thể che semantic change. Giới hạn normalization và explicit marker là hard acceptance.

## `F-CUR-02` — Ambient cwd thắng explicit target

- Root cause: activation/global instruction chỉ nói tìm nearest initialized ancestor/workspace root, chưa nêu trusted explicit target phải thắng ambient cwd và chưa cấm fallback.
- Historical reproduction: M04 nhận request nhắm repository bên ngoài nhưng cwd là Harnix; flow đã chạy guard/inspect ambient qua hai tool call rồi abort.
- Current confirmation: Codex/Kiro/Antigravity generated guard và project AGENTS template không có target-precedence rule.
- User impact: đọc sai task/state, có nguy cơ ghi sai repository nếu request tiếp tục; abort tạo churn và mất niềm tin.
- Frequency: một run xác nhận; impact cao nên không chờ recurrence mới fix. CLI routing simulation hiện tại chỉ chứng minh ancestor/fail-closed, không chứng minh model target selection.
- Proposal: algorithm `HX-TARGET-01`; user-authored explicit target hoặc trusted workspace context mới có authority.
- RED tests: agent fixture với ambient canary + explicit external target; uninitialized target phải zero ambient access; quoted path trong repository text không được chọn; multi-target mutation phải stop.
- Affected paths: `src/templates/harnix/activation.ts`, `src/templates/harnix/agents.ts`, three platform configurators/generated snapshots, `test/workflow/routing.test.ts`, platform/agent eval fixtures.
- Compatibility risk: false target extraction từ prose. Chỉ accept existing canonical path/repo explicitly authored; ambiguous mutation fail closed.

## `F-CUR-03` — Thiếu transition-level local observability

- Root cause: TaskRecord lưu current/final state; journal schema có checkpoint kind nhưng workflow thực tế chỉ ghi completion/cancellation/learning và summary có thể chứa prose riêng tư.
- Evidence: 38 completed tasks có 38 completion entries nhưng không có ordered transition ledger. Audit phải line-parse 288.452.362 bytes host rollout để dựng sequence.
- User impact: khó biết step nào lặp, state đổi lúc nào, recovery nào xảy ra; forensic phụ thuộc host log retention/API.
- Waste metric: 82 rollout/275,1 MiB là audit input, không đồng nghĩa Harnix tạo toàn bộ waste.
- Proposal: strict bounded metadata-only `runtime-trace.jsonl` và `harnix trace` read API; task state authoritative, trace có `partial`.
- RED tests: each legal transition emits one idempotent event; append failure leaves state valid and reports recovery; malformed/saturated file does not leak/block; no forbidden fields; active/historical query bounds.
- Affected paths: new `src/core/tasks/runtime-trace.ts`, new `src/commands/trace.ts`, workflow/resume/finish/cancel integration, CLI program, integration/safety/migration docs/tests.
- Compatibility risk: multi-file atomicity và unbounded growth. Deterministic event IDs, explicit partial recovery, 2.000-event cap và no-authority rule mitigate.

## `F-CUR-04` — Preflight ceremony lặp trước khi biết route

- Root cause: current global instruction yêu cầu mọi ordinary request inspect active task, đọc full `.harnix/workflow.md`, rồi mới classify. Stage skills lặp guard/state directives và chưa yêu cầu dùng fresh-check report để tránh rerun.
- Evidence: workflow file hiện khoảng 15 KiB; 216 compactions và 7.649 tool calls trong population. Đây là correlation; không quy toàn bộ compaction cho Harnix.
- User impact: conversational/read-only request tốn context; project request có thể cần nhiều status/check/audit reads trước stage action.
- Proposal: trusted-target first, narrow pure-conversation fast path và one-call hidden preflight; full workflow vẫn bắt buộc cho mutable/ambiguous route.
- RED tests: pure chat no project read; code review/mutation/ambiguous input không false-bypass; preflight no-write/no-network/redacted/sorted; fresh check không rerun khi inputs unchanged.
- Affected paths: `src/commands/internal-workflow.ts`, `src/cli-program.ts`, activation/AGENTS/skills, workflow/platform tests và scripted agent eval.
- Compatibility risk: false Bypass làm mất safety gate. Fast path chỉ áp dụng khi request không cần repository data hoặc mutation; default là full guard.

## `F-CUR-05` — Fixed one-hour expiry không phân loại check

- Root cause: check report đánh dấu evidence quá một giờ hoặc future-dated là stale ngay cả khi v2 input digest không đổi.
- Impact tiềm năng: user pause hoặc task dài có thể rerun deterministic local checks không cần thiết.
- Vì sao defer: external/service/manual checks có freshness theo thời gian thật; current logs chưa định lượng bao nhiêu rerun chỉ do age. Bỏ expiry sẽ làm yếu safety.
- Research cần thêm: check policy enum hoặc environment fingerprint, backward defaults, clock-skew behavior và acceptance measurement.

## Host-owned/guidance findings

### `F-HOST-01` — Auto-goal micro-turn churn

M02 có 35 auto-goal turns/224 tools; toàn main có 51 auto starts, 1.703 tools và 349,7 closed elapsed minutes. Scheduler và continuation thuộc Codex host. Harnix có thể giảm scope bằng preflight/next-stage guidance, nhưng không được claim core enforcement.

### `F-HOST-02` — Overlapping delegation scopes

M03 tạo 27 named workers và 40 guardians; final audit/code review/lifecycle/doctor scopes có overlap, một worker depth-2. Harnix có thể thử `HX-DELEGATION-01` guidance nhưng chỉ promote sau agent eval chứng minh ít overlap mà không giảm defect detection.

### `F-EXT-01` — Login/trust/manual activation

Kiro/Codex real runtime không được automation trong audit vì login/trust boundary; Antigravity behavior từng được đo riêng. Đây không phải lỗi Harnix CLI. Fake-home lifecycle vẫn pass và `installed-pending-trust` semantics phải giữ.

## Historical issues đã đóng

| ID | Historical symptom | Current disposition/evidence |
|---|---|---|
| F-FIXED-01 | migration/purge/ownership/doctor và path safety gaps | fixed qua `1.0.12`; current lifecycle/safety simulations pass |
| F-FIXED-02 | thiếu status/task history/audit/impact | implemented `1.0.13`; README và tests hiện có |
| F-FIXED-03 | thiếu resume/context explanation/check freshness | implemented `1.0.14`; current simulations pass |
| F-FIXED-04 | Codex hook dùng/migrate sai config surface | fixed `1.0.11`; fake-home lifecycle giữ conservative readiness |
| F-FIXED-05 | README/CHANGELOG hay bị bỏ sót | current project policy và docs đồng bộ; monitor, không thêm mechanism mới trong vòng này |
| F-POLICY-01 | commit xảy ra trước explicit review trong history đầu | current AGENTS contract yêu cầu proposed diff/message rồi approval; CLI simulation chỉ là contract proxy, không tuyên bố intercept Git |

Không mở lại các issue đã đóng nếu không có fresh reproduction trên version hiện tại.
