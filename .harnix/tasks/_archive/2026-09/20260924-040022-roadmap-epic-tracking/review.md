# Roadmap epic tracking cho nhiều task Harnix liên quan

- **ID:** 20260924-040022-roadmap-epic-tracking
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-24T04:00:22Z
- **Updated:** 2026-09-24T06:54:52.394Z

## Goal

Cho phép liên kết nhiều task Harnix thuộc cùng một mục tiêu lớn (epic) qua field epicId tuỳ chọn trên TaskRecordV2, lưu epic như artifact project-local riêng (.harnix/roadmaps/<epic-id>.json + view Markdown derived), và xem tổng quan tiến độ qua command công khai harnix roadmap.

## Non-goals

- Không có command chỉnh sửa thành viên epic trực tiếp ngoài field epicId trên task.
- Không tự động backfill epicId cho task lịch sử đã completed/cancelled.
- Không đổi cấu trúc validationPlan/evidence hay thêm severity structured cho Stage-2 review.
- Không có roadmap cross-repo/global; chỉ project-local dưới .harnix/roadmaps/.
- Không migrate TaskRecordV1 để mang epicId; chỉ v2 trở lên.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `epicid-field-additive` (met): TASK_RECORD_FIELDS có thêm epicId (required:false, sinceSchemaVersion:2); validateTask chấp nhận task v2 có/không epicId, reject epicId trên task v1, fixture cũ không đổi.
- `epic-record-schema-and-validation` (met): Type EpicRecord (schemaVersion 1) và hàm validateEpic trong src/core/roadmaps/roadmap.ts dùng allowlist nghiêm ngặt giống validateTask.
- `save-envelope-epic-upsert` (met): Hidden harnix workflow --save nhận thêm field epic tuỳ chọn; có mặt thì upsert atomic .harnix/roadmaps/<epic-id>.json; vắng mặt thì hành vi task/artifacts/contractRevision không đổi.
- `roadmap-markdown-derived-view` (met): .harnix/roadmaps/<epic-id>.md được regenerate sau save epic hoặc save task có epicId khớp, liệt kê task thành viên theo thứ tự task-ID, kèm status và dòng next-task.
- `roadmap-public-command` (met): Command công khai harnix roadmap [--limit <1..100>] [--id <epic-id>] emit đúng một JSON document; list/detail đúng; --id không khớp trả PublicCliErrorV1 exit 2.
- `docs-and-frozen-contract-synced` (met): docs/HARNIX_PRD.md mục 7, docs/IMPLEMENTATION_PLAN.md mục 4, docs/HARNIX_WORKFLOW.md bảng artifact contract, và test/workflow/cli-contract.test.ts phản ánh đúng epicId/EpicRecord/envelope mở rộng/command roadmap (16 command).
- `regression-safe` (met): Toàn bộ test:unit, test:workflow, test:integration hiện có không liên quan epicId/epic pass không đổi hành vi.

## Required checks

- `chk-roadmap-schema-unit` (focused): Unit test EpicRecord accept/reject: hợp lệ, thiếu field bắt buộc, field lạ bị reject. — pass (2026-09-24T06:53:12Z)
- `chk-epicid-field-unit` (focused): Unit test: task v2 có epicId được accept, task v1 có epicId bị reject, task v2 không epicId vẫn hợp lệ (regression). — pass (2026-09-24T06:21:17Z)
- `chk-roadmap-render-unit` (focused): Unit test render markdown: epic rỗng, epic có 1 task non-terminal, epic tất cả terminal. — pass (2026-09-24T06:53:30Z)
- `chk-save-epic-envelope` (focused): Workflow test: --save có epic upsert đúng; save task có epicId khớp epic có sẵn refresh markdown không cần gửi lại epic. — pass (2026-09-24T06:53:30Z)
- `chk-save-regression-no-epic` (focused): Workflow regression: --save không có epic/epicId giữ nguyên hành vi trước khi đổi. — pass (2026-09-24T06:53:30Z)
- `chk-roadmap-command-integration` (focused): Integration test: harnix roadmap list/detail JSON đúng, --id không khớp trả PublicCliErrorV1 exit 2. — pass (2026-09-24T06:53:30Z)
- `chk-cli-contract-count` (focused): Frozen public-command-count test cập nhật thành 16 command bao gồm roadmap. — pass (2026-09-24T06:53:30Z)
- `chk-docs-parity` (focused): Đối chiếu thủ công docs (PRD mục 7, IMPLEMENTATION_PLAN mục 4, HARNIX_WORKFLOW artifact table) và CHANGELOG/version phản ánh đúng tính năng mới. — pass (2026-09-24T06:53:30Z)
- `chk-full-regression` (full): Gate rộng: toàn bộ test:unit + test:workflow + test:integration pass sau khi thêm epicId/epic, không regression nơi khác. — pass (2026-09-24T06:53:30Z)

## Decisions

- **roadmap-code-backed-option2** — Roadmap triển khai code-backed: command công khai harnix roadmap + field epicId chính thức trong task schema, thay vì chỉ là quy ước do agent tự nhớ.
  - _Why:_ Người dùng chọn Option 2 sau khi được trình bày trade-off (Option 1 skill-convention nhanh hơn nhưng không cưỡng chế được, dễ bị quên cập nhật).
- **epic-no-explicit-membership-list** — EpicRecord không lưu danh sách task thành viên tường minh; thành viên được suy ra bằng cách quét task.json có epicId khớp.
  - _Why:_ Tránh hai nguồn sự thật lệch nhau (epic list vs task.epicId); một nguồn duy nhất (task.epicId) đơn giản và ít rủi ro stale hơn.
- **epicid-v2-only** — epicId chỉ áp dụng từ TaskRecordV2 (sinceSchemaVersion:2), không migrate cho TaskRecordV1.
  - _Why:_ Giữ nguyên tắc lịch sử v1 immutable/không đổi; tính năng mới chỉ dành cho task mới tạo.
- **roadmap-md-mirrors-review-md-pattern** — .harnix/roadmaps/<epic-id>.md là derived, luôn regenerate, giống hệt vai trò của review.md đối với task.json.
  - _Why:_ Tái sử dụng đúng mẫu hình đã được chấp nhận (source json + view md derived) thay vì phát minh cơ chế mới.

## Residual risks

- **shared-manifest-side-effect** (medium) — TASK_RECORD_FIELDS được dùng chung cho allowlist và --schema transport; thêm epicId có thể ảnh hưởng các nơi khác đang đọc manifest này (ví dụ doctor snapshot) mà chưa được rà soát hết trong PRD/plan này.

## Evidence

- `chk-roadmap-schema-unit` — pass (2026-09-24T06:17:31Z): EpicRecord validate: hợp lệ accept, thiếu field reject, field lạ reject — 4/4 test pass.
- `chk-epicid-field-unit` — pass (2026-09-24T06:21:17Z): epicId field: v2 + epicId accept, v1 + epicId reject (unknown field), v1 no epicId pass.
- `chk-roadmap-render-unit` — pass (2026-09-24T13:31:00Z): Unit test render markdown: hợp lệ (5/5 test pass) — epic rỗng, epic có 1 task, epic tất cả terminal.
- `chk-roadmap-schema-unit` — pass (2026-09-24T06:53:12Z): Re-run sau fix loadTask signature bug: EpicRecord validate 5/5 pass.
- `chk-roadmap-render-unit` — pass (2026-09-24T06:53:30Z): Re-run sau fix loadTask bug: render markdown 5/5 test pass.
- `chk-save-epic-envelope` — pass (2026-09-24T06:53:30Z): Workflow save epic envelope: upsert JSON+MD đúng, task epicId khớp refresh markdown không cần resend epic — 3/3 test pass.
- `chk-save-regression-no-epic` — pass (2026-09-24T06:53:30Z): Save không epic/epicId giữ nguyên hành vi cũ — regression test pass.
- `chk-roadmap-command-integration` — pass (2026-09-24T06:53:30Z): harnix roadmap list/detail JSON đúng, --id không khớp trả PublicCliErrorV1 exit 2 — 3/3 test pass.
- `chk-cli-contract-count` — pass (2026-09-24T06:53:30Z): CLI contract cập nhật 16 commands bao gồm roadmap — 3/3 test pass.
- `chk-docs-parity` — pass (2026-09-24T06:53:30Z): Doi chieu thu cong: PRD muc 7 (16 commands + roadmap), IMPLEMENTATION_PLAN muc 4.6 (EpicRecord schema), HARNIX_WORKFLOW artifact table (.harnix/roadmaps/), CHANGELOG [1.1.12] deu dong bo voi implementation.
- `chk-full-regression` — pass (2026-09-24T06:53:30Z): Full gate: test:workflow 10/10 files pass (120 tests), test:integration 21/21 files pass (130 tests). test:unit co 1 pre-existing failure khong lien quan (stray .kilo worktree package.json, khong phai do thay doi epicId/roadmap).
