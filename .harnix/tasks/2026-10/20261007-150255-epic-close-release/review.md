# Đóng epic tự cải tiến: tài liệu gốc, kiểm chứng tiến trình thật và phát hành 2.3.0

- **ID:** 20261007-150255-epic-close-release
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-07 15:02:55 +07:00
- **Updated:** 2026-10-07 15:40:50 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Hoàn tất epic harnix-self-improvement: đưa tài liệu gốc về khớp với các thay đổi của epic, kiểm chứng các lệnh mới bằng tiến trình thật và phát hành 2.3.0 bằng --fold-dev; đây là task cuối theo ID nên đóng epic.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Tài liệu gốc khớp với các thay đổi của epic: docs/HARNIX_PRD.md và docs/IMPLEMENTATION_PLAN.md (mục transport của hidden workflow) nêu --run-checks, --init với --text lặp và --with-check, outputTail mới của --run-check, baselineHint của --preflight, secretAdvisory của --finish --brief và advisory ready gộp; các test docs xanh.
- `ac-2` (met): Có test scenario chạy --run-checks và --init --with-check bằng tiến trình thật (không runner giả) trong project dùng một lần, nên đường chạy thật của các lệnh mới được kiểm chứng ngoài unit test.
- `ac-3` (met): Đóng epic: bản phát hành 2.3.0 tạo bằng pnpm version:sync 2.3.0 --fold-dev (CHANGELOG chỉ còn một entry 2.3.0 gồm mọi dev.1 đến dev.N, không mất dòng nào), AGENTS.md mục Current state ghi epic và phiên bản mới, mô tả epic phản ánh đủ 10 member.

## Required checks

- `check-1` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 15:40:21 +07:00)
- `check-docs` (focused): Test docs: PRD, IMPLEMENTATION_PLAN và HARNIX_WORKFLOW nhất quán, ngân sách instruction và golden xanh — pass (2026-10-07 15:39:07 +07:00)
- `check-scenario` (focused): Scenario chạy --run-checks và --init --with-check bằng tiến trình thật — pass (2026-10-07 15:39:11 +07:00)
- `check-release` (focused): Test hợp đồng release: CHANGELOG không còn entry dev của bản đã phát hành, bản mới nhất khớp package.json — pass (2026-10-07 15:39:14 +07:00)

## Decisions

- **d-split-from-batch** — Task này tách ra từ workflow-friction-batch để phần đóng epic (tài liệu gốc, kiểm chứng tiến trình thật, phát hành 2.3.0 --fold-dev) chạy sau cùng và là member cuối theo ID.
  - _Why:_ Phần ma sát vặt và phần đóng epic có rủi ro và bề mặt khác nhau; gộp một task làm task quá lớn (9 tiêu chí).
- **d-release-last** — Bước phát hành 2.3.0 --fold-dev chạy sau cùng, sau khi docs và scenario đã xong và đã chạy các check, rồi mới verify lại; không dùng git và không cài lại CLI nếu chưa được người dùng cho phép.
  - _Why:_ Gộp entry dev đổi CHANGELOG, package.json, README, skills và manifest self-host nên phải là thay đổi cuối cùng trước verify.

## Residual risks

- **r-cli-skew** (medium) — harnix trên PATH có thể cũ hơn repo nên các lệnh và hành vi mới (run-checks, with-check, baselineHint, secretAdvisory, advisory gộp) không hiện ra khi dùng thật; build và cài lại CLI cần người dùng cho phép, đặt ở bước đóng epic và phải hỏi trước.

## Evidence

- `check-docs` — pass (2026-10-07 15:39:07 +07:00): pnpm test:gates — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-scenario` — pass (2026-10-07 15:39:11 +07:00): pnpm exec vitest run test/integration/scenarios/cli-real-process.test.ts — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `check-release` — pass (2026-10-07 15:39:14 +07:00): pnpm exec vitest run test/workflow/changelog-contract.test.ts test/workflow/package-contract.test.ts — exit 0
- `check-1` — pass (2026-10-07 15:40:21 +07:00): pnpm test — exit 0
