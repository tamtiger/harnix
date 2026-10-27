# PRD - Giam token lang phi (3 cai tien)

Nguon ton token lon nhat: --save envelope fail nhieu lan (validator throw loi dau -> gui lai nguyen khoi), agent do schema bang fail, cookbook thieu mau.

## Acceptance criteria
- ac-aggregate-errors - Verifies: test/unit/core/tasks/task-validate.test.ts case nhieu loi + case cu van pass.
- ac-plan-save-constraints - Verifies: skill-sources/persistence-guidance + doc tay.
- ac-cookbook-save - Verifies: persistence-guidance kiem cookbook.

## Non-goals
Khong doi rang buoc schema; khong doi noi dung message cu; khong dong rule always-loaded.
