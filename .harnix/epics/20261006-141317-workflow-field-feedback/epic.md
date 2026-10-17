# Epic: Giảm ma sát workflow theo phản hồi thực tế

Xử lý các điểm vướng gặp khi dùng và phát triển Harnix: cờ không nhất quán, digest ràng buộc chéo giữa các check, quan hệ task bị mất, vòng đời nặng khi đổi check ở giai đoạn verify, quy ước ngôn ngữ ID/title, chính sách phiên bản theo epic, cổng ready kiểm nội dung kế hoạch, và các ma sát phát hiện trong quá trình làm epic (đồng bộ file tự-host, test hợp đồng chạy nhanh, tham chiếu chéo trong --batch, sửa member không đổi con trỏ, thứ tự member, cảnh báo lệch phiên bản CLI). Epic đóng bằng một bản minor 2.2.0 ở member cuối theo ID. Quy ước: ID task và epic là slug tiếng Anh (--init --slug), title/goal/tiêu chí là tiếng Việt có dấu. Chính sách phiên bản: Task 1 đã phát hành 2.1.2; các member còn lại dùng 2.2.0-dev.N (mỗi member một lần); member cuối theo ID là 20261006-165805-cli-version-skew-warning đóng epic bằng bản 2.2.0.

- **Cập nhật:** 2026-10-06 20:13:41 +07:00

## Non-goals

- Không thêm reopen/amend cho task completed
- Không cho sửa hồi tố task terminal
- Không thêm cờ --query hay parser JSON mới
- Không đổi tên hay sửa task và epic đã tạo trước đây
- Không đổi ID hay slug tiếng Việt đã tạo; quy ước chỉ áp dụng cho ID mới

## Next task

Không còn task nào chưa hoàn tất.

## Members (13 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261006-141318-cli-flag-consistency` | Thống nhất cờ lặp/comma và lỗi cờ không hợp lệ của harnix workflow | `lite` | `completed` |
| 2 | `20261006-141319-task-lineage-links` | Ghi nhận quan hệ task nối tiếp và gắn epic ngay lúc init | `full` | `completed` |
| 3 | `20261006-141320-per-check-digest-isolation` | Cô lập digest của từng check khỏi định nghĩa các check khác | `full` | `completed` |
| 4 | `20261006-141321-baseline-red-verify-flow` | Cho phép chứng minh bằng check tập trung khi baseline đỏ và đổi check ở verify không ép replan đầy đủ | `full` | `completed` |
| 5 | `20261006-144105-id-language-and-epic-mode-column` | Chuẩn hóa ngôn ngữ ID/title và thêm cột mode vào danh sách member của epic | `full` | `completed` |
| 6 | `20261006-144106-release-versioning-policy` | Chính sách phiên bản: bản dev cho từng member, một bản minor khi đóng epic, patch cho task lẻ | `full` | `completed` |
| 7 | `20261006-150703-ready-gate-content-checks` | Cổng ready kiểm tra nội dung kế hoạch và buộc xác nhận ready-review | `full` | `completed` |
| 8 | `20261006-165800-selfhost-sync-script` | Script đồng bộ file tự-host và hash manifest thay cho thao tác tay | `full` | `completed` |
| 9 | `20261006-165801-fast-contract-gates` | Cổng hợp đồng chạy nhanh và bảo vệ golden khỏi cập nhật nhầm | `full` | `completed` |
| 10 | `20261006-165802-batch-cross-references` | --batch và --set-check chấp nhận tham chiếu chéo trong cùng một lần gọi | `full` | `completed` |
| 11 | `20261006-165803-member-edit-without-switch` | Sửa kế hoạch của task thành viên epic mà không phải pause và resume | `full` | `completed` |
| 12 | `20261006-165804-epic-member-order` | Thứ tự thực thi member của epic không phụ thuộc ID | `full` | `completed` |
| 13 | `20261006-165805-cli-version-skew-warning` | Cảnh báo khi CLI harnix cũ hơn dự án và đóng epic bằng bản 2.2.0 | `full` | `completed` |

## Task Overview & Scope

### 1. `20261006-141318-cli-flag-consistency` — Thống nhất cờ lặp/comma và lỗi cờ không hợp lệ của harnix workflow

- **Trạng thái:** `completed`
- **Mục tiêu:** Mọi cờ nhận danh sách của harnix workflow chấp nhận cả dạng lặp cờ lẫn dạng phân tách bằng dấu phẩy, và cờ không áp dụng cho hành động đang chạy phải báo lỗi rõ thay vì bị bỏ qua; cookbook ghi cách đọc JSON an toàn trên Windows.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261006-141319-task-lineage-links` — Ghi nhận quan hệ task nối tiếp và gắn epic ngay lúc init

- **Trạng thái:** `completed`
- **Mục tiêu:** --init có thể gắn task vào epic có sẵn (--epic <id>) và --follow-up ghi lại quan hệ nối tiếp bằng field tùy chọn của TaskRecord v3, hiển thị trong status/tasks/review.md, để chuỗi task tinh chỉnh không bị rời rạc.
- **Tiêu chí nghiệm thu:** 7 tiêu chí

### 3. `20261006-141320-per-check-digest-isolation` — Cô lập digest của từng check khỏi định nghĩa các check khác

- **Trạng thái:** `completed`
- **Mục tiêu:** inputDigest của một check chỉ phụ thuộc vào input files, định nghĩa của chính check đó và tiêu chí nó phủ, để --replace-check hoặc --set-check trên check khác không làm stale bằng chứng pass hợp lệ.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 4. `20261006-141321-baseline-red-verify-flow` — Cho phép chứng minh bằng check tập trung khi baseline đỏ và đổi check ở verify không ép replan đầy đủ

- **Trạng thái:** `completed`
- **Mục tiêu:** Khi suite đã đỏ từ trước ngoài phạm vi task, người dùng có đường ghi nhận baseline đỏ có ủy quyền cùng check chứng minh tập trung, và thay check ở giai đoạn verifying quay lại verifying thay vì đi lại ready, in_progress, verifying, finishing.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 5. `20261006-144105-id-language-and-epic-mode-column` — Chuẩn hóa ngôn ngữ ID/title và thêm cột mode vào danh sách member của epic

- **Trạng thái:** `completed`
- **Mục tiêu:** Task ID và Epic ID luôn là slug tiếng Anh, còn title, goal và nội dung hướng người dùng là tiếng Việt có dấu; --init không còn sinh slug tiếng Việt từ title, và epic hiển thị mode (lite/full) của từng member.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 6. `20261006-144106-release-versioning-policy` — Chính sách phiên bản: bản dev cho từng member, một bản minor khi đóng epic, patch cho task lẻ

- **Trạng thái:** `completed`
- **Mục tiêu:** Đặt quy tắc phiên bản rõ ràng và kiểm tra được: task lẻ tăng patch một lần; task thuộc epic dùng bản tiền phát hành X.Y.0-dev.N; khi đóng epic phát hành một bản minor X.(Y+1).0 (major chỉ khi phá vỡ frozen contract).
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 7. `20261006-150703-ready-gate-content-checks` — Cổng ready kiểm tra nội dung kế hoạch và buộc xác nhận ready-review

- **Trạng thái:** `completed`
- **Mục tiêu:** Đưa ready self-review vào chính Harnix để mọi nền tảng và mọi repo đều bị chặn khi kế hoạch Full còn placeholder, tiêu chí không có trong plan.md, hoặc tiêu chí chỉ được phủ bởi suite toàn dự án; chuyển ready cho task Full phải kèm xác nhận --reviewed. Task này được làm trước các member còn lại của epic để chúng được hưởng cổng mới.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 8. `20261006-165800-selfhost-sync-script` — Script đồng bộ file tự-host và hash manifest thay cho thao tác tay

- **Trạng thái:** `completed`
- **Mục tiêu:** Một lệnh duy nhất đồng bộ .harnix/workflow.md với template và cập nhật hash trong .harnix/.template-hashes.json (chuẩn hóa LF), và làm rõ vì sao harnix update bỏ qua workflow.md của chính repo này và kéo theo thay đổi guide không liên quan.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 9. `20261006-165801-fast-contract-gates` — Cổng hợp đồng chạy nhanh và bảo vệ golden khỏi cập nhật nhầm

- **Trạng thái:** `completed`
- **Mục tiêu:** Phát hiện sớm các test hợp đồng (cấu trúc test, cli-contract, architecture, tài liệu, golden) mà check tập trung hay bỏ sót, và chặn việc regenerate golden ghi nhầm lỗi.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 10. `20261006-165802-batch-cross-references` — --batch và --set-check chấp nhận tham chiếu chéo trong cùng một lần gọi

- **Trạng thái:** `completed`
- **Mục tiêu:** Tiêu chí và check được khai báo trong cùng một lệnh có thể tham chiếu nhau mà không phụ thuộc thứ tự, vì hiện tại --batch báo coverage incomplete hoặc unknown criterion khi tiêu chí trỏ tới check chưa tồn tại.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 11. `20261006-165803-member-edit-without-switch` — Sửa kế hoạch của task thành viên epic mà không phải pause và resume

- **Trạng thái:** `completed`
- **Mục tiêu:** Cho phép các lệnh sửa obligation, đường dẫn và ghi chú nhắm tới một task thành viên đang planning của epic bằng --task <id>, thay vì chuỗi pause, resume, sửa, pause, resume dễ làm mất con trỏ.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 12. `20261006-165804-epic-member-order` — Thứ tự thực thi member của epic không phụ thuộc ID

- **Trạng thái:** `completed`
- **Mục tiêu:** Epic có thể khai báo thứ tự chạy rõ ràng để harnix epic gợi ý đúng task kế tiếp khi người dùng đổi ưu tiên, thay vì luôn theo ID tăng dần.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 13. `20261006-165805-cli-version-skew-warning` — Cảnh báo khi CLI harnix cũ hơn dự án và đóng epic bằng bản 2.2.0

- **Trạng thái:** `completed`
- **Mục tiêu:** Báo rõ khi harnix chạy trên PATH cũ hơn phiên bản đã ghi trong dự án, vì khi đó các cổng mới không có tác dụng mà không có dấu hiệu nào; đồng thời task cuối này phát hành bản 2.2.0 đóng epic.
- **Tiêu chí nghiệm thu:** 4 tiêu chí
