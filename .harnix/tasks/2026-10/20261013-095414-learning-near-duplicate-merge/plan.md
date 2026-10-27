# Kế hoạch

## Checklist theo thứ tự

- [x] Slice 1 (ac-1, ac-2): `learning-similarity.ts` với `foldObservation`, `observationTokens`, `jaccard`, `findFoldedMatch`; test đơn vị RED trước.
- [x] Slice 2 (ac-1, ac-2): `learning-capture.ts` tra candidate hiện có qua khoá gấp dấu và dùng lại id đó; test capture RED trước, gồm test id cũ không đổi.
- [x] Slice 3 (ac-3): `similar` cho `harnix learning` (list) và `--promote` (preview); test fixture precision/recall và test tích hợp.
- [x] Slice 4 (ac-3): cập nhật PRD, WORKFLOW, README, AGENTS; bump `2.4.0-dev.3` bằng `pnpm version:sync`.
- [x] Slice 5 (ac-4): build rồi chạy `harnix learning` trên journal thật (chỉ đọc), ghi số liệu trước/sau vào evidence.

## Hợp đồng

- `foldObservation(text)`: `normalizeObservation(text)` rồi bỏ dấu (`đ` thành `d`, NFD bỏ `\p{M}`). Dùng chung một hàm bỏ dấu trong module này.
- `observationTokens(text)`: token chữ và số của chuỗi đã gấp dấu, dài từ 2 ký tự, là một `Set`.
- `jaccard(a, b)`: giao chia hợp, bằng 0 khi cả hai rỗng.
- `SIMILARITY_THRESHOLD = 0.5`; `MAX_SIMILAR = 5` id mỗi mục, xếp theo độ giống giảm dần rồi id.
- `findFoldedMatch(states, statement)`: trả state live (draft/candidate) hoặc đã `rejected`/`promoted`/`archived` có `foldObservation(candidate.statement)` bằng khoá của statement mới; ưu tiên entry mới nhất. Capture dùng id của state tìm được thay cho id băm mới.
- Id mới (không có khớp) vẫn là `observationCandidateId(statement)`.
- `similar` trong JSON: `{ id, score }[]`, `score` làm tròn 2 chữ số; mục thiếu thì mảng rỗng. Chỉ so với entry live và `promoted`.

## Kiểm chứng

- RED rồi GREEN từng slice bằng `pnpm exec vitest run test/unit/core/journal test/integration/commands/learning.test.ts`.
- `pnpm run test:gates` (CLI, tài liệu, golden) và toàn bộ `pnpm run test`.
- ac-4 là báo cáo số liệu từ lệnh chỉ đọc, ghi trong evidence của check `check-merge`.
