# PRD: Gate footprint theo ngân sách byte và các khoảng trống sau review 2.22.1

## Context & Problem Statement

`pnpm measure:footprint` đo dung lượng đĩa mà `harnix setup` ghi vào thư mục người dùng (`.agents`, `.codex`, `.gemini`, `.kiro`), không đo token agent nạp vào ngữ cảnh; token đã có gate riêng (`measure:tokens`, ngân sách skill). Gate hiện đòi footprint giảm ít nhất 50% so với baseline template Trellis (236 file, 1.343.579 byte, `docs/UPSTREAM_BASELINE.md` mục 5). Mỗi reference của skill được ghi ra bốn nơi (một bản cho mỗi platform), nên thêm 1 KB hướng dẫn tốn khoảng 4 KB footprint. Ở 2.22.1 footprint chỉ còn dư khoảng 650 byte so với ngưỡng, nên mọi bổ sung hướng dẫn đều bị gate chặn dù không tốn token nào khi agent chạy.

Review 2.22.1 còn tìm thấy: guard `vi.mock` bỏ sót `vi.doMock`; `closestMatch` coi `ac-01` và `ac-1` là anh em khác số; JSDoc `finishWorkflowReport` gắn nhầm; và sáu chỗ tài liệu bị thu hẹp khi rút gọn reference (`--task`, `--exit-code`, lối ra của breaker, vế "chỉ một pass hợp lệ hoặc `--reset-breaker` mới reset", evidence ngày tương lai, pointer `--run-checks`, phạm vi digest).

## Scope & Boundaries

Trong phạm vi: ac-1 đến ac-5 trong `task.json`. Đây là **thay đổi một tiêu chí chấp nhận của sản phẩm** (PRD, `UPSTREAM_BASELINE.md` mục 5, `IMPLEMENTATION_PLAN.md`), do người dùng quyết định ngày 2026-10-26: mốc 50% so với Trellis chuyển thành số tham khảo lịch sử, gate hiện hành là ngân sách byte.

Ngoài phạm vi: không cài `references/` theo cách khác, không đổi ngân sách token.

## Anchored Acceptance Criteria

ac-1 đến ac-5 trong `task.json`; mỗi tiêu chí có check tập trung trong Verification Matrix của `plan.md`.

## Architectural & Safety Constraints

Gate mới không được yếu đi so với hiện tại ở thời điểm đổi: ngân sách ban đầu bằng số đo thực làm tròn lên 1 KiB, nên footprint không được lớn hơn mức hiện có trừ khi người dùng nâng ngân sách có lý do. Ngân sách là file được commit (`scripts/footprint-budget.json`), chỉ nâng bằng thay đổi có chủ đích, giống ngưỡng coverage. Tuân thủ AGENTS.md và `.harnix/spec/guides/`.
