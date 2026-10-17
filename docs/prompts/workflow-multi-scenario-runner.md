# Prompt — Chạy Tự Động Workflow Đa Kịch Bản, Kiểm Thử Lặp và Khắc Phục Điểm Yếu (Harnix v2.10.0)

> **Mục đích:** Prompt chuẩn hóa dùng để chỉ đạo một Coding Agent (hoặc quy trình CI/CD runner) tự động khởi tạo, thực thi và kiểm chứng quy trình Harnix qua một ma trận đa kịch bản (8 scenarios) lặp lại nhiều vòng (3–5 rounds) trong môi trường cô lập, tự phát hiện các lỗi biên, điểm ma sát (friction points), sau đó lên kế hoạch và tự động khắc phục trực tiếp trong mã nguồn.

---

## 1. Nhiệm vụ và Nguyên tắc Thực thi

Bạn là Senior Harness Systems Engineer. Nhiệm vụ của bạn là đưa Harnix v2.10.0 qua bài kiểm tra độ bền và tính ổn định nghiêm ngặt nhất qua hai pha bắt buộc:

1. **Pha A — Thực thi Đa kịch bản & Quan sát Lặp lại (Multi-Scenario Stress Testing):**
   - Chạy tuần tự và lặp lại tối thiểu **3 vòng** trên **8 kịch bản chuẩn tắc** của Harnix.
   - Mọi kịch bản có ghi dữ liệu (mutation) **bắt buộc chạy trên disposable fixture** (thư mục tạm biệt lập, không thao tác trực tiếp trên repository chính).
   - Ghi nhận chi tiết: thời gian thực thi, số lượng token tiêu thụ, sự ổn định của state machine, tính hợp lệ của input digest, tính trơn tru của các tính năng mới (PRD 4 khối, Plan Execution Slices, Plan Auto-Sync, Code Impact Dashboard, Epic Folders, Repo-map).
2. **Pha B — Tự Review & Lập Kế Hoạch Khắc Phục (Root-Cause Remediation):**
   - Với mọi lỗi biên, sự cố tranh chấp lock, cảnh báo schema, hoặc điểm ma sát phát hiện ở Pha A:
     - Cô lập nguyên nhân gốc rễ (Root Cause).
     - Viết bài test tái hiện lỗi (Failing Test).
     - Triển khai bản sửa lỗi nhỏ nhất (Minimal Fix) và chạy lại kịch bản để chứng minh chuyển từ Đỏ sang Xanh.

---

## 2. Ranh giới An toàn & Môi trường Cô lập (Safety Boundary)

1. **Khoanh vùng Môi trường Tạm (Containment):**
   - Sử dụng thư mục tạm (OS temp dir) để tạo fixture repository độc lập cho từng kịch bản.
   - Không được chạm vào các thư mục cấu hình thật của người dùng: `~/.kiro`, `~/.gemini`, `~/.claude`, `$CODEX_HOME`, `~/.config/opencode`, `~/.cursor`. Mọi bài test platform phải dùng `isolated-user-home`.
2. **Không commit/push tự động trên repo thật:**
   - Trong quá trình kiểm thử, chỉ thao tác git trên fixture repo.
   - Không tự ý `git commit` hoặc `git push` trên repository chính trừ khi được người dùng phê duyệt rõ ràng.
3. **Quy ước Ngôn ngữ:**
   - Giao tiếp với người dùng và tạo tác task/epic (`task.json`, `prd.md`, `plan.md`, `review.md`, `research.md`, `journal`) bằng Tiếng Việt. Giữ nguyên định danh mã nguồn, lệnh CLI và đường dẫn kỹ thuật.

---

## 3. Ma trận 8 Kịch bản Thực thi (Scenario Matrix)

Mỗi vòng kiểm thử (Iteration Round) phải chạy qua đầy đủ 8 kịch bản sau:

### Kịch bản 1: Phân luồng Bỏ qua (Bypass Route)
- **Tình huống:** Người dùng gửi câu hỏi tra cứu, yêu cầu giải thích code, tra cứu trạng thái (`harnix status`), xem sơ đồ phụ thuộc (`harnix repo-map --query`), chỉnh sửa tài liệu thuần túy (docs-only), hoặc yêu cầu rõ ràng bỏ qua task cho một thay đổi 1 dòng hằng số.
- **Tiêu chí Pass:**
  - Không tạo task mới trong `.harnix/tasks/`.
  - Không làm xáo trộn con trỏ `.harnix/tasks/.active` hiện tại (nếu có).
  - Trả về kết quả chính xác, nhanh gọn, tiết kiệm token tối đa.

### Kịch bản 2: Vòng đời Nhiệm vụ Gọn (Lite Task Lifecycle)
- **Tình huống:** Một thay đổi nhỏ, rủi ro thấp (ví dụ: refactor một hàm helper nội bộ trong 1 file).
- **Quy trình:**
  1. Khởi tạo: `harnix workflow --init --title "Refactor helper" --mode lite --command "pnpm run test" --input "src/**,test/**" --brief`.
  2. Ready Gate: `harnix workflow --transition ready/ready --brief`.
  3. Triển khai: `harnix workflow --transition in_progress/implementing --brief`. Viết test trước (TDD RED -> GREEN).
  4. Xác thực: Chạy kiểm tra bằng `harnix workflow --run-check <chk-id> -- <cmd>`.
  5. Đánh dấu tiêu chí: `harnix workflow --criterion <ac-id> --met`.
  6. Hoàn tất: `harnix workflow --transition verifying/finishing --brief` -> `harnix workflow --finish --brief`.
- **Tiêu chí Pass:** Record chỉ lưu trong `task.json`, không sinh PRD/Plan, hoàn tất với mã thoát 0, dọn sạch active pointer, ghi nhật ký journal hợp lệ.

### Kịch bản 3: Vòng đời Nhiệm vụ Toàn phần & Tự Đồng Bộ (Full Task with Auto-Sync & Code Impact)
- **Tình huống:** Tính năng thay đổi lớn, liên quan đến hợp đồng dữ liệu hoặc kiến trúc.
- **Quy trình:**
  1. Khởi tạo: `harnix workflow --init --title "Nang cap data contract" --mode full --slug "upgrade-data-contract" --command "pnpm run test" --input "src/**,test/**" --brief`.
  2. Kiểm tra sinh tự động: Xác nhận hệ thống tự sinh ngay lập tức `prd.md` (4 khối kỹ thuật: Bối cảnh, Ranh giới, Yêu cầu cốt lõi, Rủi ro) và `plan.md` (Execution Slices có tag `[chk-id]`).
  3. Hoàn thiện PRD/Plan: Điền nội dung cụ thể vào 4 khối và các lát cắt kiểm thử.
  4. Ready Gate: `harnix workflow --transition ready/ready --reviewed --brief` (xác nhận bộ quét cấu trúc `scanPrdStructure`/`scanPlanStructure` xác thực hợp lệ).
  5. Triển khai & Auto-Sync:
     - `harnix workflow --transition in_progress/implementing --brief`.
     - Chạy test kiểm thử qua `harnix workflow --run-check <chk-id> -- <cmd>`.
     - **Kiểm tra tự động đồng bộ:** Mở `plan.md`, xác nhận dòng `- [ ] [<chk-id>]` đã được tự động chuyển thành `- [x] [<chk-id>]` 100% mà không cần sửa tay.
  6. Xác thực & Review: Chuyển `verifying/verifying`, kiểm tra file `review.md` được sinh ra có chứa bảng `## Code impact` hiển thị thống kê files và `+ / -` lines.
  7. Finish: Hoàn tất task và xác nhận learning capture trích xuất các quyết định/rủi ro.

### Kịch bản 4: Chuỗi Sáng kiến Đa Nhiệm vụ (Epic Workflow with Folder Hierarchy)
- **Tình huống:** Một sáng kiến lớn gồm 2 tasks kế tiếp nhau.
- **Quy trình:**
  1. Khởi tạo: Khởi tạo Task 1 kèm Epic và khai báo toàn bộ `epicMembers` up-front bằng `--save` envelope.
  2. Kiểm tra cấu trúc Epic: Xác nhận dữ liệu được lưu tại thư mục `.harnix/epics/<epic-id>/epic.json`, `epic.md` và tạo file `research.md`.
  3. Thực thi Task 1: Bumping version pre-release `X.Y.0-dev.1` bằng `pnpm version:sync`, hoàn thành Task 1.
  4. Chuyển sang Task 2: Chạy `harnix resume --next` để tự động kích hoạt task kế tiếp của Epic.
  5. Đóng Epic: Khi Task 2 hoàn tất, bump phiên bản minor chính thức với cờ `--fold-dev` (gộp changelog).
- **Tiêu chí Pass:** `harnix epic <epic-id>` phản ánh tiến độ chính xác theo từng giai đoạn; cấu trúc thư mục epic nguyên vẹn, không bị mất mát file `research.md`.

### Kịch bản 5: Ngắt Mạch & Thay Thế Kiểm Tra (Circuit Breaker & Check Replacement)
- **Tình huống:** Một validation check bị fail 2 lần liên tiếp do lệnh kiểm thử bị sai hoặc môi trường thay đổi.
- **Quy trình:**
  1. Cố ý chạy lệnh fail 2 lần qua `workflow --run-check <chk-id>`.
  2. Xác nhận cơ chế Circuit Breaker kích hoạt: từ chối chạy lần 3 với cùng lệnh và digest.
  3. Sử dụng `harnix workflow --replace-check <old-chk> <new-chk> --reason "Dieu chinh command va input hop le" ...` để thay thế check nguyên tử.
  4. Chạy lại check mới với kết quả pass và hoàn tất quy trình.

### Kịch bản 6: Suite Kiểm Thử Đỏ Từ Trước & Cột Mốc Cơ Sở (Red Baseline & Focused Proof)
- **Tình huống:** Test suite chung của dự án đã bị fail từ trước do một module khác không thuộc phạm vi task.
- **Quy trình:**
  1. Ủy quyền baseline: Chạy `harnix workflow --set-baseline <check-id> --result fail --classification pre-existing --authorized-by user --scope "Loi cu tu module auth"`.
  2. Tạo một check tập trung (`scope: focused`) bao phủ tiêu chí của task hiện tại.
  3. Chứng minh check tập trung pass, và xác nhận cổng `finish` chấp nhận cặp kết quả này mà không đòi hỏi toàn bộ test suite phải xanh.

### Kịch bản 7: Điều Chỉnh Kế Hoạch Sau Đóng Băng (Guarded Replan)
- **Tình huống:** Task đã vào trạng thái `ready` (nghĩa vụ obligations đã đóng băng) nhưng phát hiện cần bổ sung tiêu chí nghiệm thu mới hoặc sửa file inputs.
- **Quy trình:**
  1. Thực hiện chỉnh sửa bằng `--set-check` hoặc `--add-criterion` kèm cờ `--reason "Phat hien edge case moi can bo sung check"`.
  2. Xác nhận task tự động chuyển về checkpoint `replan`.
  3. Rà soát lại và chạy `workflow --transition ready/ready` để tái đóng băng hợp đồng.

### Kịch bản 8: Hủy Bỏ Tường Minh & Ghi Nhật Ký (Explicit Cancellation)
- **Tình huống:** Người dùng đổi ý hoặc yêu cầu hủy bỏ một task đang dang dở.
- **Quy trình:**
  1. Thực thi `harnix workflow --cancel --reason "Yeu cau thay doi kien truc khong tiep tuc"` trực tiếp (hoặc pipe payload JSON `{ "reason": "...", "authorizedBy": "user" }` qua stdin).
  2. Xác nhận con trỏ active pointer được giải phóng sạch (`No active task`).
  3. Xác nhận nhật ký workspace ghi nhận sự kiện kind `cancellation` với đầy đủ lý do kiểm toán.

---

## 4. Hướng dẫn Tự Review & Lập Kế Hoạch Khắc Phục (Self-Review & Action Plan)

Sau khi hoàn tất mỗi vòng chạy kiểm thử, agent bắt buộc phải trả lời và đánh giá:
1. **Chỉ số Ổn định (Stability):** Có kịch bản nào bị crash, treo lock file (`.harnix/.lock`), hoặc văng lỗi không mong muốn không?
2. **Độ Bền của Token & Hiệu Năng (Token Economy):** Các lệnh có tuân thủ cờ `--brief` không? Các file template sinh ra có bị phình token không?
3. **Các Điểm Ma Sát (Friction Points):**
   - Thao tác nào bắt agent phải gõ quá nhiều bước?
   - Bộ đồng bộ `plan-sync` có bỏ sót tag định dạng nào không (ví dụ: `[chk-1]` vs `chk-1` vs `#chk-1`)?
   - Bộ quét tiêu đề PRD có quá khắt khe với các định dạng đề mục khác nhau không?
4. **Bản Kế Hoạch Sửa Lỗi (Action Plan):**
   - Lập danh sách các lỗi và điểm cần tối ưu hóa theo thứ tự ưu tiên (P1 -> P3).
   - Xác định phạm vi file cần sửa đổi trong `src/core/`.
   - Viết regression unit test trước khi chỉnh sửa.
