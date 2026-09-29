# Kế hoạch — Tái cấu trúc code

## Checklist thực thi

- [x] SNAPSHOT — ghi golden hành vi trước khi refactor
- [x] SPLIT-TASK — tách `task.ts` thành schema/validate/migration/state/store/review
- [x] SPLIT-WORKFLOW — chuyển logic workflow vào `src/core/workflow/`, command chỉ còn adapter
- [x] LAYERING — gỡ `node:fs` khỏi command, chuyển detection/stack sang core, đổi tên `canonicalJson`, test kiến trúc
- [x] EXEMPTIONS — cập nhật danh sách miễn trừ ESLint và ghi quyết định
- [x] DOCS — docs, `AGENTS.md`, `CHANGELOG.md`, parity
- [x] GATE — chạy bộ kiểm chứng đầy đủ và ghi evidence

## Chi tiết

### SNAPSHOT

Làm: `test/workflow/behavior-snapshot.test.ts` chạy một kịch bản cố định (init, save, transition, evidence, snapshot, finish, cancel, learn, epic, status, tasks, preflight) với clock và múi giờ cố định, chuẩn hóa đường dẫn, so với golden `test/workflow/behavior-snapshot.golden.json` sinh từ code trước refactor.
Kiểm chứng: test pass trước và sau refactor với cùng golden.

### SPLIT-TASK

Làm: `src/core/tasks/{task-schema,task-validate,task-migration,task-state,task-store,task-review}.ts`, `task.ts` là barrel.
Kiểm chứng: `check-behavior`, `check-architecture`.

### SPLIT-WORKFLOW

Làm: `src/core/workflow/*` theo action; `src/commands/internal-workflow.ts` re-export; `src/core/workflow.ts` chuyển vào thư mục.
Kiểm chứng: `check-behavior`, `check-architecture`.

### LAYERING

Làm: bỏ `node:fs` khỏi `epic.ts`, `internal-context.ts`, `legacy-project-surfaces.ts`, `mem.ts`, `uninstall.ts`, `update.ts`; `src/core/stack/`; `canonicalizeJson`; `test/unit/architecture.test.ts`.
Kiểm chứng: `check-architecture`.

### EXEMPTIONS

Làm: gỡ khỏi `eslint.config.mjs` các file đã tách, ghi owner cho phần còn lại, ghi quyết định vào `docs/OVERHAUL_DECISIONS.md`.
Kiểm chứng: `pnpm lint`.

### DOCS

Làm: mô tả thư mục mới, hướng phụ thuộc và danh sách miễn trừ; `CHANGELOG.md`.
Kiểm chứng: `check-docs-sync`.

### GATE

Làm: chạy từng check tập trung rồi bộ đầy đủ, ghi evidence với digest trước và sau.
