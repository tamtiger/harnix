# PRD task: Audit và refactor toàn repository

## Kết quả mong muốn

Đánh giá codebase hiện tại bằng bằng chứng, sửa các lỗi correctness, workflow recovery, compatibility và maintainability có tác động quan sát được, đồng thời bổ sung version hợp lệ cho bảy canonical Harnix skills mà không phá parity Kiro, Antigravity và Codex.

## Trong phạm vi

- Audit compliance, correctness, security, safety, architecture, tests, performance và footprint trên repository hiện tại.
- Bổ sung skill version theo schema được xác minh, cập nhật parser, tests và tài liệu contract liên quan.
- Sửa workflow partial-persistence/recovery nếu completed task vẫn còn active sau lỗi journal/archive.
- Sửa các finding khác chỉ khi có reproduction hoặc contract evidence rõ ràng.
- Chạy fresh focused tests và toàn bộ acceptance sequence mục 11.

## Ngoài phạm vi

- Không thêm platform, package, workspace, service hoặc compatibility surface mới.
- Không thay đổi frozen task/config/doctor schema ngoài phạm vi được user yêu cầu.
- Không chạm real user home, không chạy manual tool-session smoke trên profile thật.
- Không commit, branch, push, publish hoặc tạo PR.

## Acceptance criteria

1. Audit có trace tới file/contract, phân loại severity và không biến preference thành finding.
2. Mọi canonical skill công bố version hợp lệ, parser expose version và ba adapter giữ byte-identical content.
3. Completed-active partial persistence có đường recovery rõ ràng, an toàn và được regression test.
4. Global manifest reject mọi managed-block selector có token begin/end overlap chéo.
5. Tài liệu normative và implementation nhất quán với behavior sau thay đổi.
6. Focused tests và acceptance/release gates tự động pass trên fake home/current tree.

## Material unknown

Đã khóa `metadata.version: "1.0.0"` cho từng canonical skill. Đây là content version độc lập với package version; parser chỉ chấp nhận semantic version và ba platform tiếp tục nhận cùng byte content. Antigravity runtime acceptance vẫn được bảo vệ bằng open-standard contract và automated parity fixture; không claim manual host activation mới.