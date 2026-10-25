# Harnix — Product Requirements Document

## 1. Document status

| Field | Value |
|---|---|
| Product | **Harnix** |
| Owner | tamtiger |
| Repository | [https://github.com/tamtiger/harnix.git](https://github.com/tamtiger/harnix.git) |
| Repository root | Resolved dynamically; no machine-specific path is part of product output |
| Package / executable | `@tamtiger/harnix` / `harnix` |
| Project data / generator / skills | `.harnix/` / `harnix` / `harnix-*` |
| Status | **Implemented in the authorized scope**; Phase 6, workflow freshness C1–C3 và Epic 2.19.0 (Enterprise Events, Brief Defaults, Multi-Workspace & Active Technique Skills) đã hoàn tất 100%. Revalidation 2026-08-18 proved disposable `agy` implicit routing/no-op control; current `agy --print` hook loading, Kiro/Codex disposable login/trust and GUI surfaces remain conservative/not-run rather than being inferred active. |

Tài liệu này là nguồn yêu cầu sản phẩm chính. `HARNIX_WORKFLOW.md` là contract chuẩn cho state/transition/gate/artifact của workflow; `IMPLEMENTATION_PLAN.md`, `HARNESS_RESEARCH.md`, `UPSTREAM_MAPPING.md` và `UPSTREAM_BASELINE.md` giải thích cách triển khai và provenance. Khi có mâu thuẫn về product behavior, PRD được ưu tiên; khi chi tiết workflow không được PRD quy định, `HARNIX_WORKFLOW.md` được ưu tiên, trừ khi yêu cầu mới của người dùng ghi rõ override.

## 2. Product overview

Harnix là agent harness gọn nhẹ cho enterprise engineering. Harnix giúp coding agent biến yêu cầu thành spec/task có acceptance criteria, triển khai theo workflow phù hợp độ phức tạp, nạp đúng project knowledge trong context budget, kiểm chứng bằng fresh evidence và duy trì journal/learning project-local mà không làm phình context hoặc consumer repository.

Harnix được phát triển từ baseline kỹ thuật [mindfold-ai/Trellis](https://github.com/mindfold-ai/Trellis), đồng thời chuyển thể có chọn lọc thực hành từ [ECC](https://github.com/affaan-m/ECC) và [Superpowers](https://github.com/obra/superpowers). SHA và license nằm trong `UPSTREAM_BASELINE.md`.

## 3. Problems and outcomes

| # | Pain point | Required outcome |
|---:|---|---|
| 1 | Brainstorm quá nặng cho task nhỏ | Dual mode lite/full; lite hỏi tối đa một confirmation |
| 2 | Context injection bloat | Rank, deduplicate, budget và disclosure cho omitted files |
| 3 | Init dump runtime/platform files | `init` chỉ tạo project data và một root `AGENTS.md` bootstrap nhỏ; các surface tích hợp platform vẫn thuộc `setup` |
| 4 | Nested path/worktree hooks hỏng | Resolve Git root an toàn trên Windows/macOS/Linux |
| 5 | Re-init/update overwrite customizations | Versioned hash manifest và conservative ownership |
| 6 | Scripts/hooks duplicate | Runtime từ package đã cài; mỗi platform một mechanism |
| 7 | Thiếu stack-specific standards | Detect stack và seed concise relevant rules |
| 8 | Quá nhiều platform/surface | Chỉ Kiro, Antigravity, Codex, Claude Code, OpenCode và Cursor |
| 9 | Workflow/channel quá phức tạp | Một workflow; không forum/worker network |
| 10 | Completion claim thiếu evidence | Fresh verification gate và two-stage review |
| 11 | Legacy install bị merge âm thầm | Preview, explicit migration, verify, rollback, preserve source |

## 4. Product principles

- **Evidence over claims:** không claim pass/fixed/complete từ summary hoặc suy luận; persisted pass được reuse khi current input digest vẫn khớp.
- **Project-data local, integrations explicit:** workflow data stays project-local; only documented, Harnix-owned user-global platform integrations may cross projects. No global runtime, daemon or hidden memory.
- **User data wins:** modified files, tasks, journals và unrelated config được bảo toàn.
- **Progressive context:** load theo relevance/budget; full context là explicit override.
- **Safe by default:** preview migration/purge và fail closed khi path/hash/schema không chắc chắn.
- **YAGNI:** không thêm platform, orchestration, service hoặc generic skill ngoài nhu cầu.
- **Single-agent capable:** subagent có thể hữu ích nhưng không phải dependency.
- **Offline lifecycle:** init/setup/update/uninstall/mem/status/tasks/resume/pause/context-report/checks/audit/repo-map/doctor không silent network.

## 5. Scope

### 5.1 In scope

- Một TypeScript ESM npm package và một CLI executable.
- Task/spec/context/journal/learning project-local.
- Dual-mode brainstorm, adaptive TDD, systematic debugging, two-stage review.
- Stack/package-manager/verification detection.
- Kiro, Antigravity, Codex, Claude Code, OpenCode và Cursor native user-global integrations with project-activation guards. OpenCode (`~/.config/opencode/AGENTS.md` + `~/.config/opencode/skills/`, hookless; marked block thay fallback `~/.claude/CLAUDE.md`) và Cursor (`~/.cursor/skills/`, không file instruction global vì User Rules chỉ qua UI, hookless vì `sessionStart` injection chưa xác minh) được thêm chỉ bằng bản ghi registry + facts (nguồn chính thức, truy cập 2026-10-01).
- Managed lifecycle, migration, doctor, update, upgrade, uninstall, memory query.
- Bounded task observability, exact unfinished-task pointer recovery, effective-context explanation và required-check freshness explanation.
- Concise common và stack-specific engineering rules.
- Safe resolution của existing Git root/worktree; Harnix không tự tạo worktree.

### 5.2 Explicitly out of scope

- Channel, forum, worker network, mandatory multi-agent orchestration.
- Marketplace, dashboard, telemetry, hosted/paid service.
- Chinese localization và workflow-template switching.
- Global runtime, daemon, observer hoặc global memory.
- Silent network, default MCP, multi-model gateway, external scanner bundling.
- Automatic commit, branch, worktree, merge, push hoặc PR.
- Hàng chục adapters/hàng trăm generic skills.
- Hai install mechanisms cho cùng platform.
- Package core/public package phụ hoặc pnpm workspace.

## 6. Identity, packaging and architecture

- Public package duy nhất: `@tamtiger/harnix`.
- Executable duy nhất: `harnix`.
- Node.js `>=18`; pnpm; TypeScript ESM; Commander.js; Inquirer; tsup; Vitest.
- `src/core` là internal boundary, không phải package.
- New-project output dùng `.harnix/`; không tạo legacy project-data directory.
- Public help, README, examples, config, generated files và errors dùng Harnix branding.
- Tên upstream chỉ xuất hiện trong research, migration compatibility, license/attribution và Git history.

```text
harnix/
├── src/
│   ├── core/               # tasks, context, journal, learning, config
│   ├── commands/           # init, setup, update, upgrade, uninstall, mem, status, tasks, resume, context-report, checks, audit, doctor
│   ├── configurators/      # kiro.ts, antigravity.ts, codex.ts only
│   ├── templates/          # harnix + three platforms + shared
│   ├── rules/              # common + selected stack packs
│   ├── skills/             # focused Harnix workflows
│   ├── agents/             # optional roles only
│   ├── migration/          # discover, preview, apply, verify, cleanup
│   ├── utils/              # paths, detection, hashing, managed files, process
│   ├── cli.ts
│   └── index.ts
├── test/
│   ├── unit/               # pure core and utility behavior
│   ├── integration/        # CLI and project lifecycle boundaries
│   ├── workflow/           # routing, context, and template contracts
│   ├── migration/
│   ├── platform/
│   ├── safety/
│   └── support/            # reusable isolated-repository fixture
├── docs/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── pnpm-lock.yaml
```

`commands`, `configurators` và `migration` có thể gọi `core`; `core` không phụ thuộc terminal UI, Commander/Inquirer hoặc platform templates. Filesystem, clock, prompts, process runner, version/network lookup and home/platform-root resolvers must be injectable at deterministic test boundaries. Không public deep imports ngoài exports trong `src/index.ts`.

## 7. Public CLI contract

CLI có help rõ, actionable errors và non-zero exit khi thất bại:

```text
harnix init [--user <name>] [--languages <csv>] [--dry-run]
harnix setup --kiro|--antigravity|--codex|--claude|--opencode|--cursor [--dry-run]
harnix update [--restore]
harnix update --global [--kiro|--antigravity|--codex|--claude|--opencode|--cursor] [--restore] [--dry-run]
harnix upgrade
harnix uninstall --purge [--yes]
harnix uninstall --global --kiro|--antigravity|--codex|--claude|--opencode|--cursor [--yes]
harnix uninstall --legacy-project-surfaces [--yes]
harnix mem [query]
harnix learning [--status <s>] [--limit <1..100>]
harnix learning --reject <id> [--reason <text>]
harnix learning --promote <id> [--apply]
harnix learning --retire <id>
harnix learning --prune [--apply]
harnix status
harnix tasks [--limit <1..100>] [--status <TaskStatus>]
harnix epic [<epic-id>] [--limit <1..100>] [--brief]
# hidden: harnix workflow --epic-order <epic-id> <task-id>...   # optional explicit run order of an epic (members in order first, the rest by ID)
harnix resume <task-id> [--dry-run]
harnix resume --epic <epic-id> [--dry-run]
harnix context-report --platform <kiro|antigravity|codex|claude|opencode|cursor> [--limit <1..50>]
harnix status --explain [--limit <1..50>]
harnix status --criteria
harnix status --workspace [path]
harnix skill [name] [--raw] [--reference <topic>] [--suggest <query>]
harnix doctor [--fix] [--global] [--allow-warnings]
harnix repo-map [--workspace [path...]]
harnix repo-map --query <text> [--format <json|compact|outline>] [--workspace [path...]] [--limit <count>]
harnix repo-map --impact <path> [--depth <1..3>] [--limit <1..20>]
harnix repo-map --tests <path> [--limit <1..20>]
harnix repo-map --outline <path> [--symbol <name>] [--limit <1..50>]
harnix repo-map --refs <symbol> [--path <path>] [--limit <1..20>]
harnix repo-map --events [--workspace <path...>]
harnix verify-plan
```

Có mười bảy public commands. Mọi public command luôn emit đúng một JSON document; không cần `--json`. `harnix verify-plan` phát hiện deterministic lệnh test/lint/typecheck/format theo manifest, lockfile và runner cho ≥ 8 hệ sinh thái (Node, Python, Rust, Go, Gradle, Maven, .NET, Composer, Swift, Flutter) và monorepo workspaces theo nearest-manifest-wins (.NET: project chỉ có `hasTests` khi `.csproj` tham chiếu test SDK hoặc framework test, thư mục chứa `.sln` là một package chạy `dotnet test <tên>.sln` (dùng `.sln` đầu tiên theo thứ tự mã đơn vị; xét `.csproj`, `.fsproj` và `.vbproj`) và các project nó tham chiếu không liệt kê riêng, đồng thời `verify-plan --recursive` tự động gộp và loại bỏ các test project con bị lồng bên trong thư mục solution để tránh double testing); hỗ trợ file cấu hình `.harnixignore` tại root dự án để loại trừ các thư mục rác, scratch scripts hoặc công cụ nội bộ khỏi stack detection, repo-map và verify-plan; `--path <dir>`, `--changed` (đọc `git status`) và `--brief` thu hẹp danh sách package, không đổi `hasTests` hay `commands` toàn cục; cho phép override bằng mục `verify:` trong `.harnix/config.yaml`. Repo không có test được cảnh báo (`hasTests: false`) và đòi hỏi khai báo check thay thế. **Suite Gate** ràng buộc: `ready` đòi hỏi ít nhất một required check mức project phủ toàn bộ source và test; `finish` từ chối hoàn thành khi check đó thiếu pass với input digest hiện hành. Public failure trước normal result emit exact `PublicCliErrorV1` đã redaction trên stdout và cùng actionable message trên stderr; exit nằm trong envelope và tuân theo semantics `1|2`. Mã thoát process luôn bằng `error.exitCode` của envelope (test scenario khóa điều này); một host như PowerShell 7 có thể báo 1 vì stderr thô, nên người dùng đọc `error.exitCode` trong JSON hoặc chuyển hướng stderr (quan sát, không đổi kênh stderr). Hidden `context`/`workflow` giữ protocol output riêng, không nhận public error envelope. Platform flags là explicit authorization cho global mutation; `--global` không tạo command mới. Init không destructive và không prompt: lệnh tối giản là `harnix init`; `--user`, `--languages` và `--technologies` chỉ override giá trị tự phát hiện. `--yes` chỉ còn cần cho destructive uninstall. Packaged hidden `harnix context --platform <id>` là platform-hook protocol (mặc định dùng Lean Context Injection (< 150 tokens) chèn metadata tóm tắt và file pointers, cấu hình qua `context.mode: lean | full`); hidden `harnix workflow` yêu cầu đúng một action flag trong `--preflight|--inspect|--init|--save|--transition|--evidence|--criterion|--migrate|--run-check|--run-checks|--set-check|--replace-check|--add-criterion|--set-criterion|--add-decision|--add-risk|--set-paths|--set-title|--set-goal|--set-baseline|--batch|--schema|--snapshot|--finish|--cancel|--learn` (`--brief` thu gọn output cho 21 action write/read được hỗ trợ; `--preflight` hỗ trợ `--expected-task <id>` phát hiện chuyển task ngầm; chuẩn hóa cờ `--file <path>` trên toàn bộ các lệnh nhận payload JSON) và là agent routing/persistence/freshness/terminal transport. Chúng không xuất hiện trong public help và không phải supported public API; frozen behavior nằm trong `IMPLEMENTATION_PLAN.md` mục 4.

## 8. Init requirements

- Resolve root từ nested directory/existing worktree trên Windows, macOS, Linux, Unicode/spaces.
- Bỏ qua `.git`, Harnix/agent tooling (`.harnix`, `.agents`, `.kiro`, `.gemini`, `.codex`, `.claude`, `.trellis`, `.understand-anything`), `node_modules`, `vendor`, `bin`, `obj`, `dist`, `build`, coverage/cache.
- Detect language and technology independently with bounded evidence:
  - C# source/project evidence; `.NET` metadata; ABP package/content evidence.
  - TypeScript/JavaScript source/config evidence; independent NestJS, React web and Vue dependencies with React Native exclusion.
  - PHP/Composer evidence and authoritative CodeIgniter dependencies.
  - Python manifests/source; Java source plus independent Spring dependency/content evidence; Go modules/source.
  - Generic solution, Maven, Gradle or Composer markers never assert a specific framework or unrelated source language.
- Detect packages, package manager và verification commands nhưng không execute.
- Non-interactive by default: infer a safe developer journal ID from the current OS user and auto-detect languages/technologies. `--user`, `--languages` and `--technologies` are optional deterministic overrides for CI/tests; legacy compound language aliases normalize with a warning and are never persisted in v2.

Init chỉ tạo:

```text
.harnix/
  spec/guides/
  spec/project-facts.md      # derived: confirmed stack and verify commands per package
  config.yaml
  cache/repo-map-v1.json
  workflow.md
  .template-hashes.json
AGENTS.md                  # short bootstrap only when absent
```

Khởi tạo mới build repo-map cache sau config và managed files; `--dry-run` chỉ báo cache planned, còn rerun initialized project không refresh cache. Không tạo runtime scripts hoặc empty placeholder directories. `tasks/` và `workspace/<developer>/journal/` được tạo lazy khi task/journal đầu tiên được persist; developer source of truth là `config.yaml`, không duplicate `.developer`. Seed relevant specs/rules. Rerun idempotent và giữ modified specs/config/tasks/journals. Init trả project status cùng các path `created`, `updated`, `unchanged`, `preserved` và warning để người dùng thấy chính xác file nào bị tác động. Project update báo `metadataUpdated` riêng cho managed entry chỉ được refresh manifest metadata; các path này không được claim là content `updated`. Init quản lý `.harnix/` và may create the minimal root `AGENTS.md` bootstrap only when it is absent; it does not inspect, migrate, overwrite or delete `.trellis`, `.trellis-pro` or Trellis skills. Representative fixture phải dưới 5 giây.

## 9. User-global setup and platform requirements

Phase 6 supersedes every former project-local platform setup path. `init` continues to create only project data; `setup` installs explicit Harnix-owned integration for the current user profile and can run from any directory.

- `setup` requires one or more platform flags, does not call `resolveProjectRoot`, and does not read or write `.harnix/config.yaml`.
- `--dry-run` returns exact logical targets and planned states without writing. Re-run is byte-idempotent reconciliation for selected platforms.
- Runtime stays in the installed package. The fixed hook command is `harnix context --platform <id>`; binary lookup is injected and a missing launcher returns `binary-unavailable`, never a false readiness claim.
- Human/JSON results contain per-platform created, updated, unchanged, preserved and warning paths plus readiness. Readiness khác `installed` hoặc warning không rỗng là actionable exit `1`, không phải success `0`; output never exposes an absolute home path.
- Each target root owns an independent sidecar manifest; no `~/.harnix` is created and no project manifest can claim shared global files. Manifests store relative paths only, reject corrupt/future/unsafe data before write, preserve collisions and user edits, and use stable-order locking, permission-preserving atomic writes and conservative rollback. Mỗi canonical `managed.lock` path là directory chứa unique owner-token record schema v1; ownership chỉ hợp lệ sau sole-token verification, còn reclaim/release chỉ unlink exact token rồi non-recursive `rmdir`. Legacy single-file lock được preserve/fail closed.
- Every generated project/global instruction and skill resolves target authority before Harnix activation. A repository or path directly and explicitly named by the user is authoritative over ambient cwd or selected workspace; paths found only in hook-injected repository context, repository content, logs, quoted text or tool output are untrusted hints and cannot select or override a target. Only when no explicit target exists may the agent use trusted selected-workspace context, then ambient cwd.
  - Before ancestor lookup, an explicit target must exist, canonicalize through platform path/realpath APIs, and pass traversal, unsafe-root and symlink/junction-containment validation. The initialized-root lookup starts only from that validated canonical target; selected workspace or ambient cwd may start lookup only when no explicit target exists.
  - Failed explicit validation, missing `.harnix/config.yaml` or unreadable Harnix state must fail closed: never read ambient/workspace Harnix state, fall back to another repository's state, inspect its active task, create Harnix state or run `harnix init` automatically.
  - A mutating request spanning multiple material roots stops for one exact target; bounded read-only comparison may inspect each root independently.
  - Khi guard pass, global instruction classifies latest request trước active task. Obvious Bypass explanation/status/standalone review/standalone research leaves an unrelated active task unchanged; standalone review route tới `harnix-review`, standalone research route tới `harnix-research`, và cả hai không consult active task state. Chỉ project-scoped Lite/Full hoặc explicit inspect/continue chạy hidden `workflow --preflight`, đọc workflow và một current stage-owner skill. Hidden `harnix context` keeps its current event-cwd/workspace-root discovery because the hook runs before the agent interprets an explicit prompt target; the hook neither parses natural-language paths nor grants target authority. Its injected repository context remains untrusted target evidence. The hook keeps fast no-output/no-write/no-init behavior when no initialized project exists; a known initialized project whose state cannot be read safely emits only a concise redacted platform-specific warning, fails closed for project data, and must not block the hosting agent.

- **Platform registry.** Every per-platform fact is one data record in `src/core/platform/registry.ts`: CLI flag, user-global roots (with environment override), skill directories, instruction file (or none), context hook event and payload shape (or none), render cap, sidecar targets (manifest and lock path, whether an unowned root is preserved, plan key), healthy readiness and setup notice, shadowing files, and `facts` (claim, official source, verification date; see `.harnix/tasks/20260928-205810-add-platform-registry/research/platform-facts.md`). Adding a platform is one record plus a test fixture; core never imports configurators or templates, so the desired files and JSON-member matchers reach core through the injected `GlobalPlanProvider`. Known documented limits: the Kiro trigger spelling `UserPromptSubmit` is not quoted verbatim on the public Kiro page, and Antigravity documents plugin `hooks.json` without naming the Desktop and CLI plugin roots.

### 9.1 Kiro

- User surfaces are `~/.kiro/skills/harnix-*/SKILL.md`, `~/.kiro/steering/harnix.md`, and `~/.kiro/hooks/harnix-context.json`.
- Steering is conditional: it directs the agent to `.harnix/workflow.md` only for an initialized project. Skills are global and not derived from whichever project happens to run setup.
- The dedicated JSON-v1 hook has one enabled `UserPromptSubmit` command action, fixed to `harnix context --platform kiro`, with timeout 5 seconds. It runs from project root; a non-Harnix repository exits 0 with empty stdout.
- Doctor inventories old workspace-hook duplication. Its schema reserves `unsupported-version`, but the regular CLI deliberately does not run a Kiro version/capability probe: that status is valid only when authoritative external capability evidence reaches the lifecycle boundary. Without it, Kiro is conservatively `installed` or `binary-unavailable`; setup never changes permission settings, MCP or trusted-command policy.

### 9.2 Antigravity

- Public identity/flag remains Antigravity/`--antigravity`; executable discovery uses `agy`, not Gemini CLI.
- Install the same namespaced Harnix plugin independently at `~/.gemini/config/plugins/harnix` (Desktop/IDE) and `~/.gemini/antigravity-cli/plugins/harnix` (CLI). Each has its own ownership manifest.
- `plugin.json` contains only official fields. The plugin owns Harnix skills, always-on activation-guard rule tại `rules/AGENTS.md` không có frontmatter, and a `PreInvocation` fixed command handler in `hooks.json`; it never creates MCP/settings, touches credentials/accounts/registry, or hardcodes a machine path.
- The handler injects only on the initial invocation and outputs `{ "injectSteps": [...] }`. It exits `0` with empty stdout for a non-Harnix workspace or malformed optional event; `{ "injectSteps": [] }` is emitted only after an initialized project is known and the invocation is later or no context applies. It chooses a valid cwd root first, then exactly one initialized `workspacePaths[]` root; ambiguity does not read project data and yields a short warning.
- File presence alone is not active. Doctor reports `active` or `shadowed` only when authoritative external activation/precedence evidence is supplied; otherwise Antigravity is `precedence-unknown`. The regular CLI does not probe an Antigravity version or infer precedence from files.

### 9.3 Codex

- User skills are `$HOME/.agents/skills/harnix-*/SKILL.md`; they are not repository `.agents/skills` setup output.
- Setup merges a short conditional Harnix block into `$CODEX_HOME/AGENTS.md`, preserving every byte outside markers, and a nested `UserPromptSubmit` handler into a managed block in `$CODEX_HOME/config.toml`, preserving unrelated settings and hooks.
- Setup does not change model, reasoning, sandbox, approval, provider/auth, MCP or feature flags. An unchanged legacy Harnix hook in `$CODEX_HOME/hooks.json` is migrated conservatively; modified or colliding content is preserved and reported. `AGENTS.override.md` shadowing and legacy project hooks are doctor findings.
- The fixed nested hook command has timeout 5 seconds and `additionalContextLimit: 2500`. Windows launcher smoke must prove a pnpm/npm `.cmd` shim resolves; no absolute executable or automatic trust bypass is allowed.
- Codex hook files are initially `installed-pending-trust`. User review/trust through `/hooks` is necessary but not sufficient for an `active` claim: activation additionally needs authoritative external evidence. Changed hook content requires review again, and the regular CLI never assumes trust or activation from file presence.

### 9.4 Claude Code

- User surfaces are `~/.claude/skills/harnix-*/SKILL.md`, a marker block in `~/.claude/CLAUDE.md`, and one owned `harnix-context` group inside `hooks.UserPromptSubmit` in `~/.claude/settings.json`. `CLAUDE_CONFIG_DIR` relocates that root exactly as `CODEX_HOME` relocates the Codex root.
- Claude Code reads a project `AGENTS.md` natively (v2.1.277+) only when no `CLAUDE.md` exists in or above the working directory, and the user-level `~/.claude/CLAUDE.md` does not count, so the activation guard lives in user memory (`~/.claude/CLAUDE.md`). Setup preserves every byte outside its markers.
- `UserPromptSubmit` has no matcher support, so the owned member is one `{ hooks: [...] }` group holding the fixed command `harnix context --platform claude` with timeout 5 seconds. Unrelated groups in the same array are preserved and never reinterpreted; a user-edited Harnix group is preserved and reported as drift instead of being duplicated.
- The hook emits plain-text stdout, which Claude Code adds as prompt context. A non-Harnix directory exits 0 with empty stdout.
- Setup never writes `~/.claude.json`, credentials, MCP servers, `projects/`, `history` or `todos/`, and never changes permissions, sandbox or model settings. Claude Code reloads settings hooks from disk, so Harnix reports readiness `installed` or `binary-unavailable` and never claims `active` without authoritative external evidence.

### 9.5 OpenCode

- Public identity/flag: `opencode` / `--opencode`.
- Nơi cài đặt: `~/.config/opencode/skills/harnix-*/SKILL.md` qua global skill sink chung, và một marker block trong `~/.config/opencode/AGENTS.md`. Khối này bảo toàn toàn bộ nội dung người dùng nằm ngoài markers, và có độ ưu tiên cao hơn fallback `~/.claude/CLAUDE.md`.
- Chế độ hoạt động: Hookless (không hook shell, không cài plugin JS mặc định, không có biến môi trường relocate root riêng).
- Manifest và Reconcile: `preserveUnownedRoot: false` vì thư mục gốc chia sẻ với công cụ; bảo toàn các file và skill không do Harnix quản lý.

### 9.6 Cursor

- Public identity/flag: `cursor` / `--cursor`.
- Nơi cài đặt: `~/.cursor/skills/harnix-*/SKILL.md` qua global skill sink chung.
- Không có file instruction global: Cursor User Rules chỉ cấu hình qua giao diện UI, không có file instruction cấp hệ thống.
- Chế độ hoạt động: Hookless (injection `sessionStart` chưa được xác minh schema và không dùng `beforeSubmitPrompt`).
- Manifest và Reconcile: `preserveUnownedRoot: false` vì thư mục gốc chia sẻ với công cụ; bảo toàn các skill của bên thứ ba.

The root `AGENTS.md` bootstrap that `init` creates when absent is retained for project onboarding. It is not a setup-owned Codex platform surface.
## 10. Config, context, journal and learning

Normative schemas cho `.harnix/config.yaml`, stack/guide catalog, project managed manifest, TaskRecord v3 (v1/v2 legacy chỉ đọc), optional context manifest, journal/learning, global ownership manifest và Doctor JSON v2 nằm tại `IMPLEMENTATION_PLAN.md` mục 4 và `GLOBAL_SETUP_REFACTOR_PLAN.md`. Implementation không được tự đổi field/enum/path/transition mà không cập nhật PRD/workflow, migration và tests trong cùng change. Task mới dùng exact schema v3; unknown top-level/nested field bị reject. Hidden save envelope/artifact/contract-revision cũng exact-schema và không nhận caller-supplied context-selection sidecar. Đây là breaking change đã duyệt (D1/D11, `docs/OVERHAUL_DECISIONS.md`); `release-v2` gộp changelog. Terminal `completed|cancelled` v1/v2 được byte-preserve; unfinished v1/v2 chỉ được migrate bằng một `workflow --save` explicit giữ nguyên status/checkpoint, bảo toàn criteria/evidence và base definition của mọi required check (bỏ `@task-contract`, thêm mapping v3) rồi append evidence `task-schema-to-v3`; mọi thao tác khác trên task cũ chưa migrate bị từ chối, và migration provenance giữ các thay đổi obligation tiếp theo sau `contractRevision`. Full không downgrade về Lite, và `.active` trỏ tới task không tồn tại phải fail closed thay vì được hiểu là không có task. Update/Doctor chỉ chẩn đoán `legacy-task-schema`. Config v2 lưu `languages` và `technologies` độc lập ở project/package; technology kind chỉ nằm trong packaged catalog. Config v1 vẫn đọc được và chỉ được migrate explicit bởi `update` hoặc `doctor --fix`, không rescan; compatible unknown keys được giữ và future/corrupt state bị reject. `config.platforms` remains deprecated and ignored for desired global setup.

Context:

- Rank theo pin, task/acceptance reference, active package/path, language/technology guide và cross-project relevance; một entry chỉ nhận một bounded stack bonus dù match cả hai facet.
- Deduplicate theo normalized repo-relative source/content.
- Enforce configurable character/token approximation budget.
- Khi truncate, inject phần điểm cao nhất và liệt kê omitted files. Omission disclosure được JSON-serialize, tính trong cùng budget và luôn nằm trước closing marker của fixed untrusted repository boundary; path chứa C0/C1 hoặc Unicode line separator bị reject.
- Full-context override explicit và vẫn ghi source list.
- Research findings lưu cùng task với source/date, không global injection.
- Explicit hidden context persistence ghi `context.json` cùng task-owned `context-selection.json` v1, bind `taskId`, selector version, repo-map `inventoryFingerprint`, canonical selection-input hash và selection-result hash; sidecar không chứa source body, task prose, secret hoặc absolute path.
- Hidden inspect/continue luôn trả `contextDrift` gồm path `changes` và selection-basis `selectionChanges`; content, inventory, selector version hoặc task/config/guide signal drift tạo `stale`, buộc persist cùng status/checkpoint `replan` trước context reselection. Manifest v1 chưa có sidecar vẫn đọc và disclose `not-recorded`; inspect/hook không scan, refresh hoặc write repo-map.
- Mọi timestamp Harnix ghi ra dùng `timezone` IANA trong `.harnix/config.yaml` (ISO 8601 kèm offset; repo này `Asia/Ho_Chi_Minh`); hidden `workflow --preflight` cũng trả `clock` (`timezone`, `now`, `idPrefix`) làm nguồn thời gian cho agent thay cho lệnh `date` của shell.
- Hidden `workflow --preflight` trả bounded no-write routing state; same `contextDrift` sau một replan/reselection trong cùng request phải dừng thay vì lặp. `learning` chỉ có nội dung khi `nextStage` là `plan` (stage khác trả mảng rỗng) và `workflow --preflight --brief` bỏ `learning`. `workflow --schema` có khối `constraints` (enum mode/status/checkpoint/scope/result, regex id task và epic, mảng sorted-unique, dạng envelope `{ task, ... }` và danh sách lệnh nhận `--brief`) lấy từ cùng hằng mà validator dùng, khối `nested` bổ sung `decisions` và `residualRisks`, cùng `exampleEnvelope` cung cấp mẫu phong bì lưu trữ tối thiểu hợp lệ. Lệnh `workflow --tick <item>` cho phép cập nhật checklist `plan.md` trực tiếp từ CLI và chốt chặn `verifying/verifying` kiểm soát 100% hoàn thành. Một `epic <epic-id> --brief` chỉ in id/title, đếm theo trạng thái, `nextTask` và id+status từng member.
- Epic `field-defects-hardening` (phát hành 2.12.0), không đổi field hay enum đóng băng ngoài trường `rawInputDigest` thêm vào đầu ra `--snapshot`: `workflow`, `mem` và `skill` dò `.harnix` gần nhất từ mọi thư mục con (kể cả repo Git lồng) và lỗi liệt kê thư mục con đã init thay vì chọn hộ; tên lệnh trần như `dotnet` được tra trên `PATH` (chỉ mục tuyệt đối) và chạy thẳng khi là `.exe` hoặc theo đường dẫn đã resolve khi là `.cmd`/`.bat`; `--criterion --met` nêu lý do từng check bị từ chối; `--add-risk --mitigation`, `--init --cwd`, `cwd=` cho `--with-check`, `--task` cho `--set-criterion`, `--remove-decision` và `--remove-criterion` (chỉ khi `planning`); `secretAdvisory` tôn trọng `.gitignore`; mẫu `prd.md`/`plan.md` trung tính; `config.yaml` ghi package theo `.sln`, project độc lập và manifest `composer.json`, `pom.xml`, `go.mod`, `Cargo.toml`, `pyproject.toml`.
- Cải tiến của epic tự cải tiến (phát hành 2.3.0) cho hidden `workflow`, không đổi field hay enum đóng băng: `--run-checks [--brief]` chạy tuần tự mọi required check chưa passing (focused trước, suite sau) bằng `command`/`cwd` đã khai báo, dừng ở lần fail đầu và in `{ ran: [{ id, result, exitCode, outputTail? }], remaining }`; `--run-check`/`--run-checks` trả `outputTail` là tóm tắt ngắn các test lỗi (vitest) hoặc 600 ký tự cuối kể cả khi `--brief`, không trả gì khi pass; lỗi launcher (thiếu package.json hay script, lệnh không tồn tại) báo `could not start` và không ghi evidence nên không vào circuit breaker; `sameCommand` so executable theo tên khi command khai báo là tên trần. `--init` nhận `--text` lặp (criterion `ac-1..n`) và `--with-check "id=<id>;command=<cmd>;criteria=<ac-1+ac-2>;input=<glob+glob>[;scope=..][;description=..]"` lặp; check sinh từ lệnh test của dự án là `check-suite` scope `full`. `--set-criterion <id> --text <text> [--reason <why>]` sửa chữ một criterion (sau planning cần `--reason` và đi qua replan, criterion đã có evidence bất biến), `--inspect --task <id>` đọc task chưa kết thúc khác không đổi con trỏ, và `harnix resume --epic <epic-id> [--dry-run]` khôi phục task chưa kết thúc kế tiếp của epic. `--preflight` thêm `baselineHint` (một dòng) khi suite cùng command đã đỏ ở 2 task kết thúc gần nhất; `--finish --brief` thêm `secretAdvisory { files, findings: [{ path, rule }] }` khi file thuộc relevantPaths hoặc input của check có dấu hiệu secret (không bao giờ có giá trị, không dùng Git, không chặn finish). Dry-run của ready gộp advisory chưa baseline thành một dòng có số lượng và cảnh báo id `check-...` mà `plan.md` nhắc nhưng `validationPlan` không khai báo; hook context chỉ mang khối learning khi task `planning`.

Task verification:

- TaskRecord v3 required checks map acceptance bằng `criterionIds` và khai báo sorted safe repository-glob `inputs` (≥ 1 mỗi loại; token `@task-contract` bị reject vì digest luôn gồm định nghĩa của chính check, tiêu chí nó phủ và mode của task). Một check có thể khai báo `cwd` (đường dẫn tương đối repo ở dạng POSIX, `.` là gốc; traversal, tuyệt đối và dạng drive-relative bị reject; nằm trong contract hash) và `baseline` (tập key đóng `result|classification|authorizedBy|scope`). `--run-check` chỉ chạy đúng `command` đã khai báo trong đúng `cwd` đã khai báo, evidence mới không được đề ngày ở tương lai, và check fail hai lần liên tiếp từ chối thêm evidence cho tới khi người dùng cho phép `--replace-check` với bản thay khác `command`, `inputs` hoặc `cwd`. Definitions hội tụ trong draft rồi freeze tại first persisted `ready` (khi vào `ready/ready`, CLI kiểm nội dung kế hoạch và buộc `--reviewed` với task Full); một `--save` đặt checkpoint `replan` cùng `contractRevision.reason` dài 10–1.000 ký tự chỉ được supersede pending/unproven obligation và Harnix append audit evidence `task-contract-revision-NN`; sau đó một save/transition `ready/ready` thông thường, không có bước audit riêng. Tại checkpoint `replan` kèm `contractRevision.reason` hợp lệ, cho phép cập nhật nội dung text của tiêu chí (tự động reset status về `pending` và xóa `evidenceIds`) hoặc waive tiêu chí (kèm `waiverReason` ≥ 10 ký tự). Một check đã có pass evidence hoặc fail evidence có thể được retire bằng cách giữ nguyên ID/definition, đổi riêng `required:false`, đồng thời thêm required replacement ID có cùng criterion coverage (hoặc qua `--replace-check` có `--reason`). Ngoài checkpoint `replan`, tiêu chí và check đã pass vẫn bất biến; exact replay không append audit evidence lần hai.
- Required pass (và stable failed run khi tính được) mang `inputDigest` SHA-256 của hợp đồng riêng của check (định nghĩa chính check, tiêu chí nó phủ, mode; không gồm check khác, decisions/residual risks/evidence; evidence ghi bằng công thức cũ vẫn được nhận khi hợp đồng task chưa đổi) và sha256 của sorted repository inputs (file văn bản không chứa byte NUL được băm sau khi đọc CRLF thành LF, trừ file nhạy cảm với kết thúc dòng như `.sh`, `.bat`, `.cmd`, Makefile, Dockerfile; snapshot trả thêm `rawInputDigest` trên byte thô; evidence ghi theo đó hoặc theo công thức cũ `digest: 3` (`legacyInputDigest`, chỉ tính nội bộ, không in) vẫn được nhận); command-backed pass có `exitCode` 0. Digest lưu inline trong evidence, không có sidecar `verification-inputs.json` cho task v3 (legacy v2 chỉ đọc). Snapshot bỏ đúng `task.json`, `review.md` và legacy `verification-inputs.json` của active task; `prd.md`/`plan.md` chỉ là input khi được khai báo nên tick checklist không stale evidence. Save validate candidate artifacts, recompute digest của required pass mới append, rồi ghi `task.json` commit marker; pre-commit failure rollback conservatively chỉ khi bytes hiện tại vẫn do attempt đó sở hữu. Finish recompute digest của latest required passes từ current inputs.
- Criterion chỉ `met` cho completion khi linked evidence là fresh pass của check có declared `criterionIds` chứa criterion đó. Changed/missing/unreadable/unsafe/empty input hoặc contract drift fail closed; diagnostics không lộ source body, secret hay absolute path.
- Mọi TaskRecord v3 pass không expire chỉ vì wall-clock age nhưng invalid/future timestamp vẫn stale; pass của task legacy v1/v2 chưa migrate báo `legacy-schema`. Verification reuse matching v3 pass, không chạy same check/digest hai lần mỗi request và chỉ cho một automatic remediation round. Mọi failed rerun sau round đó phải stop/yield; identical fingerprint chỉ là stop reason mạnh nhất, không phải điều kiện bắt buộc có thể né bằng đổi summary hay digest. `skipped` và invalid/future pass không reset retry accounting; chỉ current valid pass mới reset.
- Full `prd.md`/`plan.md` là Markdown tự do: ready chỉ đòi cả hai không rỗng và `plan.md` có ít nhất một checklist item. Ready-trace grammar, execution-notes grammar và `workflow --audit-ready` đã bị removed; plan cũ chứa vùng execution-notes vẫn được đọc như văn bản thường. Lite và historical records không nhận retroactive ceremony.

Journal/learning:

- Project-local, newest-first, query theo user/limit và JSON.
- Missing workspace, malformed entry, Unicode/spaces không crash toàn command.
- Candidate gồm source task, statement, evidence, occurrences, confidence.
- Public `harnix mem --learning` filter learning entries trước query/limit, giữ newest-first và JSON shape hiện tại khi không có flag.
- Hidden `workflow --learn` chỉ nhận bounded candidate-only JSON tại active `verifying/finishing`; runtime revalidate completion freshness, source task/evidence provenance, 64 KiB và eligibility, tự tính derived fields rồi append idempotent một `JournalEntryV1`. Retry identical không duplicate; conflict fail closed; action không đổi TaskRecord/spec/active pointer.
- Capture tự động tại `workflow --finish` (best-effort): quan sát lấy từ `decisions`, `residualRisks` và `findings` của evidence trong chính task, chuẩn hóa và loại trùng, tối đa 5 mỗi lần finish; quan sát `credential-like`/`instruction-override`/`command-like` không bao giờ được capture. Candidate id ổn định `obs-<sha256 chuẩn hóa>[0..16]`; một task nguồn là `draft`, tự nâng lên `candidate` khi task thứ hai lặp lại và đạt ngưỡng eligibility hiện hành. Status: `draft | candidate | approved | promoted | rejected | archived`; `draft`/`candidate` quá 28 ngày là `archived` khi đọc (không ghi lại journal).
- Surface tự động: hook context của task active ở trạng thái `planning` có khối "Project learning" tối đa 5 dòng (statement 160 ký tự, JSON-quoted, đã redact) và `workflow --preflight` trả cùng danh sách trong trường `learning` cho nền tảng không hook. Phạm vi project-local.
- Promotion vào spec cần repeated independent evidence hoặc explicit finish approval; không có đường tự động ghi vào spec.
- Vòng đời thủ công (phát hành cùng epic đại tu learning): `harnix learning [--status <draft|candidate|approved|promoted|rejected|archived>] [--limit <1..100>]` liệt kê trạng thái hiệu lực kèm kích thước `.harnix/spec/learned.md`; `harnix learning --reject <id> [--reason <text>]` loại một draft hoặc candidate; `harnix learning --promote <id> [--apply]` in bản đề xuất, và chỉ khi có `--apply` mới thêm khối vào `.harnix/spec/learned.md` (file của người dùng, ngoài catalog guide, không bị `update` ghi đè) rồi ghi `promoted`; `harnix learning --retire <id>` gỡ khối và ghi `archived`. `harnix learning --prune [--apply]` liệt kê draft hoặc candidate mà bộ lọc chất lượng capture sẽ không nhận nữa (dưới 40 ký tự hoặc chỉ gồm chuỗi test) và chỉ khi có `--apply` mới ghi `rejected` cho chúng. Bốn cờ hành động loại trừ nhau; `--apply` chỉ đi với `--promote` hoặc `--prune`, `--reason` chỉ đi với `--reject`. Capture bỏ qua ghi chú dưới 40 ký tự hoặc chỉ gồm chuỗi test; ghi chú gắn id task vẫn được giữ nhưng xếp sau ghi chú chung khi nạp vào prompt. Capture gộp biến thể chỉ khác dấu tiếng Việt, hoa thường hoặc dấu câu vào candidate đã có và giữ nguyên id của nó (id không bao giờ tính lại cho entry đã lưu). `harnix learning` và `--promote` trả thêm `similar` (tối đa 5 `{ id, score }` có Jaccard từ 0,5 trên token đã bỏ dấu) để người duyệt thấy mục gần trùng; chỉ là gợi ý, không tự gộp hay từ chối. Mọi quyết định là entry journal mới (append-only), không sửa dòng cũ; mục đã `rejected` hoặc `archived` không bị capture lại. Mỗi khối mang marker `<!-- harnix-learning:<id> paths=<tiền tố> -->`; tối đa 40 khối. Hook context nạp tối đa 5 khối và 2.000 ký tự, chọn theo giao nhau với `relevantPaths` của task rồi khối chung, ở mọi stage; khối "Project learning" chưa duyệt vẫn chỉ ở `planning` và xếp lesson của task cùng vùng đường dẫn trước.
- Promotion reviewable trong diff; statement chỉ được render dưới `Statement-JSON: <JSON.stringify(statement)>` trong fixed untrusted-learning boundary, kèm exact SHA-256, sorted provenance/evidence và redacted risk categories. Doctor gộp tối đa một `persistent-learning-suspicious` warning mỗi journal file, `fixable:false`, không echo matched value và không sửa journal/spec. Không daemon, hidden skill generation, global memory hoặc automatic promotion.

## 11. Managed-file lifecycle

Project manifest versioned SHA-256 lưu normalized repository-relative path, source/template ID, generated hash và generator version. Canonical `.harnix/workflow.md` dùng `sourceId: "workflow"`; legacy metadata-only `"harnix-workflow"` chỉ normalize khi stored generated hash vẫn khớp exact disk bytes, còn user-modified content luôn được preserve. It owns only `.harnix` project templates, never global integration files. Global integrations use a separate manifest per verified platform root, whose entries use paths relative to that root and can own whole files, managed Markdown blocks, or stable JSON members.

| State | Action |
|---|---|
| Stored hash = disk hash | Update |
| Stored hash ≠ disk hash | Preserve + warn |
| New desired file | Create + track |
| User-deleted tracked file | Report; explicit restore required |
| Obsolete unchanged | Remove |
| Obsolete modified | Preserve |

Content/manifest uses atomic replacement. Reject traversal, absolute keys, unsafe roots, symlink/junction escape and corrupt/future manifests. A partial write keeps the previous valid state. Tasks/journals are never managed; specs/workflow are project-managed only until user modification. A global fragment hash covers only the Harnix fragment, never unrelated user content; non-overlapping selectors are required for a shared file. Stale-lock reclaim mang theo exact bytes đã inspect và đọc lại ngay trước remove; nếu identity/content đã đổi thì replacement lock được giữ nguyên và contender retry/timeout.

## 12. Lifecycle commands

### Update

`update` without `--global` reconciles offline packaged project templates only; it does not recreate old platform surfaces. `update --global [platform flags]` reconciles valid user-global manifests; absent flags mean all valid global manifests. Neither mode touches tasks, journals or unrelated files.

### Upgrade

Báo installed/available version và npm upgrade path cho `@tamtiger/harnix`. Result luôn có `available: string|null`; offline default là `null`, còn host chỉ nhận version khi inject explicit lookup. Dùng argument arrays và injected version/process dependencies để không gọi network/install ngầm; chỉ `--apply` mới chạy install process.

### Uninstall

`uninstall --purge --yes` only removes project `.harnix` data after preview/confirmation and safe-root checks. `uninstall --global --kiro|--antigravity|--codex|--claude|--opencode|--cursor [--yes]` previews then removes only unchanged selected global entries; without `--yes` it makes no write. `uninstall --legacy-project-surfaces [--yes]` is a separate manifest-backed cleanup that may delete only unchanged **standalone** historical paths whose v1 manifest proves the exact Harnix source/path. Root/shared files such as `AGENTS.md`, `GEMINI.md`, `.codex` config/hooks and arbitrary user files are inventory-only, never deletion targets; the flag is mutually exclusive with global/purge and always preserves modified/untracked content.

### Mem

Search newest-first với query/user/limit/json; include candidate confidence/evidence nhưng không promote; malformed data xử lý graceful.

### Status

`harnix status` resolve ancestor initialized gần nhất, validate config/task state và emit `HarnixStatusResultV1` read-only. Với active task, output chỉ chứa `id`, `mode`, `status`, `checkpoint`, aggregate acceptance/required-check counts, context state/counts, một deterministic `nextAction` và bounded ordered `attention`; title/goal/criterion/check/blocker prose, validation command, prompt, secret và absolute path không được emit. Không có active task là success với `activeTask:null` và `no-active-task`.

Required-check state dùng latest evidence theo timestamp rồi persisted append order, đồng nhất với completion/input-freshness semantics. Missing/latest skipped là `pending`, latest fail là `failed`; invalid/future pass là `stale`. TaskRecord v1 còn stale khi quá một giờ. TaskRecord v3 pass chỉ là `passed` khi evidence digest khớp recomputed current input digest, không expire do tuổi; missing/unreadable/mismatch fail closed thành `stale` (`digest-mismatch|inputs-unavailable`), còn pass của legacy v1/v2 là `stale` với `legacy-schema`. Command không ghi state, refresh cache, gọi network hoặc thêm flag `--json`.

### Tasks

`harnix tasks [--limit <1..100>] [--status <TaskStatus>]` resolve ancestor initialized gần nhất và emit `TaskIndexResultV1` chỉ từ task records local. Default limit là 20. Command đọc tối đa 1.000 safe task directories: candidate ID sort code-unit giảm dần, active candidate hợp lệ luôn nằm trong scan budget, từng record được exact-schema validate độc lập, và malformed record chỉ tăng `invalid` thay vì làm mất history hợp lệ. Output pin active record đã match filter, sau đó sort `updatedAt` giảm dần và ID giảm dần; status filter không ép active record vượt qua filter.

Top-level fields là `generator`, `schemaVersion`, `scope`, `status`, `filter`, `summary`, `activeTaskId`, `attention`, `tasks`. `scope` luôn `project`; `status` là `ready|partial`, trong đó `partial` chỉ khi có invalid record hoặc active pointer không resolve. Scan/result truncation là bounded normal behavior và có flag riêng. Mỗi task chỉ emit `id`, `mode`, `status`, `checkpoint`, `active`, `updatedAt`; title, goal, prompt, criterion/check/blocker prose, evidence summary, validation command, secret và absolute path không được emit. Command không đọc artifact/journal body, ghi state, gọi network hoặc refresh cache.

### Resume

`harnix resume --epic <epic-id> [--dry-run]` phục hồi task chưa kết thúc kế tiếp của epic (không dùng cùng `<task-id>`; từ chối khi epic hết việc hoặc khi có task active khác) và `harnix resume <task-id> [--dry-run]` resolve ancestor initialized gần nhất và phục hồi duy nhất `.harnix/tasks/.active` tới exact unfinished TaskRecord. Task ID phải canonical; record tối đa 1 MiB, directory/record ID khớp, exact-schema hợp lệ và status không terminal. Pointer tối đa 1 KiB; absent/empty cho phép `would-resume` hoặc atomic write thành `resumed`, còn cùng exact valid task trả `already-active` không write. Pointer malformed/dangling/terminal hoặc đang trỏ task khác, candidate missing/malformed/oversized/terminal đều fail closed bằng public error exit 2 và không overwrite.

Success `TaskResumeResultV1` chỉ gồm `generator`, `schemaVersion`, `scope`, `dryRun`, `outcome`, task `id|mode|status|checkpoint` và deterministic `nextAction`. Mutation duy nhất là permission-preserving atomic replacement của pointer; command không sửa TaskRecord/evidence/artifact, chuyển workflow, phục hồi transcript/model session/Git state hoặc gọi network. `--dry-run` thực hiện cùng validation/collision checks nhưng không ghi file.

Hidden save chỉ có crash-recovery exception hẹp: khi task commit đã tồn tại nhưng `.active` bị thiếu, exact persisted task/artifact replay hoặc exact committed contract-revision replay được repair pointer idempotently. Candidate inactive đã sửa bị reject; nó không được dùng hidden save để lách user-selected public `resume` boundary.

### Pause

`harnix pause [--dry-run]` resolve ancestor initialized gần nhất và gỡ con trỏ `.harnix/tasks/.active` một cách an toàn mà không làm mất trạng thái hay dữ liệu của active task. Nếu không có active task, trả về outcome `no-active-task`. Nếu có active task hợp lệ, trả về `would-pause` (khi `--dry-run`) hoặc `paused` (atomic clear pointer về chuỗi rỗng) kèm hướng dẫn `Run harnix resume <task-id> when ready to continue.`. Active pointer trỏ tới record missing/terminal/malformed đều fail closed bằng public error exit 2.

### Context report

`harnix context-report --platform <kiro|antigravity|codex|claude|opencode|cursor> [--limit <1..50>]` emit `ContextReportResultV1` read-only; default limit 20, no active task là success với `activeTask:null`. Active report dùng cùng effective builder với hidden context ở bounded hook mode: Codex cap 2.500 characters; Kiro/Antigravity/Claude Code cap `min(config.context.maxCharacters, 8000)`; tối đa 64 inspected entries. Chưa có `context.json` thì candidate là task `relevantPaths` cộng applicable guides; đã có manifest thì dùng persisted entries cộng applicable guides.

Output active chỉ gồm task ID, platform budget, aggregate candidate/selected/omitted counts, selected relative paths với trusted sorted reason codes `applicable-guide|persisted-selection|pinned|task-reference`, omitted relative paths với `budget|duplicate|missing|unsafe`, và bounded context/selection drift metadata. `--limit` áp riêng cho selected, omitted và drift changes. Toàn JSON tối đa 262.144 UTF-8 bytes bằng deterministic whole-item tail omission; report không trả content, raw persisted reason/state, hash, task prose, hook event, secret hoặc absolute path, không ghi file/network và không làm đổi hidden hook payload. Hook context bounded liệt kê mọi guide dưới `.harnix/spec/guides/` và mọi file từ 1.500 ký tự dạng con trỏ (đường dẫn + số ký tự, kèm lời nhắc đọc khi khớp file đang sửa) thay vì nhúng nội dung, vẫn hash để drift hoạt động; mỗi entry luôn nguyên vẹn hoặc nằm trong `Omitted`, không bao giờ bị cắt giữa chừng.

### Checks

`harnix status --explain [--limit <1..50>]` bổ sung projection `ChecksReportResultV1` dưới `explain.checks` (read-only); default limit 20, no active task là success với `activeTask:null`. Required checks sort code-unit. Mỗi item chỉ gồm ID, state `passed|failed|stale|pending`, trusted sorted reason codes và tối đa 20 relative `changed|missing` input paths; aggregate giữ full counts cùng returned/truncation flags. Toàn JSON tối đa 262.144 UTF-8 bytes bằng deterministic whole-item tail omission.

Classifier dùng latest evidence theo timestamp rồi append order. No evidence/latest skipped là pending; latest fail là failed; invalid/future timestamp là stale; pass legacy v1/v2 là stale (`legacy-schema`). v3 pass cần evidence digest khớp recomputed current input digest, không age-expire. Digest mismatch (gồm đổi hợp đồng của chính check hoặc input đổi) và unavailable inputs được biểu diễn bằng categorical reason code, không throw private detail. Command không trả description/validation command, evidence ID/summary/time/hash/input glob, criterion/task prose, secret hoặc absolute path; không chạy check, sửa state/sidecar/evidence hoặc gọi network.

### Audit

`harnix status --workspace [path]` không cần project đã init: phát hiện các sub-repo có `.git` (con trực tiếp hoặc lồng hai cấp; thư mục có manifest mà không có `.git` không được xét sâu hơn) và emit JSON `{ scope:"workspace", members[], message? }`, mỗi member có `name`, `status`, `branch`, `detached`, `dirty`, `upstream`, `ahead`, `behind`. Chỉ chạy `git --no-optional-locks status --porcelain=v2 --branch -z` (không shell, timeout 5 giây, tối đa 4 đồng thời), không fetch/pull/checkout, không network, nên ahead/behind phản ánh lần fetch gần nhất; lỗi một member không làm hỏng bảng. Không dùng chung với `--explain`, `--summary` hay `--limit` (exit 2). Đây là cờ của `status`, nên số public command không đổi.

`harnix status --criteria` emit JSON `{ taskId, mode, status, criteria: [{ id, status, text, coveredBy }] }` danh sách tiêu chí nghiệm thu của active task, giúp agent và người dùng tra cứu nhanh gọn mà không phải dump toàn bộ task JSON hay đọc trực tiếp file state. Không dùng chung với `--explain` hay `--summary`.

`harnix status --explain` bổ sung projection `TaskAuditResultV1` dưới `explain.audit`, resolve ancestor initialized gần nhất (read-only); không có active task là success với `activeTask:null`. Active projection chỉ gồm `id`, `mode`, `status`, `checkpoint`, `readiness`, `completion`. Full readiness chỉ kiểm `prd.md`/`plan.md` không rỗng và plan có checklist item; mỗi diagnostic chỉ có stable `code` (`artifact-unavailable|artifact-empty|plan-checklist-missing`) và `artifact`. Artifact read failure trở thành readiness `unavailable` với `artifact-unavailable`; Lite readiness là `not-applicable`.

Completion gồm `status`, `criteria`, `requiredChecks`. `criteria` là completion-ready partition `met|waived|pending|total` cùng sorted `pendingIds`: persisted met chỉ được tính met khi có current supporting evidence theo finish semantics. `requiredChecks` có `passed|failed|stale|pending|total` cùng sorted `failedIds|staleIds|pendingIds`, tái dùng exact latest-evidence và TaskRecord v3 current-input digest freshness của status/finish. Completion chỉ pass khi criteria/checks non-empty, mọi criterion ready và mọi required check pass. Audit không chạy command, sửa artifact/state, chuyển workflow, gọi network hoặc echo title/goal/prose/command/secret/absolute path; audit pass không phải completion evidence.

### Doctor

Doctor uses JSON v2: `project` has status `ready|not-initialized|invalid`; `globalIntegrations` separately reports every supported platform as `not-installed|installed|active|installed-pending-trust|binary-unavailable|shadowed|precedence-unknown|unsupported-version|drifted|invalid`. It works outside a Harnix project and treats `project:not-initialized` as info. The enum supports authoritative external evidence, but the regular CLI does not run a platform-version probe or infer activation/precedence from installed files: `active`, `shadowed` and `unsupported-version` are reported only when that evidence is supplied at the integration boundary; otherwise it returns the conservative installed/trust/binary/precedence state.

Offline deterministic checks include schemas, hashes, missing/modified/obsolete, `legacy-task-schema`, duplicate/legacy injection, suspicious persistent-learning categories, skill frontmatter, hooks, unsafe paths, attribution, platform drift, embedded secrets, broad permissions and injection-prone commands. Secret values are redacted và Doctor không migrate task record hoặc rewrite journal. Doctor còn đối chiếu `packages` trong `config.yaml` với phát hiện hiện tại (cùng bộ `detectProject` của init): thư mục package phát hiện được mà config không liệt kê cho finding `config-packages-drift` mức `info` (tối đa 10 đường dẫn kèm số dư), không đổi `ok`, summary hay mã thoát; doctor chỉ đọc, không ghi `config.yaml` (file của người dùng) và lỗi phát hiện bị bỏ qua êm. Hướng xử lý là `harnix update`, nay phát hiện lại và hợp nhất theo kiểu chỉ thêm vào `config.yaml` (package còn thiếu, so khớp theo đường dẫn đã chuẩn hóa, cùng language và technology của các package mới đó; một language hay technology người dùng đã bỏ khỏi cấp trên không bị thêm lại nếu không có package mới nào cần): giữ nguyên mọi mục đã có và khóa khác, ghi nguyên tử, idempotent, kết quả có `configRefreshed` (tối đa 20 đường dẫn kèm `morePackages`) và `update --dry-run` chỉ xem trước; một lỗi phát hiện bị bỏ qua êm. Phát hiện package và repo-map inventory dùng chung danh sách thư mục bỏ qua (`src/core/stack/ignored-directories.ts`, gồm `.kilo`, `.worktrees`, `.cursor`, `.idea`, `.vs`); một mục `packages` bị người dùng xóa tay sẽ được thêm lại ở lần `update` sau. Exit 0 is safe/no actionable finding, exit 1 is actionable warning/drift, and exit 2 is invalid usage or unsafe/corrupt/future project/global state. The opt-in `--allow-warnings` turns exit 1 into 0 only when the summary has no errors (the JSON, including `ok:false`, is unchanged; errors and exit 2 are never hidden), so a pipeline can tolerate warnings without changing the default contract. `--fix` alone only repairs safe project-managed issues; `--fix --global` only reconciles safe missing/unchanged global entries and never trusts Codex hooks, enables permissions/features, or changes a modified user fragment.

## 13. Legacy compatibility boundary

Trellis/ECC/Superpowers chỉ còn là provenance và research history. Runtime Harnix không phụ thuộc vào hoặc phát hiện `.trellis/`, `.trellis-pro/`, `trellis-*` skills hay package Trellis.

- `init` luôn tạo namespace `.harnix/` nếu namespace này chưa tồn tại.
- Existing Trellis files được giữ nguyên và không bị migrate, overwrite, rename hoặc xóa.
- Legacy project-local Kiro, Antigravity, Codex and Claude Code setup output is inventory-only after Phase 6: update never recreates it and doctor classifies it as unchanged/modified/untracked/duplicate-hook. Only explicit `uninstall --legacy-project-surfaces [--yes]` can remove a manifest-proven unchanged **standalone** path; root/shared instructions, Codex config/hooks and arbitrary files remain inventory-only.
- Global setup from two repositories must remain byte-idempotent and must not transfer ownership to the most recent project.

## 14. Workflow and skills

Workflow chuẩn được định nghĩa tại `docs/HARNIX_WORKFLOW.md` và được generate thành `.harnix/workflow.md`. Harnix có đúng một state machine:

```text
triage -> planning -> ready -> implementing -> verifying -> finishing -> completed
                         |             |           |
                         +---------- debugging ----+
                                      |
                                   replan -> planning
```

`blocked` là trạng thái có thể resume khi thiếu user-owned decision, authority, credential hoặc external dependency. `cancelled` là terminal state riêng khi người dùng explicit abandon task chưa hoàn tất: nó giữ evidence/criteria, ghi reason/authority và cancellation journal, không claim success. Read-only answer, standalone review và standalone research dùng Bypass, không đọc/mutate active task và không tạo task. Lite/Full là mức ceremony trên cùng workflow, không phải template hoặc workflow khác nhau.

Sáu skill (overhaul D4, task `slim-instructions`), mỗi skill sở hữu đúng một nhóm trạng thái và `nextStage` của preflight trỏ thẳng tới chủ sở hữu:

- `harnix-plan` — planning, replan, ready gate, migration v3, epic (task cùng mạch việc: `--init --epic <epic-id>`; `--follow-up` ghi `followUpOf`); thay `harnix-brainstorm` và phần restore của `harnix-continue`.
- `harnix-implement` — ready → `in_progress/implementing`, TDD, release preparation.
- `harnix-verify` — `verifying/verifying` → `verifying/finishing` → finish, cancellation; thay `harnix-check` và `harnix-finish-work`.
- `harnix-debug` — checkpoint `debugging` và quyết định replan.
- `harnix-review` — standalone code review read-only (Bypass, không cần `.harnix/workflow.md`, không đọc/mutate task).
- `harnix-research` — standalone read-only research (Bypass) và task-scoped research cho material unknown trong planning/replan/debugging.

Chi tiết ít dùng nằm ở reference nạp theo yêu cầu qua `harnix skill <name> --reference <topic>` (plan: `decision-discipline|epic|grilling|migration|multi-repo|ready-review|replan`; implement: `brownfield|commit-hygiene|dotnet-microservices|feedback`; verify: `evidence|finish-cancel|rationalizations|so-what|technical-recap`; review: `multi-lens`; research: `scouting-isolation`; debug: `feedback-loop`; và 6 technique references: `verification-blindspots`, `invariant-debugging`, `concurrency-isolation`, `zero-downtime-evolution`, `injection-traversal-guardrails`, `multi-step-tree-search`, `domain-briefs|wbs-consolidation`), không phải file cài thêm. Lệnh `harnix skill --suggest <query>` hỗ trợ tìm kiếm và xếp hạng gợi ý skill theo ngữ nghĩa và từ khóa. Tên cũ (`harnix-brainstorm|check|finish-work|continue`) còn resolve qua `harnix skill` với `resolvedFrom` để agent đã cache không gãy.

Source of truth của từng skill là file thật `src/skills/harnix-*/SKILL.md`, không phải string prose nhúng trong `workflow.ts`. Build nhúng Markdown vào `dist` để không cần runtime filesystem/network. Kiro, Antigravity và Codex cài cùng byte content canonical; frontmatter có `name`, `description` và `metadata.version`, trong đó version semantic của mọi skill phải đồng bộ với package release. Activation guard, danh sách Bypass và state rule chỉ nằm ở một khối rules always-loaded (`HARNIX_RULES`), skill không lặp lại. Router chọn một current stage owner rồi agent đọc riêng selected skill đến EOF; không batch-load skill stage tương lai, và output truncate phải được reread riêng trước khi hành động. Test bắt buộc kiểm tra frontmatter, sáu skill đầy đủ và ngân sách token (always-loaded ≤1.500, mỗi skill ≤2.000, đường Full ≤15.000 token ước lượng chars/4), version đồng bộ package, ready/TDD/debug/verification/resume/cancellation guardrail và parity giữa platform.

Thư viện technique-skill hẹp (5–10 skill, hiện ship 7 skill: `harnix-verification-gap`, `harnix-bugfix-preserve`, `harnix-flaky-test`, `harnix-migration-safety`, `harnix-security-lens`, `harnix-sequential-thinking`, `harnix-arch-review`) cung cấp các kỹ thuật cross-language có bằng chứng thực nghiệm rõ ràng từ `external-research.md`. Chúng được cài đặt vào global skill sink của 6 nền tảng để agent tự chọn theo mô tả (native discovery), hoặc thông qua trường `suggestedTechniques?: string[]` trong `harnix workflow --preflight` tự động phân tích triệu chứng lỗi và ngữ cảnh task. Đồng thời, thư mục `.harnix/spec/skills/` mở ra làm extension point để từng dự án tự bổ sung skill riêng (domain, tool vendor), được `harnix skill` tự động khám phá và phục vụ. Các lệnh ghi workflow mặc định kích hoạt brief mode (chỉ in `id`, `status`, `checkpoint`, `updatedAt`) và cung cấp cờ `--full` khi cần in trọn vẹn task record. Khi commit của git HEAD thay đổi so với thời điểm trích xuất facts, preflight trả về `projectFactsStale: true` để cảnh báo. Lệnh `harnix repo-map --events` hỗ trợ quét đa workspace thông qua cờ `--workspace <path...>` hoặc cấu hình liên kết `linkedWorkspaces` trong `.harnix/config.yaml`, đồng thời trích xuất hằng số và property initializer từ `*Options.cs` và truy vết callers của `events.producerWrappers`.

- **Lite:** thay đổi tập trung, rủi ro thấp, ít decision; task record tối thiểu vẫn có acceptance, validation và evidence. LOC chỉ là tín hiệu, không phải luật.
- **Full:** feature, integration, migration, architecture/refactor, security-sensitive hoặc multi-layer; task `prd.md` + `plan.md`, conditional `design.md`/research và decision-complete plan.
- Mỗi `saveTask` cũng regenerate `.harnix/tasks/<id>/review.md`: một trang tổng hợp thuần cho người đọc (title, status/checkpoint, goal, non-goals, acceptance criteria, `decisions`/`residualRisks` khi có, blocker/cancellation khi có, evidence) để review task mà không cần mở `task.json` hay chạy command. File này derived-only, luôn bị ghi đè, không thuộc `TaskArtifacts`, không nằm trong `inputs` mặc định của bất kỳ required check nào, và không ảnh hưởng `taskContractHash`. Khi workflow save truyền `projectRoot` và task ở `in_progress` hoặc `verifying`, `review.md` có thêm `## Code impact` do `src/core/tasks/code-impact.ts` tính từ Git chỉ đọc so với `HEAD`: chỉ `git --no-optional-locks` với `rev-parse --show-prefix`, `status --porcelain=v2 --untracked-files=all -z` và `diff --no-ext-diff --no-textconv --numstat -z HEAD` (không shell, timeout 2 giây, allowlist chặn lệnh con khác, mọi lệnh git của Harnix tắt `core.fsmonitor` và `core.untrackedCache` và bỏ biến `GIT_DIR`/`GIT_WORK_TREE`/`GIT_INDEX_FILE`/`GIT_EXTERNAL_DIFF` kế thừa), tối đa 50 file kèm dòng tóm tắt phần dư, đường dẫn tương đối và bỏ `.harnix/`; dự án chỉ là thư mục con của repo Git thì bỏ qua (git báo đường dẫn tính từ gốc repo); git không trả lời (ngoài Git, lỗi, timeout) thì giữ mục đã có và việc lưu không bị ảnh hưởng; thiếu `HEAD` chỉ mất số dòng; tên file hiển thị trong ô code an toàn (ký tự điều khiển thành `?`, `|` được thoát); khi task `completed` (kể cả lúc finish) mục đã có được giữ nguyên. Không đổi schema `TaskRecord`; hạn chế đã biết: so với `HEAD` nên commit giữa chừng làm số liệu của task đang làm giảm đi.
- **Ambiguous:** tự chọn mức nhẹ nhất kiểm soát được rủi ro; chỉ hỏi full brainstorm hay quick implementation khi outcome/cost khác đáng kể.
- Explicit `--lite`/`--full` override heuristic. Forced Lite với risk signal vốn chọn Full phải giữ Lite nhưng emit `explicit-lite-risk-conflict`; cả hai mode vẫn giữ common compliance và quality/security gates.

Yêu cầu rõ kiểu build/fix/implement/change cho phép chuyển từ ready sang implementing trong phạm vi đã yêu cầu; không xin approval lần hai. Plan-only request hoặc explicit review checkpoint dừng ở `ready`. Task Full và Epic luôn dừng ở `ready` (`nextStage: await`) để người dùng duyệt kế hoạch trước khi viết code; chỉ task Lite đã được yêu cầu triển khai mới chuyển thẳng sang `implementing`. Product decision chưa giải quyết, scope expansion, destructive/external action hoặc thiếu authority mới cần hỏi.

Workflow phải operational từ generated project artifacts: classify latest request trước khi đọc `.active`; obvious Bypass giữ unrelated task unchanged. Standalone review route tới `harnix-review` và standalone research route tới `harnix-research` mà không consult active task state. Project-scoped Lite/Full hoặc explicit inspect/continue mới chạy bounded hidden preflight. `ready` trả `nextStage:await` vì persisted state không tự chứng minh latest request đã authorize implementation. Sau routing, persist task `planning` trước product edits; persist `ready`, `in_progress/implementing`, và `verifying` trước hành động của stage kế tiếp; ghi evidence ngay sau check; persist `completed` trước completion journal/archive. Hidden `workflow --cancel` nhận bounded JSON reason/authority cho explicit cancellation, persist `cancelled/cancelling` trước cancellation journal rồi clear only matching pointer; partial failure retry idempotent và không chạy completion gate. Task ID phải dùng lowercase kebab slug dễ đọc và vẫn fail closed với unsafe path. Ready persistence bắt buộc ít nhất một acceptance criterion và một required validation check; ở v3 mọi non-waived criterion phải được required check bao phủ. V3 draft hội tụ trong planning và freeze tại first persisted `ready`. Post-ready revision dùng một save `replan` kèm `contractRevision`, không reinterpret evidence dưới criterion/check definition mới. Full artifacts phải tồn tại, an toàn, không rỗng tại mỗi ready transition; `plan.md` có implementation checklist (≥ 1 item) ánh xạ các slice, chỉ check sau focused evidence và không thay thế TaskRecord evidence. Mỗi generated skill phải nêu incoming state, persisted action, và exit/handoff; không dựa vào conversation memory để giả định transition.

Language/package profile trong `.harnix/config.yaml` chỉ là init-time discovery seed. Agent phải đối chiếu manifest, source, test và project instructions hiện tại, chọn context có budget, và không bulk-load repository chỉ vì profile thiếu hoặc stale.

Bug/failure dùng reproduce → evidence → root cause → one hypothesis → minimal failing test → regression protection → fix. Chỉ một automatic remediation round; failed rerun kế tiếp dừng automatic work. Sau ba distinct failed hypotheses cho cùng symptom, reassess architecture và replan nếu cần. Behavior change ưu tiên RED–GREEN–REFACTOR; docs/trivial wiring/generated snapshots có thể dùng documented exception và strongest alternative verification.

Ready gate bắt buộc observable acceptance criteria, affected contract/scope, validation plan, resolved material unknowns, placeholder/consistency/decision self-review và artifacts tương xứng mode. Contract chưa quyết định không được đẩy vào một implementation “freeze” step để lách gate. Task-scoped material research lưu task/source/date/conclusion/remaining uncertainty; standalone research trả cùng loại evidence trong response và không persist task artifact. Implement phải critical-review plan, quan sát RED fail đúng lý do trước GREEN, và hoàn tất release preparation trước `verifying`; version chỉ bump tối đa một lần trên resume, changelog được amend, managed output regenerate khi source đổi. Check stage 1 là PRD/spec/acceptance compliance; stage 2 là correctness, tests, security, maintainability và unnecessary complexity; từng claim map tới current/reused hoặc newly executed evidence cùng full output/exit và matching v2 input snapshot. Finish product-read-only: chỉ archive/complete workflow state, journal evidence/validated learning và recompute freshness, không sửa code/docs/version/changelog/generated/release metadata và không commit/push/merge/PR. Explicit cancellation dùng cùng owner nhưng không giả verification. Continue route từ persisted status/checkpoint, inspect `contextDrift`, và load smallest relevant journal/spec slice; corrupt/future state fail closed.
## 15. Guide catalog and rules integration

Precedence:

```text
repository conventions
> user-modified project specs
> selected technology/domain guide
> selected language guide
> common guide
> packaged fallback
```

Harnix ships a typed guide registry and focused Markdown under `src/guides/common`, `src/guides/languages/<language>` and `src/guides/technologies/<kind>/<technology>`. Metadata selects common, source-language and increasingly specific technology/domain content by profile, path and task topic. Short rules may be always active; path guides and task skills load only when applicable. Only selected content is materialized and loaded. Descriptor/content mapping, priority, composition, supersedence and provenance are validated; user-modified or unowned content is preserved. Every guide has the same three sections after its title: `## Verify` (commands of the official tools), `## Constraints` (at most 10 rules that catch real defects) and `## Common mistakes` (at most 6), and stays within 600 tokens (ceil(characters / 4)); `test/workflow/guide-format.test.ts` enforces this. `.harnix/spec/project-facts.md` is derived, not user-owned: `init` and `update` rewrite it deterministically from `.harnix/config.yaml` (confirmed languages, technologies and packages) and the detected verify plan, it is not listed in `.template-hashes.json`, and the hook context never embeds it.

Initial IDs cover source languages C#, TypeScript, JavaScript, PHP, Python, Java and Go plus .NET, ABP, NestJS, Spring, React web, Vue and CodeIgniter technologies, plus PostgreSQL, MySQL, SQL Server, MongoDB and Redis as first-class `database`-kind technologies. Detection is evidence-based and independent across facets: generic Composer/Maven/Gradle/solution metadata cannot assert a specific framework or source language. A database's own detector never asserts a nuget/maven/gradle dependency fact, since collectors only gather npm/composer dependencies; a .NET or Java driver is matched through its package name inside `*.csproj`/`pom.xml`/`build.gradle*` content instead. PostgreSQL, MySQL and SQL Server share one relational-database guide through the packaged `extends` mechanism; MongoDB and Redis each ship a standalone guide. Packaged content starts by decomposing guidance Harnix already owns; external text requires a frozen upstream revision, license review, mapping and release-scan evidence before adaptation.

## 16. Security requirements

- Node path/realpath containment; không shell-concatenate untrusted paths.
- Process execution bằng executable + argument array.
- Bounded cross-platform hooks, no duplicates.
- Global writes use an injected home/root resolver, relative logical paths, sidecar ownership manifests, permission-preserving atomic replacement, stable locks and concurrent-edit-safe rollback. Windows atomic rename retries only transient `EPERM|EACCES|EBUSY` on one bounded delay schedule; every other error fails immediately and exhaustion preserves the original file plus best-effort temp cleanup.
- Secret reports không echo values.
- Shared JSON/Markdown merge does not touch sensitive or unrelated keys/content; global setup never changes MCP, credentials, permissions, trust, model or provider configuration.
- Purge/migration exact preview và explicit intent.
- Atomic writes, rollback, source preservation có injected-failure tests.
- Không execute spec/context/journal content. Repository-derived excerpt phải nằm trong explicit untrusted-data boundary dùng chung cho Kiro, Antigravity và Codex; learning statement dùng boundary riêng và JSON-string serialization. Fixed boundary và omission disclosure đều tính vào output budget.
- Không network trong init/setup/update/uninstall/mem/status/tasks/resume/context-report/checks/audit/repo-map/doctor.

## 17. Required tests

Tất cả filesystem tests dùng isolated temporary repositories **và injected disposable user homes**; they must not read or write a real user profile:

1. Unit: detection; config/migrations; context ranking/budget; project/global hash manifests; permission-preserving atomic writes; user path safety; lock/stale-lock/rollback; journal; learning; Doctor v2.
2. CLI: all seventeen public commands; status/tasks/resume/context-report/checks/audit from nested initialized paths plus no-active/active/collision/fresh/stale/malformed/no-write/privacy/bounded fixtures; repo-map query/impact cache-only fixtures; setup outside an initialized repository; project/global update/uninstall scope; idempotence; modified/deleted/corrupt/future project and global schemas.
3. Migration: discovery, dry-run, transform, preservation, mixed/conflict, rollback, cleanup.
4. Fixtures: independent C#/.NET/ABP, TypeScript/NestJS, PHP/CodeIgniter, Python, Java/Spring, Go, React web/Native exclusion, Vue and multilingual/multi-technology monorepo.
5. Platform: Kiro global JSON-v1 hook; Antigravity Desktop/CLI plugins and multi-root invocation; Codex global skills/AGENTS/nested hook schema; relevant rules only and no machine paths.
6. Codex: preserve global `AGENTS.md` and unrelated hook groups, `AGENTS.override.md` detection, `CODEX_HOME`, Windows launcher resolution, pending-trust/retrust flow, no duplicate injection, preserve user files.
7. Workflow evals: routing, research, debug, TDD exception, two-stage review, fresh verification, budget disclosure, finish/continue, promotion.
8. Safety: traversal/symlink/junction, global hook no-op/activation guard, secrets, global uninstall confirmation, data preservation, collision, duplicate/legacy hook, lock contention and rollback concurrent edit.
9. Packaging: one publishable package/bin; tarball runtime/templates/licenses; fake-home plus isolated-project smoke; no workspace/second package/stale project-local setup surface.

## 18. Acceptance gates

Harnix không hoàn thành cho tới khi fresh output chứng minh:

- `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint` (đã gồm `pnpm format:check`), `pnpm typecheck` và `pnpm test` (kèm coverage; `test:acceptance` là alias) pass; `pnpm test` đã bao phủ toàn bộ test directories nên cổng release không chạy thêm các suite con.
- `pnpm pack:check` tạo/kiểm đúng một `@tamtiger/harnix` tarball dưới project-local `.artifacts/`.
- `pnpm smoke:tarball` uses two independent temporary roots: a fake user home for global Kiro/Antigravity/Codex setup and one-or-more temporary projects for init/context; it must never mutate real profile/config.
- `pnpm test` gồm clean/seeded unsafe Doctor JSON v2 fixtures and isolated-home global lifecycle fixtures.
- `pnpm measure:init` fail nếu documented non-migration fixture có worst run >=5 giây.
- Non-Harnix `harnix context` cold-path fixture measures startup/event parsing: median <300ms, p95 <750ms and no sample >1s on supported CI OS.
- `pnpm measure:footprint` fail nếu consumer footprint không giảm ít nhất 50% theo `UPSTREAM_BASELINE.md`.
- `pnpm scan:release` fail trên public old branding/package/path, second package/workspace, unsupported adapter, dead packaged import, secret, accidental absolute path, required TODO hoặc duplicate hook.
- `git diff --check` pass; a disposable Windows profile/manual smoke confirms dry-run targets, setup discovery, no-op/activation, Codex `/hooks` trust, doctor and uninstall without altering unrelated global config. A real profile requires explicit authorization.
- Mọi criterion/adopted capability trace tới code/test; deviations ghi rõ.
- License/NOTICE attribution đúng cho Trellis, ECC và Superpowers.
- `docs/HARNESS_FEATURE_PROVENANCE.json` exact-schema regression pass; mỗi external-derived capability có immutable ref/date/license/evidence, adaptation delta và existing code/test/docs targets.

Delivery evidence status through 2026-08-26: Phase 6 implementation and automated isolated-home gates are complete. Repository review continuation F1–F9 hardens managed JSON/markers, repo-map determinism/limits, diagnostics/release privacy, filesystem preservation and duplicated pure utilities. The current research-driven batch adds bounded public task status/next action, resilient local task index, cache-only dependency impact, deterministic readiness/completion audit and machine-checked per-feature provenance after revalidating three upstreams and eight deep dives. Historical authorized sessions are retained as dated evidence, while fresh disposable revalidation proved `agy` implicit routing/no-op but not print-mode hook loading; Kiro/Codex disposable sessions lacked login and Codex trust. `active`, `shadowed` and `unsupported-version` still require current authoritative external evidence.

## Repository map v1

Repo-map is disposable project cache at `.harnix/cache/repo-map-v1.json`, containing only deterministic repository-relative structural metadata and SHA-256 fingerprints—never source bodies, literals, secrets, absolute paths, a daemon, embeddings, or network data. Fresh `harnix init`, hidden `harnix repo-map --refresh`, and project `doctor --fix` may safely rebuild it. Public `harnix repo-map --query <text> [--limit <count>]` is cache-only and always emits the v1 JSON shape. The ranker uses graph-aware lexical and structural signals resolving relative and project/package imports, builds a bounded in-memory graph (10k nodes, 100k edges, two hops, 200 candidates), then applies capped dependency-neighbor, referenced-by and inbound-centrality bonuses with stable tie-breaking. Unused ranker v1 was removed in task [16].

Public `harnix repo-map --impact <path> [--depth <1..3>] [--limit <1..20>]` is mutually exclusive with query/tests/hidden refresh and accepts only an exact normalized non-root repository-relative POSIX path. It reads cache v1 only, returns direct outgoing dependencies and unique reverse dependents with BFS distance up to depth (default 2), sorts by distance then code-unit path, and applies limit independently to both directions (default 20), đồng thời tự động mở rộng đồ thị quan hệ phụ thuộc thông qua `<ProjectReference>` trong `.csproj` khi phân tích file C# .NET. Stable result status is `ready|missing|invalid|not-found`; every non-ready result keeps the same JSON fields with empty lists and false truncation flags.

Public `harnix repo-map --tests <path> [--limit <1..20>]` is mutually exclusive with query/impact/hidden refresh and accepts only an exact normalized non-root repository-relative POSIX path. It reads cache v1 only, identifies directly and transitively affected test files based on both import edges and test naming conventions (cho TypeScript/JavaScript, Python, Go, và C# .NET qua cơ chế symbol reference scanning tìm các biểu thức khởi tạo `new ClassName(...)`, `Mock<IInterface>`, `Substitute.For<IInterface>` trong các file test nghiệp vụ), prioritizing direct matches before reverse-dependent tests, sorted code-unit. When target is already a test file, it returns target itself. Lệnh `harnix repo-map --events` quét event topic matrix tự động loại bỏ test mocks, tham số biến động (`stoppingToken`, `createdEto`, `payload`, `Arg.Any`) và giải mã giá trị thực của các hằng số class (như `KafkaTopics.X`). Stable result status is `ready|missing|invalid|not-found`. Impact and tests never scan source, refresh/write cache, infer dynamic dependencies, or change cache schema. Global hooks never scan, refresh, write, query, or request impact/tests from repo-map.

## 19. Provenance and requirement history

PRD ban đầu dùng working title “Trellis Pro”, pnpm monorepo/two packages, `.trellis/`, Kiro/Gemini và project-local Python scripts. Sau research và product decisions, Harnix thay thế bằng single package, `.harnix/`, installed-package runtime, Kiro/Antigravity/Codex, cùng managed lifecycle, migration, doctor, context budget, learning và safety contracts.

Lịch sử này giải thích provenance/migration, không tạo public alias hoặc old output. Chi tiết mapping và decisions nằm trong các tài liệu research; registry machine-checkable hiện hành là `docs/HARNESS_FEATURE_PROVENANCE.json`, và mọi feature harness-derived mới phải được thêm vào registry trước completion.

## 20. Delivery phases

- **Phase 0:** PRD/research/baseline checkpoint và Git inventory.
- **Phase 1:** single-package foundation, root/detection/config/init, migration preview, basic Kiro/Codex setup.
- **Phase 2:** tasks/context/journal/learning, managed manifest, rule seeding.
- **Phase 3:** workflow skills/evals và Kiro/Antigravity/Codex parity; remove stale surfaces.
- **Phase 4:** lifecycle commands, full migration, packaging, performance, footprint và polish.
- **Phase 5:** review remediation, lifecycle/state safety and harness hardening.
- **Phase 6:** explicit user-global Kiro, Antigravity, Codex, and Claude Code integrations; global ownership, Doctor v2, legacy project-surface cleanup and disposable-profile acceptance.
- **Phase 7 (Overhaul v2.0.0):** Đại tu toàn diện 17 tasks: TaskRecord schema v3, suite gate kiểm chứng thực, chuẩn hóa múi giờ VN offset, thống nhất tên epic, bổ sung OpenCode & Cursor qua platform registry khai báo, viết lại guides dạng lệnh + ràng buộc, thư viện technique-skills & extension point, repo-map test-impact, tinh gọn acceptance gates và phát hành chính thức 2.0.0.

Chi tiết file/task/test/exit criteria nằm trong `IMPLEMENTATION_PLAN.md`.
