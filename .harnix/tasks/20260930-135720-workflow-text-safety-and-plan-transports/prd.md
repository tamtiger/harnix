# PRD — An toàn văn bản và transport chỉnh kế hoạch cho hidden workflow

## Vấn đề

Agent Kiro trên Windows vẫn dựng JSON và script `.ps1` để chỉnh nghĩa vụ của task (sửa command của check, thêm check, sửa `relevantPaths`) vì `--save` là transport duy nhất cho các thao tác này. Qua Windows PowerShell 5.1 văn bản có dấu bị hỏng: `Get-Content` không `-Encoding UTF8` đọc UTF-8 thành ANSI (mojibake, ví dụ `Khá»Ÿi táº¡o`), và pipe sang lệnh native luôn thêm BOM `EF BB BF` dù đã đặt `$OutputEncoding = UTF8Encoding($false)`. Bản hỏng đi qua đường replan (`contractRevision`) và có thể được ghi vào `task.json`, `prd.md`, `plan.md`.

## Phạm vi

- Trong phạm vi: `src/commands/workflow-command.ts`, module mới trong `src/core/workflow/` (bỏ BOM, kiểm tra hỏng mã hóa, chỉnh kế hoạch), `workflow --schema`, cookbook/skill/activation, PRD, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` §4, `AGENTS.md`.
- Ngoài phạm vi: `--file`, đổi schema TaskRecord, sửa lại dữ liệu đã hỏng ở repo khác.

## Hợp đồng chính xác

- **BOM:** mọi body đọc từ stdin của `--save|--evidence|--migrate|--cancel|--learn` được bỏ `U+FEFF` đứng đầu trước khi parse.
- **Kiểm tra hỏng mã hóa:** `saveWorkflow` từ chối envelope có bất kỳ chuỗi nào (task, artifacts, epic, epicMembers) (a) chứa `U+FFFD`, hoặc (b) là mojibake của một chuỗi UTF-8 hợp lệ có ký tự ngoài ASCII: mọi ký tự ánh xạ được về byte theo `windows-1252` hoặc `windows-1258` và chuỗi byte đó giải mã UTF-8 hợp lệ ra chuỗi khác chứa ký tự ngoài ASCII. Văn bản tiếng Việt hoặc Latin hợp lệ không bị từ chối. Thông báo lỗi chỉ đường: sửa file trực tiếp bằng công cụ sửa file hoặc dùng transport dạng flag.
- **`--set-check <id>`** `[--description <t>] [--command <t>] [--scope focused|full] [--required|--no-required] [--criteria <ids>] [--input <glob>]...`: thêm hoặc cập nhật một validation check của task v3 active; field không nêu giữ nguyên. Check mới cần `--description`, `--scope`; check required cần `--criteria` và ít nhất một `--input`.
- **`--add-criterion <id> --text <text>`:** thêm một acceptance criterion `pending` (id chưa tồn tại).
- **`--set-paths`** `[--relevant-path <p>]... [--relevant-spec <p>]...`: thay toàn bộ danh sách tương ứng khi flag được nêu.
- **Quy tắc lưu chung cho ba transport trên:** đi qua `saveWorkflow`. Task `planning` (checkpoint khác `replan`): save thường. Task đã qua planning và chưa ở checkpoint `replan`: bắt buộc `--reason <10–1000 ký tự>` và làm đúng một save đặt checkpoint `replan` cùng `contractRevision.reason` (status giữ nguyên); sau đó người dùng chuyển `--transition ready/ready`. Task đã ở checkpoint `replan`: save thường. `--set-paths` không phải nghĩa vụ nên không cần `--reason`.
- **Hướng dẫn:** cookbook, `Persistence rules` của 6 skill và khối activation nói rõ: chỉnh check/criterion/paths bằng flag; sửa `prd.md`/`plan.md`/`design.md` trực tiếp bằng công cụ sửa file; văn bản có dấu không đi qua pipe hay script `-File` của `powershell.exe` 5.1 (dùng bash hoặc `pwsh` 7.4+); `$OutputEncoding` một mình không đủ vì vẫn thêm BOM.

## Tiêu chí chấp nhận

Xem `task.json`. Bằng chứng: `chk-text-safety-focused` (unit, integration, workflow tests) và `chk-full-suite`.

## Rủi ro

- Heuristic mojibake có thể chặn nhầm: chỉ chặn khi toàn chuỗi ánh xạ được về byte và giải mã UTF-8 hợp lệ ra ký tự ngoài ASCII; test cả văn bản Việt/Latin hợp lệ.
- Ba transport mới làm rộng bề mặt CLI: giữ mỗi transport nhỏ và đi qua `saveWorkflow` để giữ mọi guard.
