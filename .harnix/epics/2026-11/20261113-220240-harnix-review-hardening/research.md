# Báo cáo cuối: review toàn bộ Harnix (2026-11-13)

Phạm vi: repo `D:\MyProject\harnix`, nhánh `v2`, sau commit 2.32.4. Review chỉ đọc, do 6 nhóm thực hiện (A an toàn/global, B kiến trúc/tài liệu, C UX agent/token, D kiểm chứng, E công cụ tương tự, F thực tế sử dụng). Các phát hiện chưa được tác giả báo cáo này tự xác minh lại; chỗ nào là suy luận đều được ghi rõ.

## 1. Tóm tắt

- Tình trạng chung tốt: `typecheck`, `lint`, `test:gates`, `pnpm test` (3251 test, 0 fail, 9 skipped) đều pass. Coverage lines 96,3%, branches 90,9%. `harnix doctor`: 0 lỗi, 19 cảnh báo (exit 1 theo thiết kế). Không có phát hiện P0.
- Khác biệt thật của Harnix so với thị trường: kiểm chứng bằng input digest, cài global có ownership hash và rollback, ranh giới an toàn rõ (không MCP, daemon, tự commit). Điểm yếu: quy mô (chưa publish npm), chỉ 6 nền tảng, chưa có spec "sống".
- Việc đáng làm nhất:
  1. S1: `uninstall` có thể xóa junction của profile trên Windows (P1, hệ quả của thay đổi 2.32.4).
  2. P2-1, P2-2: hai kẽ hở "pass giả" ở suite gate.
  3. A1: `.harnix/cache/repo-map-v1.json` đang bị git theo dõi dù `.gitignore` bỏ qua.
  4. Kiểm trên bản cài dùng thử: trùng skill Cursor, hook Claude chạy trong Cursor, đường dẫn plugin Antigravity.

## 2. Kết quả chạy lệnh (nhóm D)

| Lệnh | Mã thoát | Ghi chú |
|---|---|---|
| `pnpm typecheck` | 0 | sạch |
| `pnpm lint` | 0 | prettier và eslint sạch |
| `pnpm test:gates` | 0 | 7 file contract xanh |
| `pnpm test:failures` | 0 | "no failing tests" |
| `vitest run --coverage` | 0 | 3251 test, 9 skipped; lines 96,34, functions 98,89, branches 90,85 |
| `harnix doctor` | 1 | 0 lỗi, 19 cảnh báo (`claude: drifted`, `codex-trust-pending`, `antigravity-precedence-unknown`, `managed-modified`, journal-unlinked) |
| `harnix verify-plan` | 0 | lệnh test `pnpm run test` |
| `harnix workflow --preflight` | 0 | không có task active, `projectFactsStale: true` |

## 3. Phát hiện trong repo

### P1
- **S1** (an toàn) `src/core/global/uninstall.ts:145-217`: `removeEmptyDirectory` gọi `rmdir` không `lstat`. Trên Windows `rmdir` xóa chính junction (đã chạy thử). Kịch bản: `CLAUDE_CONFIG_DIR` trỏ profile có `skills/` là junction; `setup --claude` rồi `uninstall --claude --yes` xóa junction `skills/` của profile. Test đỏ: junction `root/skills` trỏ ra ngoài, `uninstallGlobal({yes:true})`, khẳng định `lstat(root/skills).isSymbolicLink()` vẫn true (Windows; thêm biến thể symlink POSIX). Sửa: `lstat` trước, bỏ qua symlink; áp cho cả thư mục sidecar `harnix/` và `removeEmptyOwnedRoot`. Công sức S.

### P2
- **P2-1** (pass giả) `src/core/workflow/suite-gate.ts:31,64-77`: `"*"` bị coi là wildcard toàn repo nhưng chỉ khớp 16 file so với 2089 của `**`; `["assets/**","test/**"]` và input file đơn cũng qua. Chạm hợp đồng đóng băng (`IMPLEMENTATION_PLAN.md` mục 4.5). Test đỏ: `coversSourceAndTest(["*"])` phải trả false.
- **P2-2** (pass giả) `src/core/workflow/suite-command.ts:~56`: `acceptsSuiteCommand` trả true trước khi xét `cwd`, nên `pnpm run test` với `cwd packages/a` thỏa suite gate. Test đỏ: `acceptsSuiteCommand(root, "pnpm run test", "packages/a", ["pnpm run test"])` phải trả false.
- Hai mục P2-1/P2-2 mới xác nhận bằng hàm thuần chạy trong vitest, chưa qua `--run-check`/`--finish` thật.
- **A1** `.harnix/cache/repo-map-v1.json`, `.gitignore`: file vẫn được `git ls-files` liệt kê (đã nằm trong các commit trước và cả commit 2.32.4); mỗi lần `repo-map` tự làm mới làm bẩn cây làm việc. Sửa: `git rm --cached` (cần người dùng duyệt) và thêm finding doctor theo mẫu `active-pointer-tracked`.
- **S2** `uninstall.ts:154-156`, `user-paths.ts:266`: hai manifest (root override và root mặc định) có thể cùng sở hữu một file vật lý qua junction; uninstall bên này làm bên kia báo lỗi. Cần finding doctor mới và ghi chú trong `GLOBAL_SETUP_REFACTOR_PLAN.md`.
- **S5** `user-paths.ts:116-126`, `doctor/global.ts:52-58`: một biến môi trường sai (ví dụ `CODEX_HOME` rỗng) làm `doctor` báo `invalid` cho cả 6 nền tảng; nên resolve theo từng nền tảng và nêu tên biến.
- **UX-01** `save.ts:96`: `--init` khi đang có task active không có hint (nên nêu `--no-activate`, `harnix pause`, `--follow-up`).
- **UX-02** `obligations.ts:26`: `--run-check` ở `planning` ghi evidence rồi mọi `--set-check`/`--set-criterion` bị từ chối không hint; cần hint và một notice khi chạy ở `planning`.

### P3
- Chất lượng lỗi: A3 (`--init --file` với `{"checks":"zz"}` lộ `filePayload.checks.map is not a function`), UX-03 (nhiều lỗi flag thiếu hint; khoảng 46/255 `throw` có hint, ước tính bằng grep).
- An toàn: P3-1 (`baseline.authorizedBy` chỉ cần khác rỗng, agent tự điền được), S3 (`linkBoundary` là toàn bộ home, không thu hẹp về thư mục nền tảng), S4 (root mặc định không nhận `linkBoundary`, khó giải thích với người dùng), S6 (hook Kiro global chưa xác minh được), S7 (`???` gây false-positive trong text-integrity), S8 (tiến trình bị kill giữa chừng để lại file `untracked-collision`).
- Kiểm chứng: P3-2 (breaker so digest bằng chuỗi), P3-3 (ngưỡng coverage còn dư 1,3 điểm lines, 1,85 điểm branches), P3-4 (gate "module có test" quá lỏng), P3-5 (test lifecycle chậm khi tranh CPU), P3-6 (`scripts/test-failures.mjs` bỏ qua mã thoát vitest), P3-8 (digest bỏ file gitignored, `src/**`+`test/**` không phủ `package.json`), P3-9 (9 test skip trên Windows, repo không có CI).
- Token: TOK-01 (mô tả 13 skill, ước khoảng 530 token, không được đo, không có trần), TOK-02 (báo cáo `budgetUsage` dùng nhầm trần 2000 thay cho 1200 cho skill technique), TOK-03 (câu về quy tắc commit lặp 4 nơi), TOK-04 (bảng route trùng `nextStage`), TOK-05 (hai lệnh cùng việc `repo-map --tests` và `verify-plan --impact`), UX-04 (`--cancel --brief` bị từ chối trái hướng dẫn "thêm `--brief` cho mọi lệnh ghi"), UX-05 (hook repo-map nhắc sai với `rg --files`).
- Kiến trúc/refactor: A4 (`user-paths.ts` lặp tên 6 nền tảng ở 5 chỗ), A5 (`repo-map-internal.ts` import ngược lên `cli-helpers`, đúng 300 dòng), A6 (danh sách thư mục bị bỏ qua lặp 4 bản, đã lệch), A7 (`isRecord` 18 bản, `sortedUnique` 6 bản, 4 bản `exists` nuốt mọi lỗi), A8 (sàn test chỉ bằng khoảng 59% số thực, ước theo regex), A10, A11 (file sát trần 300 dòng; `saveWorkflowLocked` chạm complexity 20), A13, A14.
- Tài liệu: A2 (`--schema` còn mô tả đường dẫn epic phẳng cũ), A9 (sơ đồ phụ thuộc nhắc `src/migration` không tồn tại, bỏ sót `src/catalog` và `src/guides`), A12 (hướng dẫn `--brief` vô nghĩa với các lệnh đã mặc định brief), P3-7 (`HARNIX_WORKFLOW.md:227` mâu thuẫn với AGENTS.md về sha256 thô và phạm vi task contract).

### Tính năng có bằng chứng
- **FEAT-01**: journal ghi nhiều lần hủy task để gộp vào task khác trong epic (4 task ngày 2026-11-09, 2 task ngày 2026-10-14). Cách rẻ nhất: chỉnh chỉ dẫn `harnix-plan` reference `epic` về cỡ member, không cần đổi code.
- **FEAT-02** (đi nhanh `ready/ready` rồi `in_progress/implementing` cho Lite): bằng chứng yếu, chạm hợp đồng đóng băng; không khuyến nghị.

## 4. Công cụ tương tự (nhóm E, truy cập 2026-11-13)

| Công cụ | Quy mô | Điểm mạnh | Điểm yếu | Harnix hơn/kém |
|---|---|---|---|---|
| Superpowers | khoảng 317k sao, `v7.0.2` | Cộng đồng lớn, skill tự kích hoạt | Cài riêng từng harness, ceremony nặng, mặc định dùng subagent | Hơn ở ceremony thích nghi và digest; kém ở quy mô |
| Spec Kit | khoảng 150k sao, `v1.4.0` | Hệ sinh thái lớn | Cần Python 3.11+ và `uv` | Hơn ở kiểm chứng; kém ở quy mô |
| OpenSpec | khoảng 75k sao, `v2.0.0` | Nhẹ, spec sống sau archive | Cài theo project, cần Node ≥22.12 | Hơn ở evidence; kém ở spec sống |
| BMAD-METHOD | khoảng 55k sao, `v6.12.4` | Phủ cả vòng đời | Nhiều thành phần agent | Nhẹ hơn; kém ở độ phủ |
| Trellis | khoảng 15k sao | 22 nền tảng | Python runtime trong project, AGPL | Nhỏ hơn; kém ở số nền tảng |
| Taskmaster | khoảng 28k sao | Quản lý task đa editor | Cần MCP, chậm phát hành từ tháng 4 | Hơn ở an toàn |
| Aider (repo-map) | khoảng 50k sao | Repo map có ngân sách token | Chỉ trong Aider | Harnix dùng được qua nhiều agent |
| Serena | khoảng 31k sao | Điều hướng theo symbol bằng LSP | Cần MCP/daemon, Python, GPL | Harnix không có LSP chính xác |

Ý đáng cân nhắc: spec sống sau archive (OpenSpec; đang `deferred` trong `HARNESS_RESEARCH.md`), bước phân tích yêu cầu chỉ đọc (Kiro), ngân sách token tùy chọn cho `repo-map` (Aider). Giới hạn: nhận xét về đối thủ dựa trên README/docs, chưa đọc mã; không truy cập được docs chính thức của Cursor, Codex, OpenCode.

## 5. Thực tế sử dụng và thay đổi của 6 nền tảng (nhóm F)

- Gloaguen (arXiv 2602.11988, v3 2026-09-29): file ngữ cảnh luôn nạp làm chi phí tăng hơn 20%. McMillan (arXiv 2605.10039, 2026-05-11): tuân thủ quy tắc giảm dần trong phiên.
- Claude Code: hook `UserPromptSubmit` có báo cáo không chạy trên Windows và VS Code extension (nguồn thứ cấp). `AGENTS.md` chỉ được đọc khi không có `CLAUDE.md` (v2.1.277+).
- Codex: hook trust theo hash; đổi nội dung khối hook buộc trust lại. Đường dẫn skill user-level chỉ có nguồn thứ cấp.
- Cursor: `sessionStart` chưa đưa ngữ cảnh tới agent; mặc định nhập hook của Claude Code; đọc skill từ `~/.cursor`, `~/.agents`, `~/.claude`, `~/.codex`.
- Antigravity: hook plugin có vẻ chỉ chạy ở CLI `agy`; `facts.ts` thiếu `SessionStart`.
- Kiro, OpenCode: cấu hình hiện tại khớp tài liệu, trừ điểm chưa xác minh của hook Kiro (S6).
- Rủi ro cần xác minh trên bản cài dùng thử (đều là suy luận từ tài liệu): trùng skill trong Cursor, hook Claude chạy trong Cursor, đường dẫn plugin Antigravity.

## 6. Lộ trình đề xuất

| # | Việc | Loại | Ghi chú |
|---|---|---|---|
| 1 | S1 + S2 (+ finding doctor) | Lite | Cùng vùng `uninstall.ts`; bump patch |
| 2 | P2-1 + P2-2 | Full | Chạm hợp đồng đóng băng: cập nhật `IMPLEMENTATION_PLAN.md`, AGENTS.md, golden |
| 3 | A1 (gỡ cache khỏi git + finding doctor) | Lite | `git rm --cached` cần người dùng duyệt |
| 4 | UX-01..03 (hint cho lỗi flag phổ biến + test quét) | Lite | |
| 5 | Kiểm trên bản cài dùng thử (Cursor, Antigravity) | Nghiên cứu nhỏ | Không cần code trước |
| 6 | Nhóm P3 (sàn test, đo token, gom helper, tách file sát trần, đồng bộ tài liệu) | Epic nhỏ | Làm sau; mỗi mục độc lập |

## 7. Đã xem xét nhưng không đề xuất

MCP/daemon/subagent bắt buộc; dùng `beforeSubmitPrompt` của Cursor để tiêm ngữ cảnh; mở rộng quá 6 nền tảng; persona/agent theo vai trò. Không thấy lỗ hổng ở: race snapshot/run, evidence future-dated, khóa file, atomic write, `check-runner`, golden test.

## 8. Giới hạn

- Các phát hiện chưa được tác giả báo cáo tự xác minh lại.
- Không có CI trong repo; 9 test bị skip trên Windows (symlink, file mode).
- Nhóm B đã chạy `harnix init` trong thư mục tạm ngoài repo (rồi xóa) trái brief.
- `git status` sau review chỉ còn `.harnix/cache/repo-map-v1.json` đổi (do A1).
- `harnix doctor` báo `claude: drifted`; chưa tìm hiểu nguyên nhân.
