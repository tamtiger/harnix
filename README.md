# Harnix

Harnix là coding-agent harness chạy cục bộ trong repository. Harnix biến yêu cầu thành task có phạm vi và tiêu chí nghiệm thu rõ ràng, chọn context phù hợp trong giới hạn, hướng dẫn triển khai/kiểm chứng và lưu bằng chứng cùng knowledge có thể tái sử dụng.

Harnix hỗ trợ đúng ba nền tảng: Kiro, Antigravity và Codex.

Repository: [github.com/tamtiger/harnix](https://github.com/tamtiger/harnix.git)

## Trạng thái

Phase 5 review/refactor đã hoàn tất và toàn bộ acceptance gate hiện tại đã pass. Package chưa được publish lên npm; khi sử dụng từ source, hãy chạy CLI qua `pnpm` như hướng dẫn bên dưới.

## Đặc điểm sản phẩm

- Một npm package: `@tamtiger/harnix`
- Một executable: `harnix`
- Một namespace dữ liệu dự án: `.harnix/`
- Runtime chạy local, mặc định không cần network.
- Một workflow state machine duy nhất với hai mức ceremony: Lite và Full.
- Không telemetry, daemon, hosted service, global memory hoặc bắt buộc điều phối multi-agent.
- Không tự động commit, branch, worktree, merge, push, publish hay tạo pull request.

Antigravity có identity public là `antigravity`, flag là `--antigravity` và executable là `agy`. Harnix chỉ tạo project-local `GEMINI.md` cùng `.gemini/skills/harnix-*`; không chỉnh user-level `.gemini` state.

## Yêu cầu

- Node.js `>=18`
- pnpm `11.4.0` hoặc tương thích
- Một repository dự án có quyền đọc/ghi
- Executable nền tảng tương ứng nếu muốn kiểm tra readiness; test và setup fixture vẫn có thể chạy offline.

## Cài đặt và chạy từ source

```powershell
git clone https://github.com/tamtiger/harnix.git
Set-Location harnix
pnpm install --frozen-lockfile
pnpm build
```

### Đăng ký lệnh `harnix` global từ source

Package hiện chưa được publish lên npm. Để gọi trực tiếp `harnix` trong mọi PowerShell, build và đăng ký binary local từ thư mục repository Harnix:

```powershell
Set-Location C:\FPT\MyProject\harnix
pnpm install --frozen-lockfile
pnpm build
pnpm add -g .

# Xác nhận PowerShell tìm thấy executable
Get-Command harnix
harnix --help
```

Với pnpm 11, không dùng `pnpm link --global`; lệnh này đã bị loại bỏ. Dùng `pnpm add -g .` để đăng ký binary khai báo trong trường `bin` của `package.json`.

Nếu `pnpm add -g .` báo không tìm thấy global bin directory, hoặc `Get-Command harnix` vẫn không tìm thấy lệnh, chạy:

```powershell
pnpm setup
pnpm bin -g
```

Sau `pnpm setup`, đóng toàn bộ cửa sổ PowerShell, mở cửa sổ mới rồi chạy lại `pnpm add -g .` và `harnix --help`. `pnpm setup` tạo `PNPM_HOME` và thêm thư mục global bin vào `PATH`; terminal đang mở trước đó thường chưa nhận biến môi trường mới.

Khi source thay đổi, chạy lại `pnpm build`. Nếu muốn đăng ký lại bản global một cách rõ ràng, chạy lại `pnpm add -g .`. Để gỡ bản global:

```powershell
pnpm remove -g @tamtiger/harnix
```

Sau khi đăng ký thành công, có thể chuyển sang repository cần quản lý và chạy:

```powershell
Set-Location C:\path\to\consumer-project
harnix init --yes --user tam
harnix setup --codex
harnix doctor --json
```

### Chạy không cần đăng ký global

Các ví dụ bên dưới dùng lệnh `harnix` với giả định binary đã nằm trên `PATH` hoặc package đã được cài vào dự án. Khi chạy trực tiếp từ source chưa publish, thay `harnix` bằng `node C:\path\to\harnix\dist\cli.js`.

Trong repository cần quản lý, chạy binary đã build:

```powershell
node C:\path\to\harnix\dist\cli.js --help
```

Khi package đã được publish, có thể cài project-local và gọi qua `pnpm exec`:

```powershell
pnpm add -D @tamtiger/harnix
pnpm exec harnix --help
```

Hoặc cài global từ npm:

```powershell
pnpm add -g @tamtiger/harnix
harnix --help
```

Hai lệnh cài từ npm ở trên sẽ trả `404` cho đến khi `@tamtiger/harnix` được publish thành công trên npm registry.

## Quick start

Từ thư mục gốc dự án:

```powershell
# Khởi tạo .harnix và tự động phát hiện ngôn ngữ/framework
harnix init --yes --user tam

# Chọn một hoặc nhiều coding agent
harnix setup --kiro --antigravity --codex

# Kiểm tra drift, hook, path safety và secret exposure
harnix doctor --json
```

Nếu muốn chỉ định ngôn ngữ, dùng danh sách phân cách bằng dấu phẩy:

```powershell
harnix init --yes --user tam --languages vue,typescript-nestjs
```

Khi bỏ qua `--languages`, Harnix đọc marker dự án một cách local và deterministic. Các language/framework ID hiện được nhận diện gồm C#/.NET ABP, NestJS, Python, Java/Spring, Go, React web và Vue.

## CLI

### `init`

Tạo `.harnix/`, config, workflow, task/workspace namespace, các rule liên quan và root `AGENTS.md` bootstrap để AI agent biết cách đọc workflow Harnix. Init không overwrite file người dùng đã có.

```text
harnix init [--yes] [--user <name>] [--languages <csv>]
           [--dry-run]
```

- `--yes`: không prompt, phù hợp CI.
- `--user`: developer workspace ID; chỉ cho phép ký tự an toàn.
- `--languages`: override detection bằng danh sách language ID.
- `--dry-run`: kiểm tra kế hoạch mà không ghi file.

`init` chỉ tạo và quản lý namespace `.harnix/`. Nó không kiểm tra, migrate, overwrite hoặc xóa `.trellis`, `.trellis-pro` hay các skill `trellis-*` đang có trong repository. Sau `init`, chạy `setup` cho platform cần dùng để tạo các skill `harnix-*`.

### `setup`

Materialize tích hợp cho platform được chọn và ghi ownership vào managed manifest:

```text
harnix setup --kiro|--antigravity|--codex
```

Có thể chọn nhiều flag trong một lần chạy. Setup bảo toàn file đã bị người dùng chỉnh sửa, không tạo Antigravity settings/hooks chưa được xác minh, và cảnh báo nếu không tìm thấy executable `agy`.

### `update`

Đồng bộ managed files theo config hiện tại:

```text
harnix update
harnix update --restore
```

Mặc định, file managed đã bị người dùng xóa sẽ được báo cáo nhưng không tự khôi phục. Dùng `--restore` khi muốn khôi phục rõ ràng. File obsolete chưa bị sửa sẽ được xóa; file obsolete đã sửa được giữ lại. Task, spec, journal và file không thuộc Harnix không bị chạm vào.

### `doctor`

Kiểm tra config/manifest, ownership, missing/modified/obsolete files, injection marker, hook schema, Codex trust drift, skill frontmatter, unsafe path, secret và permission drift:

```text
harnix doctor
harnix doctor --json
harnix doctor --fix --json
```

`--fix` chỉ sửa managed issue an toàn và luôn diagnose lại sau khi sửa. Exit code:

- `0`: project sạch.
- `1`: có warning hoặc error cần xử lý.
- `2`: usage không hợp lệ, state corrupt hoặc path không an toàn.

### `mem`

Tìm journal memory theo query, developer và giới hạn kết quả:

```text
harnix mem "database migration"
harnix mem --user tam --limit 10 --json
harnix mem --query "timeout" --json
```

Journal malformed được đếm và bỏ qua; memory search không tự promote learning thành rule.

### `uninstall`

Gỡ platform surface nhưng giữ `.harnix` data:

```text
harnix uninstall
harnix uninstall --purge
harnix uninstall --purge --yes
```

Uninstall mặc định chỉ xóa surface managed chưa bị sửa và giữ injected block đã bị người dùng chỉnh sửa. `--purge` xóa toàn bộ `.harnix`; nếu thiếu `--yes`, lệnh chỉ preview target và trả exit code 2.

### `upgrade`

Upgrade mặc định chỉ hiển thị kế hoạch, không chạy network/install:

```text
harnix upgrade
harnix upgrade --apply
```

Chỉ dùng `--apply` khi muốn chạy npm upgrade explicit.

## Tích hợp platform

| Platform | Identity/flag | Surface Harnix tạo |
|---|---|---|
| Kiro | `kiro` / `--kiro` | `.kiro/skills`, steering và frozen context hook |
| Antigravity | `antigravity` / `--antigravity` | `GEMINI.md`, `.gemini/skills/harnix-*` |
| Codex | `codex` / `--codex` | `AGENTS.md`, `.agents/skills/harnix-*`, `.codex/config.toml`, `.codex/hooks.json` |

Các surface của người dùng và top-level hook/config key không liên quan được bảo toàn. Harnix không copy runtime script vào project đích.

## Workflow sử dụng

Workflow duy nhất của Harnix có state machine:

```text
triage -> planning -> ready -> implementing -> verifying -> finishing -> completed
                         |             |           |
                         +---------- debugging ----+
                                      |
                                   replan -> planning
```

- Lite phù hợp thay đổi nhỏ, có task record và validation tối thiểu.
- Full dùng cho thay đổi cross-layer, security-sensitive, material unknown hoặc yêu cầu implementation lớn; có thêm PRD/plan và research khi cần.
- Câu hỏi chỉ đọc có thể bypass việc tạo task.
- Finish yêu cầu fresh verification, mọi acceptance criterion đạt hoặc được waiver hợp lệ, sau đó journal evidence và clear active task.

Xem [Workflow chuẩn](docs/HARNIX_WORKFLOW.md) để biết transition, gate và artifact contract chi tiết.

## Dữ liệu dự án

```text
.harnix/
  config.yaml
  workflow.md
  .developer
  .template-hashes.json
  spec/                 # guide/rule đã được quản lý
  tasks/                # task record và artifact do người dùng sở hữu
  workspace/<developer>/journal/
```

Task, spec, research và journal là dữ liệu người dùng. Harnix dùng atomic write, normalized POSIX path và containment check để hạn chế mất dữ liệu hoặc path escape qua symlink/junction.

## Dùng trong CI

CI nên chạy non-interactive và kiểm tra state trước khi merge:

```powershell
harnix init --yes --user ci
harnix doctor --json
```

Không truyền credential vào command line hoặc generated output. Harnix không tự gọi network trong runtime; chỉ `upgrade --apply` và các bước dependency/package manager explicit mới cần network.

## Phát triển Harnix

Toolchain gồm Node.js `>=18`, pnpm, TypeScript, tsup, ESLint, Commander.js, Inquirer và Vitest.

Quality gate đầy đủ:

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

Các suite riêng lẻ:

```text
pnpm test:unit
pnpm test:integration
pnpm test:migration
pnpm test:platform
pnpm test:workflow
pnpm test:safety
```

Mọi filesystem test dùng temporary repository cô lập, không mutate global user configuration và không gọi install/network thật ngoài boundary explicit.

## Tài liệu

- [Yêu cầu sản phẩm](docs/HARNIX_PRD.md)
- [Workflow chuẩn](docs/HARNIX_WORKFLOW.md)
- [Kế hoạch triển khai](docs/IMPLEMENTATION_PLAN.md)
- [Kế hoạch review/refactor](docs/REVIEW_REFACTOR_PLAN.md)
- [Quyết định nghiên cứu harness](docs/HARNESS_RESEARCH.md)
- [Ánh xạ upstream](docs/UPSTREAM_MAPPING.md)
- [Baseline upstream cố định](docs/UPSTREAM_BASELINE.md)
- [Hướng dẫn coding agent](AGENTS.md)
- [Changelog](CHANGELOG.md)

## Nguồn gốc và giấy phép

Harnix là implementation phái sinh có chọn lọc, được xây dựng dựa trên nghiên cứu từ mindfold-ai/Trellis, ECC và Superpowers. SHA nguồn, giấy phép, quyết định tái sử dụng và chính sách attribution được mô tả trong [UPSTREAM_BASELINE.md](docs/UPSTREAM_BASELINE.md) và [UPSTREAM_MAPPING.md](docs/UPSTREAM_MAPPING.md).

Package sử dụng giấy phép AGPL-3.0-or-later và giữ attribution MIT cho nội dung chuyển thể từ ECC và Superpowers. Xem [LICENSE](LICENSE) và [NOTICE](NOTICE).
