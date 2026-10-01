# Plan - Viết lại guide theo dạng lệnh + ràng buộc và thêm project-facts

Ưu tiên theo số đo: đọc guide (2,9k-4k token mỗi lần) rồi tới tính năng `project-facts.md`.

## Slices

- [x] S1. Hợp đồng định dạng guide (RED). `test/workflow/guide-format.test.ts` duyệt `guideSources`: mỗi guide có đúng H1 rồi ba mục `## Verify`, `## Constraints`, `## Common mistakes` theo thứ tự; `ceil(content.length/4)` không quá 600; Verify có ít nhất một dòng lệnh trong khối ```text; Constraints tối đa 10 gạch đầu dòng; Common mistakes tối đa 6. Thêm các khẳng định lỗi thời: `nextjs.md` chứa `proxy.ts` và `INP`, không chứa `FID`; `django.md` không chứa `bleach` như khuyến nghị (cho phép nhắc để cảnh báo "không dùng"); `go.md` không chứa `gosimple` và không khuyến nghị `pkg/`. Thêm khẳng định tài liệu: PRD và IMPLEMENTATION_PLAN nhắc `project-facts.md`. RED: cả 34 guide hiện tại thất bại.
- [x] S2. Viết lại `common.md` và 12 guide ngôn ngữ (`src/guides/languages/*.md`). Lệnh Verify chỉ dùng công cụ chính thức (ví dụ Go: `go vet ./...`, `staticcheck ./...`, `go test ./...`; Rust: `cargo clippy --all-targets -- -D warnings`, `cargo test`); `common.md` nói lệnh verify lấy từ `harnix verify-plan`. Chạy `guide-format.test.ts` chỉ với nhóm này.
- [x] S3. Viết lại 21 guide công nghệ: 13 framework (`abp, angular, axum, codeigniter, django, express, fastapi, gin, laravel, nestjs, nextjs, spring, vue`), `library/react-web`, `runtime/dotnet`, 6 database (`mongodb, mysql, postgresql, redis, relational, sqlserver`). Sửa lỗi thời ở `nextjs`, `django` (và `go` ở S2) theo `d-stale-verified`. Các guide database con vẫn dựa trên `relational` qua `extends`, không lặp nội dung.
- [x] S4. `project-facts.md`. RED: `test/unit/core/spec/project-facts.test.ts` (hàm thuần `renderProjectFacts(config, verifyPlan)`: tất định, không timestamp, tối đa 20 package + "và N package khác", có cảnh báo không có test) và `writeProjectFacts(root)` (tạo, ghi đè khi khác, không ghi khi giống, bỏ qua symlink thoát root); `init.test.ts`/`update.test.ts` kỳ vọng file được tạo/cập nhật và có trong kết quả `created`/`updated`; test bootstrap kiểm câu nhắc tới file và ngân sách 1.500 token vẫn đạt. GREEN: `src/core/spec/project-facts.ts`, gọi trong `updateProject` (`src/commands/update.ts`), mục dry-run của `init`, và câu nhắc trong `src/templates/harnix/agents.ts`. Không thêm vào manifest.
- [x] S5. Đo guide trong `measure:tokens`. RED: `test/workflow/measure-tokens.test.ts` kiểm hàm thuần `measureGuides(dir)` trả `{ files, totalTokens, maxTokens, commonPlusLanguage }`. GREEN: `scripts/measure-tokens.mjs` thêm khối `guides` vào báo cáo.
- [x] S6. Đồng bộ và phát hành. Cập nhật `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` (đổi câu khóa ở mục spec), README/skill nếu nhắc guide; `pnpm version:sync 2.0.0-dev.13 --summary <text> --kind changed` và `CHANGELOG.md`; `pnpm format`; build, `harnix update` để làm mới bản guide và `project-facts.md` của chính repo; chạy `measure:tokens` ghi số sau bằng decision và so với baseline 41.676.

## Kiểm chứng

Mỗi slice chạy test hẹp trước; `chk-guide-format`, `chk-project-facts`, `chk-guide-tokens`, `chk-measure` rồi một lần `check-suite` (lint + typecheck + test) ở verify. Ghi evidence bằng `--run-check`, lệnh ghép dùng `pwsh.exe`, mọi lệnh ghi dùng `--brief`.

## Rủi ro

Xem PRD. Thêm: chạm test đếm file/nội dung (catalog, init/update, templates) và golden snapshot nếu output init đổi; golden chỉ cập nhật có chủ đích và ghi decision. Công cụ: repo dùng CRLF và shell làm mất dấu `\` trong `node -e`, nên sửa file bằng công cụ Edit hoặc script có kiểm tra.
