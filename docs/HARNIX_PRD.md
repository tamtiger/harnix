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
| Status | **Implementation-ready** |

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
- **Project-local first:** không global runtime, daemon hoặc memory ẩn.
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
- Kiro, Antigravity và Codex native project surfaces.
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
├── test/{unit,integration,evals,fixtures}/
├── docs/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── pnpm-lock.yaml
```

`commands`, `configurators` và `migration` có thể gọi `core`; `core` không phụ thuộc terminal UI, Commander/Inquirer hoặc platform templates. Filesystem, clock, prompts, process runner và version/network lookup phải inject được ở boundary cần deterministic tests. Không public deep imports ngoài exports trong `src/index.ts`.

## 7. Public CLI contract

CLI có help rõ, actionable errors và non-zero exit khi thất bại:

```text
harnix init [--dry-run]
harnix setup --kiro|--antigravity|--codex
harnix update
harnix upgrade
harnix uninstall [--purge]
harnix mem [query]
harnix doctor [--fix] [--json]
```

Automation flags gồm `--yes`, `--user <name>`, `--languages <csv>`, `--limit` và `--json`. Packaged hidden `harnix internal context --platform <id>` chỉ là platform-hook protocol, không xuất hiện trong public help và không phải supported public API; exact stdin/stdout/bounds nằm trong `IMPLEMENTATION_PLAN.md` mục 4.7.

## 8. Init requirements

- Resolve root từ nested directory/existing worktree trên Windows, macOS, Linux, Unicode/spaces.
- Bỏ qua `.git`, `node_modules`, `vendor`, `bin`, `obj`, `dist`, `build`, coverage/cache.
- Detect:
  - `.csproj`/`.sln` và ABP indicators → C#/.NET/ABP.
  - `package.json` và NestJS indicators → TypeScript/NestJS.
  - Python manifests → Python.
  - Maven/Gradle và Spring indicators → Java/Spring.
  - `go.mod` → Go.
  - React dependencies → React web.
  - Vue dependencies → Vue.
- Detect packages, package manager và verification commands nhưng không execute.
- Interactive confirm/edit languages; `--yes`, `--user`, `--languages` hỗ trợ CI/tests.

Init chỉ tạo:

```text
.harnix/
  spec/<package>/
  spec/guides/
  tasks/
  workspace/<developer>/
  config.yaml
  workflow.md
  .developer
  .template-hashes.json
```

Không tạo runtime scripts. Seed relevant specs/rules. Rerun idempotent và giữ modified specs/config/tasks/journals. Init chỉ quản lý `.harnix/`, không inspect, migrate, overwrite hoặc xóa `.trellis`, `.trellis-pro` hay skill Trellis. Representative fixture phải dưới 5 giây.

## 9. Setup and platform requirements

- `setup` yêu cầu ít nhất một platform flag và cho phép nhiều flag.
- Validate `.harnix/config.yaml` trước write.
- Chỉ generate selected platforms/languages.
- Runtime dùng installed executable; không copy runtime code.
- Rerun byte-idempotent khi inputs không đổi.

### 9.1 Kiro

Frozen v1 baseline là `kiro-cli-chat 2.14.2`. Generate đúng các project-local surfaces:

- `.kiro/skills/harnix-*/SKILL.md` cho core/optional skills.
- `.kiro/steering/harnix.md` cho workflow bootstrap và relevant detected-language guidance.
- Một `.kiro/hooks/harnix-context.kiro.hook`: `version: 1.0.0`, `enabled: true`, `when.type: promptSubmit`, `then.type: runCommand`, constant command `harnix internal context --platform kiro`; successful stdout được thêm vào agent context.

Không generic/all-language output, user-level mutation, runtime copy hoặc install mechanism thứ hai. Version/schema drift phải được revalidate và ghi source/date trước khi đổi snapshot.

### 9.2 Antigravity

Frozen v1 baseline là `agy 1.1.1`:

- Public platform/flag là Antigravity/`--antigravity`; setup/doctor preflight `agy --version`, không gọi `gemini`.
- Physical project namespace là managed `GEMINI.md` và `.gemini/skills/harnix-*`; tên `.gemini` không biến target thành Gemini CLI.
- V1 không generate Antigravity settings/hooks vì chưa có authoritative project-local schema được xác minh. Workflow parity đạt qua project instruction + skills; schema mới chỉ được thêm sau documented revalidation.
- Không chạm user-level `.gemini/config`, `antigravity-cli`, `antigravity-ide`, accounts, registry, MCP credentials hoặc unrelated state.
- Không bắt buộc subagent, hardcode machine path hoặc tạo legacy slash-command shim.

### 9.3 Codex

Frozen local baseline là `codex-cli 0.139.0`; official current docs vẫn có precedence:

- Managed block ngắn trong root `AGENTS.md`, giữ user text ngoài markers.
- Repo skills tại `.agents/skills/harnix-*`, frontmatter hợp lệ và triggers cụ thể.
- Optional `.codex/agents/` cho research/independent review chỉ khi official surface hỗ trợ; core không phụ thuộc.
- Merge structural chỉ Harnix-owned `.codex/config.toml` keys; không sửa model, reasoning, sandbox, approval, provider/auth, MCP hoặc unrelated keys.
- Dùng đúng một `.codex/hooks.json` `UserPromptSubmit` command handler gọi hidden internal context protocol, bounded output, `commandWindows`, timeout và no duplicate.
- Giải thích project trust; doctor phát hiện drift có thể kiểm được.
- Optional managed `## Code Review Rules` không làm mất user content; không legacy custom prompts/slash commands.

`AGENTS.md` là bootstrap project-local được `init` tạo nếu chưa có; chi tiết load dần từ skills và `.harnix`. Codex setup tái sử dụng managed block trong file này và không tạo duplicate.
## 10. Config, context, journal and learning

Normative v1 schemas cho `.harnix/config.yaml`, managed manifest, task/evidence, optional context manifest, journal/learning và doctor report nằm tại `IMPLEMENTATION_PLAN.md` mục 4. Implementation không được tự đổi field/enum/path/transition mà không cập nhật PRD/workflow, migration và tests trong cùng change. Config migrations explicit, preserve compatible unknown keys và reject future versions.

Context:

- Rank theo pin, task/acceptance reference, active package/path, language/framework và cross-project relevance.
- Deduplicate theo normalized repo-relative source/content.
- Enforce configurable character/token approximation budget.
- Khi truncate, inject phần điểm cao nhất và liệt kê omitted files.
- Full-context override explicit và vẫn ghi source list.
- Research findings lưu cùng task với source/date, không global injection.

Journal/learning:

- Project-local, newest-first, query theo user/limit và JSON.
- Missing workspace, malformed entry, Unicode/spaces không crash toàn command.
- Candidate gồm source task, statement, evidence, occurrences, confidence.
- Promotion vào spec cần repeated independent evidence hoặc explicit finish approval.
- Promotion reviewable trong diff; không daemon, hidden skill generation, global memory.

## 11. Managed-file lifecycle

Manifest versioned SHA-256 lưu normalized relative path, source/template ID, scope/platform, generated hash và generator version.

| State | Action |
|---|---|
| Stored hash = disk hash | Update |
| Stored hash ≠ disk hash | Preserve + warn |
| New desired file | Create + track |
| User-deleted tracked file | Report; explicit restore required |
| Obsolete unchanged | Remove |
| Obsolete modified | Preserve |

Content/manifest dùng atomic replacement. Reject traversal, absolute keys, unsafe roots, symlink/junction escape và corrupt/future manifest. Partial write giữ previous valid state. Tasks/journals không bao giờ managed; specs/workflow/platform files chỉ managed tới khi user chỉnh.

## 12. Lifecycle commands

### Update

Reconcile offline packaged templates theo ownership state machine; không chạm tasks/journals/unrelated files; report create/update/preserve/missing/remove.

### Upgrade

Báo installed/available version và npm upgrade path cho `@tamtiger/harnix`. Dùng argument arrays và injected network/version/process dependencies để tests không gọi network/install thật.

### Uninstall

Default chỉ xóa unchanged managed platform files/blocks, giữ `.harnix` data và modified files. Purge preview exact targets, confirmation hoặc intentional `--yes`, refuse unsafe roots/external symlinks. Legacy source cần separate verified cleanup option.

### Mem

Search newest-first với query/user/limit/json; include candidate confidence/evidence nhưng không promote; malformed data xử lý graceful.

### Doctor

Offline deterministic checks cho schemas, hashes, missing/modified/obsolete, duplicate/legacy injection, skill frontmatter, hooks, unsafe paths, attribution, platform drift, embedded secrets, broad permissions và injection-prone commands. Stable JSON/exit codes; redact secret values. `--fix` preview và chỉ sửa safe managed issues, không sửa user files/specs/tasks/journals/secrets/sensitive permissions.

## 13. Legacy compatibility boundary

Trellis/ECC/Superpowers chỉ còn là provenance và research history. Runtime Harnix không phụ thuộc vào hoặc phát hiện `.trellis/`, `.trellis-pro/`, `trellis-*` skills hay package Trellis.

- `init` luôn tạo namespace `.harnix/` nếu namespace này chưa tồn tại.
- Existing Trellis files được giữ nguyên và không bị migrate, overwrite, rename hoặc xóa.
- `setup` chỉ tạo managed Harnix surfaces cho platform được chọn.

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

- **Lite:** thay đổi tập trung, rủi ro thấp, ít decision; task record tối thiểu vẫn có acceptance, validation và evidence. LOC chỉ là tín hiệu, không phải luật.
- **Full:** feature, integration, migration, architecture/refactor, security-sensitive hoặc multi-layer; task `prd.md` + `plan.md`, conditional `design.md`/research và decision-complete plan.
- **Ambiguous:** tự chọn mức nhẹ nhất kiểm soát được rủi ro; chỉ hỏi full brainstorm hay quick implementation khi outcome/cost khác đáng kể.
- Explicit `--lite`/`--full` override heuristic.

Yêu cầu rõ kiểu build/fix/implement/change cho phép chuyển từ ready sang implementing trong phạm vi đã yêu cầu; không xin approval lần hai. Plan-only request hoặc explicit review checkpoint dừng ở `ready`. Product decision chưa giải quyết, scope expansion, destructive/external action hoặc thiếu authority mới cần hỏi.

Bug/failure dùng reproduce → evidence → root cause → one hypothesis → minimal failing test → regression protection → fix. Sau ba failed hypotheses cho cùng symptom, reassess architecture và replan nếu cần. Behavior change ưu tiên RED–GREEN–REFACTOR; docs/trivial wiring/generated snapshots có thể dùng documented exception và strongest alternative verification.

Ready gate bắt buộc acceptance criteria, affected scope, validation plan, resolved material unknowns và artifacts tương xứng mode. Check stage 1 là PRD/spec/acceptance compliance; stage 2 là correctness, tests, security, maintainability và unnecessary complexity. Finish chạy fresh final verification, archive/complete state, journal evidence/validated learning và không commit/push/merge/PR. Continue route từ persisted status/checkpoint và load smallest relevant journal/spec slice; corrupt/future state fail closed.
## 15. Rules integration

Precedence:

```text
repository conventions
> user-modified project specs
> language/framework pack
> common pack
> packaged fallback
```

Ship concise rules cho common; C#/.NET/ABP; TypeScript/NestJS; Python; Java/Spring; Go; React web; Vue. C# gồm nullable, async/cancellation, DI, DDD/repository/application services, authorization/validation, EF Core/ABP, xUnit. Java gồm validation, transactions, Spring Security, persistence boundaries, JUnit/Testcontainers. React web gồm accessibility/client security/Testing Library và tách React Native. Chỉ seed relevant content và giữ attribution.

## 16. Security requirements

- Node path/realpath containment; không shell-concatenate untrusted paths.
- Process execution bằng executable + argument array.
- Bounded cross-platform hooks, no duplicates.
- Secret reports không echo values.
- Config merge không chạm sensitive/unrelated keys.
- Purge/migration exact preview và explicit intent.
- Atomic writes, rollback, source preservation có injected-failure tests.
- Không execute spec/context/journal content.
- Không network trong init/setup/update/uninstall/mem/doctor.

## 17. Required tests

Tất cả filesystem tests dùng isolated temporary repositories:

1. Unit: detection; config/migrations; context ranking/budget; hash/manifest; atomic writes; journal; learning; doctor.
2. CLI: seven commands, three-platform/multi-platform setup, idempotence, modified/deleted, corrupt/future schemas.
3. Migration: discovery, dry-run, transform, preservation, mixed/conflict, rollback, cleanup.
4. Fixtures: .NET/ABP, NestJS, Python, Java/Spring, Go, React, Vue, multilingual monorepo.
5. Platform snapshots/schema, relevant rules only, no machine paths.
6. Codex: preserve `AGENTS.md`, valid skills, safe config merge, Windows/Linux hooks, no duplicates, preserve user files.
7. Workflow evals: routing, research, debug, TDD exception, two-stage review, fresh verification, budget disclosure, finish/continue, promotion.
8. Safety: traversal/symlink, hooks, secrets, purge, data preservation, duplicate install.
9. Packaging: one publishable package/bin; tarball runtime/templates/licenses; no workspace/second package/stale references.

## 18. Acceptance gates

Harnix không hoàn thành cho tới khi fresh output chứng minh:

- `pnpm install --frozen-lockfile`, `pnpm build`, `pnpm lint`, `pnpm typecheck`, `pnpm test` và `pnpm test:acceptance` pass.
- `pnpm pack:check` tạo/kiểm đúng một `@tamtiger/harnix` tarball dưới project-local `.artifacts/`.
- `pnpm smoke:tarball` cài tarball vào isolated fixtures và smoke init/Kiro/Antigravity/Codex/multi-platform; Antigravity dùng injected runner hoặc `agy` khi executable có sẵn.
- `test:acceptance` gồm clean/seeded unsafe `doctor --json` fixtures.
- `pnpm measure:init` fail nếu documented non-migration fixture có worst run >=5 giây.
- `pnpm measure:footprint` fail nếu consumer footprint không giảm ít nhất 50% theo `UPSTREAM_BASELINE.md`.
- `pnpm scan:release` fail trên public old branding/package/path, second package/workspace, unsupported adapter, dead packaged import, secret, accidental absolute path, required TODO hoặc duplicate hook.
- Mọi criterion/adopted capability trace tới code/test; deviations ghi rõ.
- License/NOTICE attribution đúng cho Trellis, ECC và Superpowers.

## 19. Provenance and requirement history

PRD ban đầu dùng working title “Trellis Pro”, pnpm monorepo/two packages, `.trellis/`, Kiro/Gemini và project-local Python scripts. Sau research và product decisions, Harnix thay thế bằng single package, `.harnix/`, installed-package runtime, Kiro/Antigravity/Codex, cùng managed lifecycle, migration, doctor, context budget, learning và safety contracts.

Lịch sử này giải thích provenance/migration, không tạo public alias hoặc old output. Chi tiết mapping và decisions nằm trong các tài liệu research.

## 20. Delivery phases

- **Phase 0:** PRD/research/baseline checkpoint và Git inventory.
- **Phase 1:** single-package foundation, root/detection/config/init, migration preview, basic Kiro/Codex setup.
- **Phase 2:** tasks/context/journal/learning, managed manifest, rule seeding.
- **Phase 3:** workflow skills/evals và Kiro/Antigravity/Codex parity; remove stale surfaces.
- **Phase 4:** lifecycle commands, full migration, packaging, performance, footprint và polish.

Chi tiết file/task/test/exit criteria nằm trong `IMPLEMENTATION_PLAN.md`.
