# Implementation Plan: Thêm harnix status --workspace: bảng trạng thái Git chỉ đọc của các sub-repo

## Hiện trạng đã đối chiếu với mã
- `src/commands/status.ts`: `inspectProjectStatus(cwd)` dùng `findInitializedProject`; lỗi nếu không có project. `src/utils/git.ts` có `readGitContext` chỉ đọc (branch, clean, commit) dùng cho `status` và `preflight`.
- `src/core/repo-map/workspace.ts`: `discoverWorkspaceMembers(root)` (con trực tiếp hoặc lồng hai cấp, có manifest, `.harnix` hoặc `.git`); `src/commands/repo-map-internal.ts` có `resolveWorkspaceRoot(cwd, workspacePath)`.
- `test/unit/utils/git.test.ts`, `test/integration/commands/status.test.ts`, `test/unit/commands/status.test.ts`, `test/workflow/cli-contract.test.ts` (liệt kê option của lệnh public theo thứ tự).

## Hợp đồng (contract)
- Option mới của `status`: `--workspace [path]`. Khi có cờ, lệnh không cần project đã init: giải quyết gốc workspace rồi trả `{ generator: "harnix", schemaVersion: 1, scope: "workspace", members: WorkspaceGitMember[], message?: string }`.
- `WorkspaceGitMember`: `{ name: string, status: "ok" | "error", branch: string | null, detached: boolean, dirty: number, upstream: string | null, ahead: number | null, behind: number | null, error?: string }`; `name` là tên tương đối (`a` hoặc `a/b`), `error` là một dòng ngắn đã cắt độ dài, không chứa đường dẫn tuyệt đối.
- Module mới `src/core/workspace/git-status.ts`: `readWorkspaceGitStatus(members, run)` với `run` là bộ chạy tiến trình tiêm được (mặc định `execFile` không shell, `windowsHide`, timeout 5 giây mỗi lệnh), đồng thời tối đa 4 member. Mỗi member chỉ chạy MỘT lệnh: `git --no-optional-locks status --porcelain=v2 --branch -z` (cwd là thư mục member). Phân tích đầu ra: `# branch.head` (giá trị `(detached)` nghĩa là detached; nhánh chưa có commit vẫn đọc được), `# branch.upstream` (vắng nghĩa là không có upstream), `# branch.ab +A -B` (ahead A, behind B; vắng thì `null`), số mục `1`, `2`, `u`, `?` là `dirty` (mục loại `2` là rename có thêm một trường NUL, parser phải bỏ qua trường đó để không đếm dư).
- `--no-optional-locks` bắt buộc để `status` không ghi lại `.git/index`; có test khẳng định đối số này. Chỉ các lệnh con `status` (và `rev-parse` nếu cần) được phép; hàm kiểm tra danh sách cho phép chặn mọi lệnh con khác (đặc biệt `fetch`, `pull`, `checkout`, `commit`, `push`, `rev-list`). Test cũng khẳng định không dùng shell.
- Trích `resolveWorkspaceRoot` từ `src/commands/repo-map-internal.ts` sang `src/core/workspace/resolve-root.ts` (core không được import commands); `repo-map-internal.ts` import lại từ đó. Lưu ý hàm này trả về project đã init gần nhất, nên chạy trong member đã init thì member thành gốc; ghi vào tài liệu.
- Nhánh `--workspace` của `status` chạy trước `--summary` và `--explain` (không cần project đã init); kết hợp `--workspace` với `--explain`, `--summary` hay `--limit` bị từ chối (exit 2, thông báo rõ).
- `discoverWorkspaceMembers` dừng xuống sâu khi gặp thư mục có manifest mà không có `.git`; ghi rõ giới hạn này trong tài liệu và lọc thêm thư mục có `.git`. Task này đọc `workspace.ts` sau T47 (T47 thêm trường `initialized`, không đổi discovery).
- Member là thư mục có `.git`; không có thì không hiện. Không tìm thấy member thì `members: []` và `message` giải thích.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/workspace/git-status.test.ts` (mới): bộ chạy giả cho từng lệnh: nhánh bình thường, detached, không upstream (`ahead: null`), dirty đếm theo `-z`, ahead và behind đúng chiều, lỗi một member (timeout hoặc git lỗi) thành `status: "error"` mà các member khác vẫn đúng, đầu ra không chứa đường dẫn tuyệt đối, sắp theo tên, test chặn lệnh con ngoài danh sách cho phép.
- [x] [chk-focus] `test/integration/scenarios/status-workspace.test.ts` (file mới vì `status.test.ts` đã 343 dòng): workspace tạm có hai repo Git thật (một sạch, một dirty và lệch upstream cục bộ) cho `harnix status --workspace` qua `runCli` đúng bảng; ngoài workspace cho `members: []` kèm `message`; không đổi file nào. `test/workflow/cli-contract.test.ts`: option mới của `status`.

### Slice 2 (GREEN)
- [x] [chk-focus] Viết `src/core/workspace/git-status.ts`, nối `--workspace` vào `status` (wiring ở `commands`, chỉ gọi vào core), dùng lại `discoverWorkspaceMembers` và `resolveWorkspaceRoot`; chạy lại test Slice 1.

### Slice 3: cổng hợp đồng, tài liệu và đóng epic
- [x] [chk-gates] `README.md` (bảng lệnh, `status --workspace`) và `docs/HARNIX_PRD.md` (mô tả cờ, nói rõ chỉ đọc, không mạng, không pull); `pnpm run test:gates`; `pnpm selfhost:sync` nếu template `workflow.md` có đổi; task cuối của epic nên `pnpm version:sync 2.13.0 --summary <text> --kind added --fold-dev` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify. Task này đóng epic: bước thủ công ngoài check bắt buộc là `pnpm run lint`, `pnpm run typecheck` và chuỗi nghiệm thu mục 11 (build, pack:check, smoke:tarball, measure:init, measure:footprint, scan:release), mỗi lệnh phải đọc exit code. Câu "mười bảy lệnh public" giữ nguyên vì `--workspace` là cờ; `selfhost:sync` chỉ cần nếu template `workflow.md` đổi.

## Guardrails & Invariants
- Chỉ đọc: không `git fetch`, `pull`, `checkout`, `commit`, `push`, không đổi HEAD hay index, không mạng, không đọc hay ghi `.harnix` của member.
- Đầu ra chỉ chứa tên tương đối, tên nhánh và upstream đã cắt độ dài; không có đường dẫn tuyệt đối hay nội dung file.
- Hướng phụ thuộc `commands -> core -> utils`; module core không import Commander; mỗi file dưới 300 dòng code, complexity dưới 20; test dưới 400 dòng.
- Mọi đoạn có dấu gạch ngược đưa vào bằng công cụ Edit hoặc Write, không dựng qua `node -e`.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-focus | `pnpm exec vitest run test/unit/core/workspace test/integration/scenarios/status-workspace.test.ts test/unit/commands/status.test.ts test/workflow/cli-contract.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
