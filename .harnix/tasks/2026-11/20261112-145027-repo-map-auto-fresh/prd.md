# PRD: Repo-map tự phát hiện và làm mới cache cũ khi truy vấn

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Các lệnh `harnix repo-map --query|--refs|--outline|--tests|--impact` đọc thẳng `.harnix/cache/repo-map-v1.json` (`readRepoMap` trong `src/core/repo-map/service.ts`) và luôn trả `status: ready`, dù cache đã lệch với mã nguồn. Chỉ `harnix doctor` (`diagnoseRepoMap`) phát hiện `repo-map-stale`, và chỉ `repo-map --refresh` hoặc `doctor --fix` mới làm mới. Hậu quả đo được trên `payment-hub` (2026-11-12): doctor báo `repo-map-stale` trong khi mọi truy vấn vẫn "ready"; agent gặp vài kết quả thiếu hoặc sai sẽ mất niềm tin và quay lại Grep/Read, đúng thói quen task `repo-map-nudge-reach` đang cố sửa.

Dữ kiện kỹ thuật (đã đối chiếu mã):
- Bản ghi cache có `byteLength` và `contentHash` nhưng không có mtime; `inventoryFingerprint` chỉ phụ thuộc đường dẫn và hash nội dung (`store.ts`).
- `refreshRepoMap` luôn trích xuất lại toàn bộ file; `usedNames` (cho `attachReferences`) không được cache nên làm mới gia tăng thật sự cần đọc lại mọi file. Đo trên repo harnix: refresh 818 file mất khoảng 1,5 giây, truy vấn khoảng 0,6 giây (gồm khởi động node).
- `inventoryRepository` đã stat từng file (`metadata.size`) nên kiểm tra rẻ chỉ cần thêm `mtimeMs` vào mô tả inventory (không lưu vào cache, không đổi schema cache).
- Hook context bị cấm chạy repo-map (AGENTS.md); thay đổi này chỉ ở phía lệnh `repo-map`.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope**:
  - Hàm `repoMapFreshness(root, map)` mới (`src/core/repo-map/freshness.ts`): đi inventory (không đọc nội dung), so tập đường dẫn với cache; file ứng viên là file có `mtimeMs` mới hơn thời điểm ghi cache hoặc khác `byteLength`; chỉ đọc và băm các file ứng viên để xác nhận thay đổi thật; trả `fresh` hoặc `stale` kèm số file thêm/sửa/xóa. Không ghi gì.
  - Các lệnh `--query`, `--refs`, `--outline`, `--tests`, `--impact` (phạm vi một dự án) kiểm tra độ mới trước khi trả kết quả; nếu stale thì làm mới đúng một lần (refresh đầy đủ, tôn trọng `defaultRepoMapLimits`), trả kết quả từ dữ liệu mới và thêm trường `freshness: "refreshed"` (kèm số file đổi); cache còn mới thì output giữ nguyên, không thêm trường, không ghi.
  - Cờ `--cached`: dùng cache nguyên trạng, không kiểm tra, không ghi.
  - Làm mới thất bại hoặc vượt giới hạn: trả dữ liệu cũ kèm `freshness: "stale"` và hint `harnix repo-map --refresh`, mã thoát 0, không ném lỗi.
  - Đồng bộ hợp đồng CLI (`--help`, `cli-helpers` validation, `--schema` nếu có), README, AGENTS.md, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, dòng skill liên quan; bump version.
- **Out-of-Scope (Non-Goals)**:
  - Refresh gia tăng thật sự (cần cache `usedNames`, đổi schema cache); chỉ ghi nhận như hướng tối ưu nếu đo thấy chậm.
  - Tự dựng cache khi `missing` (giữ hành vi hiện tại: trả `missing` kèm hint), và chế độ `--workspace` (cache của nhiều thành viên).
  - Hook gọi repo-map hoặc đọc cache; watcher, daemon, thay đổi `doctor`.
  - Đổi schema `repo-map-v1.json` hoặc các trường hiện có của output.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1**: Hàm kiểm tra độ mới của repo-map phát hiện file thêm, sửa, xóa so với cache mà không ghi gì và chỉ đọc nội dung các file ứng viên (mtime mới hơn cache hoặc khác kích thước), không đọc file không đổi.
- **ac-2**: Khi cache cũ, các lệnh repo-map --query, --refs, --outline, --tests và --impact tự làm mới cache đúng một lần rồi trả kết quả từ dữ liệu mới kèm freshness refreshed; khi cache còn mới thì output giữ nguyên, không có trường freshness và không ghi cache.
- **ac-3**: Cờ --cached dùng cache nguyên trạng, không kiểm tra và không ghi; khi làm mới thất bại hoặc vượt giới hạn, lệnh vẫn trả dữ liệu cũ với freshness stale cùng hint --refresh, không ném lỗi và giữ mã thoát 0; hook context vẫn không gọi repo-map.
- **ac-4**: Hợp đồng CLI, tài liệu (README, AGENTS.md, PRD, workflow, skill) và test cấu trúc được đồng bộ, trần token không vượt, phiên bản được bump một lần.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Hướng phụ thuộc: `commands -> core -> utils`; `freshness.ts` là core thuần, chỉ nhận thư mục gốc và dependency được inject (đọc file, stat) để test xác định; mỗi file `src/core/**` ≤ 300 dòng code, complexity ≤ 20, test ≤ 400 dòng, có spec riêng (`test/unit/core/repo-map/freshness.test.ts`).
- Chỉ ghi `.harnix/cache/repo-map-v1.json` bằng ghi nguyên tử có sẵn (`writeRepoMap`); không ghi nơi khác; refresh thất bại không được làm hỏng cache cũ.
- Phải giữ các ràng buộc an toàn của inventory (symlink/junction escape, file nhạy cảm, `.harnixignore`, giới hạn file/byte); kiểm tra độ mới dùng cùng inventory, không mở rộng phạm vi quét.
- Không thêm dependency, không mạng, không telemetry; hook `context` không đổi.
- Chi phí: kiểm tra độ mới trên cache mới phải rẻ (không đọc nội dung file không đổi); đo thời gian refresh và kiểm tra trên một repo C# lớn (payment-hub) bằng bản sao dùng một lần hoặc khi người dùng cho phép, và ghi số đo vào decision `trace-`.
- Golden `test/workflow/behavior-snapshot.golden.json` chỉ cập nhật cho chuỗi mới bằng `HARNIX_UPDATE_GOLDEN=1`.
- Mọi thay đổi tuân thủ AGENTS.md và các guide trong .harnix/spec/guides/ của dự án, và không để lọt rò rỉ bảo mật.
