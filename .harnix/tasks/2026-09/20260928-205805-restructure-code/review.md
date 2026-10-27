# [07] Tái cấu trúc code theo đúng tầng và tách module lớn

- **ID:** 20260928-205805-restructure-code
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:05 +07:00
- **Updated:** 2026-09-29 11:30:44 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Đưa code về đúng hướng phụ thuộc trong AGENTS.md (commands -> core -> utils): logic workflow đang nằm ở src/commands/internal-workflow.ts (827 dòng, 24 hàm) chuyển vào src/core/workflow/ và tách theo action (save, transition, evidence, schema, snapshot, audit, preflight, finish, cancel, learn), command chỉ còn là adapter mỏng; 11 file trong src/commands import node:fs trực tiếp chuyển truy cập file xuống core/utils; detection (src/utils/detection.ts) chuyển về src/core/stack/ vì là logic nghiệp vụ; tách src/core/tasks/task.ts thành schema/validate/migration; đổi tên một trong hai hàm canonicalJson trùng tên khác nghĩa (workflow-helpers.ts trả object, global-managed-json.ts trả string); gỡ khỏi danh sách miễn trừ max-lines các file đã tách. Refactor thuần: CLI output và file ghi ra giống hệt trước/sau.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không đổi hành vi quan sát được.
- Không tách global-managed-files.ts, doctor.ts, global-doctor.ts (thuộc add-platform-registry) và không viết lại templates (thuộc slim-instructions).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-layering` (met): Không file nào trong src/commands import node:fs hay chứa logic nghiệp vụ, trừ doctor.ts, global-doctor.ts, setup.ts, global-update.ts, global-uninstall.ts (thuộc add-platform-registry, ghi vào danh sách miễn trừ); có test kiến trúc kiểm tra hướng import commands -> core -> utils và core không import commander/inquirer/templates.
- `ac-split-workflow` (met): Logic workflow nằm trong src/core/workflow/ tách theo action, mỗi file ≤ 300 dòng.
- `ac-split-task` (met): task.ts được tách thành schema/validate/migration, không còn trong danh sách miễn trừ.
- `ac-move-domain-utils` (met): detection chuyển sang src/core/stack/; src/utils chỉ còn helper dùng chung (fs, path, hash, lock, input), trừ global-managed-files.ts và global-managed-json.ts (thuộc add-platform-registry, ghi vào danh sách miễn trừ).
- `ac-rename-duplicate` (met): Không còn hai hàm cùng tên canonicalJson khác nghĩa trong src.
- `ac-no-behavior-change` (met): Test snapshot trước/sau xác nhận output CLI và file ghi ra giống hệt; toàn bộ suite pass.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-architecture` (focused): Test kiến trúc: hướng import, giới hạn dòng, vị trí module, tên hàm pass — pass (2026-09-29 11:30:38 +07:00)
- `check-behavior` (focused): Snapshot hành vi khớp golden ghi trước refactor — pass (2026-09-29 11:30:39 +07:00)
- `check-docs-sync` (focused): Test parity docs pass — pass (2026-09-29 11:30:40 +07:00)
- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-09-29 11:30:41 +07:00)

## Decisions

- **d-barrels** — task.ts và commands/internal-workflow.ts giữ nguyên tên export dưới dạng barrel/adapter.
  - _Why:_ Hàng trăm import và test hiện có không phải đổi, diff tập trung vào di chuyển code.
- **d-golden-first** — Golden hành vi được sinh từ code trước refactor và không được sửa để test pass.
  - _Why:_ Đây là bằng chứng duy nhất cho tiêu chí không đổi hành vi.
- **d-remaining-exempt** — File lớn ngoài tiêu chí vẫn nằm trong danh sách miễn trừ với owner mới; ghi vào docs/OVERHAUL_DECISIONS.md.
  - _Why:_ Task giới hạn ở tiêu chí đã duyệt; tách thêm sẽ chạm add-platform-registry và làm diff khó kiểm chứng.

## Evidence

- pass (2026-09-29 11:13:42 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-29 11:13:43 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho từng tiêu chí và ghi lại quyết định tái cấu trúc sau khi khảo sát đồ thị import.
- `check-architecture` — pass (2026-09-29 11:30:38 +07:00): Check check-architecture passed (exit 0):    Start at  11:29:47 |    Duration  665ms (transform 38ms, setup 0ms, collect 71ms, tests 48ms, env
- `check-behavior` — pass (2026-09-29 11:30:39 +07:00): Check check-behavior passed (exit 0):    Start at  11:29:50 |    Duration  1.71s (transform 415ms, setup 0ms, collect 898ms, tests 424ms, 
- `check-docs-sync` — pass (2026-09-29 11:30:40 +07:00): Check check-docs-sync passed (exit 0):    Start at  11:29:54 |    Duration  1.35s (transform 698ms, setup 0ms, collect 1.98s, tests 256ms, 
- `check-suite` — pass (2026-09-29 11:30:41 +07:00): Check check-suite passed (exit 0):    Start at  11:30:13 |    Duration  17.03s (transform 4.28s, setup 0ms, collect 40.53s, tests 90.70
