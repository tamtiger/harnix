# Harnix

**Version:** `1.1.9`

Harnix là một coding-agent harness chạy **cục bộ** trong repository của bạn. Nói đơn giản: bạn gõ yêu cầu bằng ngôn ngữ tự nhiên cho agent (Kiro, Antigravity, Codex hoặc Claude Code), Harnix sẽ tự động biến yêu cầu đó thành một **task có phạm vi rõ ràng**, chọn đúng phần context cần thiết, dẫn dắt agent triển khai + kiểm chứng theo quy trình chuẩn, rồi lưu lại bằng chứng để lần sau có thể xem lại hoặc tiếp tục.

Repository: [github.com/tamtiger/harnix](https://github.com/tamtiger/harnix.git)

## Mục lục

- [Harnix giải quyết vấn đề gì?](#harnix-giải-quyết-vấn-đề-gì)
- [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
- [Cài đặt](#cài-đặt)
- [Bắt đầu nhanh](#bắt-đầu-nhanh)
- [Harnix hoạt động như thế nào](#harnix-hoạt-động-như-thế-nào)
- [Từ yêu cầu người dùng đến workflow agent](#từ-yêu-cầu-người-dùng-đến-workflow-agent)
- [Các lệnh CLI thường dùng](#các-lệnh-cli-thường-dùng)
- [Xem lại một task](#xem-lại-một-task)
- [Tích hợp platform](#tích-hợp-platform)
- [Dữ liệu dự án (.harnix/)](#dữ-liệu-dự-án-harnix)
- [Dùng trong CI](#dùng-trong-ci)
- [Đóng góp / phát triển Harnix](#đóng-góp--phát-triển-harnix)
- [Tài liệu đầy đủ](#tài-liệu-đầy-đủ)
- [Nguồn gốc và giấy phép](#nguồn-gốc-và-giấy-phép)

## Harnix giải quyết vấn đề gì?

Khi làm việc với một coding agent, hai vấn đề hay gặp là: agent quên mất mình đang làm gì giữa chừng, và không ai biết agent đã thực sự kiểm chứng thay đổi hay chưa. Harnix gắn một quy trình làm việc (workflow) cố định vào agent để giải quyết việc đó:

- **Một npm package** (`@tamtiger/harnix`) và **một executable** (`harnix`).
- Hỗ trợ đúng 4 nền tảng agent: **Kiro, Antigravity, Codex và Claude Code**.
- Dữ liệu task nằm gọn trong `.harnix/` của từng project; tích hợp platform là cấu hình user-global, cài một lần, dùng cho mọi project.
- Chạy hoàn toàn local, mặc định không cần network, không telemetry, không daemon, không hosted service.
- **Không bao giờ tự động commit, branch, merge, push, publish hay tạo pull request** — trước mọi commit, Harnix luôn trình bày thay đổi và commit message đề xuất, rồi chờ bạn duyệt.
- Package hiện **chưa publish lên npm**; dùng trực tiếp từ source theo hướng dẫn cài đặt bên dưới.

## Yêu cầu hệ thống

- Node.js `>=18`
- pnpm `11.4.0` hoặc tương thích
- Một repository dự án có quyền đọc/ghi

## Cài đặt

```powershell
git clone https://github.com/tamtiger/harnix.git
Set-Location harnix
pnpm install --frozen-lockfile
pnpm build
pnpm add -g .          # đăng ký lệnh `harnix` dùng được ở mọi nơi trong PowerShell

Get-Command harnix
harnix --help
```

Lưu ý:

- pnpm 11 không còn `pnpm link --global`; dùng `pnpm add -g .` để đăng ký binary khai báo trong `bin` của `package.json`.
- Nếu `pnpm add -g .` báo không tìm thấy global bin directory, chạy `pnpm setup`, mở lại cửa sổ PowerShell mới (để nhận `PATH` vừa được `pnpm setup` thêm vào), rồi chạy lại `pnpm add -g .`.
- Muốn gỡ bản global: `pnpm remove -g @tamtiger/harnix`.
- Không muốn cài global? Gọi trực tiếp `node C:\path\to\harnix\dist\cli.js` thay cho `harnix` trong mọi ví dụ ở tài liệu này.
- Khi package được publish lên npm, có thể cài bằng `pnpm add -D @tamtiger/harnix` (project-local) hoặc `pnpm add -g @tamtiger/harnix` (global) — hiện tại hai lệnh này sẽ trả `404`.

## Bắt đầu nhanh

Sau khi đã có lệnh `harnix` (bước Cài đặt ở trên), làm theo 4 bước sau trong **repository bạn muốn Harnix quản lý** (khác với repo `harnix` bạn vừa clone):

```powershell
# 1. Vào project cần dùng Harnix và khởi tạo
Set-Location C:\path\to\your-project
harnix init

# 2. Cài tích hợp cho platform agent bạn đang dùng (chỉ cần làm 1 lần, dùng chung cho mọi project)
harnix setup --claude        # hoặc --kiro / --antigravity / --codex, có thể chọn nhiều cờ cùng lúc

# 3. Mở Kiro / Antigravity / Codex / Claude Code ngay tại project này và gửi yêu cầu bình thường,
#    ví dụ: "thêm retry có backoff cho payment webhook và cập nhật test"
#    -> Harnix tự phân loại yêu cầu và dẫn dắt agent qua đúng quy trình, không cần bạn gõ lệnh nào thêm.

# 4. Xem task hiện tại và bước tiếp theo bất cứ lúc nào
harnix status
```

Vài lệnh hữu ích khác khi mới dùng:

```powershell
harnix doctor              # kiểm tra drift, hook, path safety và secret exposure
harnix tasks --limit 20    # xem lịch sử task local
harnix resume <task-id>    # tiếp tục một task chưa hoàn thành, theo đúng ID
```

Muốn chỉ định sẵn ngôn ngữ/công nghệ thay vì để Harnix tự phát hiện:

```powershell
harnix init --languages typescript --technologies vue
```

## Harnix hoạt động như thế nào

Luồng chính:

```text
harnix init -> harnix setup + trust hook -> yêu cầu tự nhiên với agent
                                      -> triage -> planning -> ready
                                      -> implementing -> verifying -> finishing -> completed
```

Bạn không cần gọi lệnh để tự tạo, chuyển stage hay hoàn tất task — agent làm việc đó thông qua các skill Harnix. Mỗi yêu cầu mới được agent phân loại trước:

| Loại | Khi nào | Điều gì xảy ra |
|---|---|---|
| **Bypass** | Câu hỏi chỉ đọc, review/research độc lập, sửa docs/prose, hoặc sửa một giá trị literal đơn lẻ | Trả lời/thực hiện ngay, không tạo hay đụng vào task nào |
| **Lite** | Thay đổi nhỏ, phạm vi rõ ràng | Tạo một task record gọn, kiểm chứng tối thiểu |
| **Full** | Thay đổi cross-layer, nhạy cảm về bảo mật, hoặc còn nhiều điểm chưa rõ | Có thêm PRD/plan, research khi cần, kiểm chứng đầy đủ |

Toàn bộ state machine của workflow:

```text
triage -> planning -> ready -> implementing -> verifying -> finishing -> completed
                         |             |           |
                         +---------- debugging ----+
                                      |
                                   replan -> planning
```

Chi tiết đầy đủ (transition, gate, artifact contract) nằm ở [Workflow chuẩn](docs/HARNIX_WORKFLOW.md) — README này chỉ cần đủ để bạn hiểu luồng tổng quát.

## Từ yêu cầu người dùng đến workflow agent

**Gửi yêu cầu tự nhiên** cho agent (Kiro, Antigravity, Codex, Claude Code) ngay trong project đã `harnix init` — không cần gõ lệnh `harnix` nào trước. Agent tự phân loại yêu cầu đó trước khi chạm vào task đang active:

- Một câu hỏi chỉ đọc, một review độc lập, hoặc một **standalone read-only research** không tạo hay đụng vào task nào — agent trả lời/thực hiện ngay rồi dừng lại (Bypass).
- Ngược lại, bất kỳ yêu cầu nào **thay đổi file repository hoặc task artifact phải đi vào lifecycle Lite/Full** — tạo hoặc tiếp tục một task record, đi qua đúng các stage `planning -> ready -> implementing -> verifying -> finishing -> completed`.

**Public CLI quản lý harness và diagnostics; coding agent dùng các skill Harnix để chuyển stage.** Bạn hầu như không bao giờ tự gõ `harnix workflow --save/--transition/--evidence/...` — các skill đó chỉ dành cho agent dùng nội bộ. Bạn dùng CLI để xem trạng thái (`harnix status`, `harnix audit`, `harnix checks`) hoặc bảo trì cấu hình (`harnix doctor`, `harnix update`).

**Seed specs và `.harnix/workflow.md` được Harnix quản lý cho đến khi người dùng sửa** — sau lần chỉnh sửa đầu tiên, `harnix update` sẽ luôn giữ nguyên phần bạn đã đổi. Ngược lại: **Task, research và journal luôn là dữ liệu người dùng** — Harnix không bao giờ tự sửa hay xoá nội dung bên trong `.harnix/tasks/`, research hay journal của bạn.

## Các lệnh CLI thường dùng

Mọi output của public command đều là JSON. Dưới đây là các lệnh bạn sẽ dùng thường xuyên nhất; danh sách đầy đủ options và output shape nằm ở [Yêu cầu sản phẩm](docs/HARNIX_PRD.md#12-lifecycle-commands).

| Lệnh | Dùng để làm gì |
|---|---|
| `harnix init [--languages <csv>] [--technologies <csv>] [--dry-run]` | Khởi tạo `.harnix/` trong project, tự phát hiện ngôn ngữ/công nghệ |
| `harnix setup --kiro\|--antigravity\|--codex\|--claude [--dry-run]` | Cài tích hợp user-global cho platform agent (chạy 1 lần, dùng cho mọi project) |
| `harnix status` | Xem task đang active, tiến độ và bước tiếp theo |
| `harnix tasks [--limit <n>] [--status <status>]` | Liệt kê lịch sử task local |
| `harnix resume <task-id> [--dry-run]` | Tiếp tục một task chưa hoàn thành theo đúng ID |
| `harnix context-report --platform <id>` | Xem context nào thực sự được đưa vào agent |
| `harnix checks` | Xem check nào đã stale, input nào đổi/thiếu |
| `harnix audit` | Xem readiness/completion blocker của task hiện tại |
| `harnix repo-map --query <text>` / `--impact <path>` | Tìm file liên quan hoặc dependency impact từ cache |
| `harnix doctor [--fix] [--global]` | Kiểm tra drift, hook, path safety, secret exposure; tự sửa issue an toàn |
| `harnix update [--global] [--restore]` | Đồng bộ lại managed files theo config hiện tại |
| `harnix uninstall --purge` / `--global --kiro --yes` | Gỡ dữ liệu project hoặc một tích hợp global |
| `harnix mem "<query>"` | Tìm journal memory theo từ khóa |
| `harnix skill [name]` | Xem catalog skill hoặc nội dung một skill cụ thể |

Một vài quy ước chung đáng nhớ:

- Nếu public command lỗi trước khi có kết quả riêng, bạn sẽ nhận `PublicCliErrorV1` trên stdout với `exitCode` là `1` (warning) hoặc `2` (lỗi sử dụng/schema).
- `harnix doctor --fix` chỉ sửa issue được xác định là an toàn; nó không tự trust hook hay bật permission thay bạn.
- `harnix workflow` (với các cờ `--preflight|--inspect|--save|...`) là transport nội bộ dành cho skill của agent, **không phải** lệnh bạn cần gõ tay.

## Xem lại một task

Mở trực tiếp `.harnix/tasks/<id>/review.md` — không cần chạy command nào. File này tự động cập nhật mỗi khi task được lưu, luôn phản ánh trạng thái mới nhất: title, status, goal, acceptance criteria, quyết định, rủi ro còn lại, blocker (nếu có) và evidence. Đây là trang chỉ để đọc — đừng chỉnh sửa tay.

## Tích hợp platform

| Platform | Identity / flag | Nơi Harnix tạo file (user-global) |
|---|---|---|
| Kiro | `kiro` / `--kiro` | `~/.kiro/skills/harnix-*`, `~/.kiro/steering/harnix.md`, `~/.kiro/hooks/harnix-context.json` |
| Antigravity | `antigravity` / `--antigravity` (executable: `agy`) | `~/.gemini/config/plugins/harnix` (Desktop) và `~/.gemini/antigravity-cli/plugins/harnix` (CLI) |
| Codex | `codex` / `--codex` | `$HOME/.agents/skills/harnix-*`, `$CODEX_HOME/AGENTS.md`, `$CODEX_HOME/config.toml` |
| Claude Code | `claude` / `--claude` | `~/.claude/skills/harnix-*`, marker block trong `~/.claude/CLAUDE.md`, group `harnix-context` trong `hooks.UserPromptSubmit` của `~/.claude/settings.json` |

`harnix setup` chạy được ở bất kỳ thư mục nào, chỉ cần chọn platform flag, không cần đứng trong project. Với Codex, sau khi setup bạn cần mở `/hooks` và tự trust hook. Harnix không bao giờ ghi vào `~/.claude.json`, credentials, MCP server, hay các file không thuộc phạm vi quản lý của nó. Chi tiết đầy đủ về hook protocol nằm ở [Workflow chuẩn](docs/HARNIX_WORKFLOW.md) và [Yêu cầu sản phẩm](docs/HARNIX_PRD.md#9-user-global-setup-and-platform-requirements).

## Dữ liệu dự án (.harnix/)

```text
.harnix/
  config.yaml
  workflow.md
  .template-hashes.json
  spec/                 # guide/rule đã được quản lý
  tasks/                # tạo lazy khi persist task đầu tiên
  workspace/<developer>/journal/ # tạo lazy khi ghi journal đầu tiên
```

Seed specs và `workflow.md` được Harnix quản lý cho đến khi bạn tự sửa chúng — sau đó `update` sẽ luôn preserve nội dung bạn đã đổi. Task, research và journal luôn là dữ liệu của bạn, Harnix không tự sửa hay xoá. Chi tiết về format/schema nằm ở [Yêu cầu sản phẩm](docs/HARNIX_PRD.md#10-config-context-journal-and-learning).

## Dùng trong CI

CI nên chạy non-interactive và kiểm tra state trước khi merge:

```powershell
harnix init --user ci
harnix doctor
```

Không truyền credential vào command line hay output. Harnix không tự gọi network trong runtime bình thường; chỉ `upgrade --apply` và các bước dependency/package manager explicit mới cần network.

## Đóng góp / phát triển Harnix

Toolchain: Node.js `>=18`, pnpm, TypeScript, tsup, ESLint, Commander.js, Inquirer, Vitest.

Không sửa tay version trong `package.json` hay `metadata.version` của skill. Dùng script đồng bộ:

```powershell
pnpm version:sync 1.0.6 --summary "Mô tả thay đổi release"
pnpm build
node dist\cli.js update
```

Quality gate đầy đủ trước khi coi một thay đổi là hoàn tất:

```text
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm typecheck
pnpm test:acceptance
pnpm pack:check
pnpm smoke:tarball
pnpm measure:init
pnpm measure:footprint
pnpm scan:release
git diff --check
```

`test:acceptance` đã chạy đủ sáu suite (`test:unit`, `test:integration`, `test:migration`, `test:platform`, `test:workflow`, `test:safety`) nên không cần chạy `pnpm test` lặp lại. Mọi filesystem test dùng repository tạm và fake user home injected, không đụng vào profile/config thật.

## Tài liệu đầy đủ

- [Yêu cầu sản phẩm](docs/HARNIX_PRD.md) — scope, CLI contract, requirement chi tiết
- [Workflow chuẩn](docs/HARNIX_WORKFLOW.md) — state machine, gate, artifact contract
- [Kế hoạch triển khai](docs/IMPLEMENTATION_PLAN.md)
- [Kế hoạch review/refactor](docs/REVIEW_REFACTOR_PLAN.md)
- [Quyết định nghiên cứu harness](docs/HARNESS_RESEARCH.md)
- [Ánh xạ upstream](docs/UPSTREAM_MAPPING.md)
- [Baseline upstream cố định](docs/UPSTREAM_BASELINE.md)
- [Hướng dẫn coding agent](AGENTS.md)
- [Changelog](CHANGELOG.md)

## Nguồn gốc và giấy phép

Harnix là implementation phái sinh có chọn lọc, xây dựng dựa trên nghiên cứu từ mindfold-ai/Trellis, ECC và Superpowers. Chi tiết provenance từng capability (source, license, evidence, code/test/docs mapping) nằm ở [UPSTREAM_BASELINE.md](docs/UPSTREAM_BASELINE.md), [UPSTREAM_MAPPING.md](docs/UPSTREAM_MAPPING.md) và [HARNESS_FEATURE_PROVENANCE.json](docs/HARNESS_FEATURE_PROVENANCE.json).

Package dùng giấy phép **AGPL-3.0-or-later** và giữ attribution MIT cho nội dung chuyển thể từ ECC và Superpowers. Xem [LICENSE](LICENSE) và [NOTICE](NOTICE).
