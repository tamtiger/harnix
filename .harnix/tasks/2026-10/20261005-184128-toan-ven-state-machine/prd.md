# PRD — Toàn vẹn state machine và dữ liệu task

Thuộc epic `20261005-184125-harnix-hardening-2-0-5` (task 4/6). Nguồn: báo cáo review 2.0.4, finding R-004, R-007, R-008, R-023, R-024, R-025, R-026, R-027, R-028, R-036. Task 1–3 đã hoàn thành.

## Vấn đề

Review đã tái hiện (trong repo tạm) các đường làm mất dữ liệu hoặc vượt cổng của workflow:

1. **`epicMembers` ghi đè task đang tồn tại (R-004).** `saveEpicMembers` (`src/core/workflow/save.ts`) gọi thẳng `saveTask` cho từng member, không kiểm tra tồn tại, chạy sau khi task chính đã commit nên không nằm trong rollback. Gửi lại `epicMembers:[M planning]` khi M đã có evidence ghi đè M về `planning` với 0 evidence.
2. **Vào `blocked` với `resumeStatus` tùy ý (R-007).** `transitionTask` không so `blocker.resumeStatus` với status ngay trước. Từ `verifying` có thể đi `blocked{resumeStatus:"planning"}` rồi về `planning` và sửa criterion/check đã đóng băng mà không cần `contractRevision`. Ngược lại `--transition` không resume được task `blocked` vì giữ nguyên `blocker`.
3. **Waive criterion đã đóng băng không cần replan (R-008).** `obligationsChanged` chỉ so `id`/`text`, nên đổi `status` sang `waived` (hoặc đổi `waiverReason`) sau `ready` là một `--save` thường.
4. **Thoát `replan` không qua cổng ready (R-023).** `assertLegalTransition` với cùng status chỉ gọi `updateTaskCheckpoint`, nên `in_progress/replan` chuyển thẳng sang `in_progress/implementing` mà không chạy lại ready gate hay điểm dừng `await`.
5. **`--transition ... --dry-run` lệch transition thật (R-024).** Dry-run báo lỗi "chưa baseline" mà transition thật không đòi; làm theo gợi ý đó (chạy check trong planning) lại đóng băng obligation sớm.
6. **Migration v2→v3 không giữ `inputs` (R-026)** của required check (chỉ so `criterionIds`).
7. **`--replace-check` không kế thừa `command` (R-027).** Đã sửa ở task 2; task này chỉ thêm test hồi quy nếu thiếu.
8. **`--batch` lệch các transport cờ (R-028):** severity mặc định `medium` (cờ là `low`), id trùng bị ghi đè (cờ từ chối), `reason` chỉ kiểm tối thiểu, phát hiện "đã qua planning" theo `checkpoint` (plan-edit theo `status`), envelope không được mô tả trong `--schema`.
9. **File epic ghi không atomic (R-036):** `.harnix/epics/<id>.json|md` dùng `writeFile` thường, không newline cuối.
10. **Sơ đồ state machine lệch bảng `transitions` (R-025):** `docs/HARNIX_WORKFLOW.md` §4 có cạnh `Replan --> Planning` và `Debugging --> Implementing` không tồn tại, và thiếu các cạnh `*→blocked`, `blocked→ready|verifying`.

## Mục tiêu

Không còn đường nào làm mất dữ liệu task hoặc vượt freeze/ready gate bằng `--save`, `--transition`, `--batch`, `epicMembers`; dry-run phản ánh đúng transition thật; docs khớp code.

## Quyết định (mặc định đề xuất, chờ duyệt cùng kế hoạch)

1. **Member đã tồn tại:** chỉ chấp nhận replay giống hệt (`semanticTaskEqual`); khác thì từ chối trước khi ghi bất kỳ file nào. Member mới được ghi **trước** task chính; nếu bước sau thất bại trước khi task commit thì gỡ các member mới tạo trong lần này.
2. **`blocked`:** `blocker.resumeStatus` phải bằng status ngay trước khi vào `blocked`. `--transition` từ `blocked` bỏ `blocker` và chỉ cho resume về `resumeStatus`.
3. **Waive:** sau first ready, chuyển criterion sang/khỏi `waived` hoặc đổi `waiverReason` là thay đổi obligation: phải qua `replan` + `contractRevision.reason`. `--criterion --met` (pending→met) không bị ảnh hưởng. Trong replan, criterion đã được chứng minh không đổi `status`.
4. **Thoát `replan`:** chỉ về `ready/ready` (mọi status hợp lệ) hoặc `planning/planning` khi status là `planning`; mọi đích khác bị từ chối.
5. **Dry-run:** `valid` đúng khi transition thật sẽ được chấp nhận (cùng hàm `collectReadyIssues`). Input glob không khớp file và baseline thành `advisories` (không làm `valid=false`); đây là thay đổi hình dạng JSON của dry-run (thêm trường `advisories`) và được ghi vào §4.
6. **Replacement của `--replace-check`:** giữ nguyên hành vi cho phép dùng check đã khai báo trước đó nhưng chưa có pass làm bản thay (không siết "chỉ ID mới"), vì `--replace-check` ghi rõ "activate or declare".
7. **`--batch`:** dùng lại `saveObligationEdit`, `requireText`, kiểm severity và id trùng của `plan-edit`; mô tả envelope đầy đủ trong `workflow --schema`.
8. **Epic files:** `atomicWriteFile`, JSON có newline cuối.

## Không thuộc phạm vi

- Không đổi tên trạng thái/checkpoint, schema TaskRecord hay exit code.
- Không sửa CHANGELOG 2.0.4 sai về `specs` (task 6 sở hữu CHANGELOG).
- Cổng ready cho input glob không khớp file không trở thành lỗi cứng (tránh phá hàng loạt fixture); chỉ là advisory.

## Tiêu chí chấp nhận

Xem `task.json` (ac-1 đến ac-8). Ánh xạ: ac-1 `epicMembers`; ac-2 `blocked`; ac-3 waive; ac-4 thoát replan và dry-run; ac-5 migration và replace-check; ac-6 `--batch`; ac-7 epic atomic và sơ đồ; ac-8 cổng chất lượng.

## Rủi ro

- Đổi thứ tự ghi member/task có thể lộ giả định trong test cũ: chạy toàn bộ `test/unit/core/workflow` và `test/integration` sau slice 1.
- Siết thoát `replan` có thể phá fixture đang đi `replan → implementing`: sửa fixture (đúng luật), không nới luật.
- Thêm `advisories` vào dry-run đổi hình dạng JSON: không có test golden cho dry-run, nhưng skill/cookbook nhắc `valid`; cập nhật chúng ở task 6.
- Dọn "waived" có thể chạm Lite task cũ đang dùng `--save` để waive sau ready: nay phải `--set-check/--add-criterion` hoặc `--batch` với `reason`; ghi vào rủi ro.
