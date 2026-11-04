# Đo và research tối ưu token của skills và references

- **ID:** 20261104-113030-skills-token-research
- **Mode:** lite
- **Epic:** 20261104-112537-session-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-04 11:30:30 +07:00
- **Updated:** 2026-11-04 13:25:33 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 1/1 met or waived |
| Required checks | 100% | 2/2 passed |

## Goal

Người dùng xác định tối ưu token của skills và references là phần quan trọng (không phải dung lượng setup), nhưng chưa có số đo; đo token nạp thực tế của 14 SKILL.md, các reference và khối luôn nạp, rồi đề xuất cách giảm. Task này chỉ research, không sửa code.

## Acceptance criteria

- [x] `ac-1` (met): research.md của epic ghi số token đo được (pnpm measure:tokens và đo bổ sung) theo từng skill, từng reference và khối luôn nạp, kèm tần suất nạp theo luồng làm việc (plan, implement, verify), ít nhất hai phương án giảm token có rủi ro và ngân sách instruction-budget tác động, và một khuyến nghị để người dùng duyệt trước khi tạo task thực hiện.

## Required checks

- [x] `check-1` (focused): Kiểm chứng: Đo và research tối ưu token của skills và references — pass (2026-11-04 13:23:59 +07:00)
- [x] `chk-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-04 13:25:28 +07:00)

## Decisions

- **dec-no-release** — Task research không bump version và không đóng epic: chỉ ghi research.md; bản phát hành do task cuối theo thứ tự epic (doctor-journal-finding-dedupe) đảm nhiệm.
  - _Why:_ Quyết định của người dùng ngày 2026-11-04; task chỉ ghi tài liệu nghiên cứu nên không thay đổi package.

## Evidence

- `check-1` — pass (2026-11-04 13:23:59 +07:00): pnpm test:gates — exit 0
- `chk-suite` — pass (2026-11-04 13:25:28 +07:00): pnpm test — exit 0
