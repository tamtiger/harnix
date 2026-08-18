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
| Status | **Implemented in the authorized scope**; Phase 6 and workflow freshness C1–C3 are implemented. Revalidation 2026-08-18 proved disposable `agy` implicit routing/no-op control; current `agy --print` hook loading, Kiro/Codex disposable login/trust and GUI surfaces remain conservative/not-run rather than being inferred active. |

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
| 8 | Quá nhiều platform/surface | Chỉ Kiro, Antigravity và Codex |
| 9 | Workflow/channel quá phức tạp | Một workflow; không forum/worker network |
| 10 | Completion claim thiếu evidence | Fresh verification gate và two-stage review |
| 11 | Legacy install bị merge âm thầm | Preview, explicit migration, verify, rollback, preserve source |

## 4. Product principles

- **Evidence over claims:** không claim pass/fixed/complete từ output cũ hoặc suy luận.
- **Project-data local, integrations explicit:** workflow data stays project-local; only documented, Harnix-owned user-global platform integrations may cross projects. No global runtime, daemon or hidden memory.
- **User data wins:** modified files, tasks, journals và unrelated config được bảo toàn.
- **Progressive context:** load theo relevance/budget; full context là explicit override.
- **Safe by default:** preview migration/purge và fail closed khi path/hash/schema không chắc chắn.
- **YAGNI:** không thêm platform, orchestration, service hoặc generic skill ngoài nhu cầu.
- **Single-agent capable:** subagent có thể hữu ích nhưng không phải dependency.
- **Offline lifecycle:** init/setup/update/uninstall/mem/doctor không silent network.

## 5. Scope

### 5.1 In scope

- Một TypeScript ESM npm package và một CLI executable.
- Task/spec/context/journal/learning project-local.
- Dual-mode brainstorm, adaptive TDD, systematic debugging, two-stage review.
- Stack/package-manager/verification detection.
- Kiro, Antigravity và Codex native user-global integrations with project-activation guards.
- Managed lifecycle, migration, doctor, update, upgrade, uninstall, memory query.
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
│   ├── commands/           # init, setup, update, upgrade, uninstall, mem, doctor
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
harnix setup --kiro|--antigravity|--codex [--dry-run]
harnix update [--restore]
harnix update --global [--kiro|--antigravity|--codex] [--restore] [--dry-run]
harnix upgrade
harnix uninstall --purge [--yes]
harnix uninstall --global --kiro|--antigravity|--codex [--yes]
harnix uninstall --legacy-project-surfaces [--yes]
harnix mem [query]
harnix doctor [--fix] [--global]
harnix repo-map --query <text> [--limit <count>]
```

Có tám public commands. Mọi public command luôn emit đúng một JSON document; không cần `--json`. Platform flags là explicit authorization cho global mutation; `--global` không tạo command mới. Init không destructive và không prompt: lệnh tối giản là `harnix init`; `--user`, `--languages` và `--technologies` chỉ override giá trị tự phát hiện. `--yes` chỉ còn cần cho destructive uninstall. Packaged hidden `harnix internal context --platform <id>` là platform-hook protocol; hidden `harnix workflow inspect|save|snapshot|finish` là agent persistence/freshness transport. Chúng không xuất hiện trong public help và không phải supported public API; frozen behavior nằm trong `IMPLEMENTATION_PLAN.md` mục 4.

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
- Runtime stays in the installed package. The fixed hook command is `harnix internal context --platform <id>`; binary lookup is injected and a missing launcher returns `binary-unavailable`, never a false readiness claim.
- Human/JSON results contain per-platform created, updated, unchanged, preserved and warning paths plus readiness. Output never exposes an absolute home path.
- Each target root owns an independent sidecar manifest; no `~/.harnix` is created and no project manifest can claim shared global files. Manifests store relative paths only, reject corrupt/future/unsafe data before write, preserve collisions and user edits, and use stable-order locking, permission-preserving atomic writes and conservative rollback.
- Every global instruction, skill and hook starts with an activation guard: find the nearest initialized project ancestor/root from the event cwd or workspace roots, rather than checking only the current workspace directory. Khi guard pass, global instruction phải route mọi ordinary user request qua Bypass/Lite/Full kể cả khi prompt không nhắc Harnix; no `.harnix/config.yaml` means fast no-op with no output/write/init. A known initialized project whose state cannot be read safely emits only a concise redacted platform-specific warning, fails closed for project data, and must not block the hosting agent.

### 9.1 Kiro

- User surfaces are `~/.kiro/skills/harnix-*/SKILL.md`, `~/.kiro/steering/harnix.md`, and `~/.kiro/hooks/harnix-context.json`.
- Steering is conditional: it directs the agent to `.harnix/workflow.md` only for an initialized project. Skills are global and not derived from whichever project happens to run setup.
- The dedicated JSON-v1 hook has one enabled `UserPromptSubmit` command action, fixed to `harnix internal context --platform kiro`, with timeout 5 seconds. It runs from project root; a non-Harnix repository exits 0 with empty stdout.
- Doctor inventories old workspace-hook duplication. Its schema reserves `unsupported-version`, but the regular CLI deliberately does not run a Kiro version/capability probe: that status is valid only when authoritative external capability evidence reaches the lifecycle boundary. Without it, Kiro is conservatively `installed` or `binary-unavailable`; setup never changes permission settings, MCP or trusted-command policy.

### 9.2 Antigravity

- Public identity/flag remains Antigravity/`--antigravity`; executable discovery uses `agy`, not Gemini CLI.
- Install the same namespaced Harnix plugin independently at `~/.gemini/config/plugins/harnix` (Desktop/IDE) and `~/.gemini/antigravity-cli/plugins/harnix` (CLI). Each has its own ownership manifest.
- `plugin.json` contains only official fields. The plugin owns Harnix skills, always-on activation-guard rule tại `rules/AGENTS.md` không có frontmatter, and a `PreInvocation` fixed command handler in `hooks.json`; it never creates MCP/settings, touches credentials/accounts/registry, or hardcodes a machine path.
- The handler injects only on the initial invocation and outputs `{ "injectSteps": [...] }`. It exits `0` with empty stdout for a non-Harnix workspace or malformed optional event; `{ "injectSteps": [] }` is emitted only after an initialized project is known and the invocation is later or no context applies. It chooses a valid cwd root first, then exactly one initialized `workspacePaths[]` root; ambiguity does not read project data and yields a short warning.
- File presence alone is not active. Doctor reports `active` or `shadowed` only when authoritative external activation/precedence evidence is supplied; otherwise Antigravity is `precedence-unknown`. The regular CLI does not probe an Antigravity version or infer precedence from files.

### 9.3 Codex

- User skills are `$HOME/.agents/skills/harnix-*/SKILL.md`; they are not repository `.agents/skills` setup output.
- Setup merges a short conditional Harnix block into `$CODEX_HOME/AGENTS.md`, preserving every byte outside markers, and a nested `UserPromptSubmit` handler into `$CODEX_HOME/hooks.json`, preserving unrelated events/groups/handlers.
- Setup does not create or change `$CODEX_HOME/config.toml`, model, reasoning, sandbox, approval, provider/auth, MCP or feature flags. `AGENTS.override.md` shadowing and legacy project hooks are doctor findings.
- The fixed nested hook command has timeout 5 seconds and `additionalContextLimit: 2500`. Windows launcher smoke must prove a pnpm/npm `.cmd` shim resolves; no absolute executable or automatic trust bypass is allowed.
- Codex hook files are initially `installed-pending-trust`. User review/trust through `/hooks` is necessary but not sufficient for an `active` claim: activation additionally needs authoritative external evidence. Changed hook content requires review again, and the regular CLI never assumes trust or activation from file presence.

The root `AGENTS.md` bootstrap that `init` creates when absent is retained for project onboarding. It is not a setup-owned Codex platform surface.
## 10. Config, context, journal and learning

Normative schemas cho `.harnix/config.yaml`, stack/guide catalog, project managed manifest, TaskRecord v1/v2, verification-input sidecar, optional context manifest, journal/learning, global ownership manifest và Doctor JSON v2 nằm tại `IMPLEMENTATION_PLAN.md` mục 4 và `GLOBAL_SETUP_REFACTOR_PLAN.md`. Implementation không được tự đổi field/enum/path/transition mà không cập nhật PRD/workflow, migration và tests trong cùng change. Task mới dùng v2; completed v1 được byte-preserve, unfinished v1 chỉ migrate explicit tại `replan`, còn update/Doctor chỉ chẩn đoán `legacy-task-schema`. Config v2 lưu `languages` và `technologies` độc lập ở project/package; technology kind chỉ nằm trong packaged catalog. Config v1 vẫn đọc được và chỉ được migrate explicit bởi `update` hoặc `doctor --fix`, không rescan; compatible unknown keys được giữ và future/corrupt state bị reject. `config.platforms` remains deprecated and ignored for desired global setup.

Context:

- Rank theo pin, task/acceptance reference, active package/path, language/technology guide và cross-project relevance; một entry chỉ nhận một bounded stack bonus dù match cả hai facet.
- Deduplicate theo normalized repo-relative source/content.
- Enforce configurable character/token approximation budget.
- Khi truncate, inject phần điểm cao nhất và liệt kê omitted files.
- Full-context override explicit và vẫn ghi source list.
- Research findings lưu cùng task với source/date, không global injection.
- Hidden inspect/continue luôn trả `contextDrift`; changed, missing, unreadable hoặc unverified manifest input tạo `stale`, buộc persist cùng status/checkpoint `replan` trước context reselection. Không tự sửa source/context manifest.

Task verification:

- TaskRecord v2 required checks map acceptance bằng immutable `criterionIds`, khai báo sorted safe `inputs` có `@task-contract`, và behavioral check bind repository file/glob.
- Required pass evidence mang `inputDigest` SHA-256 của canonical task contract, Full PRD/plan và sorted repository input hashes. Save recompute để chặn race; finish recompute latest required snapshots từ immutable task-owned sidecar.
- Criterion chỉ `met` cho completion khi linked evidence là fresh pass của check có declared `criterionIds` chứa criterion đó. Changed/missing/unreadable/unsafe/empty input hoặc contract drift fail closed; diagnostics không lộ source body, secret hay absolute path.

Journal/learning:

- Project-local, newest-first, query theo user/limit và JSON.
- Missing workspace, malformed entry, Unicode/spaces không crash toàn command.
- Candidate gồm source task, statement, evidence, occurrences, confidence.
- Promotion vào spec cần repeated independent evidence hoặc explicit finish approval.
- Promotion reviewable trong diff; không daemon, hidden skill generation, global memory.

## 11. Managed-file lifecycle

Project manifest versioned SHA-256 lưu normalized repository-relative path, source/template ID, generated hash và generator version. It owns only `.harnix` project templates, never global integration files. Global integrations use a separate manifest per verified platform root, whose entries use paths relative to that root and can own whole files, managed Markdown blocks, or stable JSON members.

| State | Action |
|---|---|
| Stored hash = disk hash | Update |
| Stored hash ≠ disk hash | Preserve + warn |
| New desired file | Create + track |
| User-deleted tracked file | Report; explicit restore required |
| Obsolete unchanged | Remove |
| Obsolete modified | Preserve |

Content/manifest uses atomic replacement. Reject traversal, absolute keys, unsafe roots, symlink/junction escape and corrupt/future manifests. A partial write keeps the previous valid state. Tasks/journals are never managed; specs/workflow are project-managed only until user modification. A global fragment hash covers only the Harnix fragment, never unrelated user content; non-overlapping selectors are required for a shared file.

## 12. Lifecycle commands

### Update

`update` without `--global` reconciles offline packaged project templates only; it does not recreate old platform surfaces. `update --global [platform flags]` reconciles valid user-global manifests; absent flags mean all valid global manifests. Neither mode touches tasks, journals or unrelated files.

### Upgrade

Báo installed/available version và npm upgrade path cho `@tamtiger/harnix`. Dùng argument arrays và injected network/version/process dependencies để tests không gọi network/install thật.

### Uninstall

`uninstall --purge --yes` only removes project `.harnix` data after preview/confirmation and safe-root checks. `uninstall --global --kiro|--antigravity|--codex [--yes]` previews then removes only unchanged selected global entries; without `--yes` it makes no write. `uninstall --legacy-project-surfaces [--yes]` is a separate manifest-backed cleanup that may delete only unchanged **standalone** historical paths whose v1 manifest proves the exact Harnix source/path. Root/shared files such as `AGENTS.md`, `GEMINI.md`, `.codex` config/hooks and arbitrary user files are inventory-only, never deletion targets; the flag is mutually exclusive with global/purge and always preserves modified/untracked content.

### Mem

Search newest-first với query/user/limit/json; include candidate confidence/evidence nhưng không promote; malformed data xử lý graceful.

### Doctor

Doctor uses JSON v2: `project` has status `ready|not-initialized|invalid`; `globalIntegrations` separately reports every supported platform as `not-installed|installed|active|installed-pending-trust|binary-unavailable|shadowed|precedence-unknown|unsupported-version|drifted|invalid`. It works outside a Harnix project and treats `project:not-initialized` as info. The enum supports authoritative external evidence, but the regular CLI does not run a platform-version probe or infer activation/precedence from installed files: `active`, `shadowed` and `unsupported-version` are reported only when that evidence is supplied at the integration boundary; otherwise it returns the conservative installed/trust/binary/precedence state.

Offline deterministic checks include schemas, hashes, missing/modified/obsolete, `legacy-task-schema`, duplicate/legacy injection, skill frontmatter, hooks, unsafe paths, attribution, platform drift, embedded secrets, broad permissions and injection-prone commands. Secret values are redacted và Doctor không migrate task record. Exit 0 is safe/no actionable finding, exit 1 is actionable warning/drift, and exit 2 is invalid usage or unsafe/corrupt/future project/global state. `--fix` alone only repairs safe project-managed issues; `--fix --global` only reconciles safe missing/unchanged global entries and never trusts Codex hooks, enables permissions/features, or changes a modified user fragment.

## 13. Legacy compatibility boundary

Trellis/ECC/Superpowers chỉ còn là provenance và research history. Runtime Harnix không phụ thuộc vào hoặc phát hiện `.trellis/`, `.trellis-pro/`, `trellis-*` skills hay package Trellis.

- `init` luôn tạo namespace `.harnix/` nếu namespace này chưa tồn tại.
- Existing Trellis files được giữ nguyên và không bị migrate, overwrite, rename hoặc xóa.
- Legacy project-local Kiro, Antigravity and Codex setup output is inventory-only after Phase 6: update never recreates it and doctor classifies it as unchanged/modified/untracked/duplicate-hook. Only explicit `uninstall --legacy-project-surfaces [--yes]` can remove a manifest-proven unchanged **standalone** path; root/shared instructions, Codex config/hooks and arbitrary files remain inventory-only.
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

`blocked` là trạng thái có thể resume khi thiếu user-owned decision, authority, credential hoặc external dependency. Read-only answer/review dùng Bypass và không tạo task. Lite/Full là mức ceremony trên cùng workflow, không phải template hoặc workflow khác nhau.

Core skills:

- `harnix-brainstorm`
- `harnix-implement`
- `harnix-check`
- `harnix-finish-work`
- `harnix-continue`

Optional focused skills: `harnix-research` cho full-mode material unknowns và `harnix-debug` cho bugs/failures. Không tạo skill mới nếu behavior thuộc core skill.

Source of truth của từng skill là file thật `src/skills/harnix-*/SKILL.md`, không phải string prose nhúng trong `workflow.ts`. Build nhúng Markdown vào `dist` để không cần runtime filesystem/network. Kiro, Antigravity và Codex cài cùng byte content canonical; frontmatter có `name`, `description` và `metadata.version`, trong đó version semantic của mọi skill phải đồng bộ với package release. Activation guard và behavior stage nằm trong source đó. Test bắt buộc kiểm tra frontmatter, bảy skill đầy đủ, version đồng bộ package, ready/TDD/debug/verification/resume guardrail và parity giữa platform.

- **Lite:** thay đổi tập trung, rủi ro thấp, ít decision; task record tối thiểu vẫn có acceptance, validation và evidence. LOC chỉ là tín hiệu, không phải luật.
- **Full:** feature, integration, migration, architecture/refactor, security-sensitive hoặc multi-layer; task `prd.md` + `plan.md`, conditional `design.md`/research và decision-complete plan.
- **Ambiguous:** tự chọn mức nhẹ nhất kiểm soát được rủi ro; chỉ hỏi full brainstorm hay quick implementation khi outcome/cost khác đáng kể.
- Explicit `--lite`/`--full` override heuristic. Forced Lite với risk signal vốn chọn Full phải giữ Lite nhưng emit `explicit-lite-risk-conflict`; cả hai mode vẫn giữ common compliance và quality/security gates.

Yêu cầu rõ kiểu build/fix/implement/change cho phép chuyển từ ready sang implementing trong phạm vi đã yêu cầu; không xin approval lần hai. Plan-only request hoặc explicit review checkpoint dừng ở `ready`. Product decision chưa giải quyết, scope expansion, destructive/external action hoặc thiếu authority mới cần hỏi.

Workflow phải operational từ generated project artifacts: restore `.harnix/tasks/.active`; persist task `planning` trước product edits; persist `ready`, `in_progress/implementing`, và `verifying` trước hành động của stage kế tiếp; ghi evidence ngay sau check; persist `completed` trước journal/archive. Task ID phải dùng lowercase kebab slug dễ đọc và vẫn fail closed với unsafe path. Ready persistence bắt buộc ít nhất một acceptance criterion và một required validation check; ở v2 mọi non-waived criterion phải được required check bao phủ. Sau lần persist đầu, criterion ID/text và required-check ID/definition, gồm `criterionIds`/`inputs`, không được xoá, đổi tên, demote hoặc sửa in-place. Clarification dùng obligation bổ sung; obligation không còn áp dụng dùng explicit waiver có lý do. Full artifacts phải tồn tại, an toàn và không rỗng trên disk tại mỗi ready transition; `plan.md` có implementation checklist ánh xạ một-một với các slice, chỉ check sau focused evidence và không thay thế TaskRecord evidence. Mỗi generated skill phải nêu incoming state, persisted action, và exit/handoff; không dựa vào conversation memory để giả định transition.

Language/package profile trong `.harnix/config.yaml` chỉ là init-time discovery seed. Agent phải đối chiếu manifest, source, test và project instructions hiện tại, chọn context có budget, và không bulk-load repository chỉ vì profile thiếu hoặc stale.

Bug/failure dùng reproduce → evidence → root cause → one hypothesis → minimal failing test → regression protection → fix. Sau ba failed hypotheses cho cùng symptom, reassess architecture và replan nếu cần. Behavior change ưu tiên RED–GREEN–REFACTOR; docs/trivial wiring/generated snapshots có thể dùng documented exception và strongest alternative verification.

Ready gate bắt buộc observable acceptance criteria, affected contract/scope, validation plan, resolved material unknowns, placeholder/consistency/decision self-review và artifacts tương xứng mode. Contract chưa quyết định không được đẩy vào một implementation “freeze” step để lách gate. Material research lưu task/source/date/conclusion/remaining uncertainty. Implement phải critical-review plan và quan sát RED fail đúng lý do trước GREEN. Check stage 1 là PRD/spec/acceptance compliance; stage 2 là correctness, tests, security, maintainability và unnecessary complexity; từng claim map tới fresh command/inspection cùng full output/exit và matching v2 input snapshot. Finish archive/complete state, journal evidence/validated learning, recompute freshness và không commit/push/merge/PR. Continue route từ persisted status/checkpoint, inspect `contextDrift`, và load smallest relevant journal/spec slice; corrupt/future state fail closed.
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

Harnix ships a typed guide registry and focused Markdown under `src/guides/common`, `src/guides/languages/<language>` and `src/guides/technologies/<kind>/<technology>`. Metadata selects common, source-language and increasingly specific technology/domain content by profile, path and task topic. Short rules may be always active; path guides and task skills load only when applicable. Only selected content is materialized and loaded. Descriptor/content mapping, priority, composition, supersedence and provenance are validated; user-modified or unowned content is preserved.

Initial IDs cover source languages C#, TypeScript, JavaScript, PHP, Python, Java and Go plus .NET, ABP, NestJS, Spring, React web, Vue and CodeIgniter technologies. Detection is evidence-based and independent across facets: generic Composer/Maven/Gradle/solution metadata cannot assert a specific framework or source language. Packaged content starts by decomposing guidance Harnix already owns; external text requires a frozen upstream revision, license review, mapping and release-scan evidence before adaptation.

## 16. Security requirements

- Node path/realpath containment; không shell-concatenate untrusted paths.
- Process execution bằng executable + argument array.
- Bounded cross-platform hooks, no duplicates.
- Global writes use an injected home/root resolver, relative logical paths, sidecar ownership manifests, permission-preserving atomic replacement, stable locks and concurrent-edit-safe rollback.
- Secret reports không echo values.
- Shared JSON/Markdown merge does not touch sensitive or unrelated keys/content; global setup never changes MCP, credentials, permissions, trust, model or provider configuration.
- Purge/migration exact preview và explicit intent.
- Atomic writes, rollback, source preservation có injected-failure tests.
- Không execute spec/context/journal content. Repository-derived excerpt phải nằm trong explicit untrusted-data boundary dùng chung cho Kiro, Antigravity và Codex; fixed boundary và omission disclosure đều tính vào output budget.
- Không network trong init/setup/update/uninstall/mem/doctor.

## 17. Required tests

Tất cả filesystem tests dùng isolated temporary repositories **và injected disposable user homes**; they must not read or write a real user profile:

1. Unit: detection; config/migrations; context ranking/budget; project/global hash manifests; permission-preserving atomic writes; user path safety; lock/stale-lock/rollback; journal; learning; Doctor v2.
2. CLI: all seven commands; setup outside an initialized repository; project/global update/uninstall scope; idempotence; modified/deleted/corrupt/future project and global schemas.
3. Migration: discovery, dry-run, transform, preservation, mixed/conflict, rollback, cleanup.
4. Fixtures: independent C#/.NET/ABP, TypeScript/NestJS, PHP/CodeIgniter, Python, Java/Spring, Go, React web/Native exclusion, Vue and multilingual/multi-technology monorepo.
5. Platform: Kiro global JSON-v1 hook; Antigravity Desktop/CLI plugins and multi-root invocation; Codex global skills/AGENTS/nested hook schema; relevant rules only and no machine paths.
6. Codex: preserve global `AGENTS.md` and unrelated hook groups, `AGENTS.override.md` detection, `CODEX_HOME`, Windows launcher resolution, pending-trust/retrust flow, no duplicate injection, preserve user files.
7. Workflow evals: routing, research, debug, TDD exception, two-stage review, fresh verification, budget disclosure, finish/continue, promotion.
8. Safety: traversal/symlink/junction, global hook no-op/activation guard, secrets, global uninstall confirmation, data preservation, collision, duplicate/legacy hook, lock contention and rollback concurrent edit.
9. Packaging: one publishable package/bin; tarball runtime/templates/licenses; fake-home plus isolated-project smoke; no workspace/second package/stale project-local setup surface.

## 18. Acceptance gates

Harnix không hoàn thành cho tới khi fresh output chứng minh:

- `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` và `pnpm test:acceptance` pass.
- `pnpm pack:check` tạo/kiểm đúng một `@tamtiger/harnix` tarball dưới project-local `.artifacts/`.
- `pnpm smoke:tarball` uses two independent temporary roots: a fake user home for global Kiro/Antigravity/Codex setup and one-or-more temporary projects for init/context; it must never mutate real profile/config.
- `test:acceptance` gồm clean/seeded unsafe Doctor JSON v2 fixtures and isolated-home global lifecycle fixtures.
- `pnpm measure:init` fail nếu documented non-migration fixture có worst run >=5 giây.
- Non-Harnix `internal context` cold-path fixture measures startup/event parsing: median <300ms, p95 <750ms and no sample >1s on supported CI OS.
- `pnpm measure:footprint` fail nếu consumer footprint không giảm ít nhất 50% theo `UPSTREAM_BASELINE.md`.
- `pnpm scan:release` fail trên public old branding/package/path, second package/workspace, unsupported adapter, dead packaged import, secret, accidental absolute path, required TODO hoặc duplicate hook.
- `git diff --check` pass; a disposable Windows profile/manual smoke confirms dry-run targets, setup discovery, no-op/activation, Codex `/hooks` trust, doctor and uninstall without altering unrelated global config. A real profile requires explicit authorization.
- Mọi criterion/adopted capability trace tới code/test; deviations ghi rõ.
- License/NOTICE attribution đúng cho Trellis, ECC và Superpowers.

Delivery evidence status through 2026-08-18: Phase 6 implementation and automated isolated-home gates are complete. Repository review continuation F1–F9 hardens managed JSON/markers, repo-map determinism/limits, diagnostics/release privacy, filesystem preservation and duplicated pure utilities. Historical authorized sessions are retained as dated evidence, while fresh disposable revalidation proved `agy` implicit routing/no-op but not print-mode hook loading; Kiro/Codex disposable sessions lacked login and Codex trust. `active`, `shadowed` and `unsupported-version` still require current authoritative external evidence.

## Repository map v1

Repo-map is disposable project cache at `.harnix/cache/repo-map-v1.json`, containing only deterministic repository-relative structural metadata and SHA-256 fingerprints—never source bodies, literals, secrets, absolute paths, a daemon, embeddings, or network data. Fresh `harnix init`, hidden `harnix internal repo-map refresh`, and project `doctor --fix` may safely rebuild it. Public `harnix repo-map --query <text> [--limit <count>]` is cache-only and always emits JSON; global hooks never scan, refresh, write, or query it.

## 19. Provenance and requirement history

PRD ban đầu dùng working title “Trellis Pro”, pnpm monorepo/two packages, `.trellis/`, Kiro/Gemini và project-local Python scripts. Sau research và product decisions, Harnix thay thế bằng single package, `.harnix/`, installed-package runtime, Kiro/Antigravity/Codex, cùng managed lifecycle, migration, doctor, context budget, learning và safety contracts.

Lịch sử này giải thích provenance/migration, không tạo public alias hoặc old output. Chi tiết mapping và decisions nằm trong các tài liệu research.

## 20. Delivery phases

- **Phase 0:** PRD/research/baseline checkpoint và Git inventory.
- **Phase 1:** single-package foundation, root/detection/config/init, migration preview, basic Kiro/Codex setup.
- **Phase 2:** tasks/context/journal/learning, managed manifest, rule seeding.
- **Phase 3:** workflow skills/evals và Kiro/Antigravity/Codex parity; remove stale surfaces.
- **Phase 4:** lifecycle commands, full migration, packaging, performance, footprint và polish.
- **Phase 5:** review remediation, lifecycle/state safety and harness hardening.
- **Phase 6:** explicit user-global Kiro, Antigravity and Codex integrations; global ownership, Doctor v2, legacy project-surface cleanup and disposable-profile acceptance.

Chi tiết file/task/test/exit criteria nằm trong `IMPLEMENTATION_PLAN.md`.
