# Upstream-to-Harnix Mapping

## 1. Nguyên tắc mapping

Harnix là một derived implementation có chọn lọc, không phải rename nguyên repository. Mapping dùng ba loại:

- `reuse/adapt`: giữ boundary hoặc thuật toán có giá trị, đổi identity/data model/safety semantics theo Harnix.
- `remove`: upstream component không tồn tại trong product/output mới.
- `build new`: yêu cầu Harnix không có implementation tương đương đủ phù hợp.

Mọi public symbol, package, executable, template và generated branding dùng Harnix. `src/core` là internal boundary, không phải package thứ hai.

## 2. Repository mapping

| Upstream | Harnix target | Class | Ghi chú |
|---|---|---|---|
| Root pnpm workspace | Root single `package.json` | `build new` | Không `pnpm-workspace.yaml`; đúng một publishable package |
| `packages/core/src/task/**` | `src/core/tasks/**` | `reuse/adapt` | Thu gọn schema/task state; bỏ branch/PR/worktree automation bắt buộc |
| `packages/core/src/mem/**` | `src/core/journal/**` | `reuse/adapt` | Project journals + search; bỏ platform chat DB adapters/global memory |
| `packages/core/src/channel/**` | — | `remove` | Không forum, worker, spawn, supervisor hoặc channel store |
| `packages/cli/src/cli/**` | `src/cli.ts` | `reuse/adapt` | Commander CLI, một executable `harnix` |
| `packages/cli/src/commands/init.ts` | `src/commands/init.ts` | `reuse/adapt` | Init tạo `.harnix` project data plus root `AGENTS.md` bootstrap only when absent; setup tách riêng |
| Configurator registry 24 platform | `src/configurators/{kiro,antigravity,codex}.ts` | `reuse/adapt` | Registry đóng chỉ Kiro, Antigravity và Codex |
| `commands/{update,upgrade,uninstall,mem}.ts` | Cùng command names dưới `src/commands` | `reuse/adapt` | Semantics ownership, injection và safety mới |
| — | `src/commands/setup.ts` | `build new` | Multi-flag platform setup tách khỏi init |
| — | `src/commands/doctor.ts` | `build new` | Local deterministic diagnostics/fix |
| `utils/atomic-write.ts` | `src/utils/atomic-write.ts` | `reuse/adapt` | Temp sibling + atomic replace + cleanup/rollback tests |
| `utils/template-hash.ts` | `src/utils/hashing.ts`, `managed-files.ts` | `reuse/adapt` | Versioned entry metadata, normalized relative paths, ownership states |
| `utils/file-writer.ts`, `manifest-prune.ts` | `src/utils/managed-files.ts` | `reuse/adapt` | Preserve unknown/user files; explicit deleted/obsolete states |
| `utils/project-detector.ts` | `src/utils/detection.ts` | `reuse/adapt` | .NET/ABP, NestJS, Python, Java/Spring, Go, React, Vue + ignored dirs |
| `utils/cwd-guard.ts`, task paths | `src/utils/paths.ts` | `reuse/adapt` | Git root/worktree, Unicode/spaces, symlink and traversal safety |
| `.trellis/scripts/**` | Package runtime modules | `remove` | Không sinh Python/runtime scripts vào consumer |
| `.trellis/spec/**` templates | `src/templates/harnix/spec/**` | `reuse/adapt` | Concise, language-scoped, managed-until-edited |
| `.trellis/tasks/**` | `.harnix/tasks/**` | `reuse/adapt` | User data, never managed template |
| `.trellis/workspace/**` | `.harnix/workspace/<developer>/**` | `reuse/adapt` | Journal/learning local, newest-first; directory created lazily on first write |
| `.trellis/config.yaml` | `.harnix/config.yaml` | `build new` | `generator: harnix`, versioned strict schema |
| `.trellis/workflow.md` | `docs/HARNIX_WORKFLOW.md` → `src/templates/harnix/workflow.md` → `.harnix/workflow.md` | `adapt` | Một state machine; Bypass/Lite/Full routing, ready gate, debug/replan, two-stage verification; no duplicate approval/mandatory Git |
| Trellis platform agents/commands/skills | Harnix focused skills | `adapt` | Namespace `harnix-*`; không slash-command shim |
| Trellis migration code | `src/migration/**` | `build new` | `.trellis`/`.trellis-pro`, preview/copy/transform/verify/rollback/cleanup |
| Trellis release scripts | Minimal package scripts | `remove` | Không publish/release automation trong implementation task |
| Marketplace/docs site/Chinese docs | — | `remove` | Ngoài scope |

## 3. Core module boundaries

```text
src/commands ─────┐
src/configurators ├──> src/core ──> src/utils
src/migration ────┘         │
                            └──> pure domain types

src/templates/rules/skills ──> data/content only
src/core -X-> terminal UI, Commander, Inquirer, platform templates
```

Public exports chỉ gồm supported programmatic boundaries được ghi trong `src/index.ts`; consumer không được dựa vào deep imports. Commander/Inquirer nằm ở CLI layer. Filesystem/process/network dependencies được inject ở nơi cần test deterministic.

## 4. Command mapping

| Public command | Upstream basis | Harnix delta |
|---|---|---|
| `harnix init [--migrate] [--dry-run]` | Trellis init/project detector | `.harnix`, no scripts, interactive/CI language choice, legacy preview default, <5s |
| `harnix setup --kiro|--antigravity|--codex [--dry-run] [--json]` | Upstream configurators/templates | Explicit user-global integration, multi-platform invocation, fixed hook command/readiness, no project config/root dependency |
| `harnix update [--global]` | Template hash/fetch/prune | Offline project template reconcile by default; global reconcile uses per-root ownership manifests |
| `harnix upgrade` | Upgrade command | `@tamtiger/harnix`, installed/available versions, injected network/process deps |
| `harnix uninstall [--purge|--global|--legacy-project-surfaces]` | Uninstall scrubbers | Project purge remains separate; global/legacy cleanup preview and confirmation preserve modified/untracked content |
| `harnix mem [query]` | Mem search concepts | Project JSONL/structured journals, Unicode/malformed handling, learning metadata |
| `harnix doctor [--fix] [--global] [--json]` | New + ECC doctor ideas | Doctor JSON v2 projects + global integrations, meaningful exit codes, conservative scoped fix, no network |
| Trellis `workflow` | — | Removed; exactly one Harnix workflow |
| Trellis `channel` | — | Removed completely |

## 5. Project-data mapping

Only the following is valid new-project init output:

```text
.harnix/
  spec/guides/
  config.yaml
  workflow.md
  .template-hashes.json
AGENTS.md                  # bootstrap only when absent
```

Mapping rules:

- `.trellis/` or `.trellis-pro/` is legacy input only; never new output.
- `scripts/`, platform runtime copies, SQLite/global state and hidden generated skills are not created. The root `AGENTS.md` bootstrap is the sole non-`.harnix` init exception; it is not a setup-owned platform surface.
- Tasks/journals are user-owned and their directories are created lazily. `config.yaml` is the sole developer-ID source of truth; new init output has no duplicate `.developer`. Config/spec/workflow begin as managed where applicable and become preserved once modified.
- Project manifest keys are POSIX-normalized repository-relative paths; values include source ID, project scope, hash and generator version. Phase 6 global output uses separate platform-root-relative sidecar manifests and never puts ownership into project data.

## 6. Platform mapping

### Kiro

| Upstream | Harnix |
|---|---|
| Trellis Kiro configurator | User-global `~/.kiro` skills + conditional steering + one JSON-v1 `UserPromptSubmit` context hook invoking installed Harnix runtime |
| `trellis-*` names | `harnix-*` only |
| Runtime Python hooks/scripts | Package executable with bounded arguments/output |
| Generic/all-language steering | Global conditional Harnix-project guard; no setup-cwd language dependence |

### Antigravity

| Upstream | Harnix |
|---|---|
| Upstream Gemini/adjacent ideas | Reimplement two namespaced Antigravity **user-global** plugins; executable preflight dùng `agy` |
| Physical `.gemini` namespace | Desktop `~/.gemini/config/plugins/harnix` and CLI `~/.gemini/antigravity-cli/plugins/harnix`; public identity is Antigravity |
| User Antigravity state | Only Harnix-owned plugin fragments; no unrelated settings, accounts, registry, MCP or credentials |
| Trellis commands/agents | Focused Harnix workflow parity; no mandatory agents |
| Shared runtime scripts | Installed `harnix` executable |

### Codex

| Upstream | Harnix |
|---|---|
| Broad Codex templates/agents/config | Minimal native surfaces verified against current official docs |
| Root `AGENTS.md` overwrite risk | Managed conditional block in `$CODEX_HOME/AGENTS.md` preserving all outside text |
| Platform-specific skill copies | User `$HOME/.agents/skills/harnix-*` with valid frontmatter |
| Python session scripts | One nested `$CODEX_HOME/hooks.json` `UserPromptSubmit` handler invoking hidden installed-runtime context protocol, bounded output and Windows shim smoke |
| Config replacement | No `config.toml` mutation; preserve unrelated global hooks/instructions |
| Mandatory implement/check/research agents | Optional research/independent-review roles; core workflow independent |
| Legacy prompts/commands | Removed; skills are primary |

## 7. ECC content mapping

| ECC source pack | Harnix target | Strategy |
|---|---|---|
| `rules/common/{coding-style,patterns,security,testing,code-review,performance}.md` | `src/rules/common/**` | Condense high-signal principles, MIT attribution |
| `rules/typescript/**` | `src/rules/typescript-nestjs/**` | Adapt TypeScript + add NestJS boundaries |
| `rules/python/**` | `src/rules/python/**` | Adapt; FastAPI-specific material only when detected/relevant |
| `rules/golang/**` | `src/rules/go/**` | Adapt naming and concise content |
| `rules/vue/**` | `src/rules/vue/**` | Adapt |
| `rules/java/**` | `src/rules/java-spring/**` | Adapt + Spring validation/security/transactions/Testcontainers |
| `rules/react/**` | `src/rules/react-web/**` | Adapt; explicitly exclude React Native |
| `rules/csharp/**` | `src/rules/csharp-dotnet-abp/**` | Select useful base, build Harnix-specific ABP guidance |
| Other ECC rules/integrations | — | Remove from package and output |

## 8. Workflow synthesis mapping

### 8.1 Trellis workflow mapping

| Trellis behavior | Harnix state/contract | Adaptation |
|---|---|---|
| Request classification + task consent | `Triage` | Bypass read-only work; explicit mutation request authorizes in-scope implementation, không xin consent tạo task riêng |
| Requirement exploration | `Planning` | Repo evidence first, ask only user-owned decisions, acceptance/non-goals/validation bắt buộc |
| `prd.md`, `design.md`, `implement.md` | Lite `task.json`; Full `prd.md` + `plan.md`; conditional `design.md` | Artifact proportionality, không tạo empty ceremony files |
| `implement.jsonl` + `check.jsonl` | `context.json` scoped by state | Một ranked/budgeted manifest, dedupe và truncation disclosure |
| `task.py start` after second approval | `Ready` gate | Proceed automatically nếu original request đã cho implementation; dừng khi plan-only/checkpoint/blocker |
| Implement/check phase | `Implementing` → `Verifying` | Single-agent capable; compliance trước quality; delegation optional |
| Rollback | `Debugging` / `Replan` | Explicit transitions dựa trên root cause hoặc requirement/architecture defect |
| Spec update | Finishing learning candidate/promotion | Evidence + recurrence hoặc explicit approval; reviewable diff |
| Mandatory commit + auto-commit archive | — | Rejected; finish không mutate Git integration state |
| Continue from status/artifacts | `Continue` | Persisted status + checkpoint + bounded context; corrupt/future state fail closed |

### 8.2 Superpowers behavior mapping

| Source skill | Harnix location | Adaptation |
|---|---|---|
| `brainstorming` | `Triage`/`Planning`/`Ready`, `harnix-brainstorm` | Context-first convergence; approval chỉ khi user requested checkpoint hoặc decision chưa resolved, không universal hard gate |
| `systematic-debugging` | `harnix-debug` | Concise evidence/hypothesis loop, three-failure architecture reset |
| `verification-before-completion` | `harnix-check`, `harnix-finish-work` | Fresh command/exit evidence gate |
| `test-driven-development` | `harnix-implement` | Adaptive meaningful RED–GREEN–REFACTOR, documented exceptions |
| `writing-plans` | Full `harnix-brainstorm`, `plan.md` | File/interface-level decision-complete plan; no placeholder, mandatory commits or execution-mode handoff |
| `executing-plans` | `harnix-implement` | Small verifiable checkpoints and stop/replan rules; no required worktree/subagent |
| Request/receive review | `harnix-check` | Compliance then quality; verify feedback technically, no blind application or mandatory reviewer subagent |
| `finishing-a-development-branch` | `harnix-finish-work` only for verification concept | Branch/merge/push/PR menu rejected; integration remains explicit user-owned action |
| Universal skill invocation/worktree/subagent chain | — | Rejected; one canonical workflow routes focused skills only when state requires them |
## 9. Removal verification

Release scan must prove absence outside allowed research/migration/license contexts:

```text
Trellis Pro
Trellis Forge
@tamtiger/trellis-*
@mindfoldhq/trellis
.trellis/ in new-project output
trellis-* generated skill names
channel/forum/worker/marketplace/dashboard/telemetry surfaces
unsupported configurators
pnpm-workspace.yaml or a second publishable package.json
```

The strings `.trellis` and upstream package names remain allowed only in migration detection/tests, research, attribution and license history.

## 10. Implementation ownership rule

Before porting a source file, implementation must choose one of:

1. Reuse/adapt with AGPL provenance preserved.
2. Reimplement the behavior behind a Harnix interface, recording upstream inspiration.
3. Implement a concise MIT-attributed adaptation for ECC/Superpowers content.
4. Remove it and add an invariant test preventing accidental reintroduction.

No component may enter the package merely because it exists upstream.
