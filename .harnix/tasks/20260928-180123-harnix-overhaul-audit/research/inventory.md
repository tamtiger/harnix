# Pha 1 — Kiểm kê bề mặt Harnix (2026-09-28)

Nguồn: đọc trực tiếp repo tại HEAD `e3713ce`. **[F]** = fact kiểm được; **[H]** = giả thuyết.

## 0. Phát hiện cần xử lý ngay

- **[F] HEAD đang đỏ**: `pnpm test` → 661 test, 2 fail.
  - `test/workflow/cli-contract.test.ts:9` vẫn kỳ vọng 16 lệnh public, trong khi `pause` đã được đăng ký ở `src/cli-program.ts:185`.
  - `test/workflow/self-host.test.ts:23`: `generatedHash` của `.harnix/workflow.md` trong manifest lệch với nội dung.
  - Cả hai do commit `e3713ce` (pause) gây ra. Task `20260928-144800-task-pause-command` vẫn được ghi `completed`, tức evidence "full suite pass" không phản ánh HEAD.
- **[F] `dist/` cũ** (build 09-25) nên thiếu `pause`.
- **[F]** Mô tả chương trình ở `src/cli-program.ts:62` thiếu Claude Code.

## 1. Kích thước

| Hạng mục | Giá trị |
| --- | --- |
| `src` TS | 12.600 LOC |
| `src` Markdown (guides + skills) | 1.884 LOC |
| `test` TS | 13.498 LOC (82 file) |
| `scripts/*.mjs` | 985 LOC |
| `pnpm test` | 18,2 s |

## 2. Nhóm module theo giá trị

| Nhóm | LOC ≈ | Thành phần chính |
| --- | --- | --- |
| A. Máy móc tự bảo vệ workflow | 3.350 (27% src; ~45–50% test) | `commands/internal-workflow.ts` 827 (11 action), `core/tasks/task.ts` 498, `core/verification/input-freshness.ts` 359, `core/workflow.ts` 336, `ready-trace.ts` 219, `task-audit.ts` 210, `context/selection-freshness.ts` 153, `checks`/`audit`/`context-report`, `journal/learning*`, `promotion.ts` |
| B. Vòng đời task hướng người dùng | 1.470 | status, tasks, pause, resume, roadmap, mem, context hook |
| C. Giá trị trực tiếp | 4.670 | setup/global-* 1.470, 4 configurator 276, init/update/doctor 752, repo-map 746, catalog/guides/detection 1.134 |
| D. Hạ tầng dùng chung | 3.100 | `utils/global-managed-files.ts` 1.072, `file-lock.ts` 448, `user-paths`, `atomic-write`… |

## 3. CLI

- **Public (17):** `init`, `setup`, `update`, `upgrade`, `uninstall`, `doctor`, `mem`, `status`, `tasks`, `roadmap`, `resume`, `pause`, `context-report`, `checks`, `audit`, `skill`, `repo-map`.
- **Hidden:**
  - `context` (hook).
  - `workflow` với 11 action: `--inspect`, `--preflight`, `--save`, `--transition`, `--evidence`, `--schema`, `--snapshot`, `--audit-ready`, `--finish`, `--cancel`, `--learn`.
- **[F]** Nhiều lệnh không có description trong `--help`.

## 4. Code chết / trùng lặp

- **[F] Chỉ test import, không có đường chạy từ CLI (~280 LOC + ~350 LOC test):**
  - `src/migration/migrate.ts` và `discovery.ts`
  - `src/rules/rules.ts`
  - `src/templates/harnix/managed-workflow.ts`
  - `src/core/journal/promotion.ts`
  - `src/core/research.ts`
- **[F] Export không có consumer:** `codex.ts:17,23,42`, `validateConfigV1`, `validateJournalEntry`, `saveResearchFinding`, `TASK_V2_MIGRATION_SUMMARY`, `TASK_RECORD_FIELDS`, `findGitRoot`, `displayUserPath`…
- **[F] Trùng tên khác nghĩa:** `canonicalJson` ở `core/tasks/workflow-helpers.ts:22` trả object, ở `utils/global-managed-json.ts:70` trả string.
- **[F] Hai hệ reconcile song song:** `managed-files.ts` (project) và `global-managed-files.ts` (global). Tương tự `doctor.ts` 462 và `global-doctor.ts` 545.

## 5. Configurator

| Nền tảng | LOC | Ghi ra |
| --- | --- | --- |
| Kiro | 42 | `~/.kiro/skills`, `steering/harnix.md`, `hooks/harnix-context.json` |
| Antigravity | 47 | plugin Desktop và CLI |
| Codex | 100 | `~/.agents/skills`, block trong `$CODEX_HOME/AGENTS.md`, `config.toml` hook |
| Claude Code | 87 | `~/.claude/skills`, block trong `CLAUDE.md`, `settings.json` hook |

**[F]** Tên `claude` xuất hiện trong 15 file `src` và khoảng 12 file test.

**[H]** Thêm một nền tảng tốn ~80–100 LOC configurator, 150–250 LOC rải rác và 250–400 LOC test. Một registry khai báo sẽ giảm mạnh chi phí này.

## 6. Lớp chỉ dẫn (token ≈ chars/4)

| File | ~tok |
| --- | --- |
| Block Harnix trong `~/.claude/CLAUDE.md` | 819 |
| `AGENTS.md` root | 4.934 |
| AGENTS sinh cho consumer | ~1.575 |
| `.harnix/workflow.md` | 6.752 |
| 7 skill (tổng) | 19.738 (brainstorm 4.479, check 3.416, implement 2.961, finish 2.757, continue 2.467, debug 1.845, research 1.815) |
| Hook context mỗi prompt | 1.380 |
| Guides đã chọn (common + typescript) | 2.891 |

**Tổng phải nạp:**

| Kịch bản | ~tok |
| --- | --- |
| Lite tầm thường (4 skill + hook + guides) | ~30.400 |
| Full qua mọi stage | ~36.900 |

**[F]** Guard block ~407 tok bị lặp khoảng 10 lần trong một phiên Full, tức ~11% tải.

### Rule

- **[F]** 491 từ normative, tương đương khoảng 200 rule riêng biệt.
- **[H]** Khoảng 65% rule bảo vệ máy móc (schema, digest, transport, pointer, migration). Khoảng 35% mang giá trị kỹ thuật (review, TDD, debug, research), và đây lại là nhóm ít được nhắc lại nhất.

### Mâu thuẫn tài liệu ↔ code

| # | Mô tả | Vị trí |
| --- | --- | --- |
| C1 | Ví dụ slug không có tiền tố ngày giờ | `harnix-brainstorm/SKILL.md:86` so với `task.ts:68` |
| C2 | Danh sách field TaskRecord thiếu `decisions`, `residualRisks`, `epicId`, `findings` | `workflow.md:69` |
| C3 | Mô tả envelope bỏ sót `epic`, `roadmapMembers` | `workflow.md:59` so với `internal-workflow.ts:67` |
| C4 | Transport cho evidence mâu thuẫn giữa `--save` và `--evidence` | check, debug |
| C5 | Checklist 100% áp cho Lite dù Lite không có `plan.md` | |
| C6 | Bypass review/research vẫn phải đọc `workflow.md` | |
| C7 | Continue đọc `.active` trước preflight | |
| C8 | Danh sách Bypass không đồng nhất giữa các skill | |

## 7. Guides và stack detection

- **[F]** Có 34 guide (common, 12 ngôn ngữ, 21 công nghệ). Tất cả cùng template 4 mục × 5 bullet.
- **[F]** Hầu như không có lệnh chạy cụ thể: 0–4 dòng mỗi file.
- **[H]** Có nội dung lỗi thời: Next.js FID/`middleware.ts`, Django `bleach`, Go `gosimple`/`pkg/`.
- **[F] Detection** (`src/utils/detection.ts`):
  - Java chỉ nhận `*.java` ở mức weak, không nhận `pom.xml`/`build.gradle`.
  - Python không nhận `uv.lock`, `setup.py`, `Pipfile`.
  - Không hiểu workspace nào ngoài `package.json`.
  - `verificationCommands` chỉ lấy từ script của `package.json`, nên stack không phải JS không có lệnh verify.
  - Framework nhận bằng tìm chuỗi con, dễ dương tính giả.
