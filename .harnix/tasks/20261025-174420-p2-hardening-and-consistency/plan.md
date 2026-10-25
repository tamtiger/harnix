# Plan: Sửa lỗi P2, A3/A5 và gợi ý lệnh đúng

## Execution Slices

- [x] [chk-breaker] ac-1: nhận dạng reset breaker bằng id `ev-reset-*` do `--reset-breaker` tạo; `--evidence` không được dùng tiền tố summary reset (completion.ts, retry-guard.ts, evidence-flags.ts)
- [x] [chk-breaker-digest] ac-8: `--run-checks` tính digest hiện tại cho từng check và truyền vào breaker như `--run-check` (run-checks.ts)
- [x] [chk-flags] ac-2: owner cho `--exit-code`, `--artifact`, `--digest`; từ chối `--file` ở chế độ flags của `--evidence`/`--cancel`; từ chối `--check` nhiều id với `--snapshot`/`--evidence` (workflow-flag-owners.ts, workflow-flags.ts)
- [x] [chk-status-learning] ac-3: `status --criteria` không task trả `{ taskId: null, criteria: [] }`, từ chối `--limit` (status.ts, cli-workflow-commands.ts)
- [x] [chk-status-learning] ac-4: learning dùng id đã chuẩn hóa (learning.ts)
- [x] [chk-restore] ac-5: restoreFullArtifacts dùng tên thư mục, bỏ qua task lệch id (restore-artifacts.ts)
- [x] [chk-transaction] ac-6: file có nội dung đúng bằng nội dung mong muốn được nhận lại khi manifest thiếu (core/global)
- [x] [chk-p3] ac-9: text-integrity chỉ coi chuỗi ba dấu hỏi là lỗi mã hóa khi đi kèm dấu hiệu khác; repoMapCachePath dùng path join; AGENTS.md ghi `--full`
- [x] [chk-error-hints] ac-10: gợi ý cho cờ đúng sai lệnh, giá trị sai định dạng, id không tồn tại (check, criterion, risk, decision, skill) kèm id gần nhất, `--run-check` thiếu `--`; `harnix workflow` in JSON lỗi có `hint`
- [x] [chk-gates] ac-7, ac-8: AGENTS.md (root và src/templates), docs/HARNIX_WORKFLOW.md, skill references ghi đúng A3/A5 và định dạng lỗi; `pnpm version:sync 2.22.0-dev.2`, `pnpm selfhost:sync` nếu template đổi
- [x] [check-suite] toàn bộ test, lint, typecheck xanh

## Guardrails & Invariants

- Test hồi quy viết trước, thấy đỏ rồi mới sửa.
- Hook `context` không in JSON lỗi; giao thức hook không đổi.
- Không hạ coverage; file test ≤ 400 dòng code và phản chiếu src.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1 | chk-breaker |
| ac-2 | chk-flags |
| ac-3, ac-4 | chk-status-learning |
| ac-5 | chk-restore |
| ac-6 | chk-transaction |
| ac-7 | chk-gates |
| ac-8 | chk-breaker-digest, chk-gates |
| ac-9 | chk-p3, chk-gates |
| ac-10 | chk-error-hints, chk-gates |
| tất cả | check-suite |
