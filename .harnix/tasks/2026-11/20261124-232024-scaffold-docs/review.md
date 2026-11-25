# Sinh khung prd và plan cho task Full đang planning, đóng epic bằng bản minor

- **ID:** 20261124-232024-scaffold-docs
- **Mode:** lite
- **Epic:** 20261124-232018-harnix-friction-fixes
- **Status:** completed/finishing
- **Created:** 2026-11-24 23:20:24 +07:00
- **Updated:** 2026-11-25 21:07:00 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Summary

| Item | Progress | Details |
| --- | --- | --- |
| Acceptance criteria | 100% | 4/4 met or waived |
| Required checks | 100% | 3/3 passed |
| Residual risks | 8 | risk-scaffold-force-loses-edits: low, risk-epic-status-stale: low, risk-epic-scaffold-force: low, risk-epic-jaccard: low, risk-epic-eol-lf: low, risk-epic-head-compare: low, risk-redaction-gaps: low, risk-expandbraces-escape: low |

## Goal

Giúp soạn prd.md và plan.md không cần heredoc: sinh khung từ criteria và check đã khai báo hoặc nạp file UTF-8 cho task Full đang planning; member cuối đóng epic.

## Relevant paths

- `AGENTS.md`
- `CHANGELOG.md`
- `README.md`
- `docs/HARNIX_PRD.md`
- `docs/HARNIX_WORKFLOW.md`
- `package.json`
- `scripts/exercise-scaffold-docs.mjs`
- `src/commands/workflow-command.ts`
- `src/commands/workflow-flag-owners.ts`
- `src/commands/workflow-flags.ts`
- `src/commands/workflow-handlers.ts`
- `src/commands/workflow-lifecycle-handlers.ts`
- `src/core/workflow/actions.ts`
- `src/core/workflow/artifact-templates.ts`
- `src/core/workflow/index.ts`
- `src/core/workflow/scaffold-docs.ts`
- `src/core/workflow/schema.ts`
- `src/templates/harnix/workflow.md`
- `test/README.md`
- `test/unit/core/workflow/scaffold-docs.test.ts`
- `test/workflow/scaffold-docs.test.ts`

## Code impact

| File | Status | Changes |
| --- | --- | --- |
| `AGENTS.md` | modified | +7 / -7 |
| `CHANGELOG.md` | modified | +11 / -0 |
| `README.md` | modified | +6 / -1 |
| `docs/HARNIX_PRD.md` | modified | +10 / -2 |
| `docs/HARNIX_WORKFLOW.md` | modified | +8 / -4 |
| `package.json` | modified | +2 / -2 |
| `scripts/exercise-advisories.mjs` | added | - |
| `scripts/exercise-context-cost.mjs` | added | - |
| `scripts/exercise-git-hygiene.mjs` | added | - |
| `scripts/exercise-run-check.mjs` | added | - |
| `scripts/exercise-scaffold-docs.mjs` | added | - |
| `scripts/exercise-technique-hint.mjs` | added | - |
| `src/commands/internal-context.ts` | modified | +9 / -1 |
| `src/commands/update.ts` | modified | +8 / -0 |
| `src/commands/workflow-batch.ts` | added | - |
| `src/commands/workflow-command.ts` | modified | +18 / -2 |
| `src/commands/workflow-flag-owners.ts` | modified | +5 / -3 |
| `src/commands/workflow-flags.ts` | modified | +20 / -4 |
| `src/commands/workflow-handlers.ts` | modified | +2 / -6 |
| `src/commands/workflow-lifecycle-handlers.ts` | modified | +9 / -0 |
| `src/core/config/config-schema.ts` | modified | +17 / -3 |
| `src/core/config/config-validate.ts` | modified | +7 / -0 |
| `src/core/config/config.ts` | modified | +2 / -0 |
| `src/core/context/effective-context.ts` | modified | +1 / -0 |
| `src/core/doctor/project-runtime.ts` | modified | +2 / -2 |
| `src/core/journal/learning-summary.ts` | modified | +33 / -11 |
| `src/core/status.ts` | modified | +4 / -2 |
| `src/core/workflow/actions.ts` | modified | +1 / -0 |
| `src/core/workflow/check-log.ts` | added | - |
| `src/core/workflow/check-output.ts` | modified | +3 / -0 |
| `src/core/workflow/checks-batch.ts` | added | - |
| `src/core/workflow/evidence-mode-advisory.ts` | added | - |
| `src/core/workflow/exercise-advisory.ts` | modified | +6 / -1 |
| `src/core/workflow/finish-advice.ts` | modified | +3 / -13 |
| `src/core/workflow/git-advisories.ts` | added | - |
| `src/core/workflow/index.ts` | modified | +3 / -0 |
| `src/core/workflow/output-redaction.ts` | added | - |
| `src/core/workflow/preflight.ts` | modified | +5 / -2 |
| `src/core/workflow/ready-review.ts` | modified | +1 / -0 |
| `src/core/workflow/relevant-paths.ts` | added | - |
| `src/core/workflow/run-check.ts` | modified | +45 / -8 |
| `src/core/workflow/run-checks.ts` | modified | +3 / -0 |
| `src/core/workflow/scaffold-docs.ts` | added | - |
| `src/core/workflow/schema.ts` | modified | +5 / -3 |
| `src/core/workflow/secret-scan-changes.ts` | modified | +3 / -2 |
| `src/core/workflow/secret-scan.ts` | modified | +25 / -0 |
| `src/core/workflow/technique-hint.ts` | added | - |
| `src/core/workflow/transition-advisories.ts` | added | - |
| `src/core/workflow/transition.ts` | modified | +9 / -1 |
| `src/skills/harnix-arch-review/SKILL.md` | modified | +1 / -1 |

_(59 more files not shown)_

## Acceptance criteria

- [x] `ac-1` (met): `harnix workflow --scaffold-docs [--prd-file <p>] [--plan-file <p>] [--force]` cho task Full đang `planning` (nhận `--task`): không có file thì sinh khung `prd.md` và `plan.md` từ criteria và check hiện tại, không ghi đè nội dung đã có trừ khi `--force`; có file thì nạp UTF-8 nguyên văn (bỏ BOM, qua kiểm mojibake); ghi bằng đường `saveWorkflow`.
- [x] `ac-2` (met): Task Lite hoặc task không ở `planning` bị từ chối kèm hint; khung sinh ra không chứa token placeholder cứng làm cổng ready từ chối và có dòng checklist `[chk-id]` cho từng required check.
- [x] `ac-3` (met): Hành vi có đủ trong `WORKFLOW_ACTIONS`, `--schema`, flag-owners, handler, test action-checklist, golden (chỉ chuỗi mới), docs (HARNIX_WORKFLOW, PRD) và template `workflow.md` (tối đa một dòng trong ngân sách còn lại, rồi `pnpm selfhost:sync`).
- [x] `ac-4` (met): Member cuối đóng epic: `pnpm version:sync 2.40.0 --fold-dev` với một entry CHANGELOG, một lượt harnix-review do reviewer độc lập trên toàn diff epic trước finish, chạy lại toàn bộ check và mọi script exercise; kiểm bằng CLI thật qua `scripts/exercise-scaffold-docs.mjs` (tiếng Việt qua `--prd-file` đúng byte).

## Required checks

- [x] `check-suite` (full): Toàn bộ test của dự án phải xanh — pass (2026-11-25 21:01:23 +07:00)
- [x] `chk-focused` (focused): Test hợp đồng nhanh (docs, CLI, ngân sách token, nguồn skill) — pass (2026-11-25 20:59:18 +07:00)
- [x] `chk-exercise-scaffold-docs` (focused): Exercise chạy CLI build thật: --scaffold-docs trên dự án tạm (task Full planning, từ chối khi đã có nội dung, Lite bị từ chối, --prd-file tiếng Việt đúng byte, ready không đỏ vì placeholder) — pass (2026-11-25 21:01:30 +07:00)

## Decisions

- **dec-scaffold-full-only** — --scaffold-docs chỉ cho task Full đang planning (Lite không có prd.md và plan.md); member của --init-epic vẫn là Lite.
  - _Why:_ Mở rộng init-epic sang Full là thay đổi riêng, không nằm trong epic này.
- **trace-advisory-false-positive** — Advisory sửa-code-trước-in_progress báo các file thuộc thay đổi chưa commit của member 1-5; bỏ qua có chủ đích vì cây làm việc đã bẩn từ trước khi member 6 bắt đầu, và member 6 chưa sửa file src nào trước ready.
  - _Why:_ Advisory so với HEAD nên dương tính giả khi các member trước chưa commit (decision dec-advisory-vs-head).
- **dec-scaffold-protect-edited** — Tài liệu rỗng hoặc còn là khung sinh sẵn của chính task (so sánh với renderPrdTemplate/renderPlanTemplate của trạng thái hiện tại, bỏ khác biệt CRLF và khoảng trắng đầu cuối) được thay không cần --force; mọi nội dung khác được giữ và lệnh bị từ chối kèm gợi ý --force. Có file thì chỉ ghi tài liệu đó; không file thì ghi cả hai; từ chối bất kỳ đích nào thì không ghi gì.
  - _Why:_ Task Full luôn có prd.md và plan.md không rỗng từ lúc tạo (validateTaskArtifacts), nên 'chưa có nội dung' chỉ có nghĩa là còn là khung; khung cũ lệch sau khi thêm tiêu chí vẫn cần --force để không mất sửa tay.
- **trace-epic-review** — Review độc lập toàn diff epic 2.40.0 bởi 3 reviewer (member 1-2, member 3-5, member 6 và rà chéo). Đã sửa: F1 log lỗi sót Bearer/KEY=value/secret: (che riêng ở output-redaction.ts, không thêm vào RULES chung), F2 redactSecrets thay theo vị trí capture group, F4 outputTail dùng cùng bước che, F3 glob có ngoặc nhọn thành nhiều pathspec (expandBraces, tối đa 16, quá thì thay bằng *), B-F1 .harnix/.gitignore neo /cache/ và /tmp/, B-F3 lời doctor không hứa harnix update ghi file của người dùng, C-F2 exercise chạy thật --scaffold-docs --task cho task Full không active và task đã hủy. Chấp nhận như đánh đổi: bỏ Status khỏi băm hook, --scaffold-docs coi khung lệch sau --add-criterion là đã sửa, Jaccard 0,6, eol=lf trong .harnix/.gitattributes, relevantPaths chỉ so HEAD. Bản sửa cần lượt kiểm lại độc lập trước finish.
  - _Why:_ Tiêu chí ac-4 yêu cầu một lượt review độc lập trước finish; bản sửa chưa được reviewer thứ hai xem.
- **dec-redaction-separate** — Che secret của log và outputTail nằm ở output-redaction.ts (redactSecrets chung + quy tắc riêng cho Authorization, KEY=value không nháy), không thêm vào RULES của secret-scan vì sẽ làm secretAdvisory của finish dương tính giả trên mã nguồn.
  - _Why:_ Reviewer A xác nhận log sót mẫu phổ biến; sửa không được tăng nhiễu cho gate finish.
- **dec-update-run-in-repo** — Đã chạy harnix update trong repo harnix sau khi xem trước bằng --dry-run: chỉ tạo .harnix/.gitignore và .harnix/.gitattributes, làm mới project-facts.md (dẫn xuất, preflight đã nhắc) và manifest; AGENTS.md, README, guides không đổi.
  - _Why:_ Hết hai cảnh báo managed-untracked do doctor báo; kiểm trước/sau bằng bản sao và hash.
- **dec-redaction-line-cap** — Bản sửa N1/N2: mọi regex của LOG_RULES viết lại tuyến tính (từ khóa literal đứng cuối tên biến rồi tối đa 8 khoảng trắng, không còn hai vòng lặp không giới hạn quanh từ khóa) và mỗi dòng dài hơn 4096 ký tự bị cắt còn 1024 ký tự đầu và 3072 ký tự cuối kèm [line truncated, N more characters]; phần giữa bị bỏ nên không thể lộ secret. Giữ cả đầu lẫn đuôi vì lỗi thường nằm ở cuối dòng (test cũ run-check mong đuôi END và check-log mong THE-END). Hệ quả có chủ ý: một dòng đơn dài hơn 64 KiB không còn cho log 64 KiB đầy đủ nên test check-log đổi sang nhiều dòng; hành vi dòng dài nằm trong test output-redaction-performance.
  - _Why:_ Đo thật: regex cũ 4 KB tokenx. mất 1,1 s và 8 KB mất 12 s (bậc ba); bản mới 64 KB và 1 MB dưới 3 ms. Test hiệu năng bắt buộc có ca đầu vào độc vì lần review trước cũng có ReDoS.
- **trace-epic-rereview** — Lượt kiểm lại độc lập của bản sửa tìm ra N1 (ReDoS bậc ba trong rule thứ 3 của LOG_RULES, do chính bản sửa F1 gây ra) và N2 (che nhầm secretary, tokenizer, token_count); đã sửa bằng regex tuyến tính cộng trần dòng 4096 ký tự và test hiệu năng. Điều phối tự đo lại bằng bundle esbuild của mã thật: 13 đầu vào độc qua redactCheckOutput tối đa 2,5 ms và từng rule riêng trên 1 MB không qua trần dòng tối đa 9,3 ms. Bản sửa cuối của N1 và N2 chưa có reviewer thứ ba.
  - _Why:_ Đáp ứng ac-4 (review độc lập trên toàn diff epic trước finish) và ghi trung thực phạm vi đã được review.

## Residual risks

- **risk-scaffold-force-loses-edits** (low) — --scaffold-docs --force thay cả tài liệu đã sửa tay mà không sao lưu; khung sinh ra gộp mọi check vào một slice nên người dùng vẫn phải tự chia slice. (Mitigation: Lệnh mặc định từ chối khi có nội dung riêng và nêu rõ --force làm mất nội dung hiện có; task vẫn nằm trong git của người dùng.)
- **risk-epic-status-stale** (low) — Bỏ Status khỏi phần băm của hook nên agent có thể giữ Status cũ sau khi đổi trạng thái hoặc sau khi nén ngữ cảnh; nguồn chuẩn là preflight và workflow. (Mitigation: Chấp nhận; nếu thấy hại thì băm kèm nhóm trạng thái hoặc chèn lại mỗi N lượt.)
- **risk-epic-scaffold-force** (low) — --scaffold-docs coi khung sinh sẵn đã lệch sau --add-criterion là đã sửa nên cần --force, và --force thay cả tài liệu sửa tay mà không sao lưu. (Mitigation: Hint nói rõ nội dung hiện có sẽ mất; so sánh chặt nên chỉ thà từ chối nhầm.)
- **risk-epic-jaccard** (low) — Ngưỡng Jaccard 0,6 khi gom note học có thể gộp nhầm hai note ngược nghĩa nhưng gần từ; chưa đo trên journal thật. (Mitigation: Chỉ ảnh hưởng ngữ cảnh hook, không xóa note.)
- **risk-epic-eol-lf** (low) — * text eol=lf trong .harnix/.gitattributes làm repo cũ đã commit CRLF thấy hàng loạt file modified cho tới khi git add --renormalize; file cần CRLF dưới .harnix phải sửa file này. (Mitigation: Tài liệu nêu rõ; file gốc của repo không bị đụng.)
- **risk-epic-head-compare** (low) — Advisory sửa code trước in_progress chỉ so với HEAD nên dương tính giả khi cây đã bẩn từ trước, và advisory tiêu chí cũ im lặng với glob lồng ngoặc nhọn hoặc quá 16 tổ hợp (thay bằng *). (Mitigation: Chỉ advisory, không đổi valid hay exit code.)
- **risk-redaction-gaps** (low) — Che secret trong log chỉ là heuristic: không che --token abcdefghijklmnop (cờ dòng lệnh), bearer= chữ thường, tên biến Unicode, giá trị trong nháy có khoảng trắng như PASSWORD="quoted value here" và Bearer ngắn dưới 16 ký tự khi không có Authorization; một log sạch không đảm bảo không có secret, và log là dữ liệu cục bộ chưa tin cậy.
- **risk-expandbraces-escape** (low) — expandBraces chưa nhận biết dấu thoát \{ nên một tên file chứa dấu ngoặc nhọn thật bị mở rộng sai, và {,a} đứng riêng sinh pathspec rỗng nên advisory im lặng; chỉ ảnh hưởng advisory tiêu chí nháp cũ, không đổi valid hay exit code.

## Evidence

- `chk-focused` — pass (2026-11-25 20:59:18 +07:00): pnpm test:gates — exit 0 _(4 earlier reruns not shown; see task.json for full history)_
- `chk-exercise-scaffold-docs` — pass (2026-11-25 21:01:30 +07:00): mode: full. node scripts/exercise-scaffold-docs.mjs chạy dist/cli.js thật trong dự án tạm sau khi sửa regex che secret (N1, N2) của log lỗi; 9 kiểm tra, 0 lỗi. _(8 earlier reruns not shown; see task.json for full history)_
- `check-suite` — pass (2026-11-25 21:01:23 +07:00): pnpm test — exit 0 _(4 earlier reruns not shown; see task.json for full history)_
