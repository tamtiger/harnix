# Prompt — Review và Refactor toàn diện Harnix v2: Orchestrator Landscape, Docs Consistency & Architecture Audit

Bạn đang làm việc tại repository Harnix (`C:\FPT\MyProject\harnix`). Hãy thực hiện một đợt review toàn diện, đối chiếu với ecosystem AI coding harness hiện hành — đặc biệt là các orchestrator/meta-harness cùng loại — phát hiện mọi inconsistency/drift/gap, rồi refactor docs và code để đưa Harnix về trạng thái nhất quán, chính xác và cập nhật.

Đây là **review-then-refactor** task. Research trước, plan sau, implement có chứng cứ.

---

## Phần I — Bối cảnh Ecosystem toàn cảnh (Nghiên cứu 2026-09)

### 1.1 Phân loại ecosystem

Ecosystem AI coding agent 2025-2026 phân thành 5 nhóm rõ rệt:

| Nhóm | Đại diện | Đặc điểm |
|---|---|---|
| **Meta-Harness / Orchestrator** | **Harnix**, Trellis, ECC, Spec Kit, BMAD, Claude Task Master | Cross-agent workflow, task state, skill/rule management |
| **Terminal/CLI Agent** | Claude Code, Kiro, Codex CLI, Antigravity CLI | Deep agentic loop, AGENTS.md/CLAUDE.md, hooks |
| **AI-Native IDE** | Cursor, Windsurf, Cline/Roo Code | Editor-integrated, modular rules, Memory Bank |
| **Enterprise Ecosystem** | Amazon Q, GitHub Copilot Workspace | Task-centric, issue-driven, semantic indexing |
| **Autonomous SWE Agent** | Devin, Aider, OpenHands, SWE-Agent | Sandboxed execution, trajectory management |

> **Harnix thuộc nhóm Meta-Harness/Orchestrator** — đây là unique positioning cần làm rõ.

### 1.2 Harnix upstream trực tiếp — Trạng thái hiện tại

#### ECC (Everything Claude Code)
- **URL**: [github.com/affaan-m/ECC](https://github.com/affaan-m/ECC) — MIT License
- **Kiến trúc**: 36 specialized agents, 142 skills, 68 slash commands, hook-based workflows
- **Platform**: Chỉ Claude Code
- **Frozen ref**: `f1fec0e` (2026-08-04) → revalidation `d8409a4` / `v2.1.0` (2026-08-19): +77 commits
- **Harnix đã adapt**: Rules packs (common + 7 targets), context budgeting, research-first, doctor/eval, iterative retrieval, learning confidence
- **Harnix đã reject**: AgentShield, hosted dashboard/telemetry, global memory, multi-model gateway, SQLite, cloud/statusline
- **So sánh**: ECC rộng hơn (142 skills vs Harnix 7 skills) nhưng chỉ chạy trên Claude Code. Harnix lean hơn nhưng cross-platform.

#### Trellis (Mindfold AI)
- **URL**: [github.com/mindfold-ai/Trellis](https://github.com/mindfold-ai/Trellis) — AGPL-3.0
- **Kiến trúc**: Persistent memory, structured workflows, managed templates, 24+ configurators
- **Platform**: Claude Code, Cursor, GitHub Copilot, Codex, Gemini CLI (rộng hơn Harnix)
- **Frozen ref**: `516b34e` (2026-08-01) → revalidation `64e6636` (2026-08-21): +54 commits
- **Harnix đã adapt**: Task/spec/context/journal, lifecycle CLI, managed templates, atomic writes, root/worktree resolution
- **Harnix đã reject**: Channel/forum/worker network, 20+ configurators, workflow-template switching, marketplace/global runtime, Python runtime scripts, mandatory commits
- **So sánh**: Trellis hỗ trợ nhiều platform hơn nhưng footprint lớn (1,343,579 bytes templates). Harnix giảm 85-99% footprint và chỉ target 4 platform chất lượng.

#### Superpowers
- **URL**: [github.com/obra/superpowers](https://github.com/obra/superpowers) — MIT License
- **Kiến trúc**: Methodology/rules-only (không phải framework), skill-based workflow disciplines
- **Frozen ref**: `44c9b2d` (2026-07-28) → revalidation `b36e082` / `v6.3.0` (2026-08-12)
- **Harnix đã adapt**: Systematic debugging, verification-before-completion, TDD RED-GREEN-REFACTOR, decision-complete planning, two-stage review
- **Harnix đã reject**: Mandatory commits/worktrees/subagents/PR, universal skill chain, branch finishing
- **So sánh**: Superpowers là methodology, không phải tool. Harnix codify nó thành executable state machine.

### 1.3 Đối thủ cạnh tranh trực tiếp (cùng nhóm Meta-Harness)

#### Spec Kit
- **URL**: github.com/ship-light/spec-kit
- **Kiến trúc**: CLI `specify`, spec-driven development (SDD)
- **Platform**: Tích hợp 30+ agents (Copilot, Claude, Gemini, Cursor)
- **Workflow**: Constitution → Specify → Plan → Tasks → Implement → Converge
- **Mạnh**: Rộng nhất về platform support, artifact-based phase transitions
- **So sánh Harnix**: Spec Kit rộng nhưng shallow integration; Harnix deep nhưng targeted 4 platforms. Spec Kit không có frozen contracts hay evidence digesting. Harnix confirm: artifact-based phase transitions đúng hướng.

#### BMAD Method
- **URL**: [github.com/bmad-code-org/BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD)
- **Kiến trúc**: "Agent-as-Code" — markdown/YAML config cho virtual team (PM, Architect, Dev, QA)
- **Mạnh**: Modular expansion packs, strict spec-driven workflow
- **So sánh Harnix**: BMAD focus virtual team roles, Harnix focus single-agent state machine. BMAD ít rigorous hơn ở evidence/verification.

#### Claude Task Master (Task Master AI)
- **URL**: [github.com/eyaltoledano/claude-task-master](https://github.com/eyaltoledano/claude-task-master)
- **Kiến trúc**: MCP-based task state, hierarchical task lists từ PRD
- **Platform**: Cursor, Windsurf, Roo Code (qua MCP)
- **Mạnh**: Dùng MCP làm glue layer để IDE đọc task state seamlessly
- **So sánh Harnix**: Rất giống TaskRecordV2 và `.harnix/tasks/.active`. Task Master dùng MCP, Harnix dùng CLI JSON protocol. MCP đang thành standard nhưng Harnix PRD reject "default MCP".

### 1.4 Các patterns nổi bật khác

#### Roo Code Boomerang Pattern
- **Đặc điểm**: Break tasks thành specialized sub-agent calls, mỗi subtask "boomerang" back với summary
- **So sánh Harnix**: Harnix enforce single-agent capable workflow, delegation optional. Boomerang pattern giải quyết context window degradation — Harnix giải quyết bằng context budgeting/ranking.

#### Goose (Block) — Adversary Mode
- **Đặc điểm**: Dynamic tool-call blocking — "second pair of eyes" chặn unauthorized actions
- **So sánh Harnix**: Harnix dùng harnix-check (post-facto verification) + forbidden boundary rules. Goose proactive hơn nhưng Harnix approach phù hợp lean/no-daemon constraint.

#### Amp (Sourcegraph)
- **Đặc điểm**: Enterprise multi-agent + policy-as-code gates
- **So sánh Harnix**: Harnix is project-local, no enterprise cloud. Different market.

### 1.5 Xu hướng hội tụ từ ecosystem

| Trend | Evidence | Harnix Status |
|---|---|---|
| **Spec-Driven > Prompt-Driven** | Spec Kit, BMAD, Trellis đều dùng artifact (PRD, plan.md) | ✅ Harnix đã có (Full prd.md + plan.md) |
| **AGENTS.md là cross-agent standard** | Codex, Devin, Cline/Roo native support | ✅ Harnix đã adopt |
| **Modular conditional rules** | Cursor .mdc, Windsurf rules, Cline .clinerules | ✅ Harnix dùng catalog/guides khác biệt nhưng cùng mục đích |
| **MCP là glue layer** | Task Master, Cursor, Windsurf, Roo Code | 📋 Harnix reject default MCP — but track as deferred |
| **Context isolation (Boomerang)** | Roo Code, Amp sub-agents | ✅ Harnix dùng context budgeting thay vì sub-threading |
| **Evidence-gated completion** | Harnix, Spec Kit (phần nào) | ✅ Harnix mạnh nhất (inputDigest, frozen contracts) |
| **Hook standardization** | Claude Code, Codex, Kiro, Antigravity | ✅ Harnix đã có 4 adapters |
| **Adversary/governance mode** | Goose, Amp policy-as-code | 📋 Harnix check stage 2 covers this partially |
| **Persistent local memory** | Trellis, Windsurf Cascade, Cline Memory Bank | ✅ Harnix journal + learning model |

---

## Phần II — Capability Gap Analysis: Harnix vs Competitors

### 2.1 Harnix có mà đối thủ thiếu (Competitive Advantages)

| Capability | Harnix | Trellis | ECC | Spec Kit | BMAD | Task Master |
|---|---|---|---|---|---|---|
| Frozen contracts + input digest verification | ✅ TaskRecordV2 + SHA-256 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Deterministic ready-trace audit | ✅ Grammar v1 | ❌ | ❌ | ❌ | ❌ | ❌ |
| Explicit Bypass/Lite/Full ceremony routing | ✅ State machine | Partial | ❌ | Partial | Partial | ❌ |
| Two-stage compliance+security review | ✅ harnix-check | ❌ | Partial | ❌ | ❌ | ❌ |
| Safe managed ownership (3-way hash) | ✅ Manifest v1 | Partial | ❌ | ❌ | ❌ | ❌ |
| Context budgeting + ranking + disclosure | ✅ Scorer v1 | ❌ | Partial | ❌ | ❌ | ❌ |
| Footprint reduction (85-99% vs upstream) | ✅ Measured | ❌ Baseline | N/A | N/A | N/A | N/A |
| Self-audit mechanism | ✅ HX-TARGET-01 | ❌ | ❌ | ❌ | ❌ | ❌ |

### 2.2 Đối thủ có mà Harnix chưa có (Gaps to evaluate)

| Capability | Who has it | Harnix decision | Rationale |
|---|---|---|---|
| Native MCP server for task state | Task Master, Cursor ecosystem | **Deferred** | PRD rejects "default MCP"; giá trị cao nhưng cần user opt-in design |
| 30+ platform support | Spec Kit, Trellis (5+) | **Reject** | Shallow integration < Deep integration; quality > quantity |
| IDE-level sub-threading (Boomerang) | Roo Code | **Reject** | Harnix single-agent capable; context budget giải quyết cùng bài toán |
| Dynamic tool-call blocking (Adversary) | Goose | **Defer** | Interesting governance pattern; harnix-check covers post-facto |
| 142 skills / 68 commands | ECC | **Reject** | Lean principle; 7 canonical skills đủ cho state machine |
| Virtual team roles (PM, Architect, Dev) | BMAD | **Reject** | Harnix single-agent; roles embedded in workflow stages |
| Visual task tree in IDE | Task Master | **Defer** | IDE integration beyond CLI scope; MCP prerequisite |

### 2.3 Quyết định adopt/adapt/defer/reject cập nhật

| Source | Capability | Decision | Adaptation |
|---|---|---|---|
| Spec Kit | Artifact-based phase transitions | `already adopted` | prd.md/plan.md + ready-trace |
| Spec Kit | Cross-platform broad support | `reject` | Deep > Shallow |
| BMAD | Agent-as-Code config | `reject` | Harnix uses SKILL.md; simpler |
| BMAD | Readiness flow | `already adopted` | Ready self-review + audit |
| Task Master | MCP task state exposure | `defer` | Track for future user-opt-in design |
| Task Master | PRD → hierarchical task parsing | `already adopted` | TaskRecordV2 + plan slices |
| Roo Code | Boomerang sub-threading | `reject` | Context budget suffices |
| Goose | Adversary/governance mode | `defer` | Monitor; check stage 2 partial coverage |
| Amp | Policy-as-code gates | `already adopted` | Frozen contracts are policy-as-code |
| Trellis (current) | 5+ platform configurators | `reject` | Quality 4 > Quantity 24 |
| ECC (current) | Massive skill ecosystem | `reject` | 7 focused skills > 142 generic skills |

---

## Phần III — Findings từ Internal Audit

### 3.1 Docs drift — Claude Code bị sót tên (7+ locations)

| File | Line | Vấn đề | Action |
|---|---|---|---|
| `package.json` | L4 | description: "Kiro, Antigravity, and Codex" — thiếu Claude Code | **Fix** |
| `docs/HARNIX_PRD.md` | L174 | §9 title không liệt kê Claude Code (dù §9.4 đã có đầy đủ) | **Fix** |
| `docs/HARNIX_PRD.md` | L338, L365, L409 | "Kiro, Antigravity và Codex" — thiếu Claude Code | **Fix** |
| `docs/HARNIX_PRD.md` | L417 | §17: "all fifteen public commands" — phải là sixteen | **Fix** |
| `docs/HARNIX_PRD.md` | L465 | Phase 6: "Kiro, Antigravity and Codex" — thiếu Claude Code | **Fix** |
| `docs/HARNIX_WORKFLOW.md` | L14, L254, L270, L302 | "Kiro, Antigravity (and/và) Codex" — thiếu Claude Code | **Fix** |
| `docs/HARNESS_RESEARCH.md` | L36, L121, L187, L197 | "Kiro, Antigravity và Codex" — thiếu Claude Code | **Fix** |
| `docs/HARNESS_RESEARCH.md` | §4 (~L201) | Chỉ có Codex, Kiro, Antigravity — thiếu Claude Code section | **Add** |
| `docs/UPSTREAM_MAPPING.md` | L23 | "Chỉ Kiro, Antigravity và Codex" | **Fix** |
| `docs/UPSTREAM_MAPPING.md` | §6 (~L114) | Chỉ có 3 platform — thiếu Claude Code | **Add** |

### 3.2 Structural docs defect — IMPLEMENTATION_PLAN.md §4

| Vấn đề | Lines | Action |
|---|---|---|
| §4.4A bị cắt đôi | L341 (§4.4A) → L345 (§4.6 Roadmap chèn vào) → L365 (ContextSelectionSnapshotV1 lạc chỗ) | **Relocate** |
| Trùng §4.6 | L345 (Roadmap) vs L525 (Doctor) | **Renumber** |
| Thứ tự command numbering | L487 (skill=15th) vs L489 (audit=14th) | **Fix** |
| L1018 | "all fourteen public commands" — phải là sixteen | **Fix** |

### 3.3 Research gaps

| Gap | Action |
|---|---|
| §4 thiếu Claude Code analysis | Thêm section phân tích CLAUDE.md, settings.json hooks, skills, CLAUDE_CONFIG_DIR |
| Thiếu ecosystem positioning vs meta-harness competitors | Thêm section so sánh vs Spec Kit, BMAD, Task Master, Trellis current |
| Thiếu deferred MCP note | Ghi nhận MCP trend trong §7 Deferred |
| Thiếu Continue.dev shutdown note | Thêm vào §7 Rejected |

### 3.4 Architecture / Code health (confirmed OK)

| Area | Status |
|---|---|
| 4 configurators (kiro, antigravity, codex, claude) | ✅ Đầy đủ |
| 7 canonical skills | ✅ Đầy đủ |
| 6 languages + 11 technologies guides | ✅ Hợp lý |
| 5 runtime dependencies | ✅ Lean |
| Self-hosting (.harnix/) | ✅ Active, idle state |
| README.md | ✅ Đã có đủ 4 platforms |

---

## Phần IV — Kế hoạch Refactor chi tiết

### Phase R1: Docs Consistency — Claude Code naming (HIGH)

Checklist:

- [ ] `package.json` L4: thêm "Claude Code" vào description
- [ ] `docs/HARNIX_PRD.md`:
  - [ ] L174 §9 title: thêm "Claude Code" (nếu title liệt kê platforms)
  - [ ] L338: thêm "Claude Code"
  - [ ] L365: thêm "Claude Code"
  - [ ] L409: thêm "Claude Code"
  - [ ] L417 §17: "fifteen" → "sixteen"
  - [ ] L465 Phase 6: thêm "Claude Code"
- [ ] `docs/HARNIX_WORKFLOW.md`:
  - [ ] L14: thêm "Claude Code"
  - [ ] L254: thêm "Claude Code"
  - [ ] L270: thêm "Claude Code"
  - [ ] L302: thêm "Claude Code"
- [ ] `docs/HARNESS_RESEARCH.md`:
  - [ ] L36: thêm "Claude Code"
  - [ ] L121: thêm "Claude Code"
  - [ ] L187: thêm "Claude Code"
  - [ ] L197: thêm "Claude Code"
- [ ] `docs/UPSTREAM_MAPPING.md`:
  - [ ] L23: thêm "Claude Code"
  - [ ] §6 (~L114): thêm Claude Code platform mapping table

### Phase R2: Structural Fix — IMPLEMENTATION_PLAN.md §4 (HIGH)

- [ ] Di chuyển `### 4.6 Roadmap epic tracking` (L345-363) ra khỏi giữa §4.4A
- [ ] Đánh lại numbering: §4.4A kết thúc đúng chỗ → Roadmap epic = §4.7 → Doctor = §4.8 (hoặc appropriate slots)
- [ ] Fix command numbering: skill/audit thứ tự đúng
- [ ] Fix L1018: "fourteen" → "sixteen"
- [ ] Verify: zero frozen type/enum/path semantic changes

### Phase R3: Research Expansion (MEDIUM)

- [ ] Thêm `### Claude Code` vào §4 Platform research decisions:
  ```
  - CLAUDE.md structure: project `.claude/` + user `~/.claude/CLAUDE.md`
  - settings.json: `hooks.UserPromptSubmit` group, no matcher
  - Skills: `~/.claude/skills/harnix-*`
  - CLAUDE_CONFIG_DIR: relocates `~/.claude` root
  - Không touch ~/.claude.json, credentials, MCP servers, projects/, history, todos/
  ```
- [ ] Thêm `### 3.13 Ecosystem positioning 2026-09` (hoặc §3.14 nếu 3.13 đã dùng):
  - Harnix vs meta-harness competitors (Trellis, ECC, Spec Kit, BMAD, Task Master)
  - Harnix vs terminal agents (Claude Code, Kiro, Codex, Antigravity)
  - Harnix vs IDE-native (Cursor, Windsurf, Cline/Roo)
  - Harnix vs autonomous agents (Devin, Aider, OpenHands)
  - Unique positioning: cross-platform meta-harness with frozen contracts
- [ ] Cập nhật §7 Deferred: thêm MCP task state exposure note
- [ ] Cập nhật §7 Rejected: thêm Continue.dev shutdown, 30+ platform breadth, massive skill ecosystems, virtual team roles, IDE sub-threading

### Phase R4: Cross-document Consistency Audit (MEDIUM)

Grep patterns phải zero hits sau refactor:

- [ ] `"Kiro, Antigravity.*(and|và) Codex"` without Claude Code in docs/*.md + package.json
- [ ] `"fifteen"` in docs/*.md contexts mentioning commands
- [ ] `"three platform"` hoặc `"ba platform"` → should be "four"/"bốn"
- [ ] `"fourteen public"` in docs/*.md → should be "sixteen"
- [ ] Verify §4 headings: unique numbering, no gaps
- [ ] Verify HARNESS_FEATURE_PROVENANCE.json has Claude Code entries

### Phase R5: README & Metadata Refresh (LOW)

- [ ] README.md: confirmed already has 4 platforms ✅
- [ ] `package.json` keywords nếu có
- [ ] CHANGELOG.md entry cho đợt refactor

---

## Phần V — Guardrails

### Không được phá vỡ

1. **Frozen contracts §4** — chỉ sửa cấu trúc/numbering, KHÔNG đổi field names, enums, types, paths, transitions, exit semantics
2. **Một npm package** `@tamtiger/harnix`, một executable `harnix`
3. **Chỉ 4 platforms**: Kiro, Antigravity, Codex, Claude Code — KHÔNG thêm mới
4. **Backward compatibility**: schema v1/v2, manifest, hook protocol giữ nguyên
5. **KHÔNG commit/branch/push/PR tự động**
6. **Runtime stays in package** — không copy scripts vào consumer repos
7. **AGPL-3.0** license, MIT attribution cho ECC/Superpowers

### Scope exclusions

- Không implement MCP server (deferred, không thuộc đợt này)
- Không thêm Adversary mode (defer, monitor)
- Không thêm platform mới (Cursor, Windsurf, Devin, etc.)
- Không thay đổi src/ code (đợt này chỉ docs + package.json)

---

## Phần VI — Execution Instructions

### Workflow routing

Full task → Harnix workflow: brainstorm → planning → ready → implement → verify → finish

### Acceptance Criteria

| ID | Criterion | Verification |
|---|---|---|
| AC-1 | Mọi docs mention đủ 4 platforms | Grep audit: zero "Kiro, Antigravity, and/và Codex" without Claude Code |
| AC-2 | IMPLEMENTATION_PLAN.md §4 numbering liên tục, không trùng, §4.4A nguyên vẹn | Structure review |
| AC-3 | PRD §17 ghi "sixteen public commands" | Text match |
| AC-4 | HARNESS_RESEARCH.md có Claude Code platform section | Section exists |
| AC-5 | HARNESS_RESEARCH.md có ecosystem positioning section | Section with ≥5 competitor comparisons |
| AC-6 | package.json description mentions Claude Code | JSON field check |
| AC-7 | Build, typecheck, lint pass | Exit code 0 |
| AC-8 | Không frozen contract semantic change | Diff review: types/enums/paths unchanged |
| AC-9 | CHANGELOG.md updated | Entry exists |
| AC-10 | Zero grep remnants: "three platform", "fifteen command", "fourteen public" | Grep audit zero hits |
| AC-11 | §7 Deferred updated with MCP note | Content check |
| AC-12 | §7 Rejected updated with Continue.dev, Cursor, Windsurf | Content check |
| AC-13 | UPSTREAM_MAPPING.md §6 has Claude Code mapping | Table exists |

### Cổng dừng

- Dừng tại `ready` nếu cần user decision
- Dừng sau Phase R2 nếu IMPL_PLAN structural fix cần approval (frozen contract doc)
- Không commit tự động — show changes và chờ approval

---

## Appendix A — Full Platform Evaluation Matrix

### Platforms đã support (confirmed keep)

| Platform | Category | Surface | Hook System | Status |
|---|---|---|---|---|
| **Kiro** | Terminal/CLI | `~/.kiro/` skills/steering/hooks | JSON-v1 `UserPromptSubmit` | ✅ Keep |
| **Antigravity** | Terminal/CLI | Desktop + CLI plugins `~/.gemini/` | `PreInvocation` handler | ✅ Keep |
| **Codex** | Terminal/CLI | `$HOME/.agents/skills/`, `$CODEX_HOME/` | `config.toml` inline handler | ✅ Keep |
| **Claude Code** | Terminal/CLI | `~/.claude/` skills/CLAUDE.md/settings.json | `hooks.UserPromptSubmit` group | ✅ Keep |

### Platforms evaluated and rejected/deferred

| Platform | Category | Decision | Key Reason |
|---|---|---|---|
| Cursor | AI-Native IDE | `reject` | No CLI hook API; .mdc rules IDE-only |
| Windsurf | AI-Native IDE | `reject` | Closed Cascade Memory; no interop |
| Cline/Roo Code | AI-Native IDE | `defer` | Emerging hook/skill; monitor Boomerang |
| Continue.dev | AI-Native IDE | `reject` | **Shutdown 06/2026** |
| Amazon Q | Enterprise | `reject` | Enterprise-locked, no user-global surface |
| GitHub Copilot | Enterprise | `reject` | No local hook/skill/workflow surface |
| Devin | Autonomous SWE | `defer` | Cloud-hosted but has AGENTS.md; monitor |
| Aider | Autonomous SWE | `reject` | No hook system, convention manual-load |
| OpenHands | Autonomous SWE | `reject` | Research framework, not production |
| SWE-Agent | Autonomous SWE | `reject` | Research benchmark, not production |

### Meta-harness competitors evaluated

| Competitor | Decision | Key Differentiator vs Harnix |
|---|---|---|
| Trellis | `upstream (adapted)` | Broader platform but larger footprint |
| ECC | `upstream (adapted)` | Deeper Claude Code but single-platform |
| Superpowers | `upstream (adapted)` | Methodology only, not tool |
| Spec Kit | `defer/monitor` | 30+ platforms but shallow integration |
| BMAD | `reject` | Virtual team roles ≠ single-agent workflow |
| Task Master | `defer/monitor` | MCP-based task state; similar concept |
| Goose | `defer/monitor` | Adversary mode interesting |
| Amp | `reject` | Enterprise multi-agent; different market |

---

## Appendix B — Harnix Unique Value Proposition (cho docs)

Harnix là **meta-harness** duy nhất kết hợp:

1. **Cross-platform deep integration** — 4 terminal/CLI agent platforms với user-global hooks, skills và context protocol (không IDE-only, không cloud-hosted)
2. **Frozen contract verification** — TaskRecordV2 với SHA-256 input digest, immutable evidence và deterministic ready-trace audit (không có đối thủ nào có)
3. **Lean footprint** — 85-99% giảm so với upstream baseline, 5 runtime deps, 7 canonical skills (vs 142 skills ECC, 236 template files Trellis)
4. **Single state machine** — Bypass/Lite/Full routing cho mọi request, không duplicate workflow hay platform-specific state
5. **Evidence-gated completion** — Completion chỉ từ fresh command output, criterion-linked check evidence, input digest matching
6. **Project-local, no-daemon, no-network** — Tất cả state trong `.harnix/`, không daemon/service/cloud/telemetry

---

*Prompt v2 tạo từ kết quả nghiên cứu ecosystem + orchestrator landscape 2026-09, internal audit 9 tài liệu + cây mã nguồn Harnix v1.1.16, và đối chiếu chi tiết với 6 meta-harness competitors + 10 coding agent platforms.*
