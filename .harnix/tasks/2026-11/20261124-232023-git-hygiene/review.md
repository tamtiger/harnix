# Giảm nhiễu git: .harnix/.gitignore và .gitattributes do init và update ghi

- **ID:** 20261124-232023-git-hygiene
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 23:20:23 +07:00
- **Updated:** 2026-11-25 19:54:03 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 1 | risk-git-existing-repos: low |

## Goal

Bớt nhiễu git cho repo dùng Harnix: file ignore và line ending của riêng .harnix do init và update ghi, mà không đụng file gốc của người dùng.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `package.json`
- `scripts/exercise-git-hygiene.mjs`
- `src/commands/init.ts`
- `src/commands/update.ts`
- `src/core/doctor/project-runtime.ts`
- `src/templates/harnix/git-files.ts`
- `test/**`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +7 / -7 |
| `CHANGELOG.md` | modified | +30 / -0 |
| `README.md` | modified | +6 / -1 |
| `docs/HARNIX_PRD.md` | modified | +8 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +6 / -4 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-advisories.mjs` | added | - |
| `scripts/exercise-context-cost.mjs` | added | - |
| `scripts/exercise-git-hygiene.mjs` | added | - |
| `scripts/exercise-run-check.mjs` | added | - |
| `scripts/exercise-technique-hint.mjs` | added | - |
| `src/commands/internal-context.ts` | modified | +9 / -1 |
| `src/commands/update.ts` | modified | +8 / -0 |
| `src/commands/workflow-batch.ts` | added | - |
| `src/commands/workflow-command.ts` | modified | +8 / -0 |
| `src/commands/workflow-flags.ts` | modified | +18 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -6 |
| `src/core/config/config-schema.ts` | modified | +17 / -3 |
| `src/core/config/config-validate.ts` | modified | +7 / -0 |
| `src/core/config/config.ts` | modified | +2 / -0 |
| `src/core/context/effective-context.ts` | modified | +1 / -0 |
| `src/core/doctor/project-runtime.ts` | modified | +2 / -2 |
| `src/core/journal/learning-summary.ts` | modified | +33 / -11 |
| `src/core/status.ts` | modified | +4 / -2 |
| `src/core/workflow/check-log.ts` | added | - |
| `src/core/workflow/check-output.ts` | modified | +3 / -0 |
| `src/core/workflow/checks-batch.ts` | added | - |
| `src/core/workflow/evidence-mode-advisory.ts` | added | - |
| `src/core/workflow/exercise-advisory.ts` | modified | +6 / -1 |
| `src/core/workflow/finish-advice.ts` | modified | +3 / -13 |
| `src/core/workflow/git-advisories.ts` | added | - |
| `src/core/workflow/index.ts` | modified | +1 / -0 |
| `src/core/workflow/preflight.ts` | modified | +5 / -2 |
| `src/core/workflow/ready-review.ts` | modified | +1 / -0 |
| `src/core/workflow/relevant-paths.ts` | added | - |
| `src/core/workflow/run-check.ts` | modified | +43 / -7 |
| `src/core/workflow/run-checks.ts` | modified | +3 / -0 |
| `src/core/workflow/schema.ts` | modified | +3 / -3 |
| `src/core/workflow/secret-scan-changes.ts` | modified | +3 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +14 / -0 |
| `src/core/workflow/technique-hint.ts` | added | - |
| `src/core/workflow/transition-advisories.ts` | added | - |
| `src/core/workflow/transition.ts` | modified | +9 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-bugfix-preserve/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-debug/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-exercise/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-flaky-test/SKILL.md` | modified | +1 / -1 |
| `src/skills/harnix-implement/SKILL.md` | modified | +2 / -2 |
| `src/skills/harnix-migration-safety/SKILL.md` | modified | +1 / -1 |

_(45 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): `harnix init` và `harnix update` ghi `.harnix/.gitignore` (`cache/`, `tmp/`, `tasks/.active`) và `.harnix/.gitattributes` (`* text eol=lf`) có đánh dấu managed, idempotent, không ghi đè bản người dùng đã sửa (theo manifest hash), không đụng `.gitignore` hay `.gitattributes` gốc; nằm trong manifest và `uninstall --purge` gỡ chúng.
- [x] `ac-2` (met): Finding doctor `cache-tracked` và `active-pointer-tracked` in đúng lệnh `git rm --cached ...` cần chạy; harnix không tự chạy git; mức severity không đổi.
- [x] `ac-3` (met): Journal vẫn được theo dõi mặc định (decision ghi lại lý do: ignore sẽ mất lịch sử khi đổi máy); tài liệu nói rõ cách ignore nếu người dùng muốn. Việc gỡ `.harnix/cache/repo-map-v1.json` khỏi index của chính repo harnix là thao tác git riêng, chỉ làm khi người dùng cho phép, không nằm trong code.
- [x] `ac-4` (met): Docs (PRD, README), CHANGELOG, test init/update/doctor và phiên bản `2.40.0-dev.5` đồng bộ; kiểm bằng CLI thật qua `scripts/exercise-git-hygiene.mjs` (repo git tạm: sau `repo-map` thì `git status` không hiện cache; `update` lần hai không đổi file; file người dùng đã sửa được giữ).

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-25 19:53:43 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-25 19:51:53 +07:00)
- [x] `chk-exercise-git-hygiene` (focused): Exercise git-hygiene: init/update/doctor/uninstall bằng CLI build thật trong repo git tạm — pass (2026-11-25 19:53:52 +07:00)

## Decisions

- **dec-journal-tracked** — Journal vẫn theo dõi mặc định: ignore sẽ mất lịch sử khi đổi máy; chỉ ignore cache, tmp, tasks/.active. Ghi file vào .harnix/ thay vì .gitignore gốc để không đụng file của người dùng.
  - _Why:_ Cần người dùng xác nhận khi duyệt epic.
- **trace-advisory-false-positive** — Advisory sửa code trước in_progress liệt kê 34 file nhưng tất cả là thay đổi chưa commit của member 1-4 có từ trước task này; bỏ qua có chủ đích.
  - _Why:_ Advisory so với HEAD nên dương tính giả khi cây bẩn từ trước (dec-advisory-vs-head).
- **dec-git-files-managed** — Hai file .harnix/.gitignore và .harnix/.gitattributes là file managed phạm vi project trong desiredFiles của update.ts (sourceId git-ignore, git-attributes), dùng cơ chế manifest hash sẵn có nên idempotent, giữ bản người dùng sửa và uninstall --purge gỡ cùng .harnix; doctor chỉ in lệnh git rm, harnix không chạy git ghi.
  - _Why:_ Không cần cơ chế mới và không đụng .gitignore hay .gitattributes gốc của repo; journal vẫn theo dõi theo dec-journal-tracked.

## Residual risks

- **risk-git-existing-repos** (low) — Repo đã theo dõi cache hoặc con trỏ từ trước vẫn bị nhiễu cho tới khi người dùng chạy git rm --cached; .harnix/.gitattributes ép LF cho toàn bộ .harnix nên file người dùng tự thêm cần CRLF phải sửa file này; chưa thử Linux hay macOS.

## Evidence

- `chk-focused` — pass (2026-11-25 19:51:53 +07:00): pnpm test:gates — exit 0
- `chk-exercise-git-hygiene` — pass (2026-11-25 19:53:52 +07:00): mode: full; scripts/exercise-git-hygiene.mjs chạy dist/cli.js thật trong repo git tạm: 7 kiểm tra, 0 lỗi (init ghi hai file trong .harnix và không đụng file gốc, repo-map rồi git status sạch, con trỏ .active bị ignore và eol=lf, update lần hai không đổi file, file người dùng sửa được giữ, doctor in đúng lệnh git rm và không đổi index, uninstall --purge gỡ file) _(1 earlier rerun not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-25 19:53:43 +07:00): pnpm test — exit 0
