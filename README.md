# Harnix

Harnix là coding-agent harness chạy cục bộ trong repository. Harnix biến yêu cầu thành task có phạm vi và tiêu chí nghiệm thu rõ ràng, chọn context phù hợp trong giới hạn, hướng dẫn triển khai/kiểm chứng và lưu bằng chứng cùng knowledge có thể tái sử dụng.

Harnix hỗ trợ đúng ba nền tảng: Kiro, Antigravity và Codex.

Repository: [github.com/tamtiger/harnix](https://github.com/tamtiger/harnix.git)

## Trạng thái

Phase 5 review/refactor đã hoàn tất. Implementation Phase 6 cho user-global integrations của Kiro, Antigravity và Codex cùng toàn bộ automated acceptance đã pass với fresh evidence trên current working tree. Đây chưa phải là claim về một package đã publish. Manual smoke trên tool session thật trong disposable Windows profile/test home chưa được chạy vì chưa có explicit authorization để mutate profile ngoài test fixture. Vì vậy Harnix không claim discovery/activation thực tế trong tool của người dùng; xem [kế hoạch global setup](docs/GLOBAL_SETUP_REFACTOR_PLAN.md) để biết acceptance còn lại. Package chưa được publish lên npm; khi sử dụng từ source, hãy chạy CLI qua `pnpm` như hướng dẫn bên dưới.

## Đặc điểm sản phẩm

- Một npm package: `@tamtiger/harnix`
- Một executable: `harnix`
- Project data nằm trong namespace `.harnix/`; platform integration là user-global, explicit và Harnix-owned.
- Runtime chạy local, mặc định không cần network.
- Một workflow state machine duy nhất với hai mức ceremony: Lite và Full.
- Không telemetry, daemon, hosted service, global memory hoặc bắt buộc điều phối multi-agent.
- Không tự động commit, branch, worktree, merge, push, publish hay tạo pull request.

Antigravity có identity public là `antigravity`, flag là `--antigravity` và executable là `agy`. Phase 6 cài plugin Harnix namespaced vào hai user roots độc lập cho Desktop và CLI; không sửa MCP, account, registry, credential, permission policy hoặc state không thuộc Harnix.

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
harnix init
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
# Khởi tạo .harnix và tự động phát hiện language/technology độc lập
harnix init

# Cài integration một lần cho user profile; có thể chạy ngoài project
harnix setup --kiro --antigravity --codex --dry-run --json
harnix setup --kiro --antigravity --codex

# Kiểm tra drift, hook, path safety và secret exposure
harnix doctor --json
```

Nếu muốn chỉ định ngôn ngữ, dùng danh sách phân cách bằng dấu phẩy:

```powershell
harnix init --languages typescript --technologies vue
```

Khi bỏ qua override, Harnix đọc bounded repository evidence local và deterministic. Source-language IDs là `csharp`, `typescript`, `javascript`, `php`, `python`, `java`, `go`; technology IDs ban đầu là `dotnet`, `abp`, `nestjs`, `spring`, `react-web`, `vue`, `codeigniter`. Framework/runtime evidence không tự khẳng định source language.

## CLI

### `init`

Tạo các file `.harnix` cần thiết, rule liên quan và root `AGENTS.md` bootstrap để AI agent biết cách đọc workflow Harnix. Init không prompt, không tạo thư mục rỗng và không overwrite file người dùng đã có.

```text
harnix init [--user <name>] [--languages <csv>] [--technologies <csv>]
           [--dry-run]
```

- Không cần option cho trường hợp thông thường: Harnix lấy developer journal ID từ user hệ điều hành và tự detect stack.
- `--user`: override developer journal ID; chỉ cần khi muốn namespace khác hoặc CI cần giá trị cố định.
- `--languages`: override source-language detection bằng danh sách ID.
- `--technologies`: override technology detection bằng danh sách ID.
- `--dry-run`: kiểm tra kế hoạch mà không ghi file.

Output gồm `status`, developer, languages/technologies đã chọn, bounded repository-relative `detection.matches` và các mảng path `created`, `updated`, `unchanged`, `preserved`, `warnings`. Config v1 hiện hữu không bị init rescan/migrate; dùng `update` hoặc `doctor --fix` cho migration explicit.

`init` chỉ tạo và quản lý namespace `.harnix/`. Nó không kiểm tra, migrate, overwrite hoặc xóa `.trellis`, `.trellis-pro` hay các skill `trellis-*` đang có trong repository. `setup` là user-global nên không cần chạy lại theo từng project; trước khi kích hoạt, global skills/hook phải resolve project Harnix initialized gần nhất từ cwd hoặc workspace roots (kể cả ancestor), rồi mới dùng `.harnix/config.yaml` của project đó.

### `setup`

Materialize tích hợp user-global cho platform được chọn. Lệnh chạy được ở mọi thư mục, không resolve project root, không đọc `.harnix/config.yaml` và yêu cầu ít nhất một platform flag:

```text
harnix setup --kiro|--antigravity|--codex [--dry-run] [--json]
```

Có thể chọn nhiều flag trong một lần chạy. Mỗi invocation chỉ resolve/validate user root của platform đã chọn; ví dụ `CODEX_HOME` lỗi không làm `harnix setup --kiro` thất bại. `--dry-run` trả exact logical targets và planned state mà không ghi file. Kết quả trả status per platform/file: created, updated, unchanged, preserved, warnings và readiness. CLI tự xác minh file state, launcher và trust requirement đã biết; nó không tự chạy platform-version probe hoặc suy diễn activation/precedence từ file tồn tại. Các status `active`, `shadowed` và `unsupported-version` chỉ hợp lệ khi lifecycle boundary nhận được bằng chứng external authoritative; không có bằng chứng đó, Antigravity được báo `precedence-unknown`, Kiro là `installed`/`binary-unavailable`, và Codex là `installed-pending-trust`.

Setup dùng manifest sidecar độc lập cho từng platform root, chỉ update fragment Harnix chưa bị sửa, preserve collision/unrelated content và không copy runtime. Nếu launcher `harnix` không resolve được trong environment hook, files vẫn có thể được cài nhưng result là `binary-unavailable`, không phải ready.

### `update`

Đồng bộ managed files theo config hiện tại:

```text
harnix update
harnix update --restore
harnix update --global
harnix update --global --restore
harnix update --global --kiro --codex
harnix update --global --kiro --codex --dry-run --json
```

`update` không flag vẫn chỉ đồng bộ `.harnix/**` của project. `update --global` reconcile integration user-global; nếu không chỉ định platform, chỉ dùng platform có global manifest hợp lệ. Mặc định, file managed đã bị người dùng xóa sẽ được báo cáo nhưng không tự khôi phục. Dùng `--restore` khi muốn khôi phục rõ ràng. File obsolete chưa bị sửa sẽ được xóa; file obsolete đã sửa được giữ lại. Task, spec, journal và file không thuộc Harnix không bị chạm vào.

### `doctor`

Doctor JSON v2 kiểm tra project và global integrations riêng: config/manifest, ownership, missing/modified/obsolete files, injection marker, hook schema, Codex trust drift, skill frontmatter, unsafe path, secret và permission drift. Doctor vẫn hoạt động ngoài Harnix project để báo global integrations:

```text
harnix doctor
harnix doctor --json
harnix doctor --fix --json
harnix doctor --fix --global --json
```

`--fix` không có `--global` chỉ sửa project issue an toàn. `--fix --global` chỉ reconcile entry global missing/unchanged; không trust Codex hook, enable permission/feature hay sửa user fragment. `doctor` không tự probe version nền tảng hoặc suy activation/precedence từ file; `active`, `shadowed` và `unsupported-version` chỉ được report khi có bằng chứng external authoritative. Exit code:

- `0`: global state đọc an toàn, không warning/error; `project:not-initialized` ngoài project chỉ là info.
- `1`: warning actionable, gồm pending trust, binary unavailable, shadowed/precedence unknown, unsupported version hoặc drift.
- `2`: usage không hợp lệ, project/global manifest/schema corrupt/future hoặc path không an toàn.

### `mem`

Tìm journal memory theo query, developer và giới hạn kết quả:

```text
harnix mem "database migration"
harnix mem --user tam --limit 10 --json
harnix mem --query "timeout" --json
```

Journal malformed được đếm và bỏ qua; memory search không tự promote learning thành rule.

### `uninstall`

Gỡ project data hoặc một global integration theo scope explicit:

```text
harnix uninstall --purge
harnix uninstall --purge --yes
harnix uninstall --global --kiro --yes
harnix uninstall --legacy-project-surfaces
harnix uninstall --legacy-project-surfaces --yes
```

`--purge --yes` chỉ xóa `.harnix` project; không suy diễn thành gỡ global setup. `--global` chỉ gỡ platform đã chọn, preview trước và yêu cầu `--yes`. `--legacy-project-surfaces` chỉ xóa path legacy **standalone** khi manifest project v1 chứng minh đúng source/path Harnix sở hữu và content vẫn unchanged. File root/shared — gồm `AGENTS.md`, `GEMINI.md`, `.codex` config/hook và file người dùng bất kỳ — chỉ được inventory, không là deletion target; modified/untracked content luôn được preserve. Hai flag này mutually exclusive với `--purge`.

### `upgrade`

Upgrade mặc định chỉ hiển thị kế hoạch, không chạy network/install:

```text
harnix upgrade
harnix upgrade --apply
```

Chỉ dùng `--apply` khi muốn chạy npm upgrade explicit.

## Tích hợp platform

| Platform | Identity/flag | User-global surface Harnix tạo |
|---|---|---|
| Kiro | `kiro` / `--kiro` | `~/.kiro/skills/harnix-*`, `~/.kiro/steering/harnix.md`, `~/.kiro/hooks/harnix-context.json` |
| Antigravity | `antigravity` / `--antigravity` | Desktop `~/.gemini/config/plugins/harnix` và CLI `~/.gemini/antigravity-cli/plugins/harnix` |
| Codex | `codex` / `--codex` | `$HOME/.agents/skills/harnix-*`, `$CODEX_HOME/AGENTS.md`, `$CODEX_HOME/hooks.json` |

Kiro hook dùng JSON-v1 `UserPromptSubmit`; Antigravity hook trả `injectSteps` chỉ tại invocation đầu trong initialized project; Codex hook dùng nested `UserPromptSubmit` schema và cần người dùng review/trust qua `/hooks`. Activation guard resolve initialized project gần nhất từ cwd/workspace roots, kể cả ancestor của cwd, thay vì chỉ xét thư mục workspace hiện tại. Nếu không tìm thấy project đó hoặc event Antigravity malformed, internal context exit `0` và stdout rỗng; Antigravity chỉ trả `{ "injectSteps": [] }` khi đã xác định initialized project nhưng invocation đã qua lượt đầu hoặc không có context áp dụng. Nếu project đã được xác định nhưng state không đọc an toàn, Harnix không inject project data mà trả warning ngắn, redact và platform-specific để chạy `harnix doctor`; host agent vẫn không bị block. Các surface không liên quan được bảo toàn. Harnix không copy runtime script, không ghi absolute home path, không thêm `config.toml` key Codex, và không tạo platform surface mới trong project. Root `AGENTS.md` bootstrap do `init` tạo là ngoại lệ tương thích.

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

Bảy workflow skill được cài global nhưng source reviewable nằm tại `src/skills/harnix-*/SKILL.md`. Harnix nhúng trực tiếp các file này vào package và cài cùng nội dung cho Kiro, Antigravity và Codex; skill không được sinh từ các string rút gọn riêng theo platform.

## Dữ liệu dự án

```text
.harnix/
  config.yaml
  workflow.md
  .template-hashes.json
  spec/                 # guide/rule đã được quản lý
  tasks/                # tạo lazy khi persist task đầu tiên
  workspace/<developer>/journal/ # tạo lazy khi ghi journal đầu tiên
```

Task, spec, research và journal là dữ liệu người dùng. Harnix dùng atomic write, normalized POSIX path và containment check để hạn chế mất dữ liệu hoặc path escape qua symlink/junction.

## Dùng trong CI

CI nên chạy non-interactive và kiểm tra state trước khi merge:

```powershell
harnix init --user ci
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
git diff --check
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

Mọi filesystem test dùng temporary repository cô lập và disposable fake user home injected; không mutate profile/config thật hoặc gọi install/network thật ngoài boundary explicit. Tarball smoke dùng ít nhất hai root tạm độc lập: fake home cho setup và project cho init/context.

Automated Phase 6 gates đã pass với fresh evidence trên current working tree. Manual smoke vẫn là acceptance ngoài test fixture và **chưa được chạy**: dùng disposable Windows profile để mở session trong từng platform; explicit test home chỉ phù hợp command-side check nếu tool cũng được launch cùng home đó. Kiểm `harnix setup --kiro --antigravity --codex --dry-run --json`, sau đó chạy `harnix setup --kiro --antigravity --codex`, kiểm non-Harnix no-op và initialized-project context, review/trust Codex hook qua `/hooks`, chạy `harnix doctor --json`, preview bằng `harnix uninstall --global --kiro --antigravity --codex`, rồi chỉ apply `harnix uninstall --global --kiro --antigravity --codex --yes` sau khi đã kiểm target. Không dùng profile thật nếu chưa có explicit authorization.

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
