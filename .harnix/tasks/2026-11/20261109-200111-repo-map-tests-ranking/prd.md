# PRD: Sửa thứ hạng repo-map --tests

Task: `20261109-200111-repo-map-tests-ranking` · Epic: `20261109-194501-repo-map-insights` (member 2) · Mode: Full

## 1. Context & Problem Statement

`harnix repo-map --tests <path>` trả danh sách test bị ảnh hưởng. Đo ngày 2026-11-09 trên 5 file của repo này (`store.ts`, `text-integrity.ts`, `graph.ts`, `git.ts`, `paths.ts`): cả 5 lần trả đủ 20 test, `truncated: true` và không có test trực tiếp của file đó. Nguyên nhân trong `src/core/repo-map/tests.ts`:

- Bước "trùng symbol" gán khoảng cách 1 cho mọi test có một identifier trùng với bất kỳ symbol nào của file đích (kể cả tên chung), cùng bậc với test viết riêng cho file.
- Danh sách sắp theo khoảng cách rồi theo bảng chữ cái, nên `test/integration/...` luôn đứng trước `test/unit/...` và test trực tiếp bị cắt bởi `--limit`.
- Quy ước tên bị neo ở gốc (`^src/...`) nên không khớp monorepo như `frt-core/src/...`, và không hiểu project test C# dạng `X.Tests`.

Hậu quả: agent muốn chạy test hẹp nhất nhận về 20 test nhiễu, nên quay về `ls` và `grep`. `harnix verify-plan --impact` gọi chung `findAffectedTests` nên bị cùng lỗi.

Số đo lần hai (sau khi có bốn bậc, với thứ tự `direct` trước `convention`): `store.ts` có hơn 20 test import trực tiếp nên test đơn vị `store.test.ts` rơi xuống vị trí 18, và `text-integrity.test.ts` bị cắt hẳn khỏi top 20. Vì vậy bậc `convention` (test viết riêng cho file, kể cả khi nó cũng import file) phải đứng trước `direct`.

## 2. Scope & Boundaries

Trong phạm vi:
- Xếp theo bậc: `convention` (cùng tên và cùng cây thư mục theo quy ước từng ngôn ngữ), `direct` (test phụ thuộc trực tiếp vào file đích qua import hoặc references), `symbol` (trùng symbol đặc trưng), `transitive` (bắc cầu, tối đa 5).
- Trường tùy chọn `reasons` ánh xạ test tới bậc; `tests` vẫn là mảng đường dẫn.
- Module `test-convention.ts` (quy ước tên, thư mục) tách khỏi `tests.ts`.
- Đồng bộ tài liệu, CHANGELOG, phiên bản `2.31.0-dev.2`.

Ngoài phạm vi:
- Không đổi `RepoMapV1`, đồ thị hay cách dựng `references` (đã làm ở member 1).
- Không đổi giới hạn `--limit` (1 đến 20) hay enum `status`.
- Không đổi `verify-plan`, nhưng nó hưởng thứ hạng mới vì gọi chung hàm.

## 3. Anchored Acceptance Criteria

Nguồn chính là `task.json`:

- `ac-1`: xếp bậc `convention`, `direct`, `symbol`, `transitive`; trong bậc theo code-unit; test bậc đầu luôn đứng trước khi `--limit` cắt bớt; quy ước tên gồm `foo.test.ts`, `test_foo.py`, `FooTests.cs` trong project `X.Tests`, `FooTest.php`.
- `ac-2`: output giữ `tests` và thêm `reasons`; bắc cầu tối đa 5; symbol chung (khai báo ở hơn 4 file) bị bỏ; test không liên hệ không được trả; `verify-plan --impact` dùng chung thứ hạng; fixture TS, C#, PHP có test trực tiếp trong top 5.
- `ac-3`: tài liệu, CHANGELOG, phiên bản `2.31.0-dev.2` đồng bộ; `pnpm run test:gates` xanh.

## 4. Architectural & Safety Constraints

- Theo `AGENTS.md`, `.harnix/spec/guides/common.md` và `languages/typescript.md` (strict, không `any`, không `!`).
- `core` không phụ thuộc Commander, Inquirer hay template; file `src` dưới 300 dòng code; mỗi module `src` có spec 1-1 (`test-convention.ts` có `test-convention.test.ts`); file test dưới 400 dòng.
- Thay đổi output công khai chỉ cộng thêm (`reasons` tùy chọn); không đổi `schemaVersion`, enum hay `--limit`.
- Thứ tự xác định (bậc, khoảng cách, code-unit); không I/O mới; không lộ đường dẫn tuyệt đối.
- Giữ thay đổi chưa commit của người dùng; không commit, không tạo nhánh.

## Giả định

| Giả định | Trạng thái | Tác động nếu sai |
| --- | --- | --- |
| Test bất kỳ import hoặc dùng tên khai báo trong file đích đã có cạnh `direct` nhờ `references` của member 1 | validated (đồ thị có cạnh reference, `graph-references.test.ts`) | Symbol là bậc cứu cánh |
| Mọi `*Test(s).cs` ở `payment_hub` có `kind: test` | validated (102/102) | `findConventionTests` bỏ sót |
| Bậc bắc cầu tối đa 5 đủ hữu ích | assumed | Có thể cần tăng |

## Điều bạn có thể chưa biết

- Thứ tự các test trong `tests` thay đổi (test trực tiếp lên đầu), nên script phụ thuộc thứ tự cũ sẽ thấy khác; nội dung đúng hơn.
- `verify-plan --impact` đổi theo vì dùng chung hàm.
