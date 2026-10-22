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
| Configurator registry 24 platform | `src/core/platform/registry.ts` + `src/configurators/` | `reuse/adapt` | Registry đóng chỉ Kiro, Antigravity, Codex, Claude Code, OpenCode và Cursor |
| `commands/{update,upgrade,uninstall,mem}.ts` | Cùng command names dưới `src/commands` | `reuse/adapt` | Semantics ownership, injection và safety mới |
| — | `src/commands/setup.ts` | `build new` | Multi-flag platform setup tách khỏi init |
| — | `src/commands/doctor.ts` | `build new` | Local deterministic diagnostics/fix |
| `utils/atomic-write.ts` | `src/utils/atomic-write.ts` | `reuse/adapt` | Temp sibling + atomic replace + cleanup/rollback tests |
| `utils/template-hash.ts` | `src/utils/hashing.ts`, `src/core/managed/project-files.ts` | `reuse/adapt` | Versioned entry metadata, normalized relative paths, ownership states |
| `utils/file-writer.ts`, `manifest-prune.ts` | `src/core/managed/project-files.ts`, `src/core/managed/decision.ts` | `reuse/adapt` | Preserve unknown/user files; explicit deleted/obsolete states |
| `utils/project-detector.ts` | `src/core/stack/detection.ts` | `reuse/adapt` | .NET/ABP, NestJS, Python, Java/Spring, Go, React, Vue + ignored dirs |
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
| ~~`core/tasks/ready-trace.ts`~~ (removed in TaskRecord v3) | Superpowers decision-complete planning discipline, reimplemented | Retired: Full ready now only needs non-empty free-form prd/plan with a checklist item (`workflow-helpers.ts`) |
| `core/journal/learning-safety.ts` + `promotion.ts` | Trellis/ECC evidence learning, security adaptation | JSON-string review boundary and category-only diagnostics; no auto-promotion/spec rewrite |
| `core/repo-map/graph.ts` + `search.ts` | Repository dependency navigation pattern, Harnix-authored | Safe cached structural graph only; no AST service, embedding, persisted graph or network |
| `core/status.ts` | Trellis/ECC/Spec Kit/BMAD status-resume patterns, clean-room reimplemented | Count-only persisted-state projection; no database, watcher, task prose, model/session state or network |
| `core/tasks/task-index.ts` | Cline local task-history/discovery pattern, clean-room reimplemented | Independently validated bounded records and malformed isolation; no conversation store, fuzzy search, checkpoints or Git restore |
| `core/repo-map/impact.ts` | Aider dependency-graph/on-demand navigation pattern, clean-room reimplemented | Exact cached static-import traversal only; no scan, source snippets, dynamic call graph, embedding or cache migration |
| `core/tasks/task-audit.ts` | Spec Kit analyze + BMAD implementation-readiness pattern, clean-room reimplemented | Exact Harnix ready-trace/freshness states and stable IDs; no heuristic verdict, auto-remediation, command execution or transition |
| `core/tasks/task-resume.ts` | BMAD/Spec Kit/Codex exact persisted-state recovery, clean-room reimplemented | Exact validated unfinished TaskRecord pointer only; no transcript/session store, fuzzy selection, Git restore or workflow transition |
| `core/context/effective-context.ts` | VS Code context transparency concept over Harnix selector, clean-room reimplemented | Shared hidden-hook/report selection with trusted metadata only; no content/raw reason/hash, token accounting, compaction or model context ownership |
| `core/verification/check-report.ts` | Spec Kit/BMAD persisted status/freshness visibility over Harnix snapshots, clean-room reimplemented | Structured categorical causes and safe changed/missing paths; no command execution, evidence rewrite or heuristic remediation |
| `core/repo-map/outline.ts` + `refs.ts` | Serena (`oraios/serena`) symbol-first navigation concepts (`get_symbols_overview`, `find_symbol`, `find_referencing_symbols`), clean-room reimplemented | On-demand file symbol outline with `startLine`/`endLine` and bounded dependency-scoped symbol reference lookup; no LSP daemon, MCP server, Python runtime or cache schema change |

Public exports chỉ gồm supported programmatic boundaries được ghi trong `src/index.ts`; consumer không được dựa vào deep imports. Commander/Inquirer nằm ở CLI layer. Filesystem/process/network dependencies được inject ở nơi cần test deterministic.

## 4. Command mapping

| Public command | Upstream basis | Harnix delta |
|---|---|---|
| `harnix init [--migrate] [--dry-run]` | Trellis init/project detector | `.harnix`, no scripts, interactive/CI language choice, legacy preview default, <5s |
| `harnix setup --kiro\|--antigravity\|--codex\|--claude\|--opencode\|--cursor [--dry-run]` | Upstream configurators/templates | Explicit user-global integration, multi-platform invocation, fixed hook command/readiness, no project config/root dependency; all public output is JSON by default |
| `harnix update [--global]` | Template hash/fetch/prune | Offline project template reconcile by default; global reconcile uses per-root ownership manifests |
| `harnix upgrade` | Upgrade command | `@tamtiger/harnix`, installed/available versions, injected network/process deps |
| `harnix uninstall [--purge\|--global\|--legacy-project-surfaces]` | Uninstall scrubbers | Project purge remains separate; global/legacy cleanup preview and confirmation preserve modified/untracked content |
| `harnix mem [query]` | Mem search concepts | Project JSONL/structured journals, Unicode/malformed handling, learning metadata; statements remain untrusted review data |
| `harnix status [--explain]` | Trellis/ECC/Spec Kit/BMAD status-resume-next-step patterns | Nearest initialized project, bounded read-only JSON v1, deterministic progress/freshness/attention/next action; `--explain` gộp `checks` và `audit` cũ để chiếu readiness và digest freshness; no task prose, writes or network |
| `harnix tasks [--limit] [--status]` | Cline local task history/search plus real malformed-history failures | Bounded exact-state index, per-record validation, active pin and partial-state disclosure; no prompt/history body, fuzzy search or restore |
| `harnix pause [--dry-run]` | New in Harnix (v1.1.22) | Tạm dừng task đang active, gỡ `.active` an toàn để chuyển sang task khác |
| `harnix resume <task-id> [--dry-run]` | BMAD existing-story resume, Spec Kit exact run state and Codex exact-ID resume | Activates only an exact validated unfinished local TaskRecord when pointer state permits; preview, collision fail-close and pointer-only atomic write; no transcript/model/Git restore |
| `harnix epic [<epic-id>] [--limit]` | New in Harnix v2.0.0 (D8) | Quản lý epic (*.json và derived *.md), thay thế hoàn toàn `harnix roadmap` cũ đã gỡ bỏ |
| `harnix verify-plan` | New in Harnix v2.0.0 (D6) | Tự động phát hiện deterministic lệnh verify cho ≥ 8 hệ sinh thái và monorepo |
| `harnix context-report --platform <id> [--limit]` | VS Code context composition/transparency | Reuses Harnix's actual bounded hook selector and exposes only relative selected/omitted/drift metadata with trusted reason codes; no file content/raw reason/hash/write/network |
| ~~`harnix checks`~~ / ~~`harnix audit`~~ | Spec Kit/BMAD persisted workflow/status semantics | Retired/removed in v2.0.0: gộp vào `harnix status --explain` để giảm overhead |
| `harnix repo-map --query\|--impact\|--tests\|--outline\|--refs` | Aider repository-map + Serena symbolic navigation | Cache-only lexical candidate search, exact directional dependency impact, test-impact navigation (`--tests`), on-demand file symbol outline (`--outline <path> [--symbol <name>]`) và bounded reference lookup (`--refs <symbol> [--path <path>]`); no LSP daemon, embeddings or cache schema mutation |
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

### Claude Code

| Upstream | Harnix |
|---|---|
| ECC / Trellis Claude Code | User-global `~/.claude` skills + marker block in `CLAUDE.md` + one owned `harnix-context` hook inside `UserPromptSubmit` in `settings.json` |
| Native `projects/`, `todos/`, `history` | Ignored. Harnix uses `.harnix/` independent state. |
| Trellis MCP | No default MCP server required. |

### OpenCode

| Upstream | Harnix |
|---|---|
| OpenCode community / CLI | User-global `~/.config/opencode/skills/harnix-*` + marker block trong `~/.config/opencode/AGENTS.md` (chế độ không hook shell) |
| Shared root with tool | `preserveUnownedRoot: false`, bảo tồn mọi cấu hình và nội dung người dùng ngoài marker block |

### Cursor

| Upstream | Harnix |
|---|---|
| Cursor IDE / User Rules | User-global `~/.cursor/skills/harnix-*` (chế độ không hook shell, không tạo global instruction file vì User Rules quản lý qua UI) |
| Shared root with tool | `preserveUnownedRoot: false`, chỉ quản lý các skill `harnix-*` được cài đặt |

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
| `task.py start` after second approval | `Ready` gate (v3: non-empty prd/plan + plan checklist item) | Deterministic gate without trace grammar; proceed automatically nếu original request đã cho implementation; dừng khi plan-only/checkpoint/blocker |
| Implement/check phase | `Implementing` → `Verifying` | Single-agent capable; compliance trước quality; delegation optional |
| Rollback | `Debugging` / `Replan` | Explicit transitions dựa trên root cause hoặc requirement/architecture defect |
| Spec update | Finishing learning candidate/promotion | Evidence + recurrence hoặc explicit approval; JSON-string untrusted boundary, redacted categories và reviewable diff |
| Mandatory commit + auto-commit archive | — | Rejected; finish không mutate Git integration state |
| Continue from status/artifacts | `Continue` | Persisted status + checkpoint + bounded context; content hoặc selection-basis `contextDrift: stale` persist `replan` trước reselection; corrupt/future state fail closed |

### 8.2 Superpowers behavior mapping

| Source skill | Harnix location | Adaptation |
|---|---|---|
| `brainstorming` | `Triage`/`Planning`/`Ready`, `harnix-plan` | Context-first convergence; approval chỉ khi user requested checkpoint hoặc decision chưa resolved, không universal hard gate |
| `systematic-debugging` | `harnix-debug` | Concise evidence/hypothesis loop, three-failure architecture reset |
| `verification-before-completion` | `harnix-verify` | Fresh command/exit evidence + TaskRecord v2 criterion/check intersection + canonical input snapshot recomputed ở save/finish |
| `test-driven-development` | `harnix-implement` | Adaptive meaningful RED–GREEN–REFACTOR, documented exceptions |
| `writing-plans` | Full `harnix-plan`, `plan.md` | File/interface-level decision-complete plan; no placeholder, mandatory commits or execution-mode handoff |
| `executing-plans` | `harnix-implement` | Small verifiable checkpoints and stop/replan rules; no required worktree/subagent |
| Request/receive review | `harnix-verify`, `harnix-review` | Compliance then quality; verify feedback technically, no blind application or mandatory reviewer subagent |
| `finishing-a-development-branch` | `harnix-verify` only for verification concept | Branch/merge/push/PR menu rejected; integration remains explicit user-owned action |
| Universal skill invocation/worktree/subagent chain | — | Rejected; one canonical workflow routes focused skills only when state requires them |

Các adaptation được lưu dưới dạng source thật tại `src/skills/harnix-*/SKILL.md`, mỗi source có semantic `metadata.version` đồng bộ package release. `workflow.ts` không giữ một bản prose thứ hai; build nhúng source Markdown và cả ba platform cài cùng byte content. `harnix-plan` bổ sung decision inventory, contract/placeholder/consistency self-review; `harnix-implement` bổ sung critical plan review và observed RED; `harnix-verify` map claim sang fresh output/exit và gộp finish/cancellation; debug/review/research giữ các stop/persistence rule tương ứng nhưng tiếp tục loại universal approval, worktree, subagent, commit, branch và PR behavior.

### 8.3 Harnix self-audit ownership mapping

| Capability | Origin/evidence | Harnix location | Ownership decision |
|---|---|---|---|
| Target-root authority trước ambient context (`HX-TARGET-01`) | `harnix-self-audit`; task `20260826-165933-codex-harnix-runtime-audit`, finding `F-CUR-02`, mechanism `M04` | `src/templates/harnix/activation.ts`, project/global templates, bảy `src/skills/harnix-*/SKILL.md`, structured target scenario/ambient-canary tests | Harnix-owned instruction contract; explicit target được validate trước ancestor lookup, hook-injected context không cấp authority; không có external source, không thêm external provenance registry entry và không đổi `NOTICE` |
| Active workflow snapshot self-exclusion | `harnix-self-audit`; cùng task, verification replan ngày 2026-08-27 | `src/core/verification/input-digest.ts` (TaskRecord v3; the former `input-freshness.ts` sidecar module was removed), unit + hidden-workflow regression tests | Harnix-owned correctness repair; omit exact active `task.json`, `review.md` và legacy `verification-inputs.json` raw entries để evidence không tự đổi input digest, vẫn raw-hash matching records của other tasks; không có sidecar; không thêm external provenance/attribution |
| Standalone read-only research routing | `harnix-self-audit`; task `20260828-110352-standalone-research-route` | `src/core/workflow/routing.ts`, canonical `harnix-research`, project/global templates và routing/parity regressions | Harnix-owned consistency repair; standalone research là Bypass không consult/mutate active task, task-scoped research giữ Planning/Replan/Debugging artifact contract; không thêm external provenance/attribution |

Mapping này tách self-observed product correction khỏi external-derived capability. Nếu implementation tương lai lấy behavior, code hoặc content từ harness ngoài, mục 10 bắt buộc supersede ownership decision này bằng registry/source/ref/license/evidence đầy đủ trước completion.

### 8.4 Upstream skill libraries mapping (addyosmani/agent-skills & mattpocock/skills)

Khảo sát ngày 2026-10-14 trên hai kho kỹ năng `addyosmani/agent-skills` (25 skills) và `mattpocock/skills` (39 skills). Phân tích chi tiết các mẫu hình được tái sử dụng / thích nghi (Reuse/Adapt) và các mẫu hình bị loại bỏ dứt khoát (Explicitly Rejected):

#### 8.4.1 Các pattern Reuse / Adapt

| Pattern nguồn | Xuất xứ upstream | Harnix target skill | Phân loại | Nội dung thích nghi vào Harnix |
|---|---|---|---|---|
| `grilling` | addyosmani/agent-skills (`grilling`) | `harnix-plan` | `reuse/adapt` | Kỹ thuật chất vấn sâu về yêu cầu và giả định ngầm trong giai đoạn planning; bóc tách edge case và ép làm rõ acceptance criteria trước khi chuyển `ready`. |
| `rationalizations` | addyosmani/agent-skills (`verification-rationalizations`) | `harnix-verify` | `reuse/adapt` | Danh mục nhận diện các lý do biện minh né tránh kiểm thử (ví dụ: "chỉ là đổi nhỏ", "test chạy trên máy tôi rồi", "code trông hiển nhiên đúng"); bắt buộc bằng chứng exit code 0 thực tế và digest khớp. |
| `feedback-loop` | addyosmani/agent-skills (`debugging-feedback-loop`) | `harnix-debug` | `reuse/adapt` | Vòng lặp phản hồi chặt chẽ trong debug: tái lập lỗi -> một giả thuyết -> sửa tối thiểu -> regression test -> xác nhận lại; không phỏng đoán hay thử nghiệm lan man. |
| `standards vs spec` | addyosmani/agent-skills (`code-review-standards`) | `harnix-review` | `reuse/adapt` | Phân định rạch ròi giữa vi phạm chuẩn mực chung của dự án (standards - style, lint, kiến trúc) và vi phạm đặc tả chức năng của task (spec - logic, hợp đồng API, edge cases) khi review. |
| `adversarial` | mattpocock/skills (`adversarial-testing`) | `harnix-verification-gap` | `reuse/adapt` | Tư duy kiểm thử đối nghịch: chủ động đóng vai kẻ tấn công hoặc tìm các đầu vào biên ác ý để phá vỡ giải pháp trước khi công nhận pass. |
| `moving goalposts` | mattpocock/skills (`testing-antipatterns`) | `harnix-verification-gap` | `reuse/adapt` | Ngăn chặn hiện tượng dịch chuyển tiêu chí kiểm thử hoặc nới lỏng/xóa assertion trong test suite khi gặp thất bại; bảo đảm tiêu chí nghiệm thu được giữ vững. |
| `Chesterton's Fence` | mattpocock/skills (`code-simplification`) | `harnix-review` | `reuse/adapt` | Nguyên tắc bảo toàn: không đơn giản hóa, tái cấu trúc hoặc xóa một đoạn code / ràng buộc có vẻ rườm rà nếu chưa hiểu rõ và chứng minh được lý do nó được đặt ra ban đầu. |
| `Forced Mutation` | mattpocock/skills (`diagnosing-bugs`) | `harnix-debug` | `reuse/adapt` | Chủ động tạo đột biến mã (làm hỏng logic có chủ đích) để chứng minh rằng test suite hoặc câu lệnh kiểm chứng thực sự phát hiện được lỗi và không rơi vào tình trạng false-pass. |
| `Smell Baseline` | addyosmani/agent-skills (`code-review`) | `harnix-review` | `reuse/adapt` | Thiết lập baseline code smell hiện hữu của dự án trước khi review diff, tránh việc bắt lỗi oan hoặc sa đà vào các tồn dư kỹ thuật có sẵn ngoài phạm vi thay đổi. |

### 8.5 Upstream craft & client libraries mapping (ai-native-client & ak-quick-setup)

Khảo sát ngày 2026-10-15 trên hai kho tài nguyên `frt-public-projects/ai-native-client` (Apache-2.0) và `ak-quick-setup` (AgentKit, MIT):

#### 8.5.1 Các pattern Reuse / Adapt
| Pattern nguồn | Xuất xứ upstream | Harnix target | Phân loại | Nội dung thích nghi vào Harnix |
|---|---|---|---|---|
| `decision-discipline` (5 quy tắc thẩm định) | ak-quick-setup (`review-audit-self-decision.md`) | `harnix-plan`, `harnix-review`, `harnix-security-lens` | `reuse/adapt` | Bổ sung reference `decision-discipline.md`: bảo vệ quyết định đã kiểm chứng, bảo vệ quyết định người dùng, đánh giá rủi ro thực tế (Threat Model), thám hiểm trước khi hỏi (Scout First) và giữ sạch codebase. |
| `sequential-thinking` | ak-quick-setup (`ak-sequential-thinking`) | `src/skills/harnix-sequential-thinking` | `adapt` | Xây dựng technique skill thứ 6 thuần markdown, frontmatter chuẩn Harnix, loại bỏ script ngoài, hỗ trợ suy luận nhiều bước với REVISION, BRANCH và HYPOTHESIS. |
| `scouting-isolation` & Status Protocol | ak-quick-setup (`orchestration-protocol.md`) | `harnix-research` | `adapt` | Chuẩn hóa giao thức điều phối subagent và cô lập ngữ cảnh khi thám hiểm code: truyền context tối thiểu và bắt buộc báo cáo 4 trạng thái chuẩn (`DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`). |
| `brownfield` navigation | ai-native-client (`dev-brownfield-navigation`) | `harnix-implement` | `adapt` | Kỷ luật chỉnh sửa code cũ: tôn trọng convention tại chỗ, cô lập thay đổi tối thiểu, không tiện tay đổi kiến trúc dự án khi chưa yêu cầu. |
| `commit-hygiene` | ai-native-client (`dev-commit-mr-hygiene`) | `harnix-implement` | `adapt` | Kỷ luật chuẩn bị commit/MR: giải thích lý do, gắn kết diff thực tế với mục tiêu task, review scope cẩn thận trước khi xin phê duyệt. |
| `so-what` impact review | ak-quick-setup (`ak-sowat`) | `harnix-verify`, `harnix-plan` | `adapt` | Đánh giá tác động thực chất theo góc nhìn sản phẩm, loại bỏ việc râu ria, bảo đảm giá trị mang lại rõ ràng. |
| `technical-recap` | ak-quick-setup (`ak-sumup`) | `harnix-verify` | `adapt` | Mẫu báo cáo hoàn thành cô đọng: kết quả đạt được, sự cố & cách khắc phục, quyết định kiến trúc và sơ đồ flow. |
| `link-validation` & `trigger-eval` | ai-native-client (`scripts/`) | Test suite & scripts | `adapt` | Tích hợp kiểm định markdown link tự động và harness đo độ phân biệt trigger TF-IDF + Cosine similarity stdlib. |
| `ui-ux` & `web-testing` | ak-quick-setup | `src/guides/topics/` | `adapt` | 2 Topic Guides mới tuân thủ đúng 3 đề mục (Verify, Constraints, Common mistakes) và trần <= 600 tokens. |
| `arch-review` & Enterprise Practices | Backend Harness Practices (`04. Backend`) | `src/skills/harnix-arch-review/`, `src/guides/technologies/`, `harnix-migration-safety` | `adapt` | Technique skill 7 `harnix-arch-review` (10 domain briefs, WBS Core MAX + BFF dedup), làm giàu 6 backend guides và quy chuẩn expand-contract application DB rollback. |

#### 8.5.2 Các pattern Explicitly Rejected
1. **Silent Network Sync & MCP Auto-pull**: `tools/rai-client-sync-mcp/` và session hook tự động fetch/pull remote vi phạm nguyên tắc Lean & Offline-first của Harnix. Harnix dùng lệnh CLI tường minh `harnix update`.
2. **Proprietary Token Handling**: `auto-refresh-token.kiro.hook` và token Keycloak/GitLab là hạ tầng riêng của doanh nghiệp, không thuộc phạm vi harness mã nguồn mở.
3. **Mandatory Subagent Personas**: Cấm mandatory subagents và persona switching cồng kềnh; giữ nguyên mô hình single-agent kiêm nhiệm, chỉ kích hoạt protocol khi nền tảng hỗ trợ.
4. **Autonomous Git Worktree**: Tự động tạo worktree vi phạm Rule 6 của Harnix.

### 8.6 Symbolic code navigation mapping (oraios/serena)

Khảo sát ngày 2026-10-16 trên `oraios/serena` (`d9e4c796fae0207ba6848d1df4b331122a5567b5`, GPL-3.0-or-later):

| Khái niệm nguồn | Xuất xứ upstream | Harnix target | Phân loại | Nội dung thích nghi clean-room & ranh giới loại bỏ |
|---|---|---|---|---|
| `get_symbols_overview` + `find_symbol` | `oraios/serena` | `src/core/repo-map/outline.ts`, `harnix repo-map --outline <path> [--symbol <name>]` | `adapt` | Trích xuất on-demand danh sách symbol trong 1 file (`name`, `kind`, `exported`, `startLine`, `endLine`, `signature`, `container`) kèm bộ lọc `--symbol` và lọc secret; viết mới 100% bằng TypeScript thuần, không đổi schema `RepoMapV1`. |
| `find_referencing_symbols` | `oraios/serena` | `src/core/repo-map/refs.ts`, `harnix repo-map --refs <symbol> [--path <path>]` | `adapt` | Tra cứu tham chiếu symbol (`declaration`, `import`, `reference`) ưu tiên theo `identifiers` trong `RepoMapV1` và thu hẹp theo đồ thị phụ thuộc (`buildRepoMapGraph` + `findAffectedTests`) khi có `--path`. |
| MCP server / background daemon / `solidlsp` | `oraios/serena` | — | `remove` | Từ chối hoàn toàn daemon chạy nền, MCP server, Python runtime (`uvx`) và language server processes. |
| `.serena/` memories & symbol-body edit tools | `oraios/serena` | — | `remove` | Từ chối `.serena/memories/` (Harnix đã có `.harnix/` + `harnix learning`) và `replace_symbol_body` / `insert_after_symbol` (nhường cho native edit tools của IDE/agent). |

#### 8.4.2 Bảy pattern Explicitly Rejected kèm lý do kiến trúc

Harnix kiên định giữ vững các nguyên tắc cốt lõi (lean, deterministic, single-agent first, user-in-control, zero runtime network, clean consumer workspace). 7 mẫu hình sau đây từ các upstream bị từ chối đưa vào Harnix:

1. **Mandatory Subagents Network** (Mạng lưới subagent bắt buộc):
   - *Upstream*: Yêu cầu điều phối qua mạng lưới nhiều subagent độc lập (planner agent, reviewer agent, tester agent, researcher agent) với giao thức trao đổi phức tạp.
   - *Lý do loại bỏ*: Vi phạm ranh giới kiến trúc Harnix. Harnix thiết kế theo mô hình single-agent first với state machine xác định, các skill tập trung theo stage, không bắt buộc đa tác nhân cồng kềnh, giảm thiểu chi phí token và tránh mất đồng bộ trạng thái.

2. **Autonomous Git/PR** (Tự động thao tác Git / tạo Pull Request):
   - *Upstream*: Tự động git add, git commit, tạo branch, push lên remote và mở Pull Request sau khi hoàn thành task.
   - *Lý do loại bỏ*: Vi phạm trực tiếp Harnix Rule 6 (Commit discipline). Mọi hành động làm thay đổi lịch sử Git, nhánh hoặc remote bắt buộc phải hiển thị diff rõ ràng và chờ người dùng phê duyệt tường minh; tuyệt đối không tự ý commit hay tạo PR.

3. **External Issue Trackers** (Tích hợp hệ thống quản lý issue ngoại vi):
   - *Upstream*: Tự động sync hoặc tạo ticket trên GitHub Issues, Jira, Linear.
   - *Lý do loại bỏ*: Harnix cam kết nguyên tắc bảo mật và hoạt động offline (zero runtime network, không phụ thuộc SaaS bên ngoài). Toàn bộ dữ liệu công việc được lưu trữ cục bộ, minh bạch và an toàn trong `.harnix/` của chính repository.

4. **Root Directory Artifacts (GLOSSARY/ADR)** (Rải rác artifacts ở thư mục gốc):
   - *Upstream*: Tự động tạo các file như `GLOSSARY.md`, `ADR-001.md`, `ARCHITECTURE.md` trực tiếp tại thư mục gốc repository.
   - *Lý do loại bỏ*: Tránh làm ô nhiễm không gian làm việc của người dùng. Mọi tài liệu kỹ thuật, hướng dẫn và quyết định kiến trúc trong Harnix được tổ chức chuẩn hóa và tập trung trong `.harnix/spec/` và `.harnix/tasks/<task-id>/`.

5. **Consumer Shell Scripts** (Sao chép shell scripts vào repository người dùng):
   - *Upstream*: Sao chép các script shell (.sh, .bat, .ps1, .py) vào thư mục dự án để hỗ trợ chạy tác vụ.
   - *Lý do loại bỏ*: Vi phạm ranh giới đóng gói của Harnix. Mã runtime của Harnix chỉ tồn tại duy nhất trong npm package cài đặt (`@tamtiger/harnix`), không xả rác các file thực thi không quản lý vào repository người dùng.

6. **OS Temp Handoff (/tmp)** (Truyền nhận dữ liệu qua thư mục tạm hệ điều hành):
   - *Upstream*: Ghi file tạm, context snapshot hoặc IPC qua `/tmp` hoặc thư mục Temp của hệ điều hành.
   - *Lý do loại bỏ*: Tiềm ẩn rủi ro bảo mật (symlink attack, xung đột quyền truy cập giữa các user) và phá vỡ tính tương thích đa nền tảng (đặc biệt là Windows). Harnix yêu cầu mọi thao tác atomic write, staging và snapshot phải thực hiện ngay trong ranh giới workspace được bảo vệ.

7. **Parallel Multi-Hypotheses** (Điều tra song song nhiều giả thuyết):
   - *Upstream*: Sinh đồng thời nhiều giả thuyết song song và áp dụng đồng loạt các bản sửa thử nghiệm.
   - *Lý do loại bỏ*: Vi phạm kỷ luật debug của Harnix. Harnix áp dụng điều tra tuần tự: kiểm tra một giả thuyết tại một thời điểm, có bằng chứng thực tế chứng minh, tối đa một vòng khắc phục tự động và sau ba giả thuyết phân kỳ phải dừng lại để tái đánh giá (replan). Điều này giúp kiểm soát context lean và tránh phân rã mã nguồn.

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
