# Implementation Plan: Áp dụng chọn lọc ý tưởng từ hve-core vào skill harnix

## Execution Slices

### Slice 0: Đo ngân sách (trước khi viết)
- [x] Chạy `pnpm run measure:footprint` và `pnpm exec vitest run test/workflow/instruction-budget.test.ts`, ghi số byte và token hiện có làm mốc

### Slice 1: ac-7 làm sạch skill phục vụ (làm trước)
- [x] RED: test quét văn bản skill và reference trong `test/workflow/skill-sources.test.ts` fail khi gặp lệnh hoặc đường dẫn riêng của repo Harnix
- [x] GREEN: nói chung hóa khối "In Harnix itself" và đoạn Release preparation của harnix-implement, `harnix-plan/SKILL.md` dòng 38 và `harnix-verify/references/gates.md`
- [x] Tạo skill dự án `.harnix/spec/skills/harnix-self-host/SKILL.md` giữ phần riêng của repo, trỏ AGENTS.md mục 8 tới skill đó
- [x] Đo lại token của harnix-plan và harnix-implement sau khi cắt

### Slice 2: nội dung mới trong skill (ac-1, ac-2, ac-3, ac-8, ac-9, ac-10)
- [x] ac-1: reference plan-critique và một dòng trỏ trong harnix-plan/SKILL.md, pin bằng test trong reference-rules
- [x] ac-9: quy tắc hội tụ critique và replan, gộp vào cùng reference của harnix-plan nếu ngân sách không đủ
- [x] ac-8: viết lại mục Criteria của ready-review.md, nhãn validated/assumed/unknown và mục "Điều bạn có thể chưa biết"
- [x] ac-2: reference quy tắc bốn nấc của harnix-implement
- [x] ac-3: bước phản chứng và cổng tri thức có sẵn của harnix-research (standalone và task-scoped)
- [x] ac-10: reference finding-triage dùng chung cho harnix-review và harnix-security-lens
- [x] Đo footprint; gộp reference nếu vượt, chỉ nâng maxBytes bằng phần thiếu đã đo kèm lý do trong CHANGELOG

### Slice 3: nguồn gốc và phát hành (ac-6, ac-5, ac-4)
- [x] ac-6: NOTICE, docs/UPSTREAM_BASELINE.md, docs/UPSTREAM_MAPPING.md; cập nhật assertAttribution trong scripts/scan-release-assertions.mjs và test provenance
- [x] ac-5: đồng bộ README.md, AGENTS.md, docs; `pnpm selfhost:sync` nếu template đổi; một lần `pnpm version:sync 2.23.3 --kind changed`
- [x] `pnpm run release:check`

### Slice 4: Bằng chứng theo check
- [x] [check-suite] Toàn bộ test, lint và typecheck của dự án phải xanh (Lệnh: `pnpm run test`)
- [x] [chk-skills] Test catalog skill và ngân sách instruction (Lệnh: `pnpm exec vitest run test/unit/skills test/workflow/instruction-budget.test.ts`)
- [x] [chk-gates] Contract tests (CLI, docs, golden, kiến trúc) (Lệnh: `pnpm run test:gates`)
- [x] [chk-footprint] Ngân sách footprint của setup (Lệnh: `pnpm run measure:footprint`)
- [x] [chk-release] Chuỗi nghiệm thu release (Lệnh: `pnpm run release:check`)
- [x] [chk-suite] Toàn bộ test của dự án (Lệnh: `pnpm run test`)
- [x] [chk-served] Test skill phục vụ: RED quét lệnh riêng của repo và pin các quy tắc mới, rồi GREEN: chuyển khối self-host sang skill dự án, viết lại ready-review, thêm quy tắc hội tụ và reference finding-triage (Lệnh: `pnpm exec vitest run test/workflow/skill-sources.test.ts test/workflow/reference-rules.test.ts`)
- [x] [chk-notice] Test provenance và NOTICE: thêm hve-core vào NOTICE, UPSTREAM_BASELINE, UPSTREAM_MAPPING (RED: test khẳng định NOTICE chứa hve-core trước, rồi GREEN) (Lệnh: `pnpm exec vitest run test/workflow/provenance.test.ts`)

## Guardrails & Invariants
- Duy trì tính tương thích ngược 100% (Backward Compatibility).
- Tuân thủ các quy ước kiến trúc và giới hạn của dự án (AGENTS.md, .harnix/spec/guides/).

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3, ac-4, ac-5, ac-6, ac-7, ac-8, ac-9, ac-10 | check-suite | `pnpm run test` | full |
| ac-1, ac-2, ac-3, ac-4, ac-7, ac-8, ac-9, ac-10 | chk-skills | `pnpm exec vitest run test/unit/skills test/workflow/instruction-budget.test.ts` | focused |
| ac-4, ac-5, ac-6, ac-7, ac-8, ac-9, ac-10 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | chk-footprint | `pnpm run measure:footprint` | focused |
| ac-5 | chk-release | `pnpm run release:check` | full |
| ac-1, ac-2, ac-3, ac-4, ac-5, ac-6, ac-7, ac-8, ac-9, ac-10 | chk-suite | `pnpm run test` | full |
| ac-6 | chk-notice | `pnpm exec vitest run test/workflow/provenance.test.ts` | focused |
| ac-7, ac-8, ac-9, ac-10 | chk-served | `pnpm exec vitest run test/workflow/skill-sources.test.ts test/workflow/reference-rules.test.ts` | focused |
