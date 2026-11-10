# PRD: Đồng bộ tài liệu, skill và token budget (đóng epic)

## Context & Problem Statement

Review phát hiện lệch giữa tài liệu, template và skill: template `workflow.md` (cài vào mọi repo người dùng) nhắc lệnh chỉ có trong repo Harnix (`pnpm run test:gates`, `pnpm version:sync`, `pnpm selfhost:sync`) và test hiện còn khóa điều đó; `AGENTS.md` mục 8 và skill dự án `harnix-self-host` nêu đường dẫn không tồn tại (`src/templates/AGENTS.md`, `rules/AGENTS.md`); `AGENTS.md` liệt kê số trần token dù nói không viết số trần ở nơi khác; bảy skill technique dẫn một tệp nghiên cứu nội bộ không có trong gói; sáu reference không có dòng nào trỏ tới; `harnix-verify` và `harnix-plan` mang quy tắc riêng của repo Harnix; công cụ đo token tính sai trần của skill technique; README, PRD và danh mục tài liệu lệch.

## Scope & Boundaries

- Trong phạm vi: `src/templates/harnix/workflow.md` và `.harnix/workflow.md`, `AGENTS.md`, `.harnix/spec/skills/harnix-self-host/SKILL.md`, `src/skills/**`, `scripts/token-budget-usage.mjs`, `README.md`, `docs/HARNIX_PRD.md` và test tương ứng; bản phát hành đóng epic.
- Ngoài phạm vi: nâng trần token, đổi frozen contract, sửa ngày lịch sử trong CHANGELOG.

## Anchored Acceptance Criteria

- ac-1: template `workflow.md` không còn lệnh riêng repo; test cập nhật; `selfhost:sync` đã chạy.
- ac-2: `AGENTS.md` mục 8 và skill `harnix-self-host` dùng đường dẫn đúng; `AGENTS.md` không liệt kê số trần token.
- ac-3: skill technique bỏ tham chiếu treo; reference mồ côi có dòng trỏ tới; quy tắc riêng repo ra khỏi skill phục vụ người dùng.
- ac-4: `budgetUsage` dùng trần skill technique; README, PRD và danh mục docs đồng bộ.

## Architectural & Safety Constraints

Tuân theo `AGENTS.md`: không nâng trần token, mỗi `SKILL.md` đã sửa phải qua checklist (không lệnh riêng repo, còn trong ngân sách, mỗi reference có dòng trỏ tới, dòng phiên bản cập nhật), template workflow đổi thì chạy `pnpm selfhost:sync`.
