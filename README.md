# Harnix

Harnix là một harness gọn nhẹ, hoạt động cục bộ trong dự án dành cho các coding agent. Harnix chuyển yêu cầu thành những task có phạm vi và tiêu chí nghiệm thu rõ ràng, nạp tri thức dự án phù hợp trong giới hạn context, hướng dẫn quá trình triển khai và kiểm chứng, đồng thời lưu lại bằng chứng cùng kiến thức có thể tái sử dụng mà không đưa runtime dư thừa vào repository.

Repository: [github.com/tamtiger/harnix](https://github.com/tamtiger/harnix.git)

## Trạng thái

Harnix hiện **đang được triển khai và chưa phát hành**. Phase 1 đã có package scaffold, CLI help/usage và các primitive an toàn cho path/atomic write; các lệnh nghiệp vụ như `init` và `setup` chưa tồn tại. Yêu cầu sản phẩm, workflow, schema cố định, hợp đồng tích hợp nền tảng, kế hoạch triển khai và các cổng nghiệm thu đã hoàn tất.

Không cài `@tamtiger/harnix` từ npm cho đến khi README này được cập nhật với một bản phát hành đã kiểm chứng.

## Hình thái sản phẩm

- Một npm package: `@tamtiger/harnix`
- Một executable: `harnix`
- Một thư mục dữ liệu dự án: `.harnix/`
- Ba nền tảng coding được hỗ trợ: Kiro, Antigravity và Codex
- Runtime hoạt động cục bộ trong dự án và mặc định không cần mạng
- Một workflow chuẩn duy nhất với hai mức độ Lite và Full
- Không telemetry, daemon, dịch vụ hosted, global memory hoặc cơ chế điều phối đa agent bắt buộc

Tên công khai của nền tảng là Antigravity và executable là `agy`. Các bề mặt dự án đã được kiểm chứng của Antigravity sử dụng `GEMINI.md` và `.gemini/skills`; namespace vật lý này không có nghĩa Gemini CLI được hỗ trợ.

## CLI dự kiến

```text
harnix init [--migrate] [--dry-run]
harnix setup --kiro|--antigravity|--codex
harnix update
harnix upgrade
harnix uninstall [--purge]
harnix mem [query]
harnix doctor [--fix] [--json]
```

`init` tạo dữ liệu Harnix trong dự án. `setup` chỉ cài tích hợp cho nền tảng được chọn. Theo mặc định, các lệnh quản lý vòng đời phải bảo toàn nội dung do người dùng chỉnh sửa và dữ liệu thuộc sở hữu người dùng.

## Workflow

Harnix sử dụng một state machine duy nhất:

```text
triage -> planning -> ready -> implementing -> verifying -> finishing -> completed
                         |             |           |
                         +---------- debugging ----+
                                      |
                                   replan -> planning
```

Câu hỏi chỉ đọc và yêu cầu review có thể bỏ qua bước tạo task. Công việc Lite giữ một task record tối thiểu; công việc Full bổ sung task PRD và plan, còn design, research và persisted context chỉ được tạo khi thực sự cần. Hoàn thành luôn yêu cầu bằng chứng mới từ trạng thái hiện tại của source tree.

Xem [Workflow chuẩn](docs/HARNIX_WORKFLOW.md).

## Kiến trúc

Mục tiêu triển khai là một package TypeScript ESM duy nhất:

```text
src/
  core/             config, task, context, journal, ranh giới dự án
  commands/         bảy lệnh CLI công khai
  configurators/    Kiro, Antigravity, Codex
  templates/        template dự án và nền tảng
  rules/            hướng dẫn chung và theo ngôn ngữ/framework đã chọn
  skills/           các skill tập trung vào workflow Harnix
  migration/        phát hiện và migration hệ thống cũ an toàn
  utils/            path, detection, hashing, atomic file và managed file
```

Các module runtime được phân phối trong package đã cài. Repository sử dụng Harnix chỉ nhận dữ liệu dự án và nội dung managed của nền tảng đã chọn, không nhận bản sao runtime script.

## Tài liệu

- [Yêu cầu sản phẩm](docs/HARNIX_PRD.md)
- [Workflow chuẩn](docs/HARNIX_WORKFLOW.md)
- [Kế hoạch triển khai](docs/IMPLEMENTATION_PLAN.md)
- [Quyết định nghiên cứu harness](docs/HARNESS_RESEARCH.md)
- [Ánh xạ upstream](docs/UPSTREAM_MAPPING.md)
- [Baseline upstream cố định](docs/UPSTREAM_BASELINE.md)
- [Hướng dẫn coding agent](AGENTS.md)
- [Changelog](CHANGELOG.md)

## Phát triển

Toolchain dự kiến gồm Node.js `>=18`, pnpm, TypeScript, tsup, ESLint, Commander.js, Inquirer và Vitest. Package scaffold chưa tồn tại; hãy làm theo kế hoạch triển khai thay vì tự đặt ra lệnh mới trước khi Task 1.1 tạo và kiểm thử chúng.

Sau khi có scaffold, chuỗi nghiệm thu bắt buộc sẽ là:

```text
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm test:acceptance
pnpm pack:check
pnpm smoke:tarball
pnpm measure:init
pnpm measure:footprint
pnpm scan:release
```

Người đóng góp và coding agent phải bảo toàn thay đổi của người dùng, làm test-first đối với thay đổi hành vi, tuân thủ các hợp đồng v1 đã cố định và không tự động commit, push, publish hoặc thay đổi cấu hình global của công cụ.

## Nguồn gốc và giấy phép

Harnix là một bản triển khai phái sinh có chọn lọc, được xây dựng dựa trên nghiên cứu từ mindfold-ai/Trellis, ECC và Superpowers. SHA nguồn cố định, giấy phép, quyết định tái sử dụng và chính sách ghi công được mô tả trong [UPSTREAM_BASELINE.md](docs/UPSTREAM_BASELINE.md) và [UPSTREAM_MAPPING.md](docs/UPSTREAM_MAPPING.md).

Kế hoạch triển khai yêu cầu giấy phép/thông báo AGPL-3.0 cho phần code phái sinh từ Trellis và giữ nguyên ghi công MIT cho nội dung chuyển thể từ ECC và Superpowers. Các file giấy phép và thông báo cuối cùng sẽ được tạo cùng package scaffold trước khi phân phối.


