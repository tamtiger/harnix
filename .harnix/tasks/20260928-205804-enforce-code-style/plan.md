# Kế hoạch — Định dạng và lint

## Checklist thực thi

- [x] FORMAT — cấu hình Prettier, script, format một lần toàn repo (bước chỉ định dạng)
- [x] LINT — bật luật ESLint mới, sửa cơ học vi phạm nhỏ, ghi danh sách miễn trừ
- [x] DOCS — docs, README, `AGENTS.md`, `CHANGELOG.md`, kiểm tra parity
- [x] GATE — chạy bộ kiểm chứng đầy đủ và ghi evidence

## Chi tiết

### FORMAT

Làm: `.prettierrc.json`, `.prettierignore`, script `format` và `format:check` trong `package.json`; chạy `prettier --write` một lần; xác nhận `pnpm typecheck` và `pnpm test` không đổi kết quả. Đưa riêng vào index để làm commit chỉ định dạng.
Kiểm chứng: `pnpm format:check`.

### LINT

Làm: `eslint.config.mjs` với `projectService`, `recommendedTypeChecked`, `max-lines`, `complexity`, `no-floating-promises`, `eslint-config-prettier`; `lint` = `format:check` rồi `eslint .`; sửa cơ học vi phạm nhỏ; phần còn lại vào danh sách miễn trừ ghi task chịu trách nhiệm.
Kiểm chứng: `pnpm exec eslint .`.

### DOCS

Làm: mô tả quy ước và script trong docs/README/`AGENTS.md`, `CHANGELOG.md`; test parity nhỏ kiểm tra script `format`, `format:check`, `lint` chạy `format:check` và cấu hình tồn tại.
Kiểm chứng: `test/workflow/docs-task-contract.test.ts` và `test/unit/package-contract.test.ts`.

### GATE

Làm: chạy từng check tập trung rồi bộ đầy đủ, ghi evidence với digest trước và sau.
