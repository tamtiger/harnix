# Epic: Refactor skills, reference và workflow theo trần token mới

Đưa mọi trần token về một nơi, nâng trần (skill 2000, harnix-plan 1700, reference 1200, workflow 2500) đồng thời refactor workflow.md, skill chính, skill phụ, reference và docs để mỗi file nằm dưới mục tiêu, không mất quy tắc nào, và đường nạp mỗi phiên không phình.

- **Cập nhật:** 2026-11-09 14:48:12 +07:00

## Non-goals

- Không đổi hành vi của CLI hay hợp đồng đóng băng; chỉ đổi nội dung hướng dẫn, trần token và công cụ đo.
- Không nâng trần khối luôn nạp (giữ 1500) và không đổi trần của guide.
- Không đổi description (trigger) của các skill.

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261109-144813-token-budgets-single-source` | Đưa mọi trần token về một nơi và đo mức dùng | `lite` | `completed` |
| 2 | `20261109-144814-workflow-md-gates-trim` | Gọn workflow.md và các khối luôn nạp, đẩy chi tiết Gates sang reference | `lite` | `completed` |
| 3 | `20261109-144815-main-skills-refactor` | Refactor skill chính plan, implement, verify và reference của chúng | `lite` | `completed` |
| 4 | `20261109-144816-secondary-skills-and-docs-sync` | Gọn skill phụ, guide, reference còn lại và lập bảng quy tắc ↔ nơi sở hữu | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261109-144813-token-budgets-single-source` — Đưa mọi trần token về một nơi và đo mức dùng

- **Trạng thái:** `completed`
- **Mục tiêu:** Một module hằng số giữ mọi trần token (skill 2000, harnix-plan 1700, reference 1200, workflow 2500, khối luôn nạp 1500, đường nạp trực tiếp 3600, đường nạp task Full 11000); test và script đo cùng đọc từ đó, và có test trần cho từng reference.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261109-144814-workflow-md-gates-trim` — Gọn workflow.md và các khối luôn nạp, đẩy chi tiết Gates sang reference

- **Trạng thái:** `completed`
- **Mục tiêu:** Đưa workflow.md về khoảng 2200 token bằng cách rút mỗi mục Gates còn một dòng trỏ vào harnix-verify --reference gates, không mất quy tắc nào, và có chỗ cho --remove-check, lệnh gộp evidence + criterion và quy ước thời điểm review.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 3. `20261109-144815-main-skills-refactor` — Refactor skill chính plan, implement, verify và reference của chúng

- **Trạng thái:** `completed`
- **Mục tiêu:** Gọn harnix-verify (≤ 1700, tách phần finish/cancel còn dòng trỏ), harnix-plan (≤ 1550, trần 1700) và harnix-implement (≤ 1700) mà không mất quy tắc nào; tách phần Multi-Agent Worktree khỏi epic.md để mỗi reference ≤ 1200.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 4. `20261109-144816-secondary-skills-and-docs-sync` — Gọn skill phụ, guide, reference còn lại và lập bảng quy tắc ↔ nơi sở hữu

- **Trạng thái:** `completed`
- **Mục tiêu:** Tách domain-briefs.md, gọn các reference sát trần (dotnet-microservices, gates, evidence), rà skill phụ và guide, lập bảng quy tắc ↔ nơi sở hữu có test kiểm, cập nhật AGENTS.md và docs bản gốc với trần mới, rồi đóng epic bằng release 2.30.0.
- **Tiêu chí nghiệm thu:** 5 tiêu chí
