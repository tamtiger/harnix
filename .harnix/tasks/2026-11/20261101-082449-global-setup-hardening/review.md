# Siết setup global: notice không bị nuốt, hook Codex cũ, an toàn symlink

- **ID:** 20261101-082449-global-setup-hardening
- **Mode:** full
- **Epic:** 20261101-082443-harnix-session-review
- **Status:** planning/planning
- **Created:** 2026-11-01 08:24:43 +07:00
- **Updated:** 2026-11-01 08:24:43 +07:00

**Verdict:** PENDING — 0/4 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/4 met or waived |
| Required checks | 0% | 0/2 passed |

## Goal

Đóng R4–R10 của review global và S1/S2: notice bị nuốt khi thiếu launcher, thiếu migrate hooks.json Codex, mã `test-*-required` phát khi có VITEST, symlink dotfile, đọc symlink ngoài root.

## Non-goals

- Không đổi frozen contract nếu chưa cập nhật PRD, workflow, migration và test trong cùng thay đổi.
- Không commit, branch, push hay publish.

## Relevant paths

- `src/core/global/setup.ts`
- `src/core/doctor/global.ts`
- `src/utils/atomic-write.ts`

## Acceptance criteria

- [ ] `ac-1` (pending): Notice trust/precedence/shadow của Codex, Antigravity, OpenCode luôn hiển thị kể cả khi thiếu launcher trên PATH.
- [ ] `ac-2` (pending): Hook Harnix cũ trong `$CODEX_HOME/hooks.json` được migrate hoặc doctor báo rõ; có fixture.
- [ ] `ac-3` (pending): Mã `test-home-required`/`test-command-lookup-required` không kích hoạt ngoài test thật; ghi atomic giữ nguyên symlink nội bộ; đọc skill/stack không theo symlink ra ngoài root.
- [ ] `ac-4` (pending): Mọi test dùng home dùng một lần, không đụng home thật; `pnpm test:gates` xanh.

## Required checks

- [ ] `chk-focused` (focused): Cổng hợp đồng và test tập trung — chưa chạy / not yet run
- [ ] `chk-suite` (full): Toàn bộ test của dự án xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
