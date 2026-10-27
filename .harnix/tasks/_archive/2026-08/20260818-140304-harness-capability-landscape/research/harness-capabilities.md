# Nghiên cứu capability harness cần thiết cho Harnix

- Task ID: `20260818-140304-harness-capability-landscape`
- Ngày nghiên cứu: 2026-08-18
- Câu hỏi quyết định: Tập capability nhỏ nào có bằng chứng mạnh nhất để harden Harnix mà không mở rộng product boundary?
- Kết luận ngắn: chọn bốn hardening nội bộ; không bổ sung platform, runtime service, workflow catalog, auto-memory hoặc mandatory multi-agent.

## A. Executive summary

1. Harnix không còn thiếu một lifecycle harness cơ bản. TaskRecord v2, criterion-to-check mapping, input-digest freshness, context drift, bounded untrusted context, doctor, managed ownership và ba platform adapter đã bao phủ phần lớn capability cốt lõi mà Spec Kit, OpenSpec, Kiro Specs, BMAD, Superpowers và Trellis quảng bá.
2. Khoảng trống có giá trị cao nhất là **freshness của chính quá trình chọn context**. `context.json` hiện băm các file đã chọn, nhưng không chứng minh candidate set, repo-map inventory, selector signals và ranking version vẫn giống lúc chọn. Một file mới có liên quan có thể xuất hiện mà context drift vẫn báo `current`.
3. Khoảng trống thứ hai là **traceability có thể kiểm tra bằng máy giữa PRD, acceptance criteria, plan slice và validation check**. Schema hiện chứng minh criterion đã được required check bao phủ, nhưng phần PRD/plan vẫn dựa vào self-review bằng prompt. Spec Kit và OpenSpec cho thấy giá trị của cross-artifact analysis và structural validation, nhưng Harnix chỉ nên lấy phần structural nhỏ nhất.
4. Khoảng trống thứ ba là **an toàn của learning promotion**. Harnix đã yêu cầu recurrence/evidence và reviewable diff, nhưng `promotionProposal()` hiện render nguyên văn `candidate.statement`. Nghiên cứu Bad Memory năm 2026 cho thấy payload đã nằm trong persistent instruction/memory có thể tồn tại qua nhiều session và kích hoạt hành vi trái phép. Harnix nên giữ candidate như untrusted data đến tận bước review.
5. Khoảng trống thứ tư là **ranking repo-map theo dependency graph**. Harnix đã lưu `importTargets` và trả `reasons`, nhưng ranking vẫn chủ yếu lexical với bonus tĩnh. Aider dùng graph ranking dưới token budget; Harnix có thể thích nghi cơ chế dependency proximity/centrality offline mà không thêm embedding hoặc network.
6. Không nên nhập spec-delta/living-spec system của OpenSpec vào Harnix lúc này. Nó tạo một nguồn sự thật sản phẩm thứ hai cạnh task/PRD/learning hiện có và làm tăng ceremony/migration burden.
7. Không nên lấy workflow presets, extensions, bundles hoặc hàng chục platform integrations của Spec Kit/OpenSpec/BMAD. Chúng xung đột trực tiếp với một workflow, ba platform và một package của Harnix.
8. Không nên lấy auto-memory, hosted agent canvas, durable graph runtime, checkpoint time-travel hoặc mandatory multi-agent orchestration. Những cơ chế này mở rộng trust boundary, persistence và runtime footprint vượt product scope.
9. Dữ liệu ecosystem cho thấy cần ưu tiên cơ chế nhỏ và sở hữu được: Continue đã chuyển read-only, Roo Code đã shutdown/archive ngày 2026-05-15, AutoGen vào maintenance mode. Độ phổ biến không bảo đảm bề mặt tích hợp ổn định.
10. Roadmap gần chỉ nên có bốn item: selection-basis freshness, ready trace audit, untrusted learning promotion guard và dependency-aware repo-map ranking. Không có item thứ năm đủ mạnh.

## B. Phương pháp, nguồn và giới hạn

### B.1 Phương pháp

Nghiên cứu ưu tiên official documentation, official repository, source/test đã có trong Harnix và paper gốc. Search snippet chỉ dùng để tìm trang; kết luận dựa trên trang đã mở hoặc repository evidence. Mỗi capability được đối chiếu với:

- failure mode cụ thể;
- behavior Harnix hiện có;
- product boundary và security boundary;
- khả năng hoạt động offline/deterministic;
- khả năng kiểm thử bằng fixture/eval;
- implementation, maintenance, context và latency cost.

Điều kiện dừng đạt được khi 17 ứng viên đã bao phủ direct harness, adjacent coding agent và general orchestration framework; bốn recommendation đứng đầu được hỗ trợ bởi nhiều nguồn độc lập; các nguồn sau chỉ lặp lại pattern đã thấy.

### B.2 Nguồn sơ cấp chính

Tất cả nguồn bên ngoài được truy cập ngày 2026-08-18.

| Nguồn | Revision/version dùng | License/trạng thái | Fact chính dùng trong quyết định |
|---|---|---|---|
| [Trellis](https://github.com/mindfold-ai/Trellis) | `516b34e3591001b28fda5e2d4df3f717e82f5785`, frozen 2026-08-05 | AGPL-3.0 | Task/spec/context/journal lifecycle; đã được Harnix chọn lọc trước đây. |
| [ECC](https://github.com/affaan-m/ECC) | `f1fec0e53934737d3b3b8388b0fd1651e8b62f4f` | MIT | Conditional research, context budget, doctor/eval ideas; đã được chọn lọc. |
| [Superpowers](https://github.com/obra/superpowers) | `44c9b2d6e889982ac18c27d05a19fefe335194e1` | MIT | TDD, debugging, verification, planning/review discipline; mandatory Git/subagent đã bị loại. |
| [GitHub Spec Kit repository](https://github.com/github/spec-kit) và [reference](https://github.github.io/spec-kit/reference/overview.html) | `main` snapshot; README nêu ví dụ release `v0.12.11`; exact HEAD SHA không được HTML fetch cung cấp | MIT; active, docs cập nhật 2026-07 | `clarify`, `checklist`, `analyze`, `converge`; cross-artifact consistency và coverage. |
| [OpenSpec repository](https://github.com/Fission-AI/OpenSpec), [CLI validation](https://openspec.dev/docs/reference/cli), [core concepts](https://openspec.dev/docs/overview) | `main` snapshot | MIT; active; telemetry mặc định bật nhưng opt-out được | Spec delta, artifact workflow, strict structural validation và explicit `skip_specs`. |
| [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) | `main` snapshot | MIT; active theo repository/docs hiện hành | Workflow tự co giãn theo độ phức tạp, decision/context carry-forward; module/role surface lớn. |
| [Kiro Specs CLI](https://kiro.dev/docs/cli/v3/specs/), [Quick Spec](https://kiro.dev/docs/specs/quick-spec/), [hooks](https://kiro.dev/docs/hooks/) | Docs cập nhật 2026-07-09 đến 2026-07-28 | Proprietary product | Requirements/design/tasks, verification giữa task, quick vs full ceremony, hook lifecycle. |
| [OpenHands skills](https://docs.openhands.dev/overview/skills) và [SDK skill/context](https://docs.openhands.dev/sdk/guides/skill) | Current docs snapshot | MIT cho repository; active | Always-on, trigger-loaded và progressive disclosure; cảnh báo token cost của always-on context. |
| [Aider repo map](https://aider.chat/docs/repomap.html) và [lint/test](https://aider.chat/docs/usage/lint-test.html) | Current docs snapshot | Apache-2.0; active | Graph ranking trên dependency graph dưới token budget; focused lint/test feedback. |
| [Claude Code hooks](https://code.claude.com/docs/en/hooks) và [memory](https://code.claude.com/docs/en/memory) | Current docs snapshot | Proprietary product | Pre/post tool controls; docs cảnh báo resume replay text cũ thay vì chạy lại hook, làm timestamp/SHA stale; auto-memory persistence. |
| [OpenAI Docs: AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [skills](https://learn.chatgpt.com/docs/build-skills), [hooks](https://learn.chatgpt.com/docs/hooks) | Current official OpenAI documentation | Product/CLI licensing phụ thuộc surface | Layered guidance, progressive skills và trusted hooks; Harnix đã hỗ trợ đúng Codex surface. |
| [Cursor rules](https://docs.cursor.com/context/rules-for-ai) và [hooks changelog](https://cursor.com/changelog/1-7) | Rules docs + 1.7 changelog | Proprietary product | Always/auto/agent-requested/manual rule scope; hooks có thể audit, block hoặc redact. |
| [GitHub Copilot hooks](https://docs.github.com/en/copilot/concepts/agents/hooks) | Current official docs | Proprietary product | Pre-execution shell hooks cho policy/security enforcement. |
| [Continue rules](https://docs.continue.dev/customize/deep-dives/rules) và [repository](https://github.com/continuedev/continue) | Final 2.0.0 repository state | Apache-2.0; repository read-only, không còn active maintenance | Glob-scoped rules và codebase exploration; ecosystem lifecycle risk. |
| [Roo Code repository](https://github.com/RooCodeInc/Roo-Code) và [checkpoints](https://roocodeinc.github.io/Roo-Code/features/checkpoints/) | Archived repository snapshot | Apache-2.0; shutdown/archive 2026-05-15 | Custom modes/checkpoints; maintenance failure là tín hiệu tránh phụ thuộc surface rộng. |
| [LangGraph persistence](https://langchain-ai.github.io/langgraph/concepts/time-travel/) và [functional replay](https://langchain-ai.github.io/langgraph/how-tos/review-tool-calls-functional/) | Current docs snapshot | MIT; active | Checkpoint/replay yêu cầu serializable state và deterministic side-effect boundaries. |
| [AutoGen GraphFlow](https://microsoft.github.io/autogen/stable/user-guide/agentchat-user-guide/graph-flow.html) và [repository](https://github.com/microsoft/autogen) | Stable docs/repository snapshot | Code MIT, docs CC-BY-4.0; maintenance mode | Deterministic graph orchestration, nhưng experimental GraphFlow và framework đã maintenance-only. |
| [Toward Instructions-as-Code](https://arxiv.org/abs/2606.13449) | MSR 2026, DOI `10.1145/3793302.3793601` | Paper | 15.549 agentic PR/148 project: instruction files không mặc nhiên tăng merge rate; kết quả tăng và giảm gần cân bằng. |
| [Bad Memory](https://arxiv.org/abs/2607.14611) | arXiv 2607.14611 | Paper/preprint | Payload đã được cấy trong persistent memory/instruction có thể tấn công session hiện tại và tương lai. |

### B.3 Fact, inference và giới hạn

- **Fact:** Spec Kit có `analyze/checklist/converge`; OpenSpec validate structural issues và explicit skip; Aider dùng dependency graph ranking; Harnix hiện chỉ băm selected context entry và repo-map ranking chủ yếu lexical.
- **Inference:** selection-basis fingerprint và dependency-aware ranking sẽ giảm stale/missed context cho Harnix. Upstream không bảo đảm trực tiếp outcome này cho Harnix; cần fixture/eval trước khi triển khai.
- **Fact:** paper Instructions-as-Code cho kết quả mixed; instruction file không tự động cải thiện merge rate.
- **Inference:** Harnix nên lint/trace instruction artifacts thay vì sinh thêm nhiều prose.
- **Fact:** Bad Memory đánh giá payload đã nằm trong persistent files, không chứng minh mọi learning candidate là độc hại.
- **Inference:** giữ candidate statement trong untrusted boundary đến khi người dùng chấp thuận là hardening rẻ và hợp lý.
- Không chạy hoặc cài code upstream, không dùng benchmark marketing làm bằng chứng chất lượng, không xác định exact HEAD SHA khi GitHub HTML read-only không cung cấp. Trước khi chuyển thể code/text, phải khóa SHA/license riêng theo policy của Harnix.

## C. Landscape

| Ứng viên | Nhóm | Capability đáng học | Không phù hợp/giới hạn đối với Harnix |
|---|---|---|---|
| Trellis | Direct | Persisted lifecycle, scoped context, journal/continue | Harnix đã adapt; channel/worker, broad adapters, mandatory Git bị reject. |
| ECC | Adjacent harness/rules | Conditional research, context budget, doctor/evals | Harnix đã adapt phần high-signal; external scanner/hosted surfaces bị reject. |
| Superpowers | Direct workflow | TDD, root-cause debug, verification, review discipline | Harnix đã adapt; mandatory subagent/worktree/commit không phù hợp. |
| GitHub Spec Kit | Direct SDD harness | Cross-artifact analyze, checklist, converge, stable slice IDs | Presets/extensions/bundles, 35 integrations và workflow customization trái scope. |
| OpenSpec | Direct SDD harness | Structural validation, explicit stage skip, requirement scenarios | Living spec/delta store là nguồn sự thật thứ hai; telemetry default-on trái nguyên tắc Harnix. |
| BMAD Method | Direct workflow | Complexity-adaptive depth, explicit decisions/context carry | Nhiều roles/modules/workflows tạo ceremony và maintenance surface lớn. |
| Kiro Specs | Native platform workflow | Feature/bug/quick spec, verification theo task | Platform-specific; auto PR/multi-repo web behavior ngoài scope Harnix. |
| OpenHands | Adjacent coding-agent platform | Progressive disclosure, scoped skills, context condenser ideas | Agent server/automation/cloud/global registry và dynamic remote skill fetch ngoài scope. |
| Aider | Adjacent coding agent | Dependency graph repo-map, dynamic budget, immediate lint/test feedback | Auto-commit/Git integration và model gateway không phù hợp; graph ranking vẫn hữu ích. |
| Claude Code | Native agent platform | Hook freshness warning, deterministic pre/post-tool policy, scoped rules | Không phải supported platform; auto-memory và platform hook mutation không được port. |
| Codex | Supported platform | Layered AGENTS, skills, hooks, trust semantics | Harnix đã triển khai surface cần thiết; không mở rộng config/model/MCP/permissions. |
| Cursor | Adjacent platform | Explainable/scoped rule modes, security hooks | Không phải supported platform; proprietary and platform-specific. |
| GitHub Copilot | Adjacent platform | Pre-execution policy hooks | Không phải supported platform; không thêm integration. |
| Continue | Adjacent platform | Glob-scoped rules, built-in code search | Repository read-only; vector DB/remote docs/MCP không phù hợp. |
| Roo Code | Adjacent platform | Modes và checkpoints | Đã shutdown/archive; custom modes/time travel không phù hợp một workflow/no Git automation. |
| LangGraph | General framework | Durable replay, explicit checkpoint/state boundary | Server/DB/queue/long-term memory và agent runtime hoàn toàn ngoài product scope. |
| AutoGen | General framework | Structured graph/termination ideas | Multi-agent framework, GraphFlow experimental, project maintenance mode; reject. |

## D. Capability matrix và scoring

### D.1 Trọng số

Mỗi tiêu chí chấm 1–5, trong đó 5 là tốt nhất. Với implementation/maintenance/overhead, 5 nghĩa là chi phí hoặc overhead thấp.

- `V` user value: 15%
- `F` failure mode thực: 15%
- `G` khoảng trống Harnix: 15%
- `B` product-boundary fit: 15%
- `P` parity ba platform: 5%
- `T` deterministic testability: 10%
- `S` safety/privacy: 10%
- `I` implementation ease: 5%
- `M` maintenance ease: 5%
- `O` context/latency/footprint overhead: 2,5%
- `E` evidence quality: 2,5%

`Total = Σ(score / 5 × weight)`. Điểm chỉ hỗ trợ quyết định; requirement về boundary và security vẫn là gate tuyệt đối.

| Capability | V | F | G | B | P | T | S | I | M | O | E | Total | Quyết định |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Context selection-basis freshness | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 4 | 4 | 4 | 96 | `adapt` |
| Ready trace audit có cấu trúc | 5 | 4 | 4 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 91 | `adapt` |
| Untrusted learning-promotion guard | 5 | 5 | 4 | 5 | 5 | 4 | 5 | 4 | 4 | 5 | 4 | 91 | `adapt` |
| Dependency-aware repo-map ranking | 4 | 4 | 4 | 5 | 5 | 5 | 5 | 3 | 4 | 4 | 5 | 84 | `adapt` |
| Explicit no-spec/stage-skip marker | 3 | 3 | 2 | 5 | 5 | 5 | 5 | 4 | 4 | 5 | 5 | 73 | `defer` — Harnix đã có Lite/Full, waiver và TDD exception. |
| Living spec/spec delta store | 4 | 4 | 3 | 2 | 5 | 4 | 4 | 2 | 2 | 3 | 5 | 64 | `defer` — chỉ xem lại nếu user cần product-spec source of truth. |
| Platform PreToolUse security hooks | 4 | 5 | 3 | 1 | 1 | 3 | 3 | 1 | 1 | 3 | 5 | 51 | `reject` — không có parity và mở rộng global mutation/trust. |
| Checkpoint rewind/time travel | 3 | 3 | 3 | 2 | 2 | 3 | 2 | 1 | 2 | 2 | 4 | 47 | `reject` — đòi snapshot project/Git/runtime state. |
| Workflow presets/extensions/bundles | 3 | 3 | 1 | 1 | 3 | 3 | 2 | 1 | 1 | 2 | 5 | 39 | `reject` — trái một workflow và lean package. |
| Auto-memory/global learning | 3 | 5 | 1 | 1 | 2 | 2 | 1 | 2 | 1 | 2 | 5 | 37 | `reject` — privacy và prompt-injection risk. |
| Durable multi-agent graph runtime | 3 | 3 | 1 | 1 | 1 | 3 | 2 | 1 | 1 | 1 | 4 | 33 | `reject` — daemon/service/DB/subagent runtime ngoài mission. |

## E. Gap analysis của Harnix

### E.1 Context drift không bao phủ candidate-set drift

**Behavior hiện tại.** `src/core/context/context.ts` lưu `contentHash` cho từng selected entry và `inspectContextDrift()` chỉ so sánh các entry đó. `src/core/repo-map/types.ts` đã có `inventoryFingerprint`, nhưng `ContextManifest` không bind fingerprint, ranking version hoặc selector signals.

**Failure mode.** Sau khi task dừng, repository có thể thêm/rename một file, manifest, test hoặc guide đáng lẽ được chọn. Mọi selected file cũ vẫn không đổi nên state có thể báo `current`, dù context lý tưởng đã khác.

**Bằng chứng bên ngoài.** Claude Code docs ghi rõ resume replay nội dung đã lưu thay vì chạy lại mid-session hook, làm timestamp/commit SHA stale. LangGraph yêu cầu deterministic replay và captured task output để tránh lặp side effect. Đây không phải cùng implementation, nhưng cùng nguyên tắc: resume chỉ đáng tin khi inputs của selection/replay được khóa.

**Tác động.** Cao đối với long-running task; có thể làm replan dựa trên context thiếu. Đây là hardening nội bộ, không phải public feature mới.

### E.2 Ready gate còn một khoảng semantic/structural giữa artifact và TaskRecord

**Behavior hiện tại.** TaskRecord v2 bắt criterion-to-required-check coverage và skill yêu cầu plan checklist ánh xạ một-một với slice. Tuy nhiên PRD/plan là Markdown tự do; validator không chứng minh mọi criterion ID xuất hiện trong PRD và mỗi plan slice map tới criterion/path/check.

**Failure mode.** Agent có thể tạo TaskRecord hợp lệ nhưng bỏ một requirement trong plan, hoặc có checklist item không gắn validation. Prompt self-review có thể bỏ sót.

**Bằng chứng bên ngoài.** Spec Kit có `/speckit.analyze` cho consistency/coverage giữa spec-plan-tasks và `/speckit.checklist`; OpenSpec strict validator bắt structural omissions và yêu cầu explicit `skip_specs` khi change không có spec delta.

**Tác động.** Cao cho Full task; thấp cho Bypass/Lite. Nên kiểm tra structure/IDs, không dùng LLM judge ẩn.

### E.3 Learning candidate chưa được giữ trong untrusted-data boundary xuyên suốt

**Behavior hiện tại.** Learning cần ít nhất hai task, hai evidence và confidence `>=0.8`; promotion phải reviewable. Tuy nhiên `src/core/journal/promotion.ts` chèn nguyên `candidate.statement` vào proposal Markdown.

**Failure mode.** Nếu statement bị nhiễm instruction từ repository/web/task artifact, proposal có thể được agent đọc như authority hoặc được copy vào spec. Explicit approval giảm rủi ro nhưng không loại prompt injection trong chính bước review.

**Bằng chứng bên ngoài.** Bad Memory cho thấy payload đã cấy trong persistent memory/instruction có thể ảnh hưởng session hiện tại và tương lai. Paper không nói Harnix bị khai thác; đây là evidence cho threat model, không phải proof of exploit.

**Tác động.** Security impact cao, likelihood hiện tại trung bình-thấp nhờ explicit review và untrusted repository context. Hardening rẻ nên vẫn đáng ưu tiên.

### E.4 Repo-map lưu dependency hints nhưng chưa dùng graph signal

**Behavior hiện tại.** `searchRepoMap()` dùng MiniSearch, task/reference/package/language bonus và một filename heuristic cho implementation-test pairing. `importTargets` chỉ nằm trong terms/outline.

**Failure mode.** Lexical noise có thể xếp trên module dependency gần file active; test liên quan nhưng tên khác pattern không được ưu tiên.

**Bằng chứng bên ngoài.** Aider xây graph file/dependency và dùng graph ranking để chọn symbol quan trọng trong token budget. Harnix đã có structural metadata cần thiết nên có thể thử một subset nhỏ, offline.

**Tác động.** Trung bình-cao: tăng precision của discovery nhưng không thay correctness gate. Phải benchmark để tránh ranking phức tạp nhưng không cải thiện fixture outcome.

## F. Đề xuất được chọn

### F.1 Context selection-basis freshness — ưu tiên 1, size M

**Problem statement.** Content hash của selected files không phát hiện candidate set, config hoặc ranker đã thay đổi.

**User-visible behavior.** Khi continue/inspect, task báo `contextDrift: stale` với reason như `inventory-changed`, `selection-signals-changed` hoặc `selector-version-changed`; người dùng nhận replan thay vì tiếp tục trên context có vẻ current nhưng thực chất thiếu.

**Thiết kế tối thiểu.** Thêm task-owned sidecar hoặc ContextManifest v2 chứa `inventoryFingerprint`, `selectorVersion`, hash của normalized selection signals/config và selected/omitted reason summary. `workflow --inspect` chỉ so sánh dữ liệu cache/snapshot hiện có; không refresh repo-map, không scan repository trong platform hook.

**Cố ý không làm.** Không embedding/vector DB, watcher, daemon, runtime network, raw source cache, automatic context expansion hoặc hook-time repo-map query.

**Ảnh hưởng dự kiến.** `src/core/context/**`, `src/core/repo-map/**`, internal workflow inspect, TaskRecord/context docs và workflow tests. Nếu dùng ContextManifest v2 phải cập nhật frozen contract/migration/docs cùng change; sidecar mới giảm migration burden.

**Security/privacy.** Chỉ hash/fingerprint và repository-relative metadata; không ghi raw source/absolute path/secrets.

**Acceptance criteria.** Fixture thêm file mới liên quan, đổi config/ranker hoặc đổi repo inventory phải báo stale; content-only change vẫn giữ diagnostic path hiện tại; unchanged snapshot báo current; missing/invalid cache fail closed cho project state; non-Harnix hook vẫn no-op; cold-path thresholds không giảm.

**Verification.** Unit test fingerprint canonicalization; workflow continue fixture; corrupt/future sidecar fixture; context budget/security tests; performance measurement.

**Rollback/disable.** Reader hỗ trợ v1 như `not-recorded` và có thể xóa sidecar cache/task-owned mới; không mutate user content.

### F.2 Deterministic ready trace audit — ưu tiên 2, size M

**Problem statement.** Schema chứng minh criterion-check coverage nhưng chưa chứng minh PRD-plan-slice-check trace.

**User-visible behavior.** Full task không đạt ready nếu thiếu stable criterion reference trong PRD hoặc plan slice, checklist/slice trùng ID, slice không map criterion/check/path, hoặc còn placeholder contract-changing. Diagnostic chỉ ra artifact/ID cụ thể.

**Thiết kế tối thiểu.** Quy định một cú pháp Markdown nhỏ cho plan slice, ví dụ heading chứa stable slice ID và một dòng `Criteria:`/`Checks:`. Thêm hidden read-only audit action dùng parser deterministic; `harnix-brainstorm` chạy audit trước ready. Semantic correctness vẫn do self-review/người dùng quyết định.

**Cố ý không làm.** Không tạo living product spec, không LLM-as-judge, không tự rewrite artifacts, không workflow preset, không thêm approval gate thứ hai.

**Ảnh hưởng dự kiến.** `harnix-brainstorm`, task artifact parser/internal workflow, templates/evals, PRD/workflow/implementation-plan frozen contract nếu format trở thành bắt buộc.

**Security/privacy.** Parser bounded, không execute Markdown/code fence, reject unsafe paths và duplicate IDs.

**Acceptance criteria.** Valid Full artifact pass; missing/duplicate/unknown ID, orphan criterion, orphan slice và placeholder fail với JSON diagnostic ổn định; Lite không bị thêm ceremony; existing completed tasks vẫn byte-preserve.

**Verification.** Table-driven parser tests, v1/v2 task fixtures, skill behavior eval, migration/read-only compatibility tests.

**Rollback/disable.** Chỉ áp cho task mới sau schema/skill version; old unfinished task vào explicit replan mới nhận obligation.

### F.3 Untrusted learning-promotion guard — ưu tiên 3, size S–M

**Problem statement.** Evidence threshold không biến nội dung candidate thành trusted instruction; proposal hiện render nguyên statement.

**User-visible behavior.** Learning proposal hiển thị statement trong explicit untrusted-review boundary, provenance/evidence cạnh nội dung, cảnh báo khi có command/URL/credential-like hoặc instruction-override pattern, và không thể promotion tự động.

**Thiết kế tối thiểu.** Centralize renderer; escape/mark candidate as data, giữ hash/provenance trong review output hoặc sidecar, thêm Doctor diagnostic cho suspicious persistent-learning content. Promotion vẫn cần explicit user-owned diff; không auto-edit spec.

**Cố ý không làm.** Không semantic antivirus, external scanner, remote reputation, hidden memory, silent deletion hoặc tự sửa candidate.

**Ảnh hưởng dự kiến.** `src/core/journal/promotion.ts`, doctor, memory/journal output, safety fixtures và workflow docs. Ưu tiên sidecar/render hardening để tránh đổi LearningCandidate v1; chỉ tạo v2 nếu provenance không thể biểu diễn an toàn.

**Security/privacy.** Không log secret value; diagnostic redacted; URLs/commands chỉ được mô tả loại finding.

**Acceptance criteria.** Malicious fixture không thoát boundary; output không trở thành executable instruction; Doctor phát hiện nhưng không sửa; benign Unicode/commands-as-documentation không bị phá; promotion vẫn reviewable và deterministic.

**Verification.** Prompt-injection fixture corpus, journal/mem integration tests, doctor redaction tests, release secret/path scan.

**Rollback/disable.** Renderer change reversible; không migrate journal tự động và không mutate promoted spec.

### F.4 Dependency-aware repo-map ranking — ưu tiên 4, size M

**Problem statement.** Harnix đã lưu `importTargets` nhưng chưa dùng dependency proximity/centrality, làm lexical ranking bỏ lỡ file/test liên quan.

**User-visible behavior.** `repo-map --query` vẫn JSON và bounded, nhưng relevant dependency neighbor được xếp cao hơn với reason deterministic như `dependency-neighbor` hoặc `referenced-by`; tie-break vẫn POSIX path ổn định.

**Thiết kế tối thiểu.** Resolve import target chỉ trong indexed safe paths, xây in-memory directed graph bounded, thêm one-hop/two-hop proximity và capped centrality bonus. Không persist graph mới nếu có thể tái tạo từ cache v1; không thêm dependency.

**Cố ý không làm.** Không embeddings, vector DB, full AST, code body, call graph, network, cross-repository indexing hoặc auto test execution.

**Ảnh hưởng dự kiến.** `src/core/repo-map/search.ts`, optional helper, types chỉ khi thêm reason enum, unit/integration/performance fixtures.

**Security/privacy.** Chỉ dùng path/import target đã sanitized; không follow symlink; graph limits chống resource exhaustion.

**Acceptance criteria.** Trong fixture có lexical distractor, dependency neighbor/test đúng xếp trên noise; unresolved/external import bị bỏ an toàn; output deterministic; query <=20; footprint/cold-path không vượt gate; secrets/raw source không xuất hiện.

**Verification.** Golden ranking fixtures, property tests cho determinism/limits, benchmark trước-sau trên Harnix fixture, repo-map safety/release tests.

**Rollback/disable.** Ranking bonus có version/cờ nội bộ; quay lại lexical rank không đổi cache/public command.

## G. Deferred và rejected

### Deferred

- **Living product specs/spec delta:** xem lại chỉ khi người dùng muốn Harnix sở hữu product-spec source of truth xuyên nhiều task. Hiện task PRD + journal + explicit learning đủ và ít ceremony hơn.
- **Explicit no-spec marker:** OpenSpec xử lý tốt refactor/docs-only, nhưng Harnix đã có Lite/Full, non-goals, waiver và documented TDD exception. Chỉ thêm nếu audit cho thấy task thường xuyên nhầm behavior change với wiring/docs.
- **Maintainer-only platform contract drift probe:** có giá trị nhưng cần network/provenance policy và không được vào runtime. Xem lại nếu schema Kiro/Antigravity/Codex thay đổi thường xuyên hơn khả năng manual release research.
- **Context condenser/summary:** chỉ prototype nếu measured context budget vẫn overflow sau dependency-aware selection; summary có nguy cơ làm mất precision và tạo thêm stale artifact.

### Rejected

- Workflow template switching, presets, extensions, bundles, marketplace/catalog runtime.
- 20–35 platform adapters hoặc support Claude/Cursor/Copilot/Roo/Continue.
- Global/community skill registry và dynamic remote skill fetching.
- Auto-memory/global memory/hidden learning; paper Bad Memory củng cố quyết định loại bỏ.
- Platform pre/post-tool hooks do Harnix cài đặt để block command; không có parity và mở rộng trust/permission mutation.
- Durable multi-agent runtime, GraphFlow, server/queue/database, worker network hoặc mandatory subagent.
- Automatic Git commit/branch/worktree/PR và checkpoint rewind dựa trên Git snapshot.
- Embedding/vector DB/external code index/MCP mặc định.
- OpenSpec telemetry hoặc bất kỳ telemetry nào, kể cả anonymous/default-on.

## H. Roadmap đề xuất

| Ưu tiên | Capability | Loại | Giá trị chính | Chi phí | Bước tiếp theo |
|---:|---|---|---|---|---|
| 1 | Context selection-basis freshness | Hardening nhỏ, giá trị cao | Ngăn resume với candidate context đã đổi nhưng selected files cũ còn nguyên | M | Brainstorm contract sidecar vs ContextManifest v2; viết stale-added-file RED fixture trước. |
| 2 | Deterministic ready trace audit | Hardening workflow | Chứng minh PRD → criterion → slice → check bằng structure, giảm omission | M | Prototype parser trên task fixtures; không freeze syntax trước khi eval false positive. |
| 3 | Untrusted learning-promotion guard | Security hardening | Ngăn persistent candidate trở thành trusted instruction ngoài ý muốn | S–M | Threat-model `promotionProposal`, tạo malicious/benign fixtures và redaction contract. |
| 4 | Dependency-aware repo-map ranking | Context quality | Dùng metadata đã có để tăng precision mà không thêm network/embedding | M | Benchmark one-hop graph bonus trên deterministic fixtures và Harnix repo map. |

Không đề xuất item thứ năm. Các ý tưởng còn lại hoặc trùng capability hiện có, hoặc không đủ bằng chứng để thắng complexity/boundary cost.

## I. Open questions

Không có câu hỏi product-owner nào chặn kết luận nghiên cứu.

Hai quyết định kỹ thuật phải được giải quyết trong từng task implementation tương lai:

1. **Selection freshness nên dùng sidecar hay ContextManifest v2?** Recommendation: sidecar task-owned trước để giữ reader v1 và giảm migration; chỉ nâng schema nếu sidecar làm trùng invariant.
2. **Trace syntax nên nằm trong Markdown hay TaskRecord?** Recommendation: stable IDs trong Markdown + parser hidden, không thêm nested schema field trước khi prototype chứng minh lợi ích.

## J. Bảng quyết định cuối

| Ưu tiên | Capability | Quyết định | Giá trị chính | Chi phí | Bước tiếp theo |
|---:|---|---|---|---|---|
| 1 | Selection-basis freshness | `adapt` | Fresh resume/replan | M | Thiết kế + RED fixture |
| 2 | Ready trace audit | `adapt` | Coverage kiểm tra bằng máy | M | Prototype parser/eval |
| 3 | Learning promotion guard | `adapt` | Persistent prompt-injection defense | S–M | Threat model + safety fixtures |
| 4 | Dependency graph ranking | `adapt` | Context precision | M | Benchmark offline |
| — | Living specs | `defer` | Intent history | L | Chỉ xem lại khi có user demand |
| — | Presets/auto-memory/multi-agent runtime/platform expansion | `reject` | Không phù hợp boundary | XL | Không thực hiện |

## K. Kết luận và tác động tới plan

Nghiên cứu không biện minh cho việc mở rộng Harnix thành một ecosystem harness tổng quát. Bằng chứng ủng hộ bốn hardening nội bộ, theo thứ tự freshness → traceability → persistent-instruction safety → ranking quality. Nếu người dùng yêu cầu implementation, mỗi capability nên là một Full task riêng; không gộp thành một migration lớn. Bất kỳ thay đổi frozen schema nào phải cập nhật PRD, workflow, migration behavior và tests trong cùng change.
