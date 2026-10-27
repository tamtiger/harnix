# Epic: Áp dụng có chọn lọc agent-skills và mattpocock/skills vào Harnix

Đưa các mẫu đã kiểm chứng (grilling, chống bào chữa, phản biện, phát hiện nới ngưỡng, vòng phản hồi debug) vào skill Harnix dưới dạng reference nạp theo yêu cầu. Gồm 2 member: (1) ghi nhận nguồn MIT, (2) thêm toàn bộ reference và đóng epic bằng bản phát hành minor 2.5.0.

- **Cập nhật:** 2026-10-14 10:30:51 +07:00

## Non-goals

- Không thêm skill, lệnh, persona hay subagent bắt buộc
- Không tích hợp issue tracker, marketplace hay Git tự động
- Không vượt ngân sách token

## Next task

Không còn task nào chưa hoàn tất.

## Members (2 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261014-090610-upstream-source-intake` | Ghi nhận nguồn addyosmani/agent-skills và mattpocock/skills | `lite` | `completed` |
| 2 | `20261014-090611-plan-grilling-reference` | Thêm các reference từ nguồn ngoài vào skill Harnix và phát hành 2.5.0 | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261014-090610-upstream-source-intake` — Ghi nhận nguồn addyosmani/agent-skills và mattpocock/skills

- **Trạng thái:** `completed`
- **Mục tiêu:** Ghi provenance, giấy phép MIT và mapping reuse/adapt/remove cho hai repo nguồn vào NOTICE, docs/UPSTREAM_BASELINE.md và docs/UPSTREAM_MAPPING.md.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 2. `20261014-090611-plan-grilling-reference` — Thêm các reference từ nguồn ngoài vào skill Harnix và phát hành 2.5.0

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm reference grilling (harnix-plan), rationalizations (harnix-verify), phản biện và phát hiện nới ngưỡng (harnix-verification-gap), hai trục Standards/Spec (harnix-review), feedback-loop (harnix-debug); đóng epic bằng bản phát hành minor 2.5.0 (--fold-dev).
- **Tiêu chí nghiệm thu:** 5 tiêu chí
