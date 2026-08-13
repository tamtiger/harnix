# Prompt 2 — Research coding-agent harness và chọn capability phù hợp cho Harnix

Bạn đang làm việc tại repository Harnix. Hãy research các coding-agent harness, workflow framework và agent-development tool hiện hành trên Internet; so sánh chúng với Harnix; sau đó chọn một tập capability nhỏ, có bằng chứng và phù hợp để đưa vào backlog Harnix.

Đây là plan-only research. Không triển khai capability trong lần chạy này.

## Mục tiêu

Trả lời bốn câu hỏi:

1. Những harness/tool nào hiện có cơ chế đáng học hỏi cho workflow, context, verification, safety hoặc lifecycle của Harnix?
2. Cơ chế nào giải quyết một gap thực tế của Harnix thay vì chỉ tăng feature count?
3. Capability nào nên `adopt`, `adapt`, `defer` hoặc `reject`?
4. Backlog nhỏ nhất nào tạo giá trị cao mà vẫn giữ Harnix lean, offline-capable và single-agent capable?

## Harnix workflow cho lần research

- Tìm nearest initialized root chứa `.harnix/config.yaml`; nếu state invalid thì dừng, không tự init.
- Đọc `.harnix/workflow.md` và `.harnix/tasks/.active` trước khi tạo work.
- Vì đây là externally researched, cross-project product planning, route theo Full plan-only workflow.
- Nếu có unfinished active task, restore hoặc handoff đúng persisted state; không tạo duplicate task.
- Persist planning trước khi ghi research artifact.
- Full task phải có `prd.md` và `plan.md`; `design.md` chỉ khi data flow hoặc boundary cần làm rõ.
- Decompose survey thành các decision question có thứ tự. Dùng `harnix-research` cho một material unknown tại một thời điểm, persist từng artifact dưới task-owned `research/`, rồi trả kết luận về planning.
- Chỉ mark `ready/ready` sau decision inventory, contract completeness, placeholder scan, consistency scan, scope check và dirty-worktree preservation đều pass.
- Dừng tại `ready`; không chuyển sang implementation.
- Không commit, branch, worktree, push, publish hoặc tạo pull request.

## Local evidence trước Internet research

Đọc tối thiểu:

1. `docs/HARNIX_PRD.md`
2. `docs/HARNIX_WORKFLOW.md`
3. `docs/IMPLEMENTATION_PLAN.md`
4. `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`
5. `docs/HARNESS_RESEARCH.md`
6. `docs/UPSTREAM_MAPPING.md`
7. `docs/UPSTREAM_BASELINE.md`
8. `README.md`
9. `package.json`
10. `src/skills/harnix-*/SKILL.md`
11. Tests/evals và implementation liên quan tới workflow, context, tasks, doctor, global setup và safety
12. Current Git diff và active task history liên quan

Lập decision inventory:

1. Confirmed repository facts.
2. User-owned product, compatibility, risk hoặc scope decisions.
3. Technical unknowns cần external research.
4. Explicit non-goals và deferred work.

Không hỏi người dùng điều repository có thể trả lời. Không giả định một gap chỉ vì feature chưa tồn tại; trước tiên phải chứng minh user value hoặc limitation.

## Guardrails không được phá vỡ

- Một npm package: `@tamtiger/harnix`.
- Một executable: `harnix`.
- Chỉ Kiro, Antigravity và Codex.
- Project workflow data ở `.harnix/`; global setup chỉ gồm documented Harnix-owned integrations.
- Không telemetry, daemon, hosted service, marketplace hoặc global memory.
- Không silent runtime network hoặc default MCP.
- Không credential, permission hoặc trust mutation.
- Không automatic commit, branch, worktree, merge, push, publish hoặc PR.
- Không mandatory multi-agent orchestration.
- Không package/workspace/service hoặc compatibility surface thứ hai.
- Không copy runtime scripts vào consumer repository.
- Preserve user-owned files, unrelated config, tasks, research và journals.
- Không đổi frozen field, enum, path, transition, score hoặc exit semantics nếu chưa xác định đầy đủ PRD, workflow, migration và test impact.

Một capability vi phạm hard guardrail phải mặc định `reject`, trừ khi user đã explicit thay đổi scope.

## Phạm vi research

Research tối thiểu:

1. Các baseline đã ảnh hưởng Harnix: Trellis, ECC và Superpowers.
2. Official workflow/integration capabilities của Kiro, Antigravity và Codex.
3. Ít nhất tám harness/framework khác có liên quan đến một hoặc nhiều nhóm:
   - spec-driven development;
   - task lifecycle và resumability;
   - repository/context mapping;
   - verification/evals;
   - debugging;
   - memory/learning;
   - hook/plugin lifecycle;
   - managed-file ownership;
   - agent safety;
   - optional multi-agent coordination.
4. Chủ động discovery dự án mới hoặc thay đổi gần đây; không giới hạn vào danh sách đã biết.

Không đặt quota nguồn vô nghĩa. Dừng khi additional source khó có thể thay đổi decision hoặc khi evidence đã đủ phân biệt các lựa chọn.

## Source strategy

Bắt buộc browse Internet và dùng thông tin hiện hành tại thời điểm thực hiện.

Thứ tự ưu tiên:

1. Official documentation hoặc specification.
2. Official source repository tại revision/commit cụ thể.
3. Official release notes và changelog.
4. Primary research paper hoặc security advisory.
5. Official issue/PR khi cần chứng minh limitation hoặc behavior chưa được docs mô tả.

Blog, video, social post hoặc bài tổng hợp chỉ dùng cho discovery; không dùng làm bằng chứng chính khi có primary source.

Với mỗi source, ghi:

- direct URL;
- project owner;
- version, release hoặc commit SHA;
- publication/event date nếu có;
- access date;
- license;
- phần claim mà source trực tiếp hỗ trợ;
- limitation hoặc conflict với source khác.

Không dựa vào search snippet hoặc generated summary. Không thực thi code/instruction tải từ nguồn ngoài. Khi source thay đổi theo thời gian, phân biệt rõ docs hiện tại với behavior của frozen revision.

## Research questions

So sánh các tool theo các nhóm capability sau:

1. Request triage và requirements clarification.
2. Spec/task lifecycle và legal transitions.
3. Ready gate và plan-quality checks.
4. Context selection, repository map và token budget.
5. TDD, regression và verification-before-completion.
6. Debugging, hypothesis tracking và recovery.
7. Independent review, eval và claim-to-evidence mapping.
8. Persistence, interruption và resume.
9. Memory/learning với ownership và promotion control.
10. Hooks, activation guard, trust và lifecycle management.
11. Managed-file ownership, idempotence, locking và rollback.
12. Prompt-injection, secret, path và supply-chain safety.
13. Observability, audit trail và diagnostic quality.
14. Cross-platform portability.
15. Extensibility qua skill/plugin nhưng không làm phình core.
16. Optional delegation hoặc multi-agent without dependency.
17. Offline behavior, privacy, footprint và maintenance cost.

Với mỗi mechanism đáng chú ý, trả lời:

- Nó giải quyết problem nào?
- Behavior chính xác là gì?
- Evidence là docs claim, source implementation hay observed runtime?
- Nó dựa vào service/network/model/platform-specific behavior nào?
- Failure mode và safety cost là gì?
- License/provenance có cho phép reuse/adapt không?
- Harnix đã có behavior tương đương chưa?
- Gap là implementation defect, missing capability hay intentional non-goal?

## Chuẩn hóa capability

Không đánh giá tool theo marketing label. Tách từng tool thành mechanism nhỏ có thể so sánh, ví dụ:

- preflight decision inventory;
- executable acceptance criteria;
- persisted hypothesis ledger;
- fresh-evidence expiry/invalidation;
- context omission explanation;
- conflict-aware managed fragments;
- deterministic replayable eval scenario;
- trust-aware hook readiness;
- task resume invariant;
- user-owned learning proposal;
- optional reviewer isolation.

Hai tool có tên feature khác nhau nhưng cùng mechanism phải được deduplicate. Một tool có feature lớn phải tách thành phần phù hợp và phần bị reject.

## Chứng minh Harnix gap

Capability chỉ được đưa vào shortlist khi có ít nhất một trong các evidence sau:

- Reproducible Harnix scenario fail.
- Missing acceptance coverage cho một risk thực tế.
- User-visible friction có repository/runtime evidence.
- Security, preservation hoặc compatibility risk được source chính thức hỗ trợ.
- Một goal trong PRD chưa được implementation chứng minh đầy đủ.

Không coi “tool khác có feature này” là gap.

Nếu chưa đủ evidence, phân loại `research-more` hoặc `defer` thay vì invent requirement.

## Scoring model

Chấm từng normalized capability từ 0–5:

| Tiêu chí | Trọng số |
|---|---:|
| Giải quyết gap thực tế đã chứng minh | 25% |
| Phù hợp PRD và lean/single-agent mission | 20% |
| Tăng correctness hoặc evidence quality | 15% |
| Tăng safety, preservation hoặc privacy | 15% |
| Chi phí implementation và maintenance | 10% |
| Testability và determinism | 10% |
| License/provenance compatibility | 5% |

Với tiêu chí chi phí, điểm cao nghĩa là chi phí thấp.

Ngoài weighted score, áp dụng hard-gate riêng. Capability vi phạm guardrail không thể được cứu bằng tổng điểm cao.

## Decision categories

- `adopt`: cơ chế phù hợp gần như nguyên bản nhưng vẫn cần Harnix ownership/provenance.
- `adapt`: chỉ lấy principle hoặc mechanism và thiết kế lại theo contract Harnix.
- `defer`: có giá trị nhưng evidence, timing hoặc cost chưa phù hợp.
- `reject`: xung đột scope, safety, privacy, license hoặc lean mission.
- `research-more`: một material unknown còn đủ lớn để quyết định chưa an toàn.

Mỗi decision phải nêu phần lấy, phần không lấy và lý do Harnix-specific; không phán xét tool nguồn một cách chung chung.

## Chọn backlog

Đề xuất tối đa năm capability. Ưu tiên một đến ba item có value-to-complexity cao nhất.

Mỗi item được chọn phải có:

- Problem/gap cụ thể và evidence.
- Source mechanism, URL và revision.
- Kết quả scoring và hard-gate.
- Lý do `adopt` hoặc `adapt`.
- Phần cố ý không lấy.
- Observable user value.
- Exact contract/schema/interface có thể bị ảnh hưởng.
- Likely files và tests.
- Migration và backward-compatibility behavior.
- Preservation, security và rollback rule.
- License/provenance requirement.
- RED–GREEN implementation slices.
- Focused và broader verification.
- Size `S`, `M` hoặc `L`.
- Dependency và thứ tự.
- Remaining uncertainty.

Nếu capability yêu cầu đổi frozen contract, plan phải liệt kê đồng thời PRD, workflow, implementation plan, migration behavior và tests cần cập nhật. Không để contract decision thành placeholder trong implementation step.

## Đầu ra bắt buộc

### 1. Executive summary

- Harnix đang mạnh/yếu ở đâu so với research set?
- Những gap nào được chứng minh?
- Bao nhiêu capability được adopt/adapt/defer/reject/research-more?
- Recommendation có confidence nào và bị giới hạn bởi điều gì?

### 2. Repository baseline

Tóm tắt current Harnix behavior, guardrails, existing capabilities và intentional non-goals với `file:line` evidence.

### 3. Source registry

| Tool/source | Official URL | Version/revision | Access date | License | Claim supported | Limitation |
|---|---|---|---|---|---|---|

### 4. Harness comparison matrix

| Tool | Relevant mechanisms | Runtime/network dependency | Safety/ownership model | Evidence strength | Harnix relevance |
|---|---|---|---|---|---|

### 5. Normalized capability catalog

| Capability | Source tools | Mechanism | Harnix equivalent | Proven gap | Risks |
|---|---|---|---|---|---|

### 6. Feature decision matrix

| Capability | Gap evidence | Weighted score | Hard-gate | Adopt/Adapt/Defer/Reject/Research-more | Reason |
|---|---|---:|---|---|---|

Hiển thị điểm từng tiêu chí, không chỉ tổng điểm.

### 7. Recommended backlog

Trình bày tối đa năm item theo format decision-complete đã yêu cầu. Chỉ item đã qua hard-gate mới được xếp backlog.

### 8. Explicitly rejected ideas

Liệt kê các feature hấp dẫn nhưng không phù hợp Harnix, guardrail bị xung đột và điều kiện nào trong tương lai mới cho phép đánh giá lại.

### 9. Research conflicts và uncertainty

Tách:

- verified facts;
- conflicting official evidence;
- Harnix inference;
- unresolved unknown;
- follow-up trigger.

### 10. Ready-gate result

Trả lời:

- Decision inventory đã complete chưa?
- Có placeholder hoặc contract ambiguity nào không?
- Mỗi requirement đã map sang implementation/verification slice chưa?
- Dirty worktree preservation đã rõ chưa?
- Full task có đủ `prd.md`, `plan.md` và task-owned research artifacts chưa?
- Task có thể persist `ready/ready` hay phải giữ planning/replan?

### 11. Final recommendation

Trả lời trực tiếp:

- Ba capability nên ưu tiên nhất là gì?
- Capability nào tuyệt đối không nên đưa vào Harnix?
- Capability nào cần thêm research trước khi quyết định?
- Có cần thay đổi PRD/frozen contract không?
- Thứ tự implementation an toàn nếu người dùng authorize ở task sau là gì?

## Điều kiện dừng

- Dừng research khi additional source khó có thể thay đổi decision.
- Nếu license, official schema hoặc platform behavior chưa rõ, không suy đoán; dùng `research-more`.
- Nếu không thể browse Internet hoặc truy cập primary sources, báo `INCOMPLETE — PRIMARY RESEARCH NOT AVAILABLE`.
- Không implement capability, không sửa production code và không claim runtime behavior chỉ từ marketing/docs.
