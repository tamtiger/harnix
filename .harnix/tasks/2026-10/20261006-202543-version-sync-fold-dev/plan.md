# Kế hoạch: version:sync --fold-dev

## Checklist

- [x] 1. RED: thêm test `--fold-dev` vào `test/workflow/version-sync.test.ts` (ac-1: gộp, thứ tự, không mất dòng, idempotent, lỗi khi không có entry dev, từ chối với pre-release) và test ac-2 (formatter chỉ nhận file đã ghi, markdown không liên quan giữ nguyên byte)
- [x] 2. GREEN: tạo `scripts/changelog-fold.mjs` (`foldDevEntries(changelog, version, date, summaries, kind)`) và nối vào `scripts/version-sync.mjs` (`foldDev` option, cờ `--fold-dev`, formatter inject được qua option `format`)
- [x] 3. Tài liệu ac-3: nêu `--fold-dev` trong `AGENTS.md` (mục 7), `src/templates/harnix/workflow.md`; chạy `pnpm selfhost:sync`
- [x] 4. Bump `pnpm version:sync 2.3.0-dev.1 --summary ... --kind added` (member đầu của epic, dòng phát hành kế tiếp) và cập nhật entry CHANGELOG
- [x] 5. Chạy check-fold, check-gates, rồi suite `pnpm run test`, `pnpm lint`, `pnpm typecheck` (check-suite)

## Thiết kế

`foldDevEntries`: tách CHANGELOG thành các entry theo `^## \[`; chọn entry khớp `X.Y.0-dev.N`; sắp N tăng dần; mỗi entry tách theo `### <Tiêu đề>` thành bullet; gộp theo tiêu đề (thứ tự xuất hiện đầu tiên, các mục Added/Changed/Fixed giữ thứ tự đó); summary mới thêm vào mục `kind`; thay các entry dev bằng một entry `## [X.Y.0] - date` tại vị trí entry dev trên cùng. Không có entry dev thì ném lỗi. Entry `X.Y.0` đã có thì đường cũ ném "already contains" như hiện tại; chạy lại ở `comparison === 0` không đụng CHANGELOG nên idempotent.

## Mỗi check chứng minh gì

- `check-fold` (ac-1, ac-2): hành vi gộp và phạm vi ghi/định dạng.
- `check-gates` (ac-3): test tài liệu, ngân sách instruction và golden vẫn xanh sau khi sửa tài liệu.
- `check-suite`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Chỉ đổi script phát hành và tài liệu; hoàn tác bằng revert các file đó. Template `workflow.md` đổi cần `pnpm selfhost:sync` để test self-host không lệch.
