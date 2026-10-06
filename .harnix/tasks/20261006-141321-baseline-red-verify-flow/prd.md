# PRD: Baseline đỏ có ủy quyền và đổi check ở verify không ép replan đầy đủ

## Vấn đề

1. Khi suite toàn dự án đã đỏ từ trước và nằm ngoài phạm vi task, `--finish` không thể hoàn tất: cổng suite (`assertSuiteGateFinishing`) và `canCompleteTask` đều đòi check suite pass tươi. Người dùng không có đường ghi nhận "đỏ sẵn, đã ủy quyền" rồi chứng minh deliverable bằng một check tập trung.
2. `CheckBaselineWaiver` (`result|classification|authorizedBy|scope`) đã có trong schema nhưng không có flag để ghi, và chỉ được ready đọc như advisory.
3. Đổi check khi task đang `verifying` (`--set-check`, `--replace-check`, `--add-criterion`) buộc đi `verifying/replan` rồi `ready`, `in_progress`, `verifying`, `finishing`, dù mọi check đã pass vẫn còn nguyên.

## Phạm vi

- Thêm transport flag ghi baseline cho một check, không cần JSON.
- Finish và verify chấp nhận suite đỏ sẵn có ủy quyền khi có check focused bắt buộc pass tươi bao phủ cùng các criterion; vẫn chặn khi thiếu ủy quyền hoặc khi phân loại là `introduced`.
- Đổi check ở `verifying` quay lại `verifying/verifying` nếu mọi check đã pass còn nguyên.
- Ghi quyết định về so sánh delta (đã có decision `baseline-red-authorized-focused-proof`) vào tài liệu.

## Không thuộc phạm vi

- Không tự động bỏ qua test đỏ mới do chính task gây ra.
- Không làm yếu cổng suite mặc định khi baseline xanh.
- Không so sánh delta theo từng test (đã quyết định: phải định danh từng test, phức tạp và dễ báo sai).

## Tiêu chí chấp nhận

### ac-1: Flag ghi baseline

Có flag ghi baseline của check (`result`, `classification`, `authorizedBy`, `scope`) mà không cần JSON; việc ghi baseline là dữ liệu review nên không đòi `--reason` hay replan; finish/verify báo rõ suite đỏ sẵn đã được ủy quyền.

**Verifies:** `check-baseline-flag` (test đơn vị `baseline.test.ts` và test tích hợp flag) cùng `check-suite`.

### ac-2: Suite đỏ sẵn đi kèm check tập trung

Check suite đỏ sẵn có baseline ủy quyền (`classification` là `pre-existing` hoặc `environment`, `result` là `fail`, `authorizedBy` có giá trị) có thể đi kèm check tập trung bắt buộc làm bằng chứng; ready và finish chấp nhận tổ hợp này và vẫn chặn khi không có ủy quyền, khi `introduced`/`unknown`, hoặc khi check tập trung không phủ hết criterion của check suite.

**Verifies:** `check-baseline-gate` (`suite-gate`, `completion`, `finish`) cùng `check-suite`.

### ac-3: Đổi check ở verifying

`--replace-check`, `--set-check` hoặc `--add-criterion` khi task ở `verifying` đưa task về `verifying/verifying` nếu các check đã pass còn nguyên (bất biến pass giữ nguyên), thay vì replan đầy đủ; có test cho đường này và test cho trường hợp phải ở lại replan.

**Verifies:** `check-verify-edit` cùng `check-suite`.

### ac-4: Ghi lại quyết định delta

Quyết định không so sánh delta test (chỉ fail test mới) được ghi lại, kèm lý do, trong `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` và template `workflow.md`.

**Verifies:** `check-docs` cùng `check-suite`.

## Rủi ro

- Baseline nằm trong contract hash hay không: nếu có, ghi baseline sau freeze sẽ ép replan. Slice 1 quyết định bằng test RED và loại baseline khỏi so sánh bất biến (cùng nhóm với decisions/risks) mà không đổi digest của check.
- Lạm dụng baseline để lách suite đỏ do chính task gây ra: chỉ chấp nhận `pre-existing|environment`, bắt buộc `authorizedBy` và một check focused pass tươi; finish in rõ cảnh báo.
- Đổi tên/hành vi replan ở verifying chạm hợp đồng `assertReplanExit`; phải cập nhật `docs/IMPLEMENTATION_PLAN.md` cùng lúc.
