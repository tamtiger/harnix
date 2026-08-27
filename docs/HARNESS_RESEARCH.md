# Harnix Harness Research

## 1. Khung quyết định

PRD và master prompt là nguồn yêu cầu. Mỗi capability upstream được đánh giá theo:

- **Value**: tác động tới độ đúng, tốc độ hoặc khả năng bảo trì.
- **Cost**: complexity, context và consumer footprint.
- **Security**: trust boundary, path/process/network và data-loss risk.
- **License**: khả năng reuse hay cần clean reimplementation.
- **PRD alignment**: mức khớp với Harnix lean enterprise harness.

Trạng thái:

- `adopt`: giữ capability và semantics cốt lõi.
- `adapt`: giữ mục tiêu nhưng thiết kế lại cho Harnix.
- `defer`: có giá trị nhưng không thuộc release này.
- `reject`: chủ động loại bỏ.

## 2. Capability matrix

| Nguồn | Capability | Quyết định | Value | Cost/context | Security/license | PRD alignment và lý do |
|---|---|---|---|---|---|---|
| Trellis | Scoped spec injection | `adapt` | Rất cao | Trung bình; cần ranking và budget | Chỉ đọc repo-local, chống path escape | Trụ cột chống context bloat; bỏ dump toàn spec |
| Trellis | Task PRD + lifecycle state | `adapt` | Cao | Trung bình | JSON/schema strict, atomic writes | Giữ plan/implement/check/finish nhưng giảm ceremony |
| Trellis | Curated implement/check context | `adopt` | Cao | Thấp–TB | Không execute nội dung context | Tách context theo phase và acceptance criteria |
| Trellis | Project journal + continue | `adapt` | Cao | Thấp | Dữ liệu local, malformed lines phải an toàn | Newest-first slice nhỏ; không global memory |
| Trellis | Finish và validated spec learning | `adapt` | Cao | Trung bình | Promotion phải reviewable | Chỉ promote khi recurrence/evidence hoặc explicit approval |
| Trellis | Spec bootstrap | `adapt` | Cao | Trung bình | Không overwrite local specs | Seed theo ngôn ngữ/package đã detect |
| Trellis | Root/worktree path resolution | `adopt` | Cao | Thấp | Chống traversal/symlink escape | Hỗ trợ worktree nhưng không tự tạo worktree |
| Trellis | Atomic writer, template hash, manifest prune | `adapt` | Rất cao | Trung bình | Critical data-loss boundary | Versioned SHA-256 manifest, POSIX keys, three-way ownership semantics |
| Trellis | CLI init/update/upgrade/uninstall/mem | `adapt` | Cao | Cao nhưng bắt buộc | Argument-safe process, injected dependencies | Thu về một package và contract Harnix |
| Trellis | Python runtime scripts trong project | `reject` | Có ích upstream | Footprint/context rất cao | Tăng executable attack surface | Runtime phải chạy từ package đã cài |
| Trellis | Channel/forum/worker network | `reject` | Thấp cho scope | Rất cao | Concurrency, process và trust risk | Ngoài phạm vi; không mandatory orchestration |
| Trellis | Workflow-template switching | `reject` | Thấp | Cao | Drift và update conflicts | Harnix có một workflow |
| Trellis | 20+ configurators | `reject` | Không cần | Rất cao | Surface và test burden | Chỉ Kiro, Antigravity, Codex |
| Trellis | Marketplace/global runtime | `reject` | Không cần | Cao | Global mutation/network risk | Project-local, không service/marketplace |
| ECC | Research-first | `adapt` | Cao khi có unknown | Có thể tốn context | Primary sources, attribution | Chỉ full mode và material unknown/security/unstable fact |
| ECC | Iterative retrieval | `adopt` | Rất cao | Giảm context | Không dump secrets/unrelated files | Load theo nhu cầu, dừng khi đủ evidence |
| ECC | Context budgeting | `adopt` | Rất cao | Trung bình | Disclosure khi truncate | Configurable char/token approximation, pins và full override |
| ECC | Package manager + verification detection | `adapt` | Cao | Thấp | Không execute lúc detection | Manifest/lockfile/scripts; output là plan commands |
| ECC | Rules packs | `adapt` | Cao | Có nguy cơ bloat | MIT attribution | Vendor/chuyển thể chỉ common + 7 target packs, framework overrides common |
| ECC | Local doctor | `adapt` | Rất cao | Cao | Deterministic, offline, conservative fix | Thêm schema/hash/hook/path/secret/permission checks |
| ECC | Learning candidates/confidence | `adapt` | Cao | Trung bình | Không hidden generation | Evidence + occurrences + confidence; explicit promotion gate |
| ECC | Skill behavior evals | `adopt` | Cao | Trung bình | Deterministic fixtures | Test routing/workflow invariants thay vì chỉ snapshot text |
| ECC | AgentShield/external scanner | `reject` | Có thể cao | Cao | Network/tool trust, license scope | Doctor local đủ cho release này |
| ECC | Hosted dashboard/telemetry/global memory | `reject` | Không cần | Rất cao | Privacy/data egress | Mâu thuẫn offline/project-local |
| ECC | Multi-model gateway | `reject` | Không cần | Rất cao | Credentials/network | Không phải mục tiêu Harnix |
| Superpowers | Systematic debugging | `adapt` | Rất cao | Thấp | Evidence trước mutation | Quy trình 1 hypothesis; sau 3 lần thất bại đánh giá architecture |
| Superpowers | Verification before completion | `adopt` | Rất cao | Thấp | Chống false claims | Fresh output và exit code bắt buộc |
| Superpowers | RED–GREEN–REFACTOR | `adapt` | Cao | TB | Tests phải meaningful | Adaptive TDD; exception có lý do cho docs/wiring/generated artifacts |
| Superpowers | Decision-complete plans | `adapt` | Cao | TB | Không chứa secrets | Full mode và task lớn; không áp ceremony cho lite |
| Superpowers | Two-stage review | `adapt` | Cao | TB | Security review riêng | Stage 1 compliance; stage 2 quality/security/maintainability |
| Superpowers | Mandatory commits | `reject` | Không phù hợp | Workflow coupling | Mutates Git history | Prompt cấm tự commit |
| Superpowers | Mandatory worktrees | `reject` | Không cần | Cao | Filesystem/Git mutation | Chỉ resolve worktree hiện có |
| Superpowers | Mandatory subagents | `reject` | Tùy platform | Context/concurrency cao | Authority và prompt-injection surface | Core workflow phải chạy single-agent |
| Superpowers | Branch finishing/PR creation | `reject` | Ngoài scope | Trung bình | External mutation | Finish chỉ verify, archive, journal; không PR |

## 3. Thiết kế được chọn

### 3.1 Dual mode

**Lite** áp dụng cho thay đổi tập trung, rủi ro thấp và ít decision. LOC chỉ là tín hiệu, không phải luật; material unknown, cross-layer impact hoặc risk tăng sẽ promote task sang Full. Chỉ hỏi khi còn user-owned decision hoặc authority blocker.

**Full** áp dụng cho feature, integration, migration, architecture/refactor, security-sensitive hoặc multi-file. Full mode phải có acceptance criteria và decision-complete plan. Research chỉ được kích hoạt khi có material unknown.

Nếu không phân loại chắc chắn, hỏi người dùng full brainstorm hay quick implementation. `--lite`/`--full` override heuristic.

### 3.2 Context model

Context candidates được rank theo thứ tự ưu tiên:

1. Explicit pin.
2. Task/acceptance reference.
3. Active package/path.
4. Language/framework.
5. Cross-project guide.

Deduplicate theo normalized repo-relative path và content identity. Frozen scorer tại `IMPLEMENTATION_PLAN.md` dùng pin 1000, task/acceptance 500, active package/path 250, một bounded language-or-technology bonus 100, guide 25; signals cộng dồn và tie-break bằng normalized path. Enforce `maxCharacters` cùng `tokenApproximation`; khi thiếu budget, inject phần điểm cao nhất và luôn liệt kê file bị bỏ. Full-context là explicit override, không phải default.

### 3.3 Managed ownership model

Mỗi generated artifact có normalized relative path, source/template ID, scope/platform, generator version và generated SHA-256.

| State | Hành vi update |
|---|---|
| Disk hash = stored generated hash | Update an toàn |
| Disk hash khác stored hash | Preserve + warn |
| Template mới | Create |
| User đã xóa tracked file | Report; không silent restore |
| Template obsolete, disk unchanged | Remove |
| Template obsolete, disk modified | Preserve |

Manifest corrupt, traversal, symlink escape hoặc partial write phải fail closed. Tasks/journals không bao giờ là managed templates. Specs chỉ managed tới lần user chỉnh.

### 3.4 Learning model

Learning candidate gồm source tasks, statement, evidence IDs, occurrence count và deterministic confidence. Formula/threshold được khóa tại `IMPLEMENTATION_PLAN.md`: proposal eligibility cần ít nhất hai task độc lập, hai evidence và confidence >=0.8; write vào spec vẫn phải là explicit finish/review action. Không daemon, hidden skill generation hay global memory.

### 3.5 Verification model

- Bug/failure: reproduce → evidence → trace root cause → một hypothesis → minimal failing test → regression test → fix.
- Behavior change: ưu tiên RED–GREEN–REFACTOR.
- TDD exception chỉ cho docs-only, trivial wiring, generated snapshots hoặc nơi failing test không mang ý nghĩa; phải ghi lý do và dùng verification mạnh nhất.
- Check stage 1: PRD/spec/acceptance compliance.
- Check stage 2: correctness, tests, security, maintainability, YAGNI.
- Completion chỉ được claim từ fresh command output.

### 3.6 Workflow synthesis

Review trực tiếp Trellis `workflow.md`/brainstorm/before-dev/check/start/continue/finish-work tại SHA đã khóa cho thấy upstream có lifecycle rõ và persistence tốt, nhưng ceremony gắn chặt vào task creation consent, second implementation approval, duplicate implement/check manifests, subagent dispatch và mandatory Git commits. Review Superpowers cho thấy discipline mạnh ở design convergence, bite-sized plans, TDD, root-cause debugging, review reception và verification gate, nhưng upstream áp dụng chúng như mandatory skill chain cùng worktree/subagent/branch finishing.

Harnix kết hợp hai nguồn bằng một state machine chuẩn tại `docs/HARNIX_WORKFLOW.md`:

- Trellis đóng góp persisted task state, planning artifacts, scoped context, rollback, finish/continue và learning capture.
- Superpowers đóng góp decision-complete planning, RED–GREEN–REFACTOR, one-hypothesis debugging, technical review và evidence-before-claims.
- Harnix thêm Bypass/Lite/Full routing, ready gate dựa trên authorization thực tế, bounded `context.json`, explicit blocked/replan transitions và platform-independent single-agent execution.
- Harnix loại duplicate approval: explicit change request đã cho quyền implementation sau ready gate; chỉ user-owned decision, scope expansion hoặc action cần authority mới gây pause.
- Harnix loại mandatory commit/worktree/subagent/PR và auto-commit archive; finish chỉ verify, journal và complete state.

Skill chỉ sở hữu một đoạn state machine; skill không được định nghĩa transition cạnh tranh. Kiro, Antigravity và Codex có syntax adapter khác nhau nhưng cùng behavior eval fixtures.

### 3.7 Revalidation 2026-08-14: context drift và freshness theo input

Nghiên cứu task `20260814-081624-harness-capability-research` đã đối chiếu contract hiện tại với failure modes resume/completion và chốt ba capability nội bộ, không thêm platform/service:

- **C1 — context drift:** hidden inspect/continue luôn project `contextDrift`; hash thay đổi, file thiếu, unreadable và manifest entry không có hash được phân loại xác định. `stale` chỉ route qua persisted `replan` và context reselection, không tự sửa source/manifest.
- **C2 — TaskRecord v2:** required checks sở hữu `criterionIds`/`inputs`; completion đòi criterion-linked evidence giao đúng declared check. V1 vẫn đọc nguyên semantics; completed v1 byte-preserved, unfinished v1 chỉ explicit migrate tại `replan` với deterministic migration evidence. Doctor chỉ báo `legacy-task-schema`.
- **C3 — input freshness:** `@task-contract`, Full PRD/plan và safe repository globs tạo canonical SHA-256 `inputDigest`. Hidden snapshot chạy trước/sau check; save recompute để phát hiện race và ghi immutable relative-path/hash sidecar; finish recompute để chặn changed/missing/unreadable/unsafe input. Không persist source body, secret, absolute path, prompt, environment hay command output.

Thiết kế sidecar task-owned được chọn thay vì watcher/daemon vì giữ workflow local, deterministic, no-network và cho diagnostic path-level mà không nhét per-file hash vào evidence công khai. Timestamp-only freshness bị thay thế cho TaskRecord v2; pre-migration v1 evidence vẫn bảo toàn nhưng không chứng minh completion v2.

### 3.8 Adoption 2026-08-18: four bounded harness capabilities

Research task `20260818-140304-harness-capability-landscape` compared current agent harness patterns and selected exactly four `adapt` items that strengthen existing Harnix boundaries without adding a package, service, platform or network path:

| Capability | Decision | Harnix adaptation | Rejected expansion |
|---|---|---|---|
| Context selection-basis freshness | `adapt` | Task-owned hash-only sidecar binds task/config/guide/selector/cache inputs and selected-result metadata; inspect reports deterministic `selectionChanges` | ContextManifest v2, watcher, auto-refresh, hook-time repo-map I/O |
| Deterministic ready trace | `adapt` | Bounded line parser proves PRD criterion ↔ plan slice ↔ required check/safe path and gates Full readiness | LLM judge, arbitrary Markdown execution, Lite ceremony, historical rewrite |
| Untrusted learning promotion guard | `adapt` | Exact hash + sorted provenance/risk categories; statement is JSON-string review data inside a fixed boundary; Doctor warning is redacted/no-fix | Semantic malware claim, auto-promotion, spec/journal rewrite, URL/command execution |
| Dependency-aware repo-map ranking | `adapt` | Safe relative import resolver and bounded two-hop in-memory graph add capped bonuses; cache/public schema stay v1 and lexical ranker v1 remains rollback | AST server, embedding/vector DB, persisted graph, runtime scan/network |

The four capabilities are implemented as independent pure core boundaries with focused RED→GREEN gates, then integrated through the existing hidden workflow, Doctor and cache-only query commands. Harnix additionally exposes an explicit, evidence-gated project-local `workflow --learn` append transport and `mem --learning` filter; this is reviewable capture, not auto-memory or promotion. Living spec/spec delta, no-spec markers, platform network probes, context condensers, auto-memory, hosted runtime, workflow presets and mandatory multi-agent behavior remain deferred or rejected.

### 3.9 Revalidation 2026-08-26: task observability, navigation, audit và provenance

Task `20260826-132459-harness-ux-research-improvements` giữ nguyên frozen baseline để tái lập, đồng thời quan sát current heads của ba upstream gốc: Trellis `64e663694201005bc87766ef22de89b8da3d4d79` (54 commit; 303 file, +16.952/-5.392), ECC `d8409a4b0813771235555e32e3d8046a73988bfa` (77 commit; 468 file, +33.937/-3.122) và Superpowers `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`/`v6.3.0` (một squash release; 40 file, +2.888/-67). License tương ứng vẫn là AGPL-3.0-or-later, MIT và MIT. Current refs chỉ là dated observation, không thay frozen ownership/provenance refs.

Landscape screening dùng 12 repository và deep-dive 8: ba upstream gốc, Spec Kit, BMAD, Cline, Aider và Goose. Tín hiệu hội tụ là status/resume/next-step từ persisted state, local task history resilient, on-demand dependency navigation và pre-implementation gate visibility. Các issue/discussion Cline, Aider, Spec Kit, BMAD, Trellis, Goose và ECC cung cấp real-usage evidence về resume mơ hồ, task discovery nhiều bước, context dependency thiếu hoặc phình, record hỏng làm mất history và readiness loop. Local reproduction cho thấy hidden `workflow --inspect` trả 6.890 byte trên một dense JSON line, Doctor trộn 34 warning, repository có 36 task directories nhưng không có public index, cache đã có adjacency nhưng không expose exact impact, và public user không có completion audit dù Harnix đã persist đủ status/checkpoint/evidence/context state.

Batch được chọn gồm:

- `HX-STATUS-01`: public `harnix status` read-only, count-only, không network/write và không expose private task prose.
- `HX-NEXT-01`: một deterministic `nextAction` cùng ordered bounded `attention`, dựa trên persisted status, context drift và required-check freshness.
- `HX-TASKS-01`: public `harnix tasks` scan bounded, validate từng local task record độc lập, pin active task hợp lệ và degrade thành `partial` thay vì để một record hỏng làm mất toàn bộ history.
- `HX-IMPACT-01`: `harnix repo-map --impact` dùng exact path và cache v1 hiện hữu để trả direct dependencies/reverse dependents cycle-safe, depth/limit bounded, không scan source hoặc đổi cache schema.
- `HX-AUDIT-01`: public `harnix audit` tách Full readiness khỏi completion blockers, reuse ready-trace/input-freshness exact semantics và chỉ emit stable code/ID/count.
- `HX-PROVENANCE-01`: `docs/HARNESS_FEATURE_PROVENANCE.json` backfill mọi maintained external-derived capability và regression exact schema/path/ref/license/evidence.

Mỗi capability có provenance tách biệt để không overclaim nguồn: status/next-action tham khảo behavior Trellis, ECC, Spec Kit và BMAD với Cline issues làm pain signal; task index tham khảo Cline task history cùng issue #4359/discussion #10480; dependency impact tham khảo Aider repo-map cùng issue #3603/#4239; task audit tham khảo Spec Kit `analyze`/discussion #1917 và BMAD readiness flow/issue #2079. Tất cả là clean-room Harnix implementation, không copy source/prose. Daemon/watch/statusline, SQLite/global database, model/session compaction, Git checkpoint, cost tracking, cloud UI, heuristic auto-remediation và worker/multi-agent orchestration tiếp tục bị reject vì phá product boundary hoặc ownership. Chi tiết source, metric, scoring, rollback và bất định nằm trong research artifacts của task; registry canonical ghi repo/ref/date/license/evidence/adaptation/code/test/docs cho từng feature để về sau nhận biết bằng máy. `NOTICE` chỉ đổi khi thực sự reuse/adapt nội dung tạo nghĩa vụ attribution, không vì clean-room behavioral reference.

### 3.10 Revalidation 2026-08-26: recovery và explainability thực tế

Task `20260826-154348-harness-feature-expansion` tiếp tục từ batch observability bằng current primary sources và issue signal, đồng thời tái hiện ba gap local: unfinished TaskRecord vẫn tồn tại nhưng pointer rỗng; effective context selector có dữ liệu selected/omitted nhưng public user không xem được; immutable verification snapshot biết changed/missing path nhưng status/audit chỉ hiện aggregate stale ID. Current mechanism evidence gồm Codex `a26f1806a4f4b8cfec2ea1be129963815a61e58c`, Spec Kit `c58a8487461052b4fa65e626df167521d297b184`, BMAD `9376e1f9e5b1214c024bb20b81adff5eb447820a` và VS Code docs `af6d23706c3a59b91767b2f69de7d97d02bef9cc`; frozen ownership refs không đổi.

Weighted hard gate chọn ba clean-room adaptation:

- `HX-RESUME-01` / provenance `task-resume-recovery`: exact-ID unfinished-task pointer recovery, dry-run và collision fail-close; không session store, transcript replay hoặc Git restore.
- `HX-CONTEXT-REPORT-01` / provenance `context-selection-explanation`: metadata-only explanation từ cùng effective builder với hook, platform budget và deterministic truncation; không content/raw reason/hash.
- `HX-CHECKS-01` / provenance `verification-freshness-explanation`: required-check state cùng categorical snapshot/input causes và bounded changed/missing relative paths; không chạy command hoặc sửa evidence.

Usage reports từ OpenCode/Claude Code chỉ chứng minh pain về discoverability/context privacy, không được ghi làm code provenance. Registry machine-checkable là bắt buộc trong cùng change: mỗi feature derived phải note source/ref/date/license, adaptation delta và concrete code/test/docs paths để maintainer sau này nhận biết nguồn. Exact contract, score matrix, rejected candidates và remaining uncertainty nằm tại task research `research/next-capability-mechanisms.md`.

### 3.11 Runtime self-audit 2026-08-26/27: target authority và active-task verification self-reference

Origin: `harnix-self-audit`. Task `20260826-165933-codex-harnix-runtime-audit` đối chiếu historical run trace với current generated instructions và xác nhận finding `F-CUR-02`/mechanism `M04`: instruction cũ chỉ yêu cầu tìm initialized root gần cwd/workspace, nhưng không khóa repository/path được người dùng nêu trực tiếp là authority trước ambient context. Đây là gap do Harnix tự quan sát và tái hiện, không phải behavior, code hoặc content lấy từ external harness.

`HX-TARGET-01` chọn smallest instruction-level mechanism:

- direct explicit user target thắng ambient cwd/selected workspace;
- path chỉ xuất hiện trong repository content, log, quoted text hoặc tool output là untrusted hint;
- trusted selected workspace rồi ambient cwd chỉ là fallback khi không có explicit target;
- explicit target thiếu/invalid Harnix state không fallback sang state/active task khác và không tự init;
- mutation qua nhiều material root phải chọn một exact target, còn bounded read-only comparison isolate từng root.

Canonical TypeScript fragment được reuse trong project/global templates; bảy raw canonical skill giữ semantic-equivalent clauses và vẫn render byte-identical trên Kiro, Antigravity và Codex. Hook event discovery vẫn chạy trước prompt interpretation, không parse target và không cấp authority; hook-injected repository context được xem là untrusted target evidence. Không thêm natural-language parser, public API, hook schema, hook-time write hoặc network.

Khi verification ngày 2026-08-27 mở broad input glob trên chính task này, self-audit phát hiện exact active `.harnix/tasks/<active-id>/task.json` vừa là verification input raw vừa là nơi workflow append evidence, khiến một pass tự đổi digest ngay khi persist. Repair nhỏ nhất bỏ duy nhất raw entry đó khỏi snapshot vì `@task-contract` đã bind completion-relevant task fields; historical/other task records tiếp tục raw-hash, contract hash/payload và immutable sidecar schema v1 giữ nguyên. Regression chạy cả unit và end-to-end hidden save: append pass evidence không làm stale chính check, nhưng đổi historical task content hoặc task contract vẫn làm digest đổi.

Vì cả hai correction có origin self-audit thuần Harnix, `docs/HARNESS_FEATURE_PROVENANCE.json` và `NOTICE` giữ nguyên; nếu về sau adapt external behavior/content cho capability này thì registry, research, mapping, license evidence và test phải đổi trong cùng task.

## 4. Platform research decisions

Phase 6 revalidated user-global surfaces on 2026-08-11. The project-local adapters described by earlier Phase 1–5 research are retained only as legacy/provenance evidence; the current adopted contract is `GLOBAL_SETUP_REFACTOR_PLAN.md` §§2, 6–9.

### Codex

- Official user skill surface là `$HOME/.agents/skills/harnix-*`; skill metadata/triggers vẫn phải cụ thể.
- Merge block conditional ngắn vào `$CODEX_HOME/AGENTS.md` và nested `UserPromptSubmit` handler vào managed block trong `$CODEX_HOME/config.toml`; preserve all unrelated TOML content and detect `AGENTS.override.md` shadowing. Migrate unchanged legacy Harnix JSON hook conservatively.
- Không sửa model/reasoning/sandbox/approval/MCP/provider/auth hoặc feature flags. Constant hook command must resolve through Windows pnpm/npm shim smoke without a persisted absolute executable.
- Hook command requires user `/hooks` review/trust. File presence means `installed-pending-trust`, not `active`; Harnix never bypasses trust.
- `.codex/agents/` remains optional only when current official surface supports it; it is not a workflow dependency.
- Không tạo legacy custom prompts hoặc slash-command shims.

### Kiro

- Global user surface is `~/.kiro/skills/harnix-*`, `~/.kiro/steering/harnix.md` and `~/.kiro/hooks/harnix-context.json`; skills are not derived from the setup cwd languages.
- Steering uses a conditional Harnix-project guard and explicitly routes ordinary prompts without requiring the user to name Harnix. One JSON-v1 `UserPromptSubmit` command handler runs the fixed installed `harnix` command with timeout 5.
- Capability detection distinguishes supported IDE/CLI global hooks from legacy Kiro; doctor reports unsupported versions and stale workspace hook duplication rather than generating an old schema.
- Không tạo cơ chế install thứ hai, permission/trusted-command mutation hoặc runtime scripts trong consumer.

### Antigravity

- Executable thực tế là `agy`; setup/doctor không dùng lệnh Gemini CLI. Physical `.gemini` namespace does not change the public Antigravity identity.
- Use two independently owned global plugins: Desktop `~/.gemini/config/plugins/harnix` and CLI `~/.gemini/antigravity-cli/plugins/harnix`. Each has only official `plugin.json`, Harnix skills, an always-on `rules/AGENTS.md` without frontmatter, and a fixed `PreInvocation` command handler. The rule explicitly routes ordinary prompts without requiring the user to name Harnix.
- Handler returns `injectSteps` only for the first invocation. It selects a valid cwd project first, otherwise one initialized workspace path; a multi-root ambiguity preserves data privacy and emits only a short warning.
- No MCP/settings/account/registry/credential/permission mutation, no machine path and no project `GEMINI.md`/skills setup output. Doctor distinguishes verified `shadowed` from `precedence-unknown`.

## 5. Rules strategy

Chỉ chuyển thể nội dung liên quan:

- Common: security, testing, coding style, review và performance essentials.
- TypeScript/NestJS, Python, Go, Vue.
- Java/Spring và React web được viết pack Harnix tập trung framework.
- C#/.NET/ABP được viết pack Harnix: nullable, async/cancellation, DI, DDD/repository/application services, authorization/validation, EF Core/ABP, xUnit.
- React Native bị tách khỏi React web và không được seed.

Precedence: repository convention > user-modified project spec > selected technology/domain guide > selected source-language guide > common guide > packaged fallback.

## 6. Security analysis

| Boundary | Rủi ro | Control bắt buộc |
|---|---|---|
| Root/path | traversal, symlink/junction escape, unsafe purge | resolve Git root; normalized relative keys; realpath containment; refuse filesystem root |
| Managed update | overwrite user data, corrupt manifest | hash ownership; atomic replacement; schema validation; preserve on uncertainty |
| Migration | mixed namespace, partial copy, false hash trust | preview/default no-write; staged copy/transform; verify; rollback; source preserved |
| Hooks | duplicate execution, shell injection, untrusted project | one surface/platform; bounded args/output; Windows override; doctor trust/duplicate checks |
| Upgrade | command injection/network in tests | `execFile` argument arrays; injected version/network/process dependencies; no real install in tests |
| Doctor | secret disclosure | report path/type, redact values; deterministic local scan only |
| Ready trace | artifact injection, unbounded parse, false readiness | ignore fenced examples; size/line/slice/reference caps; stable IDs/codes only; no Markdown execution |
| Learning review | persistent prompt injection, credential/URL/command disclosure | JSON-string statement boundary, exact hash, category-only Doctor warning, no auto-fix/promotion |
| Repo-map graph | traversal, dependency explosion, ranking nondeterminism | relative-only resolver, ambiguity/resource caps, code-unit order, in-memory graph and ranker-v1 rollback |
| Uninstall | irreversible data loss | default removes unchanged managed files only; purge preview + confirmation + safe-root checks |
| Context | prompt injection/data overexposure | scoped local sources, budget, omission disclosure, no automatic external retrieval |

## 7. Deferred và rejected scope

### Deferred

- Optional Codex role agents nếu official schema chưa ổn định hoặc không cần parity.
- Semantic/embedding context ranking remains deferred; the adopted dependency-aware repo-map ranker is deterministic structural ranking over existing cache v1 metadata only.
- Extra framework packs ngoài bảy target languages/frameworks.
- Remote spec synchronization; `update` chỉ dùng packaged templates.
- Fuzzy task-body/history search; exact metadata index và exact-ID resume đã giải quyết recovery path mà không đọc private prose.

### Rejected

- Channel/forum/worker network, dashboard, marketplace, telemetry, hosted service.
- Chinese localization và workflow-template switching.
- Global daemon/observer/runtime hoặc silent network calls.
- Default MCP, multi-model gateway, AgentShield bundling.
- Automatic Git commit/branch/worktree/merge/push/PR.
- Transcript/session import-export-replay, Git checkpoint rewind, automatic context compaction/token accounting và background notification monitor.
- Mandatory subagents và hàng trăm generic skills.
- Multiple install mechanisms cho cùng platform.

Các quyết định này là guardrail chống scope creep. Thay đổi cần cập nhật PRD, matrix này, mapping và tests trước khi implementation mở rộng.

## 8. Trace tới acceptance

| Adopted capability | Code boundary dự kiến | Test/eval bắt buộc |
|---|---|---|
| Root/path safety | `src/utils/paths.ts` | nested Git/worktree, Unicode/spaces, traversal, symlink |
| Config/schema | `src/core/config/**` | exact frozen types, valid/corrupt, migrations, future version, unknown-key round trip |
| Detection | `src/catalog/**`, `src/utils/detection.ts` | independent language/technology evidence, packages, exclusions and package managers |
| Managed files | `src/utils/{hashing,managed-files,atomic-write}.ts` plus Phase 6 global ownership/lock boundary | modified/deleted/obsolete/corrupt/rollback, fragment collision, permission mode and concurrent-edit preservation |
| Context budget | `src/core/context/**` | rank, dedupe, pins, truncation disclosure, full override |
| Journal/learning | `src/core/journal/**`, `learning.ts` | malformed/Unicode/newest-first/confidence/promotion |
| Workflow | `src/skills/**` | lite/full/ambiguous/forced, debug, TDD exceptions, reviews, verification |
| Platforms/hooks | `src/configurators/{kiro,antigravity,codex}.ts`, Home/Platform root resolvers, hidden internal context handler | user-global snapshots, stdin/stdout protocol, activation guard, bounds, idempotence, fake home and no machine paths |
| Lifecycle/migration | `src/commands/**`, `src/migration/**` | project/global scope, legacy conflicts, rollback, purge/global-uninstall safety |
| Doctor | `src/commands/doctor.ts` | stable ordered/redacted Doctor JSON v2 + unsafe/duplicate/legacy/global/secret fixtures |
| Task status/next action | `src/core/status.ts`, `src/commands/status.ts` | no-active/active, precedence, v1 age/v2 digest freshness, privacy, bounded payload và no-write nested-root integration |
| Exact task recovery | `src/core/tasks/task-resume.ts`, `src/commands/resume.ts` | absent/same/different/invalid pointer, missing/malformed/oversized/terminal candidate, dry-run/no-write và pointer-only mutation |
| Effective context explanation | `src/core/context/effective-context.ts`, `src/commands/context-report.ts` | hidden-hook parity, dynamic/persisted selection, platform caps, trusted reasons, drift, privacy, truncation và no-write |
| Required-check explanation | `src/core/verification/check-report.ts`, `src/commands/checks.ts` | v1 age/v2 sidecar/input matrix, append-order tie, changed/missing path, status/audit parity, privacy, truncation và no-write |
| Harness feature provenance | `docs/HARNESS_FEATURE_PROVENANCE.json` | exact allowlists, sorted immutable sources, safe existing code/test/docs paths và pinned feature-ID set |

Chi tiết task order và gates nằm trong `IMPLEMENTATION_PLAN.md`; phân loại reuse/remove/build nằm trong `UPSTREAM_MAPPING.md`.
