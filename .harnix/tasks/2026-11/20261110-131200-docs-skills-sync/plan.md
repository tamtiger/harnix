# Plan: Đồng bộ tài liệu, skill và token budget

## Execution Slices

- [x] [chk-focus] Slice 1 (ac-1): template `workflow.md` viết trung tính; test `docs-task-contract` và `skill-sources` cập nhật; `pnpm selfhost:sync`.
- [x] [chk-focus] Slice 2 (ac-2): sửa đường dẫn trong `AGENTS.md` mục 8 và skill `harnix-self-host`; bỏ danh sách số trần khỏi `AGENTS.md`.
- [x] [chk-focus] Slice 3 (ac-3): bỏ dòng Evidence source treo ở 7 skill technique (cập nhật test), thêm dòng trỏ tới 6 reference mồ côi, đưa quy tắc riêng repo ra khỏi `harnix-verify` và `harnix-plan`, thống nhất cách trỏ reference trong `harnix-implement`.
- [x] [chk-focus] Slice 4 (ac-4): README và PRD đồng bộ; thêm 3 tài liệu vào danh mục README (budgetUsage ghi vào residual risk).
- [x] [chk-suite] Slice 5: format, lint, typecheck, toàn suite, `release:check`; bản phát hành `2.32.0` với `--fold-dev` và CHANGELOG.

## Guardrails & Invariants

- Không nâng trần token; skill chỉ giảm hoặc giữ.
- Mỗi tệp skill sửa đều đi qua checklist và dòng phiên bản do `version:sync` cập nhật.

## Verification Matrix

| Check | Chứng minh | Tiêu chí |
| --- | --- | --- |
| chk-focus | `pnpm run test:gates` (docs, skill sources, instruction budget, golden) | ac-1 … ac-4 |
| chk-suite | toàn suite | ac-1 … ac-4 |
