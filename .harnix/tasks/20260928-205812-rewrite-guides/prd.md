# PRD - Viết lại guide theo dạng lệnh + ràng buộc và thêm project-facts

## Vấn đề (số đo thật)

| Số liệu | Giá trị |
| --- | --- |
| Số guide đóng gói | 34 (common, 12 ngôn ngữ, 21 công nghệ) |
| Tổng token (ceil(ký tự/4)) | 41.676 |
| Guide lớn nhất | 1.631 token; cả 34 file vượt 600 |
| Một lần đọc `common` + `typescript` | 2.891 token; thêm `nextjs` là 4.062 |
| Lệnh chạy cụ thể trong guide | 0-4 dòng mỗi file (audit) |

Guide là thứ agent đọc theo yêu cầu (hook chỉ trỏ tới chúng), nên mỗi lần đọc tốn token đúng bằng kích thước file, mà phần lớn là văn xuôi chung chung. Audit còn ghi các nội dung lỗi thời. Các mục đó đã được kiểm chứng bằng nguồn chính thức (decision `d-stale-verified`):

| Guide | Sai | Đúng |
| --- | --- | --- |
| `nextjs.md` | `middleware.ts`, FID | `proxy.ts` (export `proxy`) từ Next.js 16; INP thay FID |
| `django.md` | khuyên dùng `bleach` | `bleach` ngừng bảo trì từ 2026-06-05; dùng sanitizer còn bảo trì như `nh3` |
| `go.md` | `gosimple`, thư mục `pkg/` | `gosimple` đã gộp vào `staticcheck`; layout chính thức dùng `internal/` và `cmd/` |

## Mục tiêu

1. Mọi guide theo đúng định dạng của `d-guide-format`: `## Verify`, `## Constraints`, `## Common mistakes`, tối đa 600 token.
2. Sửa nội dung lỗi thời ở trên.
3. Sinh `.harnix/spec/project-facts.md` (derived) lúc `init`/`update`: stack đã xác nhận và lệnh verify theo package.
4. Đo được mức giảm token của guide bằng `pnpm run measure:tokens`.
5. Cập nhật PRD, WORKFLOW, IMPLEMENTATION_PLAN (và README, skill nếu nhắc) trong cùng task; bump `2.0.0-dev.13` và CHANGELOG.

## Acceptance

- **ac-format** - Mọi guide đóng gói đúng định dạng và không quá 600 token; có mục `## Verify` chứa ít nhất một lệnh. **Verifies:** `test/workflow/guide-format.test.ts`, `test/unit/guides/catalog.test.ts`.
- **ac-stale** - `nextjs.md` nêu `proxy` và INP, không còn coi `middleware.ts` hay FID là hiện hành; `django.md` không khuyên dùng `bleach`; `go.md` không nhắc `gosimple` hay `pkg/` như khuyến nghị. **Verifies:** `guide-format.test.ts`.
- **ac-project-facts** - `.harnix/spec/project-facts.md` được ghi lúc init và update, tất định, ghi đè khi khác, không nằm trong manifest; bootstrap AGENTS.md nhắc tới nó. **Verifies:** `test/unit/core/spec/project-facts.test.ts`, `init.test.ts`, `update.test.ts`, test template bootstrap.
- **ac-docs-sync** - PRD, WORKFLOW, IMPLEMENTATION_PLAN cập nhật cho mọi contract đổi (đặc biệt câu khóa "Only selected content is materialized below `.harnix/spec/guides/`"). **Verifies:** `guide-format.test.ts` (kiểm tài liệu nhắc `project-facts.md`) và compliance review.
- **ac-token-measured** - `measure:tokens` in khối `guides`; tổng không quá 20.400 token và tối đa 600 mỗi file. **Verifies:** `test/workflow/measure-tokens.test.ts`, `chk-measure`.

## Non-goals

Không chuyển guide thành skill; không đổi cơ chế chọn guide hay schema v3; không commit tự động; `project-facts.md` không được nhúng vào hook context.

## Rủi ro

- Lệnh verify trong guide sai hoặc bịa: mỗi guide chỉ dùng lệnh chuẩn của công cụ chính thức (không phát minh cờ); có spot-check thủ công ở compliance review.
- Co 34 file về 600 token có thể bỏ sót ràng buộc quan trọng: giữ ràng buộc bắt lỗi thật, bỏ giải thích chung chung; không gỡ guide nào (decision `d-no-guide-removed`).
- Nhiều file do nhiều agent viết song song: định dạng được khóa bằng test, nội dung được đọc lại trước khi finish.
- `project-facts.md` ghi đè mỗi lần update: chấp nhận vì là derived (decision `d-project-facts-derived`).
