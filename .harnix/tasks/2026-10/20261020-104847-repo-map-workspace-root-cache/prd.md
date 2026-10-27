# PRD: repo-map --workspace dùng cache của workspace root và không tạo .harnix rác

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Báo cáo từ workspace đa repo (Payment Hub 9 sub-repo, Long Châu 4 sub-repo): sau `harnix repo-map --refresh` ở thư mục gốc, `harnix repo-map --query <t> --workspace` trả `{"members":[{"name":"frt-payment-config","records":0,"status":"missing"},...],"results":[]}` cho mọi sub-repo.

Nguyên nhân (đã đối chiếu `src/core/repo-map/workspace.ts`): `queryWorkspaceRepoMap` đọc `.harnix/cache/repo-map-v1.json` của từng member bằng `readRepoMap(member.path)`. `repo-map --refresh` (không `--workspace`) chỉ ghi cache vào chính root, nơi quét cả cây thư mục (2599 bản ghi, đường dẫn tính từ root nên đã chứa tiền tố thư mục member). Sub-repo không có `.harnix` riêng nên bị gắn `missing`.

Có một hệ quả cùng gốc: `refreshWorkspaceRepoMap` gọi `refreshRepoMap({ root: member.path })` cho MỌI member, và `writeRepoMap` tạo `.harnix/cache/` rồi ghi file. Vì vậy `repo-map --refresh --workspace` sinh thư mục `.harnix/` untracked trong các sub-repo chưa init, đúng hiện tượng "thư mục rác" đã báo trước đó (lần trước tôi kết luận nhầm là không lệnh nào ghi `.harnix`; bài test read-only đã đúng nhưng không bao gồm `--refresh`, vốn là lệnh ghi có chủ đích).

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope:** đường truy vấn `--query ... --workspace`, đường làm mới `--refresh --workspace`, thông báo khi thiếu cache.
- **Out-of-Scope (Non-Goals):** không đổi định dạng `repo-map-v1.json` (schemaVersion 1, extractorVersion 1); không tự chạy `harnix init`; không đổi `--events --workspace` (dùng `discoverWorkspaceMembers` riêng).
- Phần thêm vào đầu ra là tương thích ngược: trường `source` của member và gợi ý khi `missing` là thêm mới.

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1** Phục vụ từ cache root: member không có cache riêng nhưng root có `repo-map-v1.json` được trả `status: "ready"`, `source: "workspace"`, `records` là số bản ghi thuộc tiền tố `<member>/`; đường dẫn kết quả giữ dạng `<member>/<path>` không lặp tiền tố.
- **ac-2** Thiếu hay hỏng: không có cache nào thì `missing` kèm gợi ý `repo-map --refresh`; cache hỏng thì `invalid`; member có cache riêng dùng `source: "member"` và không đọc cache root.
- **ac-3** Refresh không tạo rác: không bao giờ tạo `.harnix` trong thư mục chưa có `.harnix/config.yaml`; member đã init refresh như cũ; member chưa init được phủ bởi cache root khi root đã init; cả hai chưa init thì báo rõ cần `harnix init` và không ghi gì.
- **ac-4** Toàn bộ test suite và `test:gates` pass.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Quyết định chờ xác nhận: phương án A (không bao giờ tạo `.harnix` trong thư mục chưa init, phủ bằng cache root) hay B (giữ ghi từng member, chấp nhận thư mục rác). Mặc định A vì AGENTS.md cấm tạo state ngoài ý muốn trong repo chưa init.
- Đọc cache root dùng `readRepoMap(root)` hiện có (đã `resolveSafeHarnixPath`, chặn symlink/junction); lọc theo tiền tố bằng so khớp đường dẫn POSIX đã chuẩn hóa, không dùng đường dẫn tuyệt đối trong đầu ra.
- Hướng phụ thuộc `commands -> core -> utils` giữ nguyên; `workspace.ts` dưới 300 dòng (hiện 207).
- Rủi ro: cache root cũ so với nội dung member (stale) cho kết quả lệch; giảm thiểu bằng `source` trong đầu ra và gợi ý `--refresh`. Không dùng `inventoryFingerprint` để đoán độ mới trong task này.
