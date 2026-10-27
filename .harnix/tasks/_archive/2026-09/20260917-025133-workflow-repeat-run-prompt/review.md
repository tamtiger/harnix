# Prompt 4 — chạy workflow lặp lại theo kịch bản thực tế, tìm bug rồi fix và cải tiến

- **ID:** 20260917-025133-workflow-repeat-run-prompt
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-17T02:51:33.111Z
- **Updated:** 2026-09-17T03:08:18.667Z

## Goal

Bổ sung một prompt tái sử dụng hướng dẫn agent chạy workflow Harnix lặp nhiều vòng trên kịch bản thực tế, theo dõi quá trình chạy để tìm bug và điểm chưa tốt, rồi fix và cải tiến qua đúng lifecycle Harnix.

## Non-goals

- Không thực thi cuộc audit/fix mô tả trong prompt ở lần chạy này.
- Không sửa source, skill, template hay test của Harnix.
- Không thêm runner script vào scripts/ hoặc test/ trong task này.
- Không commit, push hoặc tạo pull request.

## Acceptance criteria

- `ac-1` (met): File `docs/prompts/workflow-repeat-run-fix.md` tồn tại, viết bằng tiếng Việt và có đủ các section bắt buộc theo convention của các prompt hiện có trong docs/prompts/.
- `ac-2` (met): Prompt mô tả đủ bốn trụ: ngân sách/vòng lặp chạy có stop condition, kịch bản thực tế kèm oracle, instrumentation theo dõi từng lần chạy, và vòng fix/cải tiến đi qua lifecycle Harnix với safety boundary rõ ràng.
- `ac-3` (met): Mọi command, script, skill và đường dẫn repository mà prompt tham chiếu đều tồn tại trong repository hiện tại.

## Required checks

- `chk-structure` (focused): Kiểm tra prompt mới có đủ các section bắt buộc. — pass (2026-09-17T03:08:10.531Z)
- `chk-references-v3` (focused): Kiem tra moi duong dan repository duoc prompt tham chieu deu ton tai, dung command khong chua backtick va khong chua backslash. — pass (2026-09-17T03:08:10.531Z)

## Decisions

- **dec-1** — Đặt prompt tại docs/prompts/workflow-repeat-run-fix.md và đánh số là Prompt 4.
  - _Why:_ docs/prompts/ đã là nơi chứa ba prompt tái sử dụng đánh số 1-3 với cùng cấu trúc; giữ convention giúp người dùng chọn đúng prompt.
- **dec-2** — Viết toàn bộ nội dung bằng tiếng Việt, giữ nguyên identifier/command/path.
  - _Why:_ Ba prompt hiện có đều dùng tiếng Việt cho prose và tiếng Anh cho identifier.
- **dec-3** — Prompt yêu cầu ghi run log vào .artifacts/ hoặc temp ngoài repo thay vì thư mục được track.
  - _Why:_ .artifacts/ đã nằm trong .gitignore nên evidence của nhiều vòng chạy không làm bẩn worktree.
- **dec-4** — Task này chạy Lite thay vì Full.
  - _Why:_ Docs-only prose, một file, không đổi frozen public contract, không có quyết định sản phẩm vật chất.

## Evidence

- `chk-references` — fail (2026-09-17T03:01:22.735Z): Command cua chk-references chua portable: chuoi node -e chua backtick nen shell parse loi truoc khi Node chay.
- skipped (2026-09-17T03:01:43.494Z): Task contract revised at persisted replan: Check chk-references khong chay duoc vi command chua backtick lam shell parse loi; giu nguyen dinh nghia cu o muc khong bat buoc va thay bang chk-references-v2 portable voi cung pham vi criterion.
- `chk-references-v2` — fail (2026-09-17T03:07:01.169Z): Command cua chk-references-v2 mat backslash khi di qua transport nen Node bao SyntaxError truoc khi kiem tra duoc duong dan.
- skipped (2026-09-17T03:07:02.090Z): Task contract revised at persisted replan: Command cua chk-references-v2 mat backslash khi di qua transport nen regex hong va Node bao SyntaxError; thay bang chk-references-v3 khong dung backslash, cung pham vi criterion ac-3.
- `chk-structure` — pass (2026-09-17T03:08:10.531Z): structure ok: 14 sections. Snapshot truoc va sau khop.
- `chk-references-v3` — pass (2026-09-17T03:08:10.531Z): paths ok: 22. Moi duong dan repository duoc tham chieu deu ton tai; snapshot truoc va sau khop.
