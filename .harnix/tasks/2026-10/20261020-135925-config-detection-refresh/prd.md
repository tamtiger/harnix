# PRD: Phát hiện bỏ qua thư mục worktree của công cụ và để harnix update làm mới config.yaml

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Kiểm tra trên workspace payment-hub (chỉ đọc): `verify-plan --recursive` thấy 9 package, `detectProject` thấy 12 (kể cả hai đường dẫn dạng `frt-payment-core/.kilo/worktrees/steel-twig` và `frt-payment-webhook-ingress/.kilo/worktrees/attractive-stegosaurus`), nhưng `.harnix/config.yaml` chỉ ghi duy nhất `frt-payment-portal-web`, `languages` chỉ `csharp` và `technologies` thiếu `postgresql`, `redis`. Hai nguyên nhân gốc đã xác minh bằng mã: (1) `src/core/stack/detection.ts` có danh sách thư mục bỏ qua riêng (`ignoredDirectoryNames`) thiếu `.kilo` và `.worktrees` mà `src/core/repo-map/inventory.ts` đã có, nên worktree của công cụ bị tính là package; (2) `harnix init` phát hiện đúng một lần và trả `already-initialized` ở lần sau, còn `harnix update` dùng nguyên config có sẵn (`desiredFiles(config)`), nên không lệnh nào làm mới `packages`; ai đã init bằng bản phát hiện cũ giữ config thiếu mãi.

Quyết định của người dùng: không thêm lệnh hay cờ mới; tích hợp việc làm mới vào chính `harnix update`.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope:** một danh sách thư mục bỏ qua dùng chung cho detection và repo-map inventory; `harnix update` phát hiện lại và hợp nhất theo kiểu chỉ thêm vào `config.yaml` (packages, languages, technologies); kết quả `configRefreshed`; finding doctor trỏ tới `harnix update`; test; README và PRD.
- **Out-of-Scope (Non-Goals):** không xóa hay sửa mục đã có trong config; không lệnh hay cờ public mới; không đổi schema config v2; không chỉnh config.yaml của repo khác trong task này (người dùng chạy `harnix update` sau khi phát hành); không đổi `harnix init`.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1**: Phát hiện stack và package (`detectProject`) bỏ qua các thư mục công cụ `.kilo`, `.worktrees`, `.cursor`, `.idea`, `.vs`, `out` và `.claude`/`.codex`/`.gemini`/`.agents` ở mọi độ sâu bằng một danh sách bỏ qua dùng chung với repo-map inventory; fixture có package thật cùng package nằm trong `.kilo/worktrees/x` và `.worktrees/y` chỉ cho ra package thật.
- **ac-2**: `harnix update` (không cờ mới) phát hiện lại và hợp nhất vào `.harnix/config.yaml` theo kiểu chỉ thêm: thêm package, language, technology phát hiện được mà config chưa có; giữ nguyên mọi mục đã có và các khóa khác; ghi nguyên tử, giữ quyền file; kết quả có mục `configRefreshed` (các mục đã thêm, tối đa 20 đường dẫn kèm `+N more`); `update --dry-run` báo mục sẽ thêm mà không ghi.
- **ac-3**: Làm mới là idempotent và an toàn: chạy lần hai không đổi file; config không hợp lệ hoặc project không init thì lỗi rõ ràng như `update` hiện nay và không ghi; sau khi hợp nhất, các file managed (AGENTS bootstrap, guide chọn theo config) được reconcile cùng lần chạy; một lỗi phát hiện không làm `update` thất bại (bỏ qua êm, `configRefreshed` rỗng).
- **ac-4**: Finding `config-packages-drift` của doctor (task doctor-config-packages-drift) nêu cách xử lý là chạy `harnix update`; README và PRD mô tả hành vi; toàn bộ test suite, lint, typecheck và `test:gates` pass.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Danh sách bỏ qua là dữ liệu thuần trong `src/core/stack/`, cả `detection.ts` và `inventory.ts` import từ đó; không để hai bản sao.
- Hợp nhất config là hàm thuần trong `src/core/config/` (nhận config hiện có và detection, trả config mới cùng danh sách mục đã thêm); ghi bằng `atomicWriteFile` giữ quyền; tuân hướng phụ thuộc `commands -> core -> utils`.
- Đây là thay đổi hành vi của lệnh có sẵn: `update` từ nay có thể ghi `config.yaml` (trước đây chỉ ghi managed files). Chỉ thêm, không bao giờ xóa hay sửa, và báo rõ trong `configRefreshed`; ghi vào CHANGELOG và PRD. Mục `packages` do người dùng chủ động xóa sẽ được thêm lại ở lần `update` sau; ghi rõ giới hạn này.
- `update` vẫn dùng gốc Git/project hiện hành; thông điệp và đầu ra không có đường dẫn tuyệt đối.
- Rủi ro: repo lớn có nhiều package làm config dài; giảm thiểu bằng việc chỉ thêm thư mục package thật đã qua danh sách bỏ qua và bằng `--dry-run` để xem trước.
- Tuân thủ AGENTS.md và các guide trong .harnix/spec/guides/.
