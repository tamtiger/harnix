# Gỡ các ma sát gặp khi phát triển harnix: file runtime bị commit, lint file nháp, thêm member không đổi con trỏ, sửa không đổi, output gọn và release:check (2.22.3)

- **ID:** 20261026-071222-session-dx-gaps
- **Mode:** full
- **Status:** ready/ready
- **Created:** 2026-10-26 07:12:22 +07:00
- **Updated:** 2026-10-26 07:13:07 +07:00

**Verdict:** PENDING — 0/10 acceptance criteria met

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 0% | 0/10 met or waived |
| Required checks | 0% | 0/7 passed |

## Goal

Sửa các vấn đề thực tế gặp khi dùng chính harnix để phát triển harnix trong phiên review 2.22.x, để agent đỡ phải chạy script phụ, đọc task.json hay pause rồi resume chỉ để thêm một task.

## Non-goals

- Không đổi field hay enum đóng băng của TaskRecord
- Không đổi cách phát hành hay ngân sách footprint (task 2.22.2 lo)
- Không tự promote hay reject learning

## Relevant paths

- `.gitignore`
- `eslint.config.mjs`
- `package.json`
- `scripts`
- `src/commands/status.ts`
- `src/core/doctor`
- `src/core/journal/learning-notes.ts`
- `src/core/workflow/init-task.ts`
- `src/core/workflow/transition.ts`

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- [ ] `ac-1` (pending): File runtime của harnix không còn bị commit: .harnix/tasks/.active (con trỏ theo từng người) và .harnix/tmp/ (file nháp) được ignore trong repo này, được gỡ khỏi index, và harnix doctor cảnh báo khi .active đang được git track
- [ ] `ac-2` (pending): ESLint và Prettier bỏ qua .harnix/**, nên file nháp đặt trong .harnix/tmp/ (được CLAUDE.md và AGENTS.md cho phép) không làm pnpm lint thất bại
- [ ] `ac-3` (pending): workflow --init nhận --no-activate cùng --epic hoặc đứng riêng: tạo task ở planning mà không đổi con trỏ .active của task đang làm, để thêm member vào epic hiện có hoặc tạo task tiếp nối mà không phải pause rồi resume
- [ ] `ac-4` (pending): Sửa nghĩa không đổi (--set-check, --set-criterion, --add-criterion lặp lại đúng giá trị hiện có) không còn báo lỗi contractRevision khó hiểu: lệnh trả thành công với thông báo không có gì thay đổi và không đưa task về replan
- [ ] `ac-5` (pending): workflow --transition <s>/<c> --dry-run trả gọn { valid, issues, advisories } theo mặc định; reviewChecklist chỉ in khi thêm --checklist hoặc khi có lỗi
- [ ] `ac-6` (pending): status --checks in danh sách gọn các check của task active gồm id, scope, required, criterionIds, command và trạng thái tươi, để agent không phải đọc task.json
- [ ] `ac-7` (pending): Decision có id bắt đầu bằng trace- ghi vết đo đạc hoặc quy trình và không bao giờ được --finish chụp thành learning; schema TaskRecord giữ nguyên
- [ ] `ac-8` (pending): Một lệnh pnpm release:check chạy đúng chuỗi gate phát hành (install --frozen-lockfile, build, lint, typecheck, test, pack:check, smoke:tarball, measure:init, measure:footprint, scan:release, git diff --check), in từng lệnh với exit code và thời gian, dừng ở lệnh đầu tiên lỗi; được ghi ở IMPLEMENTATION_PLAN mục 11 và AGENTS.md
- [ ] `ac-9` (pending): Gửi nhầm kết quả của workflow --inspect (có activeTask và contextDrift) làm task trong --save nhận thông báo nói rõ cần truyền đối tượng activeTask, thay cho Invalid or unsupported task record
- [ ] `ac-10` (pending): Tài liệu đồng bộ với các thay đổi trên (AGENTS.md, README, HARNIX_WORKFLOW, HARNIX_PRD, IMPLEMENTATION_PLAN, workflow.md và selfhost, skill references) và bản vá 2.22.3 phát hành với toàn bộ gate xanh

## Required checks

- [ ] `chk-runtime-files` (focused): Ignore file runtime và cảnh báo doctor — chưa chạy / not yet run
- [ ] `chk-no-activate` (focused): init --no-activate giữ con trỏ — chưa chạy / not yet run
- [ ] `chk-noop-edit` (focused): Sửa không đổi và lỗi inspect — chưa chạy / not yet run
- [ ] `chk-lean-output` (focused): dry-run gọn, status --checks và trace- — chưa chạy / not yet run
- [ ] `chk-release-check` (focused): Script release:check — chưa chạy / not yet run
- [ ] `chk-gates` (focused): Contract test, docs parity và golden — chưa chạy / not yet run
- [ ] `check-suite` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — chưa chạy / not yet run

## Evidence

_None recorded yet._
