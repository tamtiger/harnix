# Kế hoạch: advisory gọn

## Checklist

- [x] 1. Test (ac-1, ac-3): `ready.test.ts` kỳ vọng một advisory gộp `N required check(s) not baselined before contract freeze (ids in unbaselinedChecks).` với giới hạn 100 ký tự cho ba check; `transition.test.ts` dry-run vẫn có advisory "not baselined"
- [x] 2. Code (ac-1): `baselineIssues` trong `src/core/workflow/ready.ts` gộp check chưa có evidence thành một advisory, giữ `unbaselined` và issue "failed in baseline run"
- [x] 3. Test (ac-2, ac-3): `finish.test.ts` kỳ vọng `learning.hint` chứa gợi ý cần thiết và không quá 90 ký tự
- [x] 4. Code (ac-2): `learningHint` trong `src/core/workflow/finish.ts` rút về một câu ngắn cho ba trường hợp, vẫn chỉ có khi `captured` bằng 0
- [x] 5. Bump `pnpm version:sync 2.3.0-dev.4 --summary ... --kind changed` và cập nhật CHANGELOG
- [x] 6. Chạy check-advisories, rồi suite `pnpm run test`, `pnpm lint`, `pnpm typecheck` (check-suite)

## Mỗi check chứng minh gì

- `check-advisories` (ac-1, ac-2, ac-3): gộp advisory, hint ngắn và giới hạn độ dài.
- `check-suite`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Chỉ đổi chuỗi và cách gộp advisory; test cũ phụ thuộc chuỗi cũ đã được cập nhật. Hoàn tác bằng revert `ready.ts`, `finish.ts` và các test liên quan.
