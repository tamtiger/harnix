# Review lỗi harnix: 20 session và code HEAD v2.23.5

Ngày: 2026-11-01. Báo cáo đã ẩn danh: không có secret, đường dẫn máy hay nội dung nghiệp vụ của repo khác (repo-A = harnix, repo-B/C = repo PHP khác).

## Giới hạn mẫu
- 20 transcript Claude Code (05/10 đến 01/11/2026) trên 3 repo, chỉ gồm session có lệnh `harnix`. Không có transcript Codex, Kiro, Antigravity, OpenCode hay Cursor: kết luận không phản ánh các nền tảng đó.
- Bộ lọc tự động chỉ bắt lỗi có `ok:false`, `error:`, `notice:`. Lỗi âm thầm (đúng exit code nhưng sai ý) chỉ thấy qua báo cáo của agent trong session.
- 5 agent review đọc code, không chạy test. Mọi mục "còn tồn tại" là từ đọc code, chưa tái hiện bằng lệnh. Mục có `?` cần xác minh ở bước plan của member tương ứng.

## Baseline (exit code thật)
`pnpm typecheck` 0; `pnpm lint` 0; `pnpm test:gates` 0 (7 file, 88 test). Chưa chạy `pnpm test` đầy đủ (agent đang đọc repo song song).

## Nhóm lỗi thực tế và trạng thái ở HEAD
| Nhóm | Triệu chứng đã gặp | Trạng thái HEAD | Member xử lý |
|---|---|---|---|
| A1/A2/A4 | Tiêu chí khoá sau khi check pass; check fail không thay được; plan chưa tick | Đã vá (`--set-criterion --reason`, `--replace-check`, `--tick`); PRD/WORKFLOW/PLAN còn mô tả cũ | docs-contract-sync |
| A5 | `--run-check` ghi pass bằng lệnh khác `command` đã khai | Vá khi có `command`; còn khe khi check không khai `command` (`run-check.ts` điều kiện `declared.command !== undefined`) | run-check-command-gate |
| A6 | Evidence tương lai, ghi đè member epic | Đã vá | không |
| A3, B1 | Lỗi thiếu hint; agent gọi sai cờ (`--brief` trên `pause`/`cancel`, `--set-baseline` thiếu đối số, `harnix facts`, `status` thừa đối số) | Một phần: `--status`, `--reviewed`, `pause --brief` đã có hint; còn lại chỉ có `message` | cli-error-hints |
| B5 | `retryOnTaskConflict` chạy lại tiến trình | Đã vá cho `run-check(s)`; hai bước save của `set-criterion` có thể kẹt `ready/ready` (P3) | run-check-command-gate |
| B6/D2 | `status`/`resume --next` quét epic cũ nhất; epic hỏng bị giấu hoặc làm dừng | Còn | status-epic-learning-noise |
| B7 | Test 6 writer song song chập chờn | Còn (`MAX_ATTEMPTS=5`) | test-stability |
| C1/C2/C3 | Heredoc có dấu nháy lỗi, mojibake PowerShell 5.1, pipe che exit code | Quy tắc đã có trong activation; cookbook thiếu hướng dẫn script phụ | cookbook-skill-guidance |
| C4 | CRLF làm git dirty giả | Đã vá | không |
| C5 | Nhãn "ERR" trên stderr | Do harness Claude Code, không phải harnix | không |
| D1 | Hook context chèn lại pointer mỗi lượt | Có dedup nhưng một slot cache chung; mất con trỏ sau compact | context-hook-dedup |
| D3 | `harnix facts --refresh` không tồn tại | `factsHint` đã trỏ `harnix update`; lệnh lạ không có hint | cli-error-hints |
| D4 | Learning draft chỉ mô tả code | Có bộ lọc chất lượng, chưa loại draft mô tả code | status-epic-learning-noise |
| E2 | `isolate:false` rò mock | Không thấy `vi.mock`; thiếu `restoreMocks:true` | test-stability |
| E3 | `adopt` trái kế hoạch Phase 6 | Đã đóng (không còn nhánh `adopt`) | không |
| E4 | Hai regex ReDoS | Đã sửa | không |
| E5/E6 | Mô tả breaker cũ; envelope lỗi | Code và skills đúng; PRD:160 (envelope) và PRD:275 (breaker) còn lệch; số dòng WORKFLOW:221 và PLAN 334/778 trong bản đầu sai, phải grep lại cụm cũ | docs-contract-sync |

## Phát hiện mới chỉ thấy khi đọc code (không có sự cố thực tế)
- global: notice của Codex/Antigravity/OpenCode bị nuốt khi thiếu launcher trên PATH (P3); mã doctor `test-*-required` chỉ phát khi `VITEST` được set (review lần hai: có thể đã đúng, cần bằng chứng mới giữ); migrate `hooks.json` Codex đã có test `codex-legacy-setup.test.ts` (review lần hai: chỉ còn câu hỏi hook không có bản ghi sidecar); ghi atomic thay symlink dotfile bằng file thường (P3); đọc skill dự án và dò stack theo symlink con ra ngoài root, chỉ đọc (P3) → global-setup-hardening.
- `--save` có epic: lỗi sau khi ghi task có thể để epic thiếu (P2, cần xác minh có doctor bắt không) → run-check-command-gate.
- hint: `harnix epic <id>` không liệt kê id hợp lệ (P2); `--limit` bị nuốt im lặng; mọi lỗi exit 2 (cần xác minh phía docs) → cli-error-hints.
- chưa xác nhận bằng lint: một số file vượt 300 dòng thô (`plan-edit.ts`, `verify-plan.ts`, `user-paths.ts`, `file-lock.ts`, `workspace-detection.ts`); quy tắc tính theo dòng code nên có thể không vi phạm.

## Thứ tự epic và lý do
1. run-check-command-gate: toàn vẹn bằng chứng (P1).
2. cli-error-hints: nguyên nhân lặp nhiều nhất trong session (B1).
3. status-epic-learning-noise, 4. context-hook-dedup: giảm nhiễu và token.
5. global-setup-hardening: an toàn và độ đúng của setup global.
6. test-stability: gỡ chập chờn trước khi cộng thêm test.
7. docs-contract-sync: đồng bộ tài liệu frozen sau khi code ổn định.
8. cookbook-skill-guidance: cập nhật template/skill, `pnpm selfhost:sync`, phát hành minor đóng epic.

Các member đang ở `planning` với tiêu chí và check nháp; phải đối chiếu lại với code hiện hành trước khi `ready` (earlier members có thể đổi file, test, hợp đồng).
