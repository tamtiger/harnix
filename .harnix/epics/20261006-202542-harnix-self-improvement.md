# Epic: Harnix tự cải tiến: tối ưu token và giảm ma sát phát hiện khi phát triển

Gom các cải tiến phát hiện trong lúc phát triển Harnix: gom bản dev thành bản phát hành, chạy mọi check bằng một lệnh, tóm tắt lỗi check gọn, giảm output lặp và giảm token của hook context. Mỗi member dùng bản dev của dòng phát hành kế tiếp; member cuối theo ID đóng epic bằng một bản minor. Epic mở rộng thành 11 member: thêm khai báo nhiều tiêu chí và check lúc --init, cảnh báo id check lạ trong plan.md, gợi ý baseline khi suite đỏ lặp, cảnh báo secret khi finish, gom các ma sát vặt và task đóng epic phát hành 2.3.0.

- **Cập nhật:** 2026-10-07 15:38:28 +07:00

## Non-goals

- Không thêm dịch vụ, telemetry hay mạng
- Không nới ngưỡng hay bỏ test cấu trúc
- Không đổi hành vi hiện có ngoài phạm vi tiêu chí

## Next task

Không còn task nào chưa hoàn tất.

## Members (11 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261006-202543-version-sync-fold-dev` | version:sync gom các bản dev thành một entry phát hành | `full` | `completed` |
| 2 | `20261006-202544-run-all-checks` | Một lệnh chạy mọi check bắt buộc và tóm tắt kết quả | `full` | `completed` |
| 3 | `20261006-202545-run-check-failure-summary` | Output --run-check chỉ nêu test lỗi thay vì đuôi log dài | `full` | `completed` |
| 4 | `20261006-202546-quiet-advisories` | Giảm output dài của ready dry-run, finish và các gợi ý lặp | `full` | `completed` |
| 5 | `20261006-202547-hook-context-diet` | Hook context chỉ mang learning khi agent sắp lập kế hoạch | `full` | `completed` |
| 6 | `20261007-110154-init-multi-obligations` | Khai báo nhiều tiêu chí và nhiều check ngay lúc --init bằng cờ lặp | `full` | `completed` |
| 7 | `20261007-110304-plan-check-references` | Cổng ready cảnh báo plan.md nhắc id check không khai báo | `full` | `completed` |
| 8 | `20261007-110306-repeated-red-baseline-hint` | Nhắc đặt baseline khi suite đỏ lặp qua nhiều task | `full` | `completed` |
| 9 | `20261007-110308-secret-scan-advisory` | Cảnh báo dấu hiệu secret trong file thuộc phạm vi task khi finish | `full` | `completed` |
| 10 | `20261007-132300-workflow-friction-batch` | Gom các ma sát vặt của workflow: đường dẫn có khoảng trắng, định dạng learning, inspect --task, sửa criterion, resume epic | `full` | `completed` |
| 11 | `20261007-150255-epic-close-release` | Đóng epic tự cải tiến: tài liệu gốc, kiểm chứng tiến trình thật và phát hành 2.3.0 | `full` | `completed` |

## Task Overview & Scope

### 1. `20261006-202543-version-sync-fold-dev` — version:sync gom các bản dev thành một entry phát hành

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi đóng epic, pnpm version:sync X.Y.0 gom các entry X.Y.0-dev.N trong CHANGELOG thành một entry X.Y.0 thay vì để người làm gom tay, và không định dạng lại các file markdown không liên quan.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261006-202544-run-all-checks` — Một lệnh chạy mọi check bắt buộc và tóm tắt kết quả

- **Trạng thái:** `completed`
- **Mục tiêu:** Agent không phải gọi --run-check lần lượt cho từng check: một lệnh chạy các check bắt buộc còn pending hoặc stale theo thứ tự (focused trước, suite cuối), ghi evidence như --run-check, dừng ở lần fail đầu và in tóm tắt rất ngắn.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261006-202545-run-check-failure-summary` — Output --run-check chỉ nêu test lỗi thay vì đuôi log dài

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi một check fail, outputTail của --run-check hiện tối đa 2000 ký tự log thô; thay bằng tóm tắt các test lỗi (tên và dòng đầu thông điệp) khi nhận diện được định dạng vitest, và giữ đuôi ngắn cho lệnh khác, để giảm token đọc lỗi.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 4. `20261006-202546-quiet-advisories` — Giảm output dài của ready dry-run, finish và các gợi ý lặp

- **Trạng thái:** `completed`
- **Mục tiêu:** Các thông báo dài lặp lại ở mỗi lần gọi (advisory chưa baseline từng check trong ready dry-run, hint learning ở --finish) tốn token mà không đổi quyết định; gộp chúng thành một dòng ngắn có số lượng.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 5. `20261006-202547-hook-context-diet` — Hook context chỉ mang learning khi agent sắp lập kế hoạch

- **Trạng thái:** `completed`
- **Mục tiêu:** Hook UserPromptSubmit gắn 5 note learning vào mọi prompt dù task đang implement hay verify; chỉ gắn khi chưa có task active hoặc task đang planning, để giảm token mỗi lượt mà không mất thông tin lúc cần.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 6. `20261007-110154-init-multi-obligations` — Khai báo nhiều tiêu chí và nhiều check ngay lúc --init bằng cờ lặp

- **Trạng thái:** `completed`
- **Mục tiêu:** Task có nhiều tiêu chí và nhiều check không còn phải dựng envelope JSON: --init nhận cờ lặp để khai báo thêm tiêu chí và check focused, rồi cổng ready kiểm tra như thường.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 7. `20261007-110304-plan-check-references` — Cổng ready cảnh báo plan.md nhắc id check không khai báo

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi plan.md còn nhắc id check đã đổi tên hoặc mới thêm (ví dụ check-2b) mà validationPlan không có, dry-run của cổng ready nêu rõ để plan và task không lệch nhau.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 8. `20261007-110306-repeated-red-baseline-hint` — Nhắc đặt baseline khi suite đỏ lặp qua nhiều task

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi cùng một suite đỏ sẵn qua nhiều task liên tiếp, preflight nhắc người dùng ủy quyền --set-baseline thay vì để agent tự đặt required false cho suite ở từng task.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 9. `20261007-110308-secret-scan-advisory` — Cảnh báo dấu hiệu secret trong file thuộc phạm vi task khi finish

- **Trạng thái:** `completed`
- **Mục tiêu:** Harnix nhắc người dùng khi file thuộc phạm vi task (relevantPaths và input của check) chứa dấu hiệu secret như mật khẩu, connection string hay private key, mà không in giá trị và không dùng Git.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 10. `20261007-132300-workflow-friction-batch` — Gom các ma sát vặt của workflow: đường dẫn có khoảng trắng, định dạng learning, inspect --task, sửa criterion, resume epic

- **Trạng thái:** `completed`
- **Mục tiêu:** Sửa một lượt các ma sát nhỏ gặp trong lúc phát triển epic tự cải tiến mà chưa có chỗ xử lý: command có đường dẫn khoảng trắng, định dạng khối learning, đọc task khác bằng --inspect --task, sửa nội dung criterion khi còn planning, resume task kế tiếp của epic và danh sách nơi phải sửa khi thêm action.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 11. `20261007-150255-epic-close-release` — Đóng epic tự cải tiến: tài liệu gốc, kiểm chứng tiến trình thật và phát hành 2.3.0

- **Trạng thái:** `completed`
- **Mục tiêu:** Hoàn tất epic harnix-self-improvement: đưa tài liệu gốc về khớp với các thay đổi của epic, kiểm chứng các lệnh mới bằng tiến trình thật và phát hành 2.3.0 bằng --fold-dev; đây là task cuối theo ID nên đóng epic.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
