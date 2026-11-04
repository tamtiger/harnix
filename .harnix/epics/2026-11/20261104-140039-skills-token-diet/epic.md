# Epic: Giảm token nạp của skills Harnix

Áp dụng kết quả research token (epic session-friction-fixes, research.md): bỏ phần lặp trong đầu ra harnix skill và rút gọn harnix-plan là skill nạp nhiều nhất, để giảm token mỗi task mà không mất quy tắc bắt buộc.

- **Cập nhật:** 2026-11-04 14:00:39 +07:00

## Non-goals

- Không thêm telemetry để đếm lần nạp skill.
- Không đổi quy tắc workflow, chỉ đổi cách trình bày và nơi đặt nội dung.
- Chưa rút gọn reference plan/epic (phương án C): đo lại sau khi xong.

## Next task

Không còn task nào chưa hoàn tất.

## Members (2 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261104-140040-skill-output-dedupe` | Hướng dẫn nạp skill bằng --raw để bỏ phần JSON lặp | `lite` | `completed` |
| 2 | `20261104-140041-plan-skill-trim` | Rút gọn harnix-plan/SKILL.md và chuyển phần ít dùng sang reference | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261104-140040-skill-output-dedupe` — Hướng dẫn nạp skill bằng --raw để bỏ phần JSON lặp

- **Trạng thái:** `completed`
- **Mục tiêu:** Theo research.md (mục 3): đầu ra JSON của harnix skill <name> thừa khoảng 110 đến 130 token mỗi lần nạp so với --raw (description, version và frontmatter lặp, ký tự escape). Hướng đã chọn (người dùng, 2026-11-04): không đổi hợp đồng byte-identical của content mà hướng dẫn agent nạp bằng --raw.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261104-140041-plan-skill-trim` — Rút gọn harnix-plan/SKILL.md và chuyển phần ít dùng sang reference

- **Trạng thái:** `completed`
- **Mục tiêu:** Theo research.md (phương án B): harnix-plan là skill nạp nhiều nhất (khoảng 106000 token qua 59 lần nạp) và đang 1798 trên trần 1800 nên mỗi lần bump version có nguy cơ vượt trần; rút gọn khoảng 15 đến 20% mà không mất quy tắc bắt buộc.
- **Tiêu chí nghiệm thu:** 2 tiêu chí
