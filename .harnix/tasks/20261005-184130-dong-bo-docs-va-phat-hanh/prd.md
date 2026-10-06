# PRD: Đồng bộ tài liệu, skill, test cấu trúc và phát hành 2.1.0

## Vấn đề

Sau bốn task đầu của epic, code đã đúng nhưng bề mặt người dùng thấy còn lệch: test cấu trúc bỏ sót kiểu import nguy hiểm, `workflow --init` có mặc định cứng và nhận tham số lỏng, skill chứa quy ước riêng của repo Harnix, số platform vẫn ghi 3-4 ở nhiều nơi, vài quy tắc/số liệu trong docs và help mâu thuẫn nhau, CHANGELOG nêu tên repo khách hàng, và chưa có bản phát hành 2.1.0.

## Ngoài phạm vi

- Không thêm tính năng sản phẩm hay platform mới; không commit/push/publish khi chưa được duyệt.

## Tiêu chí nghiệm thu

- `ac-1`: `architecture.test.ts` bắt dynamic `import()`, side-effect import, `fs` không có `node:`, cấm `core` import `configurators`; có fixture vi phạm.
  **Verifies:** `check-structure`.
- `ac-2`: `workflow --init` lấy lệnh/input mặc định từ `verify-plan`, `--mode` sai báo lỗi, slug không kết thúc bằng `-`, thời gian chỉ qua `clock.ts`, `--input` tách dấu phẩy.
  **Verifies:** `check-structure`.
- `ac-3`: skill/reference không còn quy ước riêng của repo; `replan.md` và `ready-review.md` được bổ sung.
  **Verifies:** `check-structure` (test catalog, ngân sách instruction, skill-sources).
- `ac-4`: số platform là 6 ở mọi bề mặt nêu trong task; `supported-platforms.test.ts` giữ danh sách không lệch.
  **Verifies:** `check-structure`.
- `ac-5`: quy tắc và số liệu thống nhất giữa docs, help, code (Full/Epic dừng ở ready, `status --summary` dưới 80 token, evidence.md, schema transports, sàn coverage, docs/prompts).
  **Verifies:** `check-structure`.
- `ac-6`: CHANGELOG sạch tên khách hàng; `version:sync 2.1.0` đúng một lần, một entry gộp epic; version/CHANGELOG/template khớp; `doctor` không tăng cảnh báo.
  **Verifies:** `check-version`, `check-scan`.
- `ac-7`: `typecheck`, `lint`, `test` (coverage, không hạ ngưỡng) exit 0 trên cây cuối.
  **Verifies:** `check-typecheck`, `check-lint`, `check-suite`.
- `ac-8`: reference `multi-repo` mới, `evidence.md` mô tả `--run-check`/breaker, `harnix-debug` trỏ tới breaker, cookbook nhắc reference; test catalog và ngân sách vẫn xanh.
  **Verifies:** `check-structure`.
- `ac-9`: `HARNIX_UPDATE_GOLDEN` làm test thất bại trong CI; nâng sàn đếm test/assertion; sửa lý do miễn trừ `src/index.ts` và comment ESLint lỗi thời; không thêm miễn trừ mới.
  **Verifies:** `check-structure`, `check-lint`.

## Ghi chú từ khảo sát

- Số dòng trong ac-5 không còn khớp: quy tắc Full/Epic dừng nằm ở `HARNIX_WORKFLOW.md` dòng 23 và 150 (không phải 136), PRD:402 chưa nhắc Full/Epic; sẽ căn theo nội dung, không theo số dòng.
- Help `status --summary` ghi "under 100 tokens" ở `src/cli-workflow-commands.ts:67`, template ghi 80.
- Sàn coverage trong `vitest.config.ts` là 95/95/98.6/89; `test/README.md` đang ghi 93.1/98.1/86.8.

## Rủi ro

- Test catalog, ngân sách instruction (skill ≤ 2000 token, Full path ≤ 15000, `SKILL.md` < 500 dòng) có thể vượt khi thêm reference: reference mới tải theo yêu cầu nên không tính vào đường đi mặc định, nhưng phải chạy test để chắc.
- Bộ quét import chặt hơn có thể lộ vi phạm sẵn có: xử lý bằng sửa code, không thêm miễn trừ (danh sách miễn trừ chỉ được co lại).
- `version:sync` chỉ chạy một lần, sau khi mọi thay đổi release-visible khác xong.
