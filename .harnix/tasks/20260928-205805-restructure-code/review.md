# [07] Tái cấu trúc code theo đúng tầng và tách module lớn

- **ID:** 20260928-205805-restructure-code
- **Mode:** full
- **Status:** planning/planning
- **Created:** 2026-09-28T20:58:05.000+07:00
- **Updated:** 2026-09-28T20:58:28.000+07:00

**Verdict:** PENDING — 0/7 acceptance criteria met

## Goal

Đưa code về đúng hướng phụ thuộc trong AGENTS.md (commands -> core -> utils): logic workflow đang nằm ở src/commands/internal-workflow.ts (827 dòng, 24 hàm) chuyển vào src/core/workflow/ và tách theo action (save, transition, evidence, schema, snapshot, audit, preflight, finish, cancel, learn), command chỉ còn là adapter mỏng; 11 file trong src/commands import node:fs trực tiếp chuyển truy cập file xuống core/utils; detection (src/utils/detection.ts) chuyển về src/core/stack/ vì là logic nghiệp vụ; tách src/core/tasks/task.ts thành schema/validate/migration; đổi tên một trong hai hàm canonicalJson trùng tên khác nghĩa (workflow-helpers.ts trả object, global-managed-json.ts trả string); gỡ khỏi danh sách miễn trừ max-lines các file đã tách. Refactor thuần: CLI output và file ghi ra giống hệt trước/sau.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không đổi hành vi quan sát được.
- Không tách global-managed-files.ts, doctor.ts, global-doctor.ts (thuộc add-platform-registry) và không viết lại templates (thuộc slim-instructions).

## Acceptance criteria

- `ac-layering` (pending): Không file nào trong src/commands import node:fs hay chứa logic nghiệp vụ, trừ doctor.ts, global-doctor.ts, setup.ts, global-update.ts, global-uninstall.ts (thuộc add-platform-registry, ghi vào danh sách miễn trừ); có test kiến trúc kiểm tra hướng import commands -> core -> utils và core không import commander/inquirer/templates.
- `ac-split-workflow` (pending): Logic workflow nằm trong src/core/workflow/ tách theo action, mỗi file ≤ 300 dòng.
- `ac-split-task` (pending): task.ts được tách thành schema/validate/migration, không còn trong danh sách miễn trừ.
- `ac-move-domain-utils` (pending): detection chuyển sang src/core/stack/; src/utils chỉ còn helper dùng chung (fs, path, hash, lock, input), trừ global-managed-files.ts và global-managed-json.ts (thuộc add-platform-registry, ghi vào danh sách miễn trừ).
- `ac-rename-duplicate` (pending): Không còn hai hàm cùng tên canonicalJson khác nghĩa trong src.
- `ac-no-behavior-change` (pending): Test snapshot trước/sau xác nhận output CLI và file ghi ra giống hệt; toàn bộ suite pass.
- `ac-docs-sync` (pending): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — chưa chạy / not yet run

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

_None recorded yet._
