# [05] Thống nhất tên gọi epic và sửa renderer trang epic

- **ID:** 20260928-205803-unify-epic-naming
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:03.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/6 acceptance criteria met

## Goal

Dùng một tên epic ở mọi nơi: .harnix/roadmaps/ đổi thành .harnix/epics/; lệnh harnix roadmap [--limit] [--id] đổi thành harnix epic [--limit] (danh sách) và harnix epic <epic-id> (chi tiết, positional như harnix resume <task-id>); envelope roadmapMembers đổi thành epicMembers; src/core/roadmaps/roadmap.ts và src/commands/roadmap.ts đổi thành src/core/epics/epic.ts và src/commands/epic.ts. Giữ epicId, EpicRecord, field epic. harnix update và doctor --fix chuyển dữ liệu cũ từ .harnix/roadmaps/ sang .harnix/epics/; trước khi chuyển vẫn đọc được. Sửa 3 lỗi renderer: thiếu dòng trống trước heading Members, epic.nonGoals không được render, trang .md thiếu next task so với JSON. Bỏ hẳn tên roadmap trong 2.0.0 và ghi breaking change.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không đổi EpicRecord schema ngoài đường dẫn lưu; không đổi epicId của task.

## Acceptance criteria

- `ac-rename` (pending): Không còn tên roadmap trong src, CLI, skill, template và docs hiện hành (trừ ghi chú migrate và CHANGELOG).
- `ac-cli-epic` (pending): harnix epic trả danh sách, harnix epic <epic-id> trả chi tiết kèm next task; id sai trả lỗi JSON exit 2; cli-contract.test được cập nhật.
- `ac-migrate-epics` (pending): update và doctor --fix chuyển .harnix/roadmaps/*.json sang .harnix/epics/ không mất dữ liệu, idempotent; trước khi chuyển vẫn đọc được.
- `ac-epic-members` (pending): Envelope hidden --save nhận epicMembers; skill và workflow.md dùng tên mới.
- `ac-epic-render` (pending): Trang epic .md có dòng trống trước heading, render nonGoals và next task; có test snapshot.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
