# PRD: Sửa lỗi từ đợt review sau v2.22.0

## Context & Problem Statement

Bốn subagent review toàn bộ thay đổi của commit e3b28a8 (v2.22.0) và phát hiện:

- `retryOnTaskConflict` bọc toàn bộ handler, nên chạy lại tiến trình check (bỏ mất kết quả fail), đọc lại stdin đã cạn (`--migrate` có thể mất override) và lặp lệnh lưu nhiều lần (`set-criterion` có thể dừng ở `replan`).
- `isolate: false` làm `vi.mock` của `learning-capture-failure` rò sang `learning-automation` (fail khi xáo thứ tự với seed 1 và 2).
- Quyết định `adopt` trái với `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`: file chưa có trong manifest phải giữ nguyên.
- Mục 4.25 của `docs/IMPLEMENTATION_PLAN.md` và `docs/HARNIX_PRD.md` chưa ghi lỗi JSON của `workflow`; spec `status --criteria` chưa có dạng không có task.
- Hai regex mới chạy bậc hai (2,5 giây và 3,7 giây với input lớn).
- Gợi ý id gần nhất đưa `ac-1` cho `ac-3`.
- Mô tả circuit breaker cũ còn ở bốn chỗ; `total` của `harnix epic` đếm cả epic lỗi; test ghi song song có thể chập chờn; cùng các lỗi P3.
- Gate `measure:footprint` đỏ (47,7%, dưới ngưỡng 50%) từ v2.21.0 do sáu reference `harnix-verify` được cài lặp ở từng nền tảng.

## Scope & Boundaries

Trong phạm vi: ac-1 đến ac-12 trong `task.json` (ac-12 là đợt rà soát đồng bộ tài liệu theo yêu cầu người dùng: PRD, IMPLEMENTATION_PLAN, AGENTS.md, harnix-plan SKILL.md và references). Ngoài phạm vi: tính năng mới; hạ bất kỳ ngưỡng nào; bypass override bằng homoglyph (giữ làm rủi ro tồn dư); tiêu đề CJK mất hết thành dấu hỏi trong text ASCII (sửa sẽ chặn lại câu thường kết thúc bằng ba dấu hỏi).

## Anchored Acceptance Criteria

ac-1 đến ac-11 trong `task.json`; mỗi tiêu chí có check tập trung trong Verification Matrix của `plan.md`.

## Architectural & Safety Constraints

Tuân thủ AGENTS.md và `.harnix/spec/guides/`. Bỏ `adopt` là quay về hành vi đã duyệt trong kế hoạch Phase 6. Rút gọn reference không được làm mất nội dung bắt buộc: test lean-workflow, catalog và docs parity phải xanh. Bản vá `2.22.1`, task đứng riêng (epic đã đóng ở 2.22.0).
