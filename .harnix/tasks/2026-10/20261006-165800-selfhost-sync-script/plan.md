# Kế hoạch: script đồng bộ file tự-host

## Checklist

- [x] Slice 1 — `scripts/selfhost-sync.mjs`, script pnpm, test idempotent (ac-1)
- [x] Slice 2 — Test self-host nêu `pnpm selfhost:sync` (ac-2)
- [x] Slice 3 — Test hồi quy `update` + tài liệu điều tra + chỉ dẫn release (ac-3, ac-4)
- [x] Slice 4 — Phiên bản dev, build, verify

## Slice 1 (ac-1)

Tệp: `scripts/selfhost-sync.mjs`, `package.json`, `test/workflow/selfhost-sync.test.ts`. RED: trong repo tạm gồm template, `.harnix/workflow.md` lệch, manifest có entry workflow, `syncSelfHost` ghi LF, đặt hash chuẩn hóa và generatorVersion; lần gọi thứ hai `changed: false`; thiếu template thì lỗi.

## Slice 2 (ac-2)

Tệp: `test/workflow/self-host.test.ts`: thông báo lỗi chứa `pnpm selfhost:sync` (dùng so sánh có message tùy biến qua helper `expectSynced`).

## Slice 3 (ac-3, ac-4)

Test hồi quy trong `test/workflow/selfhost-sync.test.ts` dùng `reconcileManagedFiles`: file đồng bộ nằm trong `preserved`, không trong `updated`, không bị ghi. Tài liệu: AGENTS.md, skill `harnix-implement`, template workflow, `test/workflow/docs-task-contract.test.ts` (RED trước).

## Slice 4

`pnpm version:sync 2.2.0-dev.7`, `pnpm selfhost:sync` (chính script mới), `pnpm build`, lint, typecheck, check focused, `check-suite`, finish. Không commit; không chạy prettier trên markdown.
