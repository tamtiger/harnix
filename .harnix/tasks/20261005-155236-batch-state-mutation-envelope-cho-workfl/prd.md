# PRD - Batch State Mutation Envelope (`workflow --batch`)

## 1. Bối cảnh & Vấn đề cần giải quyết
Hiện tại, khi coding agent muốn cập nhật trạng thái hoặc các obligation của task, agent phải gọi nhiều lệnh CLI riêng rẽ:
- `workflow --criterion ...`
- `workflow --add-decision ...`
- `workflow --add-risk ...`
- `workflow --set-check ...`
- `workflow --set-paths ...`

Việc này gây ra 3 vấn đề lớn:
1. **Lãng phí Token**: Mỗi lần gọi tool là một round-trip kèm input/output schema và context lặp lại (tiêu tốn từ 1.500 - 3.000 tokens).
2. **Tranh chấp Lock (Lock Contention)**: Mỗi lệnh CLI tự acquire file lock riêng biệt. Khi chạy nhanh liên tiếp, các tiến trình dễ bị xếp hàng hoặc va chạm lock.
3. **Thiếu tính Nguyên tử (Non-atomic)**: Nếu một lệnh thành công nhưng lệnh tiếp theo gặp lỗi cú pháp, task rơi vào trạng thái trung gian chưa trọn vẹn.

Giải pháp là bổ sung cờ `workflow --batch` cho phép nhận một JSON envelope tổng hợp trên stdin, thực thi toàn bộ các thay đổi dưới đúng một file lock duy nhất và commit atomic `task.json`.

## 2. Mục tiêu (Goals)
- Cung cấp action `workflow --batch` nhận JSON envelope gồm:
  - `criteria`: mảng các criterion cần thêm hoặc cập nhật (`{ id, text, check?, status?, waiverReason? }`).
  - `checks`: mảng các validation check cần thêm hoặc cập nhật (`{ id, description, command?, scope?, required?, criteria?, inputs? }`).
  - `decisions`: mảng quyết định cần ghi nhận (`{ id, text, rationale }`).
  - `risks`: mảng rủi ro tồn đọng (`{ id, text, severity? }`).
  - `paths`: danh sách đường dẫn liên quan (`{ paths?: string[], specs?: string[] }`).
- Thực thi toàn bộ thay đổi trong một lần lock duy nhất.
- Bảo đảm tính toàn vẹn (Text integrity, Schema validation, Contract immutability).
- Hỗ trợ cờ `--brief` để trả về kết quả rút gọn.

## 3. Phạm vi ngoài lề (Non-goals)
- Không thay đổi cấu trúc TaskRecord schema v3.
- Không cho phép bypass các quy tắc hợp đồng bất biến (không được sửa criterion/check đã có passing evidence).
- Không tự động transition trạng thái task (transition vẫn dùng `--transition`).

## 4. Ràng buộc kiến trúc (Invariants & Constraints)
- **File size cap**: File module mới `src/core/workflow/batch.ts` phải tuân thủ giới hạn ≤ 300 dòng code theo rule kiến trúc của Harnix.
- **Dependency direction**: `commands -> core/workflow -> tasks/utils`.
- **Text integrity**: Từ chối dữ liệu chứa ký tự null `\0`, UTF-8 mojibake hoặc UTF-8 BOM.
- **Atomic commit**: Nếu bất kỳ mục nào trong batch không hợp lệ, toàn bộ thay đổi bị rollback và ném lỗi rõ ràng, không làm biến đổi file `task.json`.

## 5. Danh sách Tiêu chí Nghiệm thu (Acceptance Criteria)

### ac-1: CLI Flag & Schema Envelope
- CLI `harnix workflow` đăng ký cờ `--batch` nhận JSON envelope trên stdin hoặc qua pipe.
- Hỗ trợ đầy đủ các trường tùy chọn: `criteria`, `checks`, `decisions`, `risks`, `paths`.
- **Verifies:** `check-1`

### ac-2: Atomic Execution & Single Lock
- Toàn bộ batch mutation được thực thi dưới 1 file lock duy nhất.
- Cập nhật đồng thời criteria, checks, decisions, risks và paths trong 1 lần ghi atomic `task.json`.
- **Verifies:** `check-1`

### ac-3: Validation & Contract Preservation
- Từ chối envelope rỗng hoặc sai định dạng schema.
- Ngăn chặn việc sửa đổi hoặc xóa các criteria/checks đã được bảo vệ bởi passing evidence.
- Kiểm tra tính toàn vẹn UTF-8 của mọi chuỗi văn bản trong envelope.
- **Verifies:** `check-1`

### ac-4: Suite Gate & Command Parity
- Toàn bộ các bài kiểm thử đơn vị cho batch mutation đạt 100% pass.
- Đăng ký `--batch` vào danh sách `BRIEF_ACTIONS` trong `src/core/workflow/brief.ts` và `workflowEnvelopeSchema`.
- **Verifies:** `check-suite`

## 6. Rủi ro & Phương án Rollback
- **Rủi ro**: Trùng lặp logic giữa batch mutation và các handler đơn lẻ (`addCriterion`, `setCheck`, `addDecision`).
  - *Giảm thiểu*: Tái sử dụng các helper logic thuần túy (pure functions) đã có trong `src/core/workflow/plan-edit.ts` và `obligations.ts`.
- **Phương án Rollback**: Giữ nguyên các flag transports đơn lẻ hiện có (`--add-criterion`, `--set-check`,...), việc bổ sung `--batch` hoàn toàn mang tính mở rộng tương thích ngược (non-breaking extension).
