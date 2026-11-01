# Bổ sung cookbook và skill cho các lệnh hay bị gọi sai

- **ID:** 20261101-082452-cookbook-skill-guidance
- **Mode:** lite
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** planning/planning
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 08:24:43 +07:00

**Verdict:** PENDING — 0/3 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/3 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Đóng B1/C1/C3/R7–R9/R11: cookbook thiếu `--set-baseline`, `--cancel`, `pause`, `repo-map`; thiếu hướng dẫn heredoc có dấu nháy và `PYTHONIOENCODING`; Commit discipline không lặp quy tắc nhánh và pipe. Thành viên cuối đóng epic.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/templates/harnix/workflow.md`
- `src/skills/harnix-verify/references/cookbook-notes.md`

## Acceptance criteria

- [ ] `ac-1` (pending): Cookbook trong `workflow.md` có dòng cho `--set-baseline` đầy đủ, `--cancel`, `pause` (chỉ `--dry-run`), `repo-map` và ghi `status` không nhận tham số vị trí.
- [ ] `ac-2` (pending): `cookbook-notes` hướng dẫn script phụ có dấu nháy (ghi file vào `.harnix/tmp/` rồi chạy), `PYTHONIOENCODING`; Commit discipline nhắc `git branch --show-current` và không pipe `git checkout`.
- [ ] `ac-3` (pending): Đã chạy `pnpm selfhost:sync`, skill đúng ngân sách token, phát hành minor đóng epic với `--fold-dev`.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
