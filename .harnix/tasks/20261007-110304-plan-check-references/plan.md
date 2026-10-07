# Kế hoạch: advisory id check lạ trong plan.md

## Checklist

- [x] 1. RED (ac-1, ac-2): `test/unit/core/workflow/ready-content.test.ts` cho `unknownCheckReferences(task, plan)`: id trong backtick và từ đầu mục checklist được nhận; id đã khai báo (kể cả check không bắt buộc) không bị báo; code fence, văn bản thường và id khác tiền tố `check-` bị bỏ qua; khử trùng và sắp xếp
- [x] 2. GREEN (ac-1, ac-2): `unknownCheckReferences` trong `src/core/workflow/ready-content.ts`
- [x] 3. RED (ac-1, ac-3): `test/unit/core/workflow/ready.test.ts`: dry-run của task Full có plan nhắc `check-2b` trả đúng một advisory gộp dạng `plan.md names 1 unknown check id(s): check-2b ...`, `issues` rỗng; với 7 id lạ chỉ liệt kê 5 và `+2 more`; plan khớp thì không có advisory
- [x] 4. GREEN (ac-1, ac-3): `artifactFindings` trong `src/core/workflow/ready-artifacts.ts` thêm advisory gộp (câu một dòng, tối đa 5 id) vào `advisories`
- [x] 5. Bump `pnpm version:sync 2.3.0-dev.7 --summary ... --kind added` và cập nhật CHANGELOG
- [x] 6. Chạy check-refs, rồi suite `pnpm run test`, `pnpm lint`, `pnpm typecheck` (check-1)

## Thiết kế

`unknownCheckReferences(task, plan)`: duyệt từng dòng ngoài code fence (dùng cùng bộ tách fence như `proseLines` nhưng giữ nội dung backtick); id khớp `/`(check-[a-z0-9]+(?:-[a-z0-9]+)*)`/gu`, hoặc từ đầu của dòng khớp `/^\s*[-*]\s+\[[ xX]\]\s+(check-[a-z0-9]+(?:-[a-z0-9]+)*)\b/u`; loại các id có trong `task.validationPlan`; trả mảng đã khử trùng, sắp xếp.

`artifactFindings` (nhánh `entering` của task Full): nếu mảng không rỗng thì thêm một advisory `plan.md names ${n} unknown check id(s): ${5 id đầu}${thêm ", +M more" nếu n > 5} (not in validationPlan).`

## Mỗi check chứng minh gì

- `check-refs` (ac-1, ac-2, ac-3): nhận diện, phạm vi quét, advisory gộp gọn và không chặn ready.
- `check-1`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Chỉ thêm một advisory, không đổi `issues` hay hợp đồng schema; hoàn tác bằng revert `ready-content.ts`, `ready-artifacts.ts` và hai file test.
