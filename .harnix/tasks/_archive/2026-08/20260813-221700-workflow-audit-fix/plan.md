# Kế hoạch triển khai — Khắc phục các vấn đề từ workflow audit

## Checklist implementation

- [x] **S0 — Task naming và tracking:** mở rộng task-ID grammar cho kebab-case, đồng bộ validator/docs/skills và xác minh implementation checklist convention.
- [x] **S1 — Persistence RED:** thêm và quan sát đúng các regression test đang fail cho ready/finish obligations.
- [x] **S2 — Persistence GREEN:** enforce monotonic obligations và Full-ready artifact checks; refactor trong trạng thái green.
- [x] **S3 — Forced-mode diagnostic:** thêm risk-conflict reason mà không đổi explicit-mode precedence.
- [x] **S4 — Context đối kháng:** thêm untrusted-data boundary và deterministic adversarial fixtures cho ba platform surface.
- [x] **S5 — Self-host reconciliation:** refresh metadata và báo cáo metadata-only reconciliation trung thực.

## Checklist verification và hoàn tất

- [x] **S6 — Contract/compliance review:** đối chiếu PRD, workflow, frozen contracts, ownership và scope.
- [x] **S7 — Broader verification:** chạy đầy đủ focused, quality, workflow, safety, platform, acceptance, package và release gates.
- [x] **S8 — Chuẩn bị finish:** xác nhận version/changelog/self-host, liên kết fresh evidence, persist finishing và bàn giao cho canonical finish.

Quy tắc theo dõi: chỉ chuyển `[ ]` thành `[x]` khi toàn bộ work của slice và focused evidence được mô tả trong slice đó đã hoàn thành. Không dùng checkbox thay cho acceptance criteria hoặc evidence trong `task.json`.

## Baseline cần bảo toàn

Trước khi implementation, ghi lại `git status --short` và hash của các user-owned file có thể overlap. Bảo toàn các thay đổi hiện có trong `.harnix/workspace/TamNT167/journal/2026-08-13.jsonl`, `CHANGELOG.md`, `package.json`, `.harnix/tasks/20260813-214222-workflow-research-prompts/` và `docs/prompts/`. Không clean, reset, stage, commit, branch, push, publish hoặc dùng real platform profile.

## Slice 0 — Task naming và implementation tracking

Thêm RED tests vào `test/unit/task-state.test.ts` cho task ID có multi-word kebab slug và các input bị reject: uppercase, double hyphen, leading/trailing hyphen và traversal. Xác nhận RED hiện fail vì validator chỉ chấp nhận một slug token. Collision algorithm chỉ được append numeric suffix; một token chữ ở cuối vẫn là phần hợp lệ của kebab slug và không được suy diễn thành collision suffix.

Cập nhật canonical task-ID grammar và dùng chung validation logic cho TaskRecord, active pointer cùng safe task resolution. Cập nhật `docs/IMPLEMENTATION_PLAN.md`, workflow contract, `harnix-brainstorm` và `harnix-implement`: task mới dùng hyphen-separated slug; Full plan có checklist một-một với các slice; implementation chỉ check item sau focused evidence. Không đổi TaskRecord schema v1. Sau khi validator mới green, migrate riêng active task ID/folder từ legacy slug liền sang `20260813-221700-workflow-audit-fix` bằng thao tác an toàn, đồng bộ `.active` và kiểm tra không để duplicate directory.

## Slice 1 — Persistence obligations: RED

Bổ sung regression case vào `test/workflow/internal-workflow.test.ts` và focused task-state tests, yêu cầu reject các trường hợp:

- `planning -> ready` với acceptance criteria rỗng;
- `planning -> ready` không có required validation check;
- xoá hoặc đổi tên persisted criterion;
- xoá hoặc demote persisted required check;
- Full ready sau khi xoá hoặc làm rỗng `prd.md` hay `plan.md`;
- finish sau khi prior obligations bị sửa theo hướng đối kháng.

Chạy focused tests và record rằng RED fail vì các operation hiện resolve thay vì reject. Không sửa production code trước khi quan sát đúng expected failure.

## Slice 2 — Persistence obligations: GREEN và refactor

Implement invariant checks nhỏ nhất trong `src/commands/internal-workflow.ts`; chỉ đưa pure helper vào `src/core/workflow.ts` hoặc `src/core/tasks/task.ts` khi reuse thực sự làm code rõ hơn. So sánh incoming task với previously persisted task, enforce non-empty ready gates, đóng băng criterion ID/text và required-check definition, đồng thời kiểm tra lại Full artifact từ safe task directory. Clarification phải thêm obligation mới; criterion cũ chỉ đổi status/evidence hoặc dùng explicit waiver có reason. Giữ mọi write atomic và giữ evidence immutability.

Chạy focused tests sau từng behavior. Chỉ refactor phần comparison trùng lặp khi test vẫn green. Bổ sung test cho allowed additions, chuyển criterion sang `met`, explicit waiver, unchanged save và legal replan additions để fix không overconstrain workflow hợp lệ.

## Slice 3 — Forced-mode conflict diagnostic

Thêm failing routing test cho explicit Lite kết hợp `security-sensitive` và một Full-risk signal đại diện khác. Giữ Lite là selected mode và `explicit-lite` là existing reason, sau đó thêm stable conflict diagnostic nhỏ nhất. Chỉ cập nhật canonical workflow, implementation documentation và generated skill/template expectation tại nơi diagnostic contract được expose. Xác minh ordinary explicit Lite, explicit Full, heuristic Lite và heuristic Full không đổi.

## Slice 4 — Repository context boundary và adversarial fixtures

Thêm failing context fixture chứa malicious README text, comment, generated-data instruction, fake secret path, duplicate excerpt, oversized content và nested-root noise. Initial RED phải cho thấy thiếu explicit untrusted-data boundary hoặc disclosure/budget result sai, không thực thi malicious instruction.

Cập nhật `src/core/context/context.ts` và số lượng tối thiểu canonical/generated instruction surfaces để repository excerpt được phân định rõ là untrusted data. Giữ hook no-write/no-network, bảo toàn ranking, dedupe, pins và omission behavior, đồng thời tính fixed boundary vào character budget. Bổ sung parity assertion cho generated surface của Kiro, Antigravity và Codex. Ghi host-level prompt-injection resistance là chưa được xác minh trừ khi disposable-profile model evaluation thực sự được chạy.

## Slice 5 — Self-host reconciliation và truthful output

Thêm failing self-host/update regression bắt đầu với managed text hiện hành nhưng `generatorVersion` stale. Xác minh `harnix update` refresh metadata và báo metadata reconciliation mà không claim user-facing file đã được update. Implement thay đổi nhỏ nhất trong project update/managed-file path. Bảo toàn modified/deleted user-owned surfaces.

Sau khi mọi implementation change đều green, tăng package patch version và cập nhật `CHANGELOG.md`, sau đó chạy project update path để `.harnix/.template-hashes.json` ghi cùng version. Thực hiện việc này trước completion persistence.

## Slice 6 — Contract và compliance review

Review behavior theo PRD trước, sau đó tới `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, Phase 6 global setup rules, TaskRecord v1, public JSON/exit semantics và ownership boundaries. Xác nhận không có frozen field, enum, path, transition, platform, package, network hoặc Git surface mới. Chỉ cập nhật document có behavioral contract bị thay đổi.

## Slice 7 — Quality, security và broader verification

Chạy mọi command trong `task.json` theo thứ tự: focused workflow, focused context, build/lint/typecheck, workflow, safety/platform, full test/acceptance, package/tarball, rồi release measures. Đọc mọi exit code và relevant output. Persist RED và failure evidence trước đó thay vì overwrite. Bất kỳ broader failure nào cũng phải quay lại implementation/debug slice sở hữu lỗi và ngăn finishing.

## Slice 8 — Finish

Xác nhận mọi criterion đã `met` hoặc được explicit waiver kèm reason; mọi required evidence đều fresh so với source và managed-state change cuối cùng; self-host metadata khớp package version đã tăng; dirty user-owned content được bảo toàn. Persist `verifying/finishing`, sau đó dùng canonical finish operation để ghi completed state, journal, archive và chỉ clear active pointer của task này. Không thực hiện thao tác Git.
