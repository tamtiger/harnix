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

The 2026-08-18 adopted capability boundaries remain in the same dependency direction:

| Harnix-owned module | Basis | Ownership/removal boundary |
|---|---|---|
| `core/context/selection-freshness.ts` | Trellis scoped-context resume semantics, reimplemented | Hash-only sidecar; no watcher, raw source cache or ContextManifest v2 |
| `core/tasks/ready-trace.ts` | Superpowers decision-complete planning discipline, reimplemented | Deterministic bounded parser; no LLM judge or Markdown execution |
| `core/journal/learning-safety.ts` + `promotion.ts` | Trellis/ECC evidence learning, security adaptation | JSON-string review boundary and category-only diagnostics; no auto-promotion/spec rewrite |
| `core/repo-map/graph.ts` + `search.ts` | Repository dependency navigation pattern, Harnix-authored | Safe cached structural graph only; no AST service, embedding, persisted graph or network |
| `core/status.ts` | Trellis/ECC/Spec Kit/BMAD status-resume patterns, clean-room reimplemented | Count-only persisted-state projection; no database, watcher, task prose, model/session state or network |
| `core/tasks/task-index.ts` | Cline local task-history/discovery pattern, clean-room reimplemented | Independently validated bounded records and malformed isolation; no conversation store, fuzzy search, checkpoints or Git restore |
| `core/repo-map/impact.ts` | Aider dependency-graph/on-demand navigation pattern, clean-room reimplemented | Exact cached static-import traversal only; no scan, source snippets, dynamic call graph, embedding or cache migration |
| `core/tasks/task-audit.ts` | Spec Kit analyze + BMAD implementation-readiness pattern, clean-room reimplemented | Exact Harnix ready-trace/freshness states and stable IDs; no heuristic verdict, auto-remediation, command execution or transition |
| `core/tasks/task-resume.ts` | BMAD/Spec Kit/Codex exact persisted-state recovery, clean-room reimplemented | Exact validated unfinished TaskRecord pointer only; no transcript/session store, fuzzy selection, Git restore or workflow transition |
| `core/context/effective-context.ts` | VS Code context transparency concept over Harnix selector, clean-room reimplemented | Shared hidden-hook/report selection with trusted metadata only; no content/raw reason/hash, token accounting, compaction or model context ownership |
| `core/verification/check-report.ts` | Spec Kit/BMAD persisted status/freshness visibility over Harnix snapshots, clean-room reimplemented | Structured categorical causes and safe changed/missing paths; no command execution, evidence rewrite or heuristic remediation |

Public exports chỉ gồm supported programmatic boundaries được ghi trong `src/index.ts`; consumer không được dựa vào deep imports. Commander/Inquirer nằm ở CLI layer. Filesystem/process/network dependencies được inject ở nơi cần test deterministic.

## 4. Command mapping

| Public command | Upstream basis | Harnix delta |
|---|---|---|
| `harnix init [--migrate] [--dry-run]` | Trellis init/project detector | `.harnix`, no scripts, interactive/CI language choice, legacy preview default, <5s |
| `harnix setup --kiro|--antigravity|--codex [--dry-run]` | Upstream configurators/templates | Explicit user-global integration, multi-platform invocation, fixed hook command/readiness, no project config/root dependency; all public output is JSON by default |
| `harnix update [--global]` | Template hash/fetch/prune | Offline project template reconcile by default; global reconcile uses per-root ownership manifests |
| `harnix upgrade` | Upgrade command | `@tamtiger/harnix`, installed/available versions, injected network/process deps |
| `harnix uninstall [--purge|--global|--legacy-project-surfaces]` | Uninstall scrubbers | Project purge remains separate; global/legacy cleanup preview and confirmation preserve modified/untracked content |
| `harnix mem [query]` | Mem search concepts | Project JSONL/structured journals, Unicode/malformed handling, learning metadata; statements remain untrusted review data |
| `harnix status` | Trellis/ECC/Spec Kit/BMAD status-resume-next-step patterns | Nearest initialized project, bounded read-only JSON v1, deterministic progress/freshness/attention/next action; no task prose, writes or network |
| `harnix tasks [--limit] [--status]` | Cline local task history/search plus real malformed-history failures | Bounded exact-state index, per-record validation, active pin and partial-state disclosure; no prompt/history body, fuzzy search or restore |
| `harnix resume <task-id> [--dry-run]` | BMAD existing-story resume, Spec Kit exact run state and Codex exact-ID resume | Activates only an exact validated unfinished local TaskRecord when pointer state permits; preview, collision fail-close and pointer-only atomic write; no transcript/model/Git restore |
| `harnix context-report --platform <id> [--limit]` | VS Code context composition/transparency | Reuses Harnix's actual bounded hook selector and exposes only relative selected/omitted/drift metadata with trusted reason codes; no file content/raw reason/hash/write/network |
| `harnix checks [--limit]` | Spec Kit/BMAD persisted workflow/status semantics | Reuses Harnix immutable verification snapshots to explain fresh/stale/failed/pending and bounded changed/missing inputs; no validation execution or state mutation |
| `harnix audit` | Spec Kit analyze and BMAD implementation-readiness checks | Separate deterministic readiness/completion projection using Harnix's exact gates; visibility only, no check execution, mutation or heuristic blocking |
| `harnix repo-map --query|--impact` | Aider repository-map and on-demand dependency navigation | Cache-only lexical candidate search or exact directional dependency impact; no source scan/snippet, embeddings or dynamic-call claim |
| `harnix doctor [--fix] [--global]` | New + ECC doctor ideas | Doctor JSON v2 projects + global integrations, redacted suspicious-learning categories, meaningful exit codes, conservative scoped fix, no network/journal rewrite |
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
| Physical `.gemini` namespace | Desktop `~/.gemini/config/plugins/harnix` and CLI `~/.gemini/antigravity-cli/plugins/harnix`; each uses always-on `rules/AGENTS.md` without frontmatter; public identity is Antigravity |
| User Antigravity state | Only Harnix-owned plugin fragments; no unrelated settings, accounts, registry, MCP or credentials |
| Trellis commands/agents | Focused Harnix workflow parity; no mandatory agents |
| Shared runtime scripts | Installed `harnix` executable |

### Codex

| Upstream | Harnix |
|---|---|
| Broad Codex templates/agents/config | Minimal native surfaces verified against current official docs |
| Root `AGENTS.md` overwrite risk | Managed conditional block in `$CODEX_HOME/AGENTS.md` preserving all outside text |
| Platform-specific skill copies | User `$HOME/.agents/skills/harnix-*` with valid frontmatter |
| Python session scripts | One inline `$CODEX_HOME/config.toml` `UserPromptSubmit` handler invoking hidden installed-runtime context protocol, bounded output and Windows shim smoke |
| Config replacement | Managed TOML block in `config.toml`; preserve unrelated settings/hooks and migrate unchanged legacy `hooks.json` content |
| Mandatory implement/check/research agents | Optional research/independent-review roles; core workflow independent |
| Legacy prompts/commands | Removed; skills are primary |

## 7. ECC content mapping

| ECC source pack | Harnix target | Strategy |
|---|---|---|
| `rules/common/{coding-style,patterns,security,testing,code-review,performance}.md` | `src/rules/common/**` | Condense high-signal principles, MIT attribution |
| `rules/typescript/**` | `src/guides/languages/typescript/**`, `src/guides/technologies/framework/nestjs/**` | Separate TypeScript from NestJS boundaries |
| `rules/python/**` | `src/guides/languages/python/**` | Adapt; framework material only when independently detected/relevant |
| `rules/golang/**` | `src/guides/languages/go/**` | Adapt naming and concise content |
| `rules/vue/**` | `src/guides/technologies/framework/vue/**` | Adapt as technology guidance |
| `rules/java/**` | `src/guides/languages/java/**`, `src/guides/technologies/framework/spring/**` | Separate Java from Spring validation/security/transactions |
| `rules/react/**` | `src/guides/technologies/library/react-web/**` | Adapt; explicitly exclude React Native |
| `rules/csharp/**` | `src/guides/languages/csharp/**`, `src/guides/technologies/{runtime/dotnet,framework/abp}/**` | Separate C#, .NET and Harnix-specific ABP guidance |
| Other ECC rules/integrations | — | Remove from package and output |

## 8. Workflow synthesis mapping

Stack/catalog architecture uses only researched patterns rather than vendored runtime code: GitHub Linguist informs source-language separation and generated/vendor exclusions; Vercel and Netlify inform declarative positive/negative detector relations; ECC informs evidence-backed minimal mapping; Awesome Copilot/Cursor catalogs inform guide metadata and activation. Harnix owns the typed IDs, confidence thresholds, migration contract, validator, selectors and content. No external guide text enters the package without a separately frozen revision/license/adaptation mapping.

### 8.1 Trellis workflow mapping

| Trellis behavior | Harnix state/contract | Adaptation |
|---|---|---|
| Request classification + task consent | `Triage` | Bypass read-only work; explicit mutation request authorizes in-scope implementation, không xin consent tạo task riêng |
| Requirement exploration | `Planning` | Repo evidence first, ask only user-owned decisions, acceptance/non-goals/validation bắt buộc |
| `prd.md`, `design.md`, `implement.md` | Lite `task.json`; Full `prd.md` + `plan.md`; conditional `design.md` | Artifact proportionality, không tạo empty ceremony files |
| `implement.jsonl` + `check.jsonl` | `context.json` scoped by state + `context-selection.json` | Một ranked/budgeted manifest, dedupe/truncation disclosure và hash-only selection-basis freshness |
| `task.py start` after second approval | `Ready` gate + ready trace v1 | Deterministic criterion/slice/check/path audit; proceed automatically nếu original request đã cho implementation; dừng khi plan-only/checkpoint/blocker |
| Implement/check phase | `Implementing` → `Verifying` | Single-agent capable; compliance trước quality; delegation optional |
| Rollback | `Debugging` / `Replan` | Explicit transitions dựa trên root cause hoặc requirement/architecture defect |
| Spec update | Finishing learning candidate/promotion | Evidence + recurrence hoặc explicit approval; JSON-string untrusted boundary, redacted categories và reviewable diff |
| Mandatory commit + auto-commit archive | — | Rejected; finish không mutate Git integration state |
| Continue from status/artifacts | `Continue` | Persisted status + checkpoint + bounded context; content hoặc selection-basis `contextDrift: stale` persist `replan` trước reselection; corrupt/future state fail closed |

### 8.2 Superpowers behavior mapping

| Source skill | Harnix location | Adaptation |
|---|---|---|
| `brainstorming` | `Triage`/`Planning`/`Ready`, `harnix-brainstorm` | Context-first convergence; approval chỉ khi user requested checkpoint hoặc decision chưa resolved, không universal hard gate |
| `systematic-debugging` | `harnix-debug` | Concise evidence/hypothesis loop, three-failure architecture reset |
| `verification-before-completion` | `harnix-check`, `harnix-finish-work` | Fresh command/exit evidence + TaskRecord v2 criterion/check intersection + canonical input snapshot recomputed ở save/finish |
| `test-driven-development` | `harnix-implement` | Adaptive meaningful RED–GREEN–REFACTOR, documented exceptions |
| `writing-plans` | Full `harnix-brainstorm`, `plan.md` | File/interface-level decision-complete plan; no placeholder, mandatory commits or execution-mode handoff |
| `executing-plans` | `harnix-implement` | Small verifiable checkpoints and stop/replan rules; no required worktree/subagent |
| Request/receive review | `harnix-check` | Compliance then quality; verify feedback technically, no blind application or mandatory reviewer subagent |
| `finishing-a-development-branch` | `harnix-finish-work` only for verification concept | Branch/merge/push/PR menu rejected; integration remains explicit user-owned action |
| Universal skill invocation/worktree/subagent chain | — | Rejected; one canonical workflow routes focused skills only when state requires them |

Bảy adaptation được lưu dưới dạng source thật tại `src/skills/harnix-*/SKILL.md`, mỗi source có semantic `metadata.version` đồng bộ package release. `workflow.ts` không giữ một bản prose thứ hai; build nhúng source Markdown và cả ba platform cài cùng byte content. `harnix-brainstorm` bổ sung decision inventory, contract/placeholder/consistency self-review; `harnix-implement` bổ sung critical plan review và observed RED; `harnix-check` map claim sang fresh output/exit; debug/research/continue/finish giữ các stop/persistence rule tương ứng nhưng tiếp tục loại universal approval, worktree, subagent, commit, branch và PR behavior.

### 8.3 Harnix self-audit ownership mapping

| Capability | Origin/evidence | Harnix location | Ownership decision |
|---|---|---|---|
| Target-root authority trước ambient context (`HX-TARGET-01`) | `harnix-self-audit`; task `20260826-165933-codex-harnix-runtime-audit`, finding `F-CUR-02`, mechanism `M04` | `src/templates/harnix/activation.ts`, project/global templates, bảy `src/skills/harnix-*/SKILL.md`, structured target scenario/ambient-canary tests | Harnix-owned instruction contract; explicit target được validate trước ancestor lookup, hook-injected context không cấp authority; không có external source, không thêm external provenance registry entry và không đổi `NOTICE` |
| Active TaskRecord snapshot self-exclusion | `harnix-self-audit`; cùng task, verification replan ngày 2026-08-27 | `src/core/verification/input-freshness.ts`, unit + hidden-workflow regression tests, TaskRecord v2 docs/templates | Harnix-owned correctness repair; omit exact active `task.json` raw entry vì `@task-contract` đã bind, vẫn raw-hash other tasks và giữ sidecar v1; không thêm external provenance/attribution |

Mapping này tách self-observed product correction khỏi external-derived capability. Nếu implementation tương lai lấy behavior, code hoặc content từ harness ngoài, mục 10 bắt buộc supersede ownership decision này bằng registry/source/ref/license/evidence đầy đủ trước completion.

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

Mọi maintained feature dùng behavior, code hoặc content từ external harness phải đồng thời thêm/cập nhật một stable entry trong `docs/HARNESS_FEATURE_PROVENANCE.json`. Entry ghi `adopt|adapt`, lifecycle, từng source repository/HTTPS URL/immutable 40-hex ref/source date/license/evidence URL, Harnix adaptation delta và sorted concrete existing `code`/`tests`/`docs` paths. `test/workflow/provenance.test.ts` pin feature-ID set, exact allowlists, sort/uniqueness, safe path và path existence; canonical research/mapping cùng expected-ID regression phải đổi trong cùng task trước completion.

Behavioral reference không đồng nghĩa copied code. Chỉ cập nhật `NOTICE` hoặc source header khi reuse/adaptation thực tế tạo nghĩa vụ license; clean-room evidence vẫn được ghi trong registry để provenance dễ nhận biết mà không overclaim nguồn sở hữu implementation.
