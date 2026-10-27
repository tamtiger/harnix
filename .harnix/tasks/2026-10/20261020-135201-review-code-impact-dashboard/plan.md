# Implementation Plan: Sinh dashboard Code impact cho review.md từ Git chỉ đọc

## Hiện trạng đã đối chiếu với mã
- `src/core/tasks/task-review.ts`: `CodeImpactItem { path, status, additions?, deletions? }`, `ReviewArtifacts.codeImpact?`, `renderCodeImpact` (bảng `File | Status | Changes`, bỏ qua khi rỗng).
- `src/core/tasks/task-store.ts:38-47`: `saveTask` dựng `artifacts` chỉ có `prd`, `plan`, `design` rồi gọi `renderTaskReview`; `saveTaskWithArtifacts` gọi lại `saveTask`. Không có producer của `codeImpact`.
- `src/utils/git.ts`: `readGitContext` và `runGit` (execFile, không shell, timeout 5 giây).
- `test/unit/core/tasks/task-store.test.ts`, `task-review.test.ts` đã có.

## Hợp đồng (contract)
- `src/core/tasks/code-impact.ts`: `readCodeImpact(root, run = runGit): Promise<CodeImpactItem[] | undefined>`; `undefined` khi ngoài Git, git lỗi hay không có thay đổi. Tối đa 50 file (`CODE_IMPACT_LIMIT`); phần bị cắt trả về qua trường `truncated?: number` của kết quả để renderer in dòng `_(N more files not shown)_`.
- Lệnh: `git --no-optional-locks status --porcelain=v2 -z` (trạng thái: `?` là added, dấu `D` là deleted, còn lại là modified; mục loại `2` có thêm trường đường dẫn gốc ngay sau) và `git --no-optional-locks diff --numstat -z HEAD` (cộng/trừ dòng; file nhị phân có `-` thì bỏ số). Hai lệnh chạy song song, cwd là gốc project (thư mục chứa `.harnix`); allowlist chỉ cho `status` và `diff` đi sau `--no-optional-locks`.
- File chưa theo dõi: `status: added`, không có số dòng (renderer in `-`). Đường dẫn: tương đối POSIX; bỏ file nằm trong `.harnix/` để dashboard không tự liệt kê state của Harnix.
- Sắp xếp: theo đường dẫn code-unit.
- `saveTask(root, task, options?: { gitRunner?: GitRunner })`: tính `codeImpact` khi `task.status` là `in_progress` hay `verifying`; khi `completed` đọc `review.md` cũ và giữ nguyên các dòng từ `## Code impact` tới mục `## ` kế tiếp (nếu có); các trạng thái khác không có mục.
- `ReviewArtifacts` thêm `codeImpactTruncated?: number`; không đổi schema `TaskRecord`.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/tasks/code-impact.test.ts` (mới): bộ chạy giả cho status và diff: modified có `+/-`, untracked là added không số dòng, deleted, rename (mục loại `2`, bỏ trường đường dẫn gốc), file nhị phân, bỏ `.harnix/`, sắp xếp ổn định, cắt ở 50 file kèm số bị cắt, git lỗi hay không có thay đổi thì `undefined`, allowlist chặn `fetch`, `commit`, `push`, `checkout`, đầu ra không chứa đường dẫn tuyệt đối.
- [x] [chk-focus] `test/unit/core/tasks/task-store.test.ts` và `task-review.test.ts`: `saveTask` ở `in_progress` hay `verifying` ghi `## Code impact`, ở `planning` thì không, ở `completed` giữ nguyên mục cũ, git lỗi không làm hỏng việc lưu; renderer in dòng phần bị cắt.
- [x] [chk-focus] `test/integration/scenarios/review-code-impact.test.ts` (mới, git thật trong thư mục tạm): sửa một file, thêm một file mới, xóa một file rồi `workflow --transition in_progress/implementing` hay `--save` và đọc `review.md` có bảng đúng; ngoài Git thì không có mục.

### Slice 2 (GREEN)
- [x] [chk-focus] Viết `code-impact.ts`, nối vào `saveTask` và renderer (thêm dòng cắt), giữ mục khi `completed`; chạy lại test Slice 1 cùng toàn bộ `test/unit/core/tasks` và `test/integration/scenarios` để bắt tác động tốc độ và hồi quy.

### Slice 3: cổng hợp đồng, tài liệu và phát hành
- [x] [chk-gates] README (mục review) và `docs/HARNIX_PRD.md` mô tả `## Code impact`: nguồn Git chỉ đọc so với `HEAD`, giới hạn 50 file, chỉ ở `in_progress` hay `verifying`, được giữ khi `completed`; `pnpm run test:gates`; `pnpm version:sync 2.14.0-dev.1 --summary <text> --kind fixed` và changelog (bản vá độc lập).
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify; bước thủ công ngoài check: `pnpm run lint`, `pnpm run typecheck`.

## Guardrails & Invariants
- Chỉ đọc: không `add`, `commit`, `stash`, `fetch`; không network; không đổi digest hay evidence; không đổi schema `TaskRecord`.
- Mất git hay git chậm không bao giờ làm hỏng hay chậm đáng kể `saveTask` (timeout 2 giây, bỏ qua mục).
- `src/core/tasks` mỗi file dưới 300 dòng code, không import Commander; hướng phụ thuộc `core -> utils`.
- Test dưới 400 dòng; test git thật dùng thư mục tạm và `-c user.name/user.email` cục bộ, không đụng cấu hình Git thật.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e` hay heredoc.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-focus | `pnpm exec vitest run test/unit/core/tasks/code-impact.test.ts test/unit/core/tasks/task-store.test.ts test/unit/core/tasks/task-review.test.ts test/integration/scenarios/review-code-impact.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
