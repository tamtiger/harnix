# Kế hoạch: ready-gate-content-checks

Thứ tự: RED (test thất bại đúng lý do) → GREEN tối thiểu → chạy test hẹp → tick `[x]`. Test dựng task bằng `test/support/builders.ts` và `workflow-fixtures.ts`; mỗi file test ≤ 400 dòng; mỗi file nguồn ≤ 300 dòng code. Đường dẫn trong mô tả dưới đây là điểm chạm chính.

- [x] S1 Bộ quét nội dung (ac-1)
- [x] S2 Kiểm tra tiêu chí có trong plan (ac-2)
- [x] S3 Kiểm tra check chuyên biệt (ac-3)
- [x] S4 Nối vào cổng ready, chỉ khi đi vào ready/ready (ac-1, ac-2, ac-3, ac-6)
- [x] S5 Cờ `--reviewed` và checklist trong lỗi và `--dry-run` (ac-4)
- [x] S6 Sửa fixture dùng chung và test hiện có (ac-6)
- [x] S7 Tài liệu, skill, schema, golden (ac-5)
- [x] S8 Hoàn tất: bump `2.2.0-dev.1`, CHANGELOG, format/lint/typecheck, đồng bộ `.harnix/workflow.md`

## S1 — Bộ quét nội dung

- Tệp mới `src/core/workflow/ready-content.ts` (thuần, không I/O): `scanPlaceholders(file, text)` trả `{ issues, advisories }`.
- RED trong `test/unit/core/workflow/ready-content.test.ts`: `TBD`, `TODO`, `FIXME`, `???`, `<placeholder>` ngoài code → issue với đúng số dòng; cùng token trong inline code và trong code fence ``` và ~~~ → bỏ qua; chữ thường `todo` không bị bắt; mỗi cụm mềm (EN và VI, có và không dấu) → advisory; văn bản sạch → rỗng.
- GREEN: bỏ code fence và inline code (giữ số dòng bằng cách thay bằng khoảng trắng), regex cho token cứng, chuẩn hóa NFD bỏ dấu và thường hóa cho cụm mềm; danh sách cụm là hằng số.

## S2 — Tiêu chí có trong plan

- RED (cùng file test): `missingCriteriaInPlan(task, plan)` trả danh sách id thiếu; `ac-1` không khớp trong `ac-10` hay `xac-1`; criterion `waived` được bỏ qua; khớp phân biệt hoa thường.
- GREEN trong `ready-content.ts`: regex `(?<![A-Za-z0-9-])<id>(?![A-Za-z0-9-])` với id được escape.

## S3 — Check chuyên biệt

- RED: `criteriaWithoutFocusedCheck(task)`: tiêu chí chỉ nằm trong check `full` → thiếu; có check `focused` required → đủ; check `focused` nhưng `required: false` → thiếu; tiêu chí waived bỏ qua. Task Lite khởi tạo bằng `--init` (check-1 focused) → đủ.
- GREEN trong `ready-content.ts`.

## S4 — Nối vào cổng ready

- RED trong `test/unit/core/workflow/ready.test.ts`:
  - Full vào ready/ready với plan chứa `TBD` → `collectReadyIssues` có issue placeholder; Lite không bị ảnh hưởng.
  - Full thiếu id tiêu chí trong plan → issue; Full tiêu chí chỉ có check full → issue; Lite → advisory trong `inspectReadyConditions`.
  - Task đã ở `ready/ready` (existing) với plan yếu → lưu bằng `--save` không bị chặn (ac-6); `ready/replan` → vào lại `ready/ready` bị kiểm.
- GREEN: `ready.ts` thêm tham số `entering: boolean` cho `collectReadyIssues`/`assertReadyRequirements`/`inspectReadyConditions`; `save.ts` truyền `existing?.checkpoint !== "ready"`; `transition.ts` dry-run truyền `task.checkpoint !== "ready"`. Đọc `prd.md`/`plan.md` từ `artifacts` hoặc đĩa (tái dùng logic của `fullArtifactIssues`). `fullArtifactIssues` chuyển sang tệp mới `src/core/workflow/ready-artifacts.ts` ngay trong slice này để `ready.ts` giữ dưới 300 dòng code.

## S5 — Cờ `--reviewed`, checklist, dry-run

- Tệp mới `src/core/workflow/ready-review.ts`: `READY_REVIEW_CHECKLIST` (12 dòng rút gọn bằng tiếng Anh khớp reference ready-review) và `reviewRequiredMessage(issues, advisories)`.
- RED:
  - `test/unit/core/workflow/transition.test.ts`: Full → ready/ready không có `reviewed` ném lỗi chứa `--reviewed` và ít nhất 12 dòng checklist; có `reviewed: true` thì qua; Lite không cần; các transition khác (in_progress, verifying…) không cần; dry-run trả `reviewChecklist` (Full, đích ready) và không cần cờ.
  - `test/integration/commands/workflow-flags.test.ts`: `--reviewed` với hành động khác ném `--reviewed requires workflow --transition.`; `--transition ready/ready --reviewed` chạy end-to-end qua CLI; thiếu cờ thì mã thoát khác 0 và stderr có checklist.
- GREEN: `transitionWorkflow(root, status, checkpoint, injectedNow, dryRun, options?: { reviewed?: boolean })`; `workflow-command.ts` thêm `--reviewed`; `workflow-flags.ts` thêm `reviewed` vào `WorkflowFlags` và `FLAG_OWNERS` (actions `transition`); `workflow-handlers.ts` truyền cờ; `schema.ts` cập nhật mô tả `--transition`.
- Trường mới `reviewChecklist?: string[]` của `DryRunTransitionResult` là additive.

## S6 — Fixture và test hiện có

- Chạy `pnpm exec vitest run --coverage.enabled=false` toàn bộ để tìm test dùng task Full đi tới ready mà không đạt cổng mới (plan thiếu id, thiếu check focused, token placeholder).
- Sửa trong `test/support/workflow-fixtures.ts` và `builders.ts` (plan mặc định chứa id tiêu chí, có check focused); không nới cổng và không sửa test để bỏ qua kiểm tra.
- Không giảm ngưỡng coverage; thêm test mới giữ coverage không giảm.

## S7 — Tài liệu, skill, schema, golden

- `src/templates/harnix/workflow.md` (mục Gates → Ready, cookbook `--transition ready/ready --reviewed`), `AGENTS.md` (mục quy trình ready), `src/skills/harnix-plan/SKILL.md` và `references/ready-review.md` (nêu cổng máy kiểm tra gì và `--reviewed`), `docs/HARNIX_WORKFLOW.md` và `docs/IMPLEMENTATION_PLAN.md` (phần cổng ready; không đổi field đóng băng), `src/core/workflow/schema.ts`.
- Test parity trong `test/workflow/docs-task-contract.test.ts` (tài liệu nhắc `--reviewed`, placeholder, check focused) và rà `instruction-budget.test.ts`.
- Golden: `HARNIX_UPDATE_GOLDEN=1 pnpm exec vitest run test/workflow/behavior-snapshot.test.ts` chỉ sau khi xem diff gồm đúng mô tả `--transition`.

## S8 — Hoàn tất

- `pnpm version:sync 2.2.0-dev.1 --summary ... --kind added`; đồng bộ `.harnix/workflow.md` từ template và hash trong `.harnix/.template-hashes.json` (chuẩn hóa LF); `pnpm format`, `pnpm lint`, `pnpm typecheck`.
- `--run-check`: `check-ready-gate`, `check-docs`, rồi `check-suite` cuối cùng; đánh dấu tiêu chí `met`; finish.

## Điểm cần lưu ý khi làm

- Kiểm tra mới chỉ áp dụng lúc vào ready/ready; không đụng tới đường lưu của task đã ở ready (quan trọng với Task 2 đang ở ready).
- `plan.md` của chính task này nhắc các token cấm chỉ trong code fence hoặc inline code, vì cổng sẽ quét nó khi áp dụng cho các task sau.
- Không dùng cụm hoãn quyết định trong tài liệu này; mọi lựa chọn đã chốt ở PRD.
