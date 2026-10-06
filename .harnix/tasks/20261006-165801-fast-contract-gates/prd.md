# PRD: Cổng hợp đồng chạy nhanh

## Vấn đề

Check tập trung của task thường bỏ sót các test hợp đồng (test-structure, cli-contract, architecture, tài liệu, golden) nên chỉ phát hiện ở `check-suite` rất lâu; `HARNIX_UPDATE_GOLDEN=1` có thể ghi golden chứa lỗi mới mà không ai thấy; đọc kết quả suite tốn token vì reporter mặc định in dài.

## Phạm vi

- `pnpm test:gates`: chạy các test hợp đồng trong vài giây.
- Hướng dẫn lập kế hoạch (skill `harnix-plan`, template workflow) nêu `pnpm run test:gates` là check tập trung gợi ý cho task đổi CLI, tài liệu hoặc cấu trúc test.
- Guard golden: `HARNIX_UPDATE_GOLDEN=1` từ chối ghi khi scenario sinh trường `error` mới, và in danh sách đường dẫn thay đổi.
- `pnpm test:failures`: chạy toàn bộ suite bằng reporter JSON, chỉ in tên test lỗi cùng thông điệp ngắn.

## Không thuộc phạm vi

Không nới ngưỡng hay bỏ test cấu trúc; không đổi nội dung golden hiện có.

## Tiêu chí chấp nhận

### ac-1: `pnpm test:gates`

Script chạy test-structure, cli-contract, architecture, docs-task-contract, skill-sources, instruction-budget và behavior-snapshot.

**Verifies:** `check-gates` cùng `check-suite`.

### ac-2: Hướng dẫn kế hoạch

Skill `harnix-plan` và template workflow nêu `test:gates` như check tập trung gợi ý.

**Verifies:** `check-docs` cùng `check-suite`.

### ac-3: Guard golden

`HARNIX_UPDATE_GOLDEN` từ chối ghi khi có trường `error` mới và in đường dẫn thay đổi; hàm so sánh có test.

**Verifies:** `check-gates` (behavior-snapshot) cùng `check-suite`.

### ac-4: `pnpm test:failures`

Script chạy suite bằng reporter JSON và chỉ in test lỗi kèm dòng đầu của thông điệp; hàm tóm tắt có test.

**Verifies:** `check-failures` cùng `check-suite`.

## Rủi ro

Danh sách file của `test:gates` phải được giữ khi đổi tên test; `test-structure` và package-contract bắt thiếu script.
