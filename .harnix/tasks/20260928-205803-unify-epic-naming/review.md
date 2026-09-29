# [05] Thống nhất tên gọi epic và sửa renderer trang epic

- **ID:** 20260928-205803-unify-epic-naming
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:03 +07:00
- **Updated:** 2026-09-29 10:58:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Dùng một tên epic ở mọi nơi: .harnix/roadmaps/ đổi thành .harnix/epics/; lệnh harnix roadmap [--limit] [--id] đổi thành harnix epic [--limit] (danh sách) và harnix epic <epic-id> (chi tiết, positional như harnix resume <task-id>); envelope roadmapMembers đổi thành epicMembers; src/core/roadmaps/roadmap.ts và src/commands/roadmap.ts đổi thành src/core/epics/epic.ts và src/commands/epic.ts. Giữ epicId, EpicRecord, field epic. harnix update và doctor --fix chuyển dữ liệu cũ từ .harnix/roadmaps/ sang .harnix/epics/; trước khi chuyển vẫn đọc được. Sửa 3 lỗi renderer: thiếu dòng trống trước heading Members, epic.nonGoals không được render, trang .md thiếu next task so với JSON. Bỏ hẳn tên roadmap trong 2.0.0 và ghi breaking change.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không đổi EpicRecord schema ngoài đường dẫn lưu; không đổi epicId của task.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-rename` (met): Không còn tên roadmap trong src, CLI, skill, template và docs hiện hành (trừ ghi chú migrate và CHANGELOG).
- `ac-cli-epic` (met): harnix epic trả danh sách, harnix epic <epic-id> trả chi tiết kèm next task; id sai trả lỗi JSON exit 2; cli-contract.test được cập nhật.
- `ac-migrate-epics` (met): update và doctor --fix chuyển .harnix/roadmaps/*.json sang .harnix/epics/ không mất dữ liệu, idempotent; trước khi chuyển vẫn đọc được.
- `ac-epic-members` (met): Envelope hidden --save nhận epicMembers; skill và workflow.md dùng tên mới.
- `ac-epic-render` (met): Trang epic .md có dòng trống trước heading, render nonGoals và next task; có test snapshot.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-epic-behavior` (focused): Test lệnh epic, envelope epicMembers và renderer trang epic pass — pass (2026-09-29 10:58:37 +07:00)
- `check-epic-migration` (focused): Test chuyển dữ liệu roadmaps sang epics pass — pass (2026-09-29 10:58:38 +07:00)
- `check-naming-docs` (focused): Test tên gọi epic, docs, skill, template và self-host pass — pass (2026-09-29 10:58:39 +07:00)
- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-09-29 10:58:40 +07:00)

## Decisions

- **d-migrate-in-update** — Migration dữ liệu epic nằm trong updateProject; doctor --fix dùng lại vì nó gọi updateProject.
  - _Why:_ Một đường duy nhất cho hai lệnh, tránh hai bản logic di chuyển file có thể lệch nhau.
- **d-keep-conflicts** — Nếu .harnix/epics/<id>.json đã tồn tại với nội dung khác thì giữ cả hai và không xóa file cũ.
  - _Why:_ Không được mất dữ liệu người dùng; xung đột hiếm nên xử lý thủ công.
- **d-remove-roadmap-cmd** — Lệnh public roadmap bị xóa hẳn, không giữ alias.
  - _Why:_ Quyết định D8 của epic đại tu: thống nhất một tên, ghi breaking change trong CHANGELOG.

## Evidence

- pass (2026-09-29 10:51:07 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-29 10:51:08 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho từng tiêu chí sau khi khảo sát code roadmap hiện có.
- `check-epic-behavior` — pass (2026-09-29 10:58:37 +07:00): Check check-epic-behavior passed (exit 0):    Start at  10:58:35 |    Duration  1.82s (transform 727ms, setup 0ms, collect 3.23s, tests 1.31s, environmen
- `check-epic-migration` — pass (2026-09-29 10:58:38 +07:00): Check check-epic-migration passed (exit 0):    Start at  10:57:30 |    Duration  1.54s (transform 347ms, setup 0ms, collect 756ms, tests 396ms, environmen
- `check-naming-docs` — pass (2026-09-29 10:58:39 +07:00): Check check-naming-docs passed (exit 0):    Start at  10:57:34 |    Duration  1.29s (transform 527ms, setup 0ms, collect 2.23s, tests 468ms, environmen
- `check-suite` — pass (2026-09-29 10:58:40 +07:00): Check check-suite passed (exit 0):    Start at  10:58:05 |    Duration  17.89s (transform 4.89s, setup 0ms, collect 39.70s, tests 94.67s, environ
