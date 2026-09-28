# [01] Đưa HEAD về xanh và sửa lệch validator C1–C3

- **ID:** 20260928-205759-fix-baseline
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-28T20:57:59.000+07:00
- **Updated:** 2026-09-28T14:28:57.333Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Sửa 2 test đỏ sau commit pause (test/workflow/cli-contract.test.ts kỳ vọng 16 lệnh; test/workflow/self-host.test.ts hash workflow.md lệch), rebuild dist, sinh lại .harnix/workflow.md và .harnix/.template-hashes.json bằng harnix update (không sửa tay; root cause: commit e3713ce đổi template nhưng không sinh lại managed output), sửa mô tả CLI thiếu Claude Code (src/cli-program.ts:62), sửa C1–C3 (lệch thật giữa skill/workflow.md và validator: ví dụ slug không có tiền tố ngày giờ, danh sách field TaskRecord thiếu decisions/residualRisks/epicId/findings, envelope thiếu epic/roadmapMembers). Lỗi renderer roadmap thuộc unify-epic-naming. C4–C8 thuộc slim-instructions.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không sửa C4–C8 (skill sẽ được viết lại ở slim-instructions).

## Acceptance criteria

- `ac-green` (met): pnpm test pass toàn bộ trên HEAD; dist chứa lệnh pause.
- `ac-contradictions` (met): C1–C3 trong research/inventory.md của task audit được sửa khớp validator.

## Required checks

- `check-suite` (focused): Toan bo typecheck, lint va test pass tren HEAD — pass (2026-09-28T21:28:44.000+07:00)
- `check-contract-parity` (focused): Template va skill khop validator (C1-C3): field list, envelope shape, task ID slug — pass (2026-09-28T21:28:45.000+07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).

## Evidence

- `check-suite` — pass (2026-09-28T21:28:44.000+07:00): pnpm typecheck + lint + test: 82 file, 660 pass, 1 skip; HEAD xanh; dist co lenh pause.
- `check-contract-parity` — pass (2026-09-28T21:28:45.000+07:00): templates.test.ts + skill-sources.test.ts pass: field list, envelope shape (epic/roadmapMembers), task ID slug khop validator.
