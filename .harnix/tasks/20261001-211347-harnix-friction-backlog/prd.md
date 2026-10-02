# PRD - Backlog lỗi và thiếu sót hướng dẫn do Harnix gây ra

## Vấn đề

Khi chạy workflow thật (epic `agent-token-diet`, task `rewrite-guides` của epic overhaul), agent gặp các lỗi mà nguyên nhân nằm ở Harnix: thông báo lỗi thiếu thông tin, hướng dẫn thiếu bước, hành vi `update` khó hiểu và chi phí token lặp. Mỗi lỗi bắt agent chạy lại hoặc đọc thêm tài liệu. Bảng dưới là nguồn duy nhất; sau mỗi task chạy thêm, bổ sung hàng mới (cột Nguồn ghi task phát hiện).

## Backlog

| # | Loại | Triệu chứng và bằng chứng | Vị trí | Hướng sửa gợi ý | Nguồn |
| --- | --- | --- | --- | --- | --- |
| HX-01 | thông báo lỗi | `--set-check ... --criteria <id chưa tồn tại>` chỉ báo "TaskRecord v3 validation criterion reference is invalid.", không nêu id nào; mất một lượt thử lại | `src/core/tasks/task-validate-contracts.ts:59` | nêu id criterion thiếu, liệt kê id hợp lệ và gợi ý thêm criterion trước | rewrite-guides |
| HX-02 | thông báo lỗi | Task migrate từ v2 từng `ready`: "cannot mutate required validation check check-suite; use persisted replan with contractRevision for v2." Task đã là v3, thông báo không nêu cờ cần dùng (`--reason`, 10-1000 ký tự) | `src/core/workflow/obligations.ts:80` | nêu `--reason` và đúng schema hiện tại | rewrite-guides |
| HX-03 | mã hoặc thiết kế | `harnix update` giữ `.harnix/spec/guides/languages/typescript.md` của chính repo như file bị sửa tay: hash trong manifest khác file thô, khác bản template LF và khác bản CRLF của checkout autocrlf, nên guide không được làm mới; chưa rõ nguyên nhân gốc | `src/core/managed/project-files.ts:144-156` | tái hiện trong repo tạm với autocrlf; chuẩn hóa xuống dòng khi so hash hoặc ghi rõ lý do preserved | rewrite-guides |
| HX-04 | thiết kế | `update` ở phạm vi project không có `--dry-run` ("--dry-run require update --global") nên không xem trước được thay đổi | `src/cli-program.ts:128` | thêm preview cho project hoặc nói rõ lệnh nào hỗ trợ | rewrite-guides |
| HX-05 | thiết kế | Hook UserPromptSubmit nhúng lại ở cả thông báo hệ thống của agent nền (6 lần ≈ 4k token); mỗi mục `relevantPaths` dài thêm một con trỏ ~25 token ở mỗi prompt (11 mục ≈ 275) | `src/commands/internal-context.ts` | giới hạn số con trỏ, bỏ tài liệu lớn khỏi con trỏ, hoặc gộp thành một dòng | rewrite-guides |
| HX-06 | hướng dẫn | `tsc` không bắt import hoặc biến thừa nhưng `pnpm lint` bắt: suite thất bại hai lần sau khi check hẹp đã pass | `src/skills/harnix-implement/SKILL.md` | dặn chạy lint trên file đã sửa trước khi ghi evidence suite | token-diet, rewrite-guides |
| HX-07 | hướng dẫn | Heredoc Bash trên Windows thất bại 3 lần (agent chính và hai agent con, "unexpected EOF"); here-string của `pwsh` chạy được; chưa rõ nguyên nhân | cookbook trong `src/templates/harnix/workflow.md` | cân nhắc khuyên `pwsh` 7.4+ khi JSON có dấu trên Windows | token-diet, rewrite-guides |
| HX-08 | thiết kế | `--run-check --brief` vẫn trả `outputTail` (~1,9 KB) | `src/core/workflow/run-check.ts` | cờ hoặc mặc định tail ngắn hơn với `--brief` | token-diet |
| HX-09 | thông báo lỗi | Task migrate từ v2 từng `ready` khi gọi `--set-check` trong `planning` báo lỗi freeze obligation và đòi replan contractRevision v2, chưa hướng dẫn rõ việc truyền `--reason` sẽ tự động chuyển checkpoint sang `replan` v3 | `src/core/workflow/obligations.ts` | Làm rõ thông báo rằng thêm `--reason` trong planning sẽ tự động mở replan v3 | add-technique-skills |
| HX-10 | thiết kế | `--input` trong `--set-check` là repeatable flag (`--input "src/**" --input "test/**"`), không tự tách chuỗi ngăn cách bởi dấu phẩy, trong khi `--criteria` nhận chuỗi dấu phẩy (`--criteria "ac-1,ac-2"`). Khi truyền `--input "src/**,test/**"`, suite gate không match được và báo thiếu coverage | `src/commands/workflow-command.ts:272` | Cho phép `--input` tự tách comma-separated hoặc cảnh báo nếu chuỗi chứa dấu phẩy | add-technique-skills |
| HX-11 | hướng dẫn & linter | ESLint cấm inline `import("...").Type` theo luật `consistent-type-imports`, và Prettier check bắt định dạng trước khi chạy eslint; agent tạo file test mới dễ vi phạm nếu không chạy `pnpm format` trước | `eslint.config.mjs` | Dặn trong skill implement chạy `pnpm format` trước `pnpm lint` hoặc tích hợp auto-format trong script verify | add-technique-skills |
| HX-12 | thiết kế | Bổ sung nhiều validation checks liên tiếp đòi hỏi gọi `--set-check` nhiều lần độc lập, mỗi lần phải lặp lại flag `--reason` khi ở trạng thái replan | `src/commands/workflow-command.ts` | Hỗ trợ batch update checks qua file/stdin hoặc lệnh tổng hợp | add-technique-skills |
| HX-13 | mã & kiến trúc | Circular dependency giữa `catalog.ts` và modular skills module khi load đồng thời ở top-level gây `techniqueSkills is not iterable` tại runtime | `src/skills/catalog.ts`, `src/skills/technique-skills.ts` | Tách helper parsing độc lập (DAG một chiều), tránh top-level mutual import giữa catalog và modular skills | add-technique-skills |
| HX-14 | thiết kế & quy ước test | `test-structure.test.ts` bắt buộc mọi test file phải mirror chính xác một `src` module (`unitOrphans`, `commandOrphans`), trong khi task v3 coi mọi required check có passing evidence là bất biến (immutable) và gán `stale (inputs-unavailable)` ngay khi xóa file input cũ. Agent không thể xóa/gộp test file mà không làm hỏng verify digest của task | `test/unit/test-structure.test.ts`, `src/core/workflow/obligations.ts` | Hướng dẫn rõ trong skill plan/implement rằng các file test được khai báo làm input cho check phải tuân thủ layout mirror của `test-structure.test.ts` ngay từ đầu, hoặc cho phép cơ chế thay thế check an toàn khi refactor cấu trúc test | add-technique-skills |
| HX-15 | hướng dẫn & tooling | `pnpm version:sync` ghi file markdown/json chưa qua định dạng của Prettier; nếu không chạy `pnpm format` ngay sau đó thì `pnpm lint` (chứa `pnpm format:check`) sẽ fail | `scripts/version-sync.mjs`, `src/skills/harnix-implement/SKILL.md` | Gọi Prettier format tự động ngay trong `version-sync.mjs` trên các file bị sửa, hoặc dặn rõ trong skill implement chạy `pnpm format` sau version:sync | add-test-impact-map |
| HX-16 | thông báo lỗi | `validateRecord` trong `src/core/repo-map/store.ts` ném lỗi chung chung `"Invalid repo map record."` khi `contentHash` không đủ 64 ký tự hex SHA-256 hoặc `importTargets` chưa sorted/unique, không chỉ rõ trường nào vi phạm khiến debug test fixture mất nhiều thời gian | `src/core/repo-map/store.ts:16-30` | Bổ sung chi tiết trường lỗi trong thông báo (ví dụ `"Invalid repo map record: contentHash must be a 64-character hex string."`, `"Invalid repo map record: importTargets must be sorted and deduplicated."`) | add-test-impact-map |
| HX-17 | tính năng & ngôn ngữ | `extract.ts` chưa bóc tách cú pháp `using <Namespace>;` của C# và quan hệ `<ProjectReference>` trong `.csproj` vào `importTargets`, khiến đồ thị phụ thuộc (`--impact` và `--tests` bắc cầu) trên repo .NET chủ yếu dựa vào naming convention chứ chưa duyệt sâu đồ thị phụ thuộc | `src/core/repo-map/extract.ts:73-83`, `src/core/repo-map/graph.ts` | Bổ sung regex bóc tách `using [static] <Namespace>;` cho C# và phân giải namespace/project reference tương ứng vào đồ thị repo-map | add-test-impact-map |
| HX-18 | cấu hình linter | ESLint 9 Flat Config ném `TypeError: Expected value to be a non-empty array` khi mảng miễn trừ `files: []` rỗng, khiến linter bị crash khi clean toàn bộ danh sách miễn trừ | `eslint.config.mjs:51-78` | Sử dụng conditional spread `...(ARRAY.length > 0 ? [{ files: ARRAY, ... }] : [])` để an toàn khi danh sách rỗng | release-v2 |
| HX-19 | hướng dẫn & tooling | Lệnh `node bin/harnix.js` trong một số chỉ dẫn/thói quen CLI bị lỗi `Cannot find module` do entry point binary thực tế nằm ở `dist/cli.js` (không có thư mục `bin/`); cần build trước và chạy `node dist/cli.js` hoặc `pnpm exec harnix` | `package.json`, hướng dẫn AGENTS | Hướng dẫn rõ ràng cách chạy CLI từ source repo hoặc thêm stub `bin/harnix.js` chuyển tiếp | release-v2 |

## Ngoài phạm vi (không do Harnix)

`WebFetch` trả về cả trang tài liệu (~11k token) dù prompt hỏi hẹp; heredoc của Bash tool là hành vi môi trường. Chỉ ghi để không nhầm với lỗi Harnix.

## Acceptance

- **ac-triage** - Mỗi hàng của bảng backlog được sửa (có test hoặc kiểm chứng lặp lại được) hoặc bị từ chối kèm lý do ghi ngay trong bảng. **Verifies:** compliance review từng hàng và `chk-suite`.

## Non-goals

Không sửa lỗi môi trường; không đổi schema v3; không commit tự động.

## Rủi ro

Danh sách còn mở: các task chạy sau có thể thêm hàng, nên task giữ `planning` cho tới khi người dùng chốt phạm vi. Obligation (criterion, check) đóng băng ở `ready`, vì vậy chỉ chốt khi danh sách đã ổn định.
