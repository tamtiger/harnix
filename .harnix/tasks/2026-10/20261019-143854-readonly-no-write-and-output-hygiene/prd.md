# PRD: Lệnh read-only không ghi `.harnix` và làm sạch đầu ra tự sinh

## Bối cảnh & Vấn đề
Báo cáo thực địa nêu bốn điểm về đầu ra và việc ghi file; sau khi đối chiếu mã:
- Thư mục `.harnix/` xuất hiện untracked trong sub-repo chưa `init`: chưa có bằng chứng lệnh read-only nào của Harnix ghi ra đó (grep không thấy ghi trong `status`, `verify-plan`, `repo-map`, `context-report`), và AGENTS.md cấm tự tạo state. Task này chỉ thêm test hồi quy để giữ vững điều đó.
- `secretAdvisory` (`src/core/workflow/secret-scan.ts`) quét file theo glob `relevantPaths` và `inputs` bằng `globby` không có `gitignore: true`, nên với input rộng (`**`) nó đọc cả log và thư mục build bị ignore, khác với `input-digest.ts` vốn tôn trọng `.gitignore`. Hai lần cảnh báo giả đều nằm trong `Logs/*.log`.
- `renderPrdTemplate` và `renderPlanTemplate` (`artifact-templates.ts`) sinh câu riêng của repository Harnix ("giới hạn 300 LOC/file trong src/core/", "commands -> core -> utils") vào mọi dự án.
- `workflow --preflight --brief` đã bỏ `learning`; `epicContext` chỉ xuất hiện khi chưa có task active và cho biết task kế của epic, nên được giữ.

## Ranh giới & Ràng buộc
- Không đổi hợp đồng đầu ra của `--preflight` hay của `--brief`.
- `secretAdvisory` vẫn offline, giới hạn (200 file, 128 KiB), không dùng Git và không trả giá trị bí mật; `.gitignore` được đọc như file thường qua `globby`.
- Mẫu `prd.md`/`plan.md` giữ tên các mục mà cổng ready và các test hiện có kiểm (`## 1. Context & Problem Statement`, `## 3. Anchored Acceptance Criteria`, `## Execution Slices`, `## Verification Matrix`); chỉ đổi các câu riêng của Harnix.
- Không đổi nội dung `prd.md`/`plan.md` của task đã tồn tại.

## Yêu cầu kỹ thuật cốt lõi
- Thêm `gitignore: true` vào lời gọi `globby` trong `candidateFiles`.
- Thay các dòng ràng buộc riêng của Harnix bằng câu trung tính trỏ tới `AGENTS.md` và `.harnix/spec/guides/` của dự án.
- Test hồi quy: các lệnh `status`, `verify-plan`, `repo-map --query`, `context-report`, `workflow --preflight`, `workflow --inspect`, `tasks`, `epic` chạy ở thư mục chưa init không tạo hay đổi file nào; `workflow --preflight --brief` không có `learning`.

## Rủi ro & Chiến lược giảm thiểu
- `gitignore: true` làm bỏ qua file nhạy cảm nằm trong thư mục bị ignore (nơi bí mật thường nằm, như `.env`): chấp nhận có chủ đích vì advisory nhắm file sắp được commit; file bị ignore không vào Git.
- Test read-only có thể phát hiện một lệnh thật sự ghi: khi đó báo lỗi thật và sửa trong task này thay vì bỏ qua.
