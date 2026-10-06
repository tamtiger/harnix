# Kế hoạch: chính sách phiên bản

## Checklist

- [x] Slice 1 — Quy tắc pre-release `dev.N` trong `scripts/version-sync.mjs` (ac-2)
- [x] Slice 2 — Tài liệu chính sách: AGENTS.md, template workflow, skill harnix-implement (ac-1)
- [x] Slice 3 — Bản ghi epic ghi quyết định phiên bản qua `--save` (ac-3)
- [x] Slice 4 — Phiên bản dev, đồng bộ `.harnix/workflow.md`, verify toàn bộ

## Slice 1 (ac-2)

Tệp: `scripts/version-sync.mjs`, `test/workflow/version-sync.test.ts`.

1. RED: `2.2.0-dev.1` được chấp nhận từ `2.1.0`; `2.2.0-dev.2` sau `2.2.0-dev.1` được chấp nhận; `2.2.0-dev.1` lặp lại hoặc lùi (`dev.1` sau `dev.2`) bị từ chối; `2.1.0-dev.9` khi hiện tại `2.1.0` bị từ chối; `2.2.0` sau `2.2.0-dev.3` được chấp nhận; `2.2.1-dev.1`, `2.2.0-beta.1` và `2.2.0-dev` bị từ chối với thông báo nêu `X.Y.0-dev.N`.
2. GREEN: sau `parseVersion` kiểm pre-release (nếu có) khớp `dev.N` và patch bằng 0.

## Slice 2 (ac-1)

Tệp: `AGENTS.md` (mục 7 của Implementation workflow), `src/templates/harnix/workflow.md`, `src/skills/harnix-implement/SKILL.md`, `test/workflow/docs-task-contract.test.ts` (RED trước: đòi `X.Y.0-dev.N`, "minor" và "major" ở ba bề mặt).

## Slice 3 (ac-3)

`--save` với trường `epic` (bản ghi đầy đủ) thêm quyết định phiên bản vào `goal`; test đọc bản ghi đòi `2.1.2`, `2.2.0-dev.N` và `20261006-165805-cli-version-skew-warning`.

## Slice 4

`pnpm version:sync 2.2.0-dev.6 --summary "..." --kind changed`; chạy `node` script đồng bộ `.harnix/workflow.md` và hash; `pnpm build`; lint, typecheck; check focused; `check-suite`; finish. Không commit. Không chạy prettier trên file markdown.
