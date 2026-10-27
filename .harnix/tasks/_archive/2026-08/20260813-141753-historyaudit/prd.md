# PRD: Refactor workflow state và instruction của Harnix

## Bối cảnh và vấn đề

Lịch sử Codex, persisted task state và source hiện tại cho thấy Harnix đã có một workflow thống nhất nhưng các contract quan trọng vẫn chủ yếu được thực thi bằng prose. TaskRecord v1 chưa được kiểm tra đầy đủ tại persistence boundary, instruction bị lặp giữa AGENTS/workflow/skill, completion journal chưa phân biệt bằng chứng cuối với lần thử đã bị thay thế, và policy riêng của repository Harnix đã lọt vào template dành cho consumer.

Nếu không refactor, một coding agent có thể báo hoàn tất trên state không hợp lệ, làm mất hoặc ghi sai evidence sau compaction, áp npm release semantics lên repository không dùng npm, hoặc vượt qua broad test gate trong khi vẫn vi phạm product boundary.

## Người dùng và giá trị

- Maintainer Harnix cần task state có thể kiểm tra, migrate và debug mà không sửa lại bằng chứng lịch sử.
- Coding agent cần một persistence boundary ngắn, rõ và atomic thay vì tự sửa JSON dựa trên prose dài.
- Consumer repository cần instruction đúng phạm vi, không bị buộc tuân theo release/version policy riêng của Harnix.
- Reviewer cần truy được từ finding tới requirement, implementation slice và fresh evidence.

## Kết quả cần đạt

1. Frozen TaskRecord v1 được enforce nhất quán khi đọc, ghi, chẩn đoán và hoàn tất task.
2. Agent có workflow operation ẩn, giới hạn và atomic để inspect/save/finish state mà không mở rộng public CLI.
3. Instruction được chia ownership rõ ràng và giảm lặp nhưng giữ nguyên safety behavior.
4. Completion evidence và journal phản ánh kết quả cuối có nghĩa, đồng thời giữ failure history trong task record.
5. Các correction đã quan sát trong lịch sử trở thành regression fixture có thể chạy lại.
6. Repository Harnix tự dùng canonical state/template sau khi integrity boundary đã chứng minh an toàn.
7. Workflow taxonomy và routing decision trở nên rõ, audit được và nhất quán giữa normalized policy, persisted state và skill trigger.
8. Các work kind phổ biến được map có chủ đích vào cùng lifecycle, với standalone review và test/hotfix semantics không bị suy diễn từ keyword.

## Phạm vi

- Normative docs, repository contributor instruction và generated AGENTS/workflow/skill của Harnix.
- Task, journal, doctor và hidden workflow persistence boundary.
- Completion evidence selection và history-derived regression eval.
- Self-host reconciliation của `.harnix` sau khi có validation và authorization phù hợp.
- Full acceptance sequence, fake-home smoke và release decision theo tài liệu hiện hành.
- Workflow inventory, entry routing, state-to-stage routing và cross-platform skill-trigger evaluation.

## Ngoài phạm vi

- Đổi field, enum hoặc schemaVersion của TaskRecord/JournalEntry v1.
- Thêm public command thứ chín, hosted service, telemetry, daemon hoặc transcript store.
- Tự sửa historical task/research/journal để che finding hoặc suy diễn evidence còn thiếu.
- Ghi global integration/profile thật, commit, push, publish hoặc tạo PR nếu chưa có quyền riêng cho hành động đó.
- Triển khai production code trong request plan-only đã tạo task này; implementation chỉ bắt đầu khi người dùng yêu cầu thực thi task.
- Tạo workflow hoặc core skill mới khi chưa có evidence một lifecycle boundary thật sự chưa được bao phủ.

## Pattern artifact của task hiện tại

Task dùng **Full + plan-only + evidence-first**: audit và research tạo bằng chứng trước, sau đó PRD và plan khóa quyết định, rồi task dừng tại `ready/ready`. Trình tự task là đúng, nhưng tên pattern ba bước trước đây chỉ mô tả luồng artifact và chưa diễn đạt đầy đủ lifecycle; bản đầu còn phân vai artifact chưa chuẩn vì audit report chứa cả target workflow và decision log, còn PRD chỉ mô tả đầu ra kiểm toán.

`Evidence → Requirements → Execution` phù hợp làm **artifact backbone**, nhưng chưa đủ làm full workflow: nó không nêu riêng Plan/Ready gate, Verify, Persist/Resume hoặc feedback loop. Pattern canonical được khuyến nghị là **Evidence-Gated Lifecycle** với chuỗi **Evidence → Requirements → Plan → Execute → Verify → Persist**; Restore/Triage là entry concern, còn Debug/Replan và Blocked/Continue là recovery loop. Mỗi loại thông tin vẫn chỉ có một nguồn canonical:

| Artifact | Vai trò canonical | Không nên chứa |
|---|---|---|
| `task.json` | State machine-readable, acceptance, validation và evidence trace | Diễn giải thiết kế dài hoặc hướng dẫn implement chi tiết |
| `audit-report.md` | Coverage, facts, findings, severity và giới hạn quan sát | Target product contract hoặc implementation sequence canonical |
| `research/*.md` | Source, version/ngày truy cập, fact, inference và uncertainty | Quyết định sản phẩm không truy về requirement |
| `prd.md` | **WHY/WHAT**: vấn đề, người dùng, outcome, scope, requirement, target behavior và acceptance | Thứ tự sửa file hoặc RED/GREEN recipe |
| `plan.md` | **HOW/WHEN**: slice, file/interface, test-first step, migration, rollback và verification | Mở rộng scope hoặc tự tạo requirement mới |
| Source/test/docs diff | Implementation thật khi task ở `in_progress`/`verifying` | Một artifact `implement.md` thay thế code/evidence |

RIPER, EPCC, Spec Kit/Kiro Specs, ReAct và Reflexion không được coi là năm workflow cạnh tranh cùng cấp. RIPER, EPCC và spec-driven development là outer lifecycle để tham khảo; ReAct, Reflexion và RED → GREEN → REFACTOR là inner loop bên trong research/implementation/debug. Harnix nhận Research/alternative/review từ RIPER, Explore/plan/code discipline từ EPCC và requirement/design/task traceability từ spec-driven workflow; không nhận mandatory Commit/PR, branch memory hoặc raw reasoning persistence. Phân tích nguồn và giới hạn nằm trong `research/coding-workflow-pattern-comparison.md`.

## PRD khác plan như thế nào

PRD là contract sản phẩm: giải thích tại sao thay đổi cần tồn tại và behavior nào phải đúng, độc lập tương đối với cách tổ chức code. Plan là contract thực thi: ánh xạ từng requirement sang file, thứ tự slice, RED/GREEN, migration, rollback và lệnh kiểm tra. Nếu đổi cấu trúc code nhưng outcome không đổi thì chủ yếu cập nhật plan; nếu đổi người dùng, scope, behavior hoặc acceptance thì phải cập nhật PRD trước rồi replan.

## Tại sao chưa có implementation

Request tạo task này giới hạn ở audit, research và planning nên task cố ý dừng ở `ready/ready`; production code chưa được phép thay đổi. Full workflow không định nghĩa `implement.md` là artifact bắt buộc. “Implement” là lifecycle stage `ready -> in_progress -> verifying`; artifact của stage đó là source/test/docs thay đổi cùng evidence mới trong `task.json` (và context có giới hạn nếu cần continuation).

Việc refactor chính task artifact trong request hiện tại không tự mở rộng quyền sang triển khai product code. Khi người dùng yêu cầu implement task `20260813-141753-historyaudit`, agent phải review lại PRD/plan, persist transition hợp lệ sang `in_progress/implementing`, rồi bắt đầu S0; không cần tạo task khác hoặc hỏi approval mang tính nghi lễ.

## Product requirements

### R0 — Consumer-safe normative guidance

Repository-only version/release policy phải ở contributor instruction của Harnix; generated consumer guidance chỉ tuân theo release instruction của project khi có. Tám public command, current phase và hook trust wording phải nhất quán giữa source chuẩn, template và docs.

### R1 — Enforced state integrity

Mọi read/write/Doctor path phải phát hiện invariant lỗi của TaskRecord v1, evidence, validation, journal, artifact path và active pointer. Active invalid state phải fail-closed; historical completed drift phải được report có giới hạn và không bị âm thầm viết lại.

### R2 — Bounded atomic persistence

Coding agent phải có hidden JSON-only operation để inspect, save và finish task qua validated atomic boundary. Operation phải reject unsafe path, illegal transition, stale/mutated evidence, oversized input, partial write và active-task mismatch; public help vẫn chỉ có tám command.

### R3 — Lean instruction ownership

AGENTS chỉ giữ activation, authority/safety, source routing và preservation; workflow chỉ giữ lifecycle/persistence invariant; procedure chi tiết chỉ nằm trong skill tương ứng; task state giữ dữ kiện thay đổi. Việc rút gọn phải được bảo vệ bằng routing và history-derived regression eval.

### R4 — Meaningful completion evidence

Completion journal chỉ tham chiếu evidence hỗ trợ criterion đã met và latest passing evidence của required validation. Failed/superseded evidence vẫn nằm trong task record và final summary phải phân biệt pass, failed-then-superseded, skipped, waived, omitted và manual check.

### R5 — History-derived regression protection

Các correction quan sát được trong lịch sử phải được chuyển thành fixture đã ẩn danh, lưu requirement và expected decision thay vì transcript, host thread ID, secret hoặc machine path.

### R6 — Safe self-host convergence

Repository Harnix chỉ reconcile `.harnix` sau khi integrity/Doctor mới và fake-repository fixture chứng minh chính xác preservation, migration và rollback. User-owned task/research/journal và modified managed content phải được giữ nguyên.

### R7 — Fresh completion and release evidence

Mỗi slice phải có focused verification; completion cần exact acceptance sequence, integrity inventory, Doctor, fake-home smoke, safety/attribution/release scan và disclosure rõ check bị bỏ qua. Manual disposable-profile smoke cần authorization riêng và không được suy diễn từ automated fixture.

### R8 — Auditable workflow routing

Harnix phải giữ đúng một canonical workflow, ba entry route và bảy stage skill. Entry router phải nhận normalized facts thay vì giả vờ parse prompt, ưu tiên active task trước new-task classification, phân biệt mutation authority với topic verb, và trả decision có reason code. Persisted status/checkpoint phải map duy nhất tới stage owner hoặc fail closed.

TaskRecord v1 không bổ sung authorization field. Khi implementation đã được cấp quyền và ready gate pass trong cùng logical run, workflow phải persist `ready` rồi chuyển ngay sang `in_progress/implementing` trước product edit. Nếu interruption để lại task ở `ready`, continuation chỉ implement khi current request cấp quyền rõ; nếu không thì report ready/wait. Rule này cố ý fail closed thay vì suy diễn approval đã mất.

Detection contract phải phân biệt ba lớp evidence:

1. deterministic policy test cho normalized facts và status/checkpoint;
2. static metadata/template test cho description, precedence và parity;
3. representative host prompt eval hoặc disposable smoke cho implicit skill activation.

Không được dùng unit test của `routeWorkflow()` để tuyên bố model đã detect đúng trên Kiro, Antigravity hoặc Codex.

### R9 — Evidence-gated lifecycle semantics

Harnix phải mô tả canonical lifecycle theo sáu semantic phase: Evidence, Requirements, Plan, Execute, Verify và Persist. Restore/Triage xảy ra trước phase chain; Debug/Replan quay lại Plan hoặc Execute; Blocked/Continue khôi phục đúng recorded stage. Các phase này là semantic view của state machine hiện có, không thêm status/checkpoint, workflow hoặc skill mới.

Phase-to-state ownership phải duy nhất và có thể kiểm tra:

- Restore/Triage, Evidence, Requirements và Plan dùng `planning|ready` với Continue, Brainstorm và Research theo material unknown; ready gate phải pass trước product edit.
- Execute dùng `in_progress/implementing|debugging` với Implement hoặc Debug.
- Verify dùng `verifying/verifying` với Check, luôn compliance trước quality/security.
- Persist dùng `verifying/finishing → completed/finishing` với Finish; supporting evidence, journal và active-pointer cleanup là completion semantics, còn Git không phải lifecycle phase.

Lite và Full chỉ thay đổi ceremony. Lite có thể gộp Evidence + Requirements + Plan trong compact TaskRecord khi scope rõ và risk thấp; Full giữ audit/research/PRD/plan khi mỗi artifact chứa decision cần resume/review. Không được dùng tên RIPER, EPCC hoặc Spec như mode thứ ba.

### R10 — Work-kind coverage không tạo workflow mới

Routing phải tách **action** người dùng yêu cầu khỏi **work kind** của thay đổi và **risk signal**. Action tối thiểu gồm inspect, plan, change, review và verify; work kind tối thiểu gồm feature, bugfix, hotfix, refactor, test, docs, maintenance, migration, dependency, security, performance và release. Code review là action áp lên một work kind, không phải workflow riêng. Work kind chỉ chọn planning concern, implementation strategy và validation profile; nó không tạo status, mode hoặc skill mới.

Contract theo nhóm:

| Request | Entry/mode | Stage path bắt buộc | Semantics riêng |
|---|---|---|---|
| Feature | Lite hoặc Full theo risk | Brainstorm → optional Research → Implement → Check → Finish | Behavior/acceptance mới; RED cho từng observable behavior |
| Bug fix | Lite hoặc Full | Brainstorm → Debug nếu root cause chưa biết, nếu không Implement → Check → Finish | Reproducer/regression trước fix; giữ failed hypothesis |
| Hotfix | Lite hoặc Full theo blast radius, không theo độ gấp | Bug-fix path | Ghi incident constraint, rollback và targeted evidence; không bỏ compliance/security/completion gate |
| Standalone code review | Bypass + Check read-only profile | Check rồi report | Không task/persist/mutation; finding có severity, file/line, evidence; không tự fix |
| Review rồi fix | Lite hoặc Full | Brainstorm → Implement/Debug → Check → Finish | Review finding là hypothesis; mutation cần task và fresh regression evidence |
| Refactor | Lite hoặc Full theo cross-layer/architecture risk | Brainstorm → Implement → Check → Finish | Khóa behavior-preservation contract; characterization/regression evidence trước và sau |
| Run/analyze tests | Bypass | Read-only/diagnostic execution rồi report | Không persist task trừ khi user yêu cầu thay đổi hoặc phát hiện cần fix |
| Add/change tests | Lite hoặc Full | Brainstorm → Implement → Check → Finish | Chứng minh test value bằng defect/fixture/coverage/mutation/contract evidence; không yêu cầu production diff giả tạo |
| Failing test fix | Lite hoặc Full | Brainstorm → Debug → Check → Finish | Reproduce, root cause, one-hypothesis loop; không đơn giản sửa assertion để xanh |
| Docs/config/build/maintenance | Lite hoặc Full | Brainstorm → Implement → Check → Finish | TDD exception chỉ khi behavior RED không có nghĩa; dùng parity/schema/build/integration evidence |
| Migration/dependency/security/performance/release | Full mặc định, explicit Lite chỉ khi policy cho phép và risk facts chứng minh | Brainstorm → optional Research → Implement/Debug → Check → Finish | Compatibility, rollback, supply-chain/security/baseline/release evidence theo loại |

`harnix-check` phải hỗ trợ hai incoming profile không nhập nhằng: (1) standalone review Bypass, read-only và không task mutation; (2) active-task verification tại `in_progress|verifying`. Nếu review request kèm sửa code, profile (1) không được sửa mà phải route Brainstorm để tạo/resume task.

Coverage chỉ được tuyên bố khi có ba lớp evidence cho từng representative work kind: deterministic route decision, static skill-description/procedure contract và host prompt eval trên Kiro/Antigravity/Codex. Keyword presence trong SKILL.md hoặc một unit test generic không đủ.

### R11 — Code-review protocol có thể discover và kiểm chứng

`harnix-check` phải được kích hoạt trực tiếp cho standalone code review, active-task verification và review-feedback evaluation mà không thêm skill hoặc workflow mới. Standalone review phải chọn phạm vi có giới hạn từ request và repository evidence (working-tree diff, explicit commit range hoặc file/path), chỉ đọc code/diff/test thực sự cần thiết và không mutate working tree, index, HEAD, task state hoặc external review system.

Finding phải được sắp theo severity thực tế và có vị trí chính xác, defect, impact, evidence và fix direction; verdict phân biệt ready, ready-with-fixes và not-ready. Khi không có finding, report vẫn phải nêu scope đã kiểm tra, check bị bỏ qua và residual risk thay vì suy diễn “không thấy lỗi” thành correctness proof. Feedback nhận được là technical hypothesis: verify từng item với requirement/code/test, clarify ambiguity trước mutation, xử lý từng finding theo blocking order và route Brainstorm/Implement/Debug trước mọi fix.

Harnix adapt discipline từ frozen Superpowers `requesting-code-review` và `receiving-code-review`, nhưng reject mandatory subagent, mandatory Git SHA/merge gate, praise ceremony, auto-fix và GitHub-specific reply behavior. Một canonical `harnix-check/SKILL.md` phải được cài byte-identical trên Kiro, Antigravity và Codex.

### R12 — Stage owner và checkpoint không mâu thuẫn

Active task routing phải xét `blocked` trước mọi checkpoint để blocker không bị bypass bởi `replan`. `harnix-debug` là owner duy nhất của `in_progress|verifying` tại checkpoint `debugging`; `harnix-implement` chỉ nhận `ready/ready` đã được authorize hoặc `in_progress/implementing`. Sau khi Check xác nhận toàn bộ prerequisite xanh, task phải persist `verifying/finishing` trước khi Finish chạy; `harnix-finish-work` chỉ nhận state đó và chuyển atomically sang `completed/finishing`, ghi journal rồi clear đúng active pointer.

Router decision table và static skill contract phải kiểm tra cùng mapping để prose không thể drift khỏi production policy. Blocked task hợp lệ luôn route `harnix-continue`, bất kể checkpoint thuộc resume status nào.

### R13 — Authorized global tool-session evidence không overclaim

Sau khi user cấp explicit authorization, active task phải chạy fake-home lifecycle và bounded real-tool probes cho Kiro, Antigravity và Codex. Skill discovery, hook execution, trust và precedence là các claim riêng: validator/file presence không chứng minh hook active. Defect nội bộ có RED/GREEN phải được sửa trong task; credential, interactive trust hoặc platform behavior chưa chứng minh phải persist thành blocker thay vì bypass. User có thể explicit defer một platform-specific manual activation probe mà không xóa implementation hoặc automated coverage của platform đó; waiver và residual risk phải được persist, và Harnix không được claim platform đó active.

## Taxonomy workflow đã khóa

| Khái niệm | Số lượng | Contract |
|---|---:|---|
| Canonical workflow | 1 | Một state machine dùng chung cho ba platform. |
| Entry route | 3 | Bypass không tạo task; Lite/Full dùng cùng lifecycle với ceremony khác nhau. |
| Persisted status | 6 | Frozen TaskRecord v1 status. |
| Workflow checkpoint | 8 | Stage/checkpoint hiện có; phải enforce legal combination. |
| Stage skill | 7 | Một owner/procedure cho từng stage concern; không phải workflow độc lập. |
| Verification stage | 2 | Compliance rồi quality/security. |

Review, security, migration, release, hotfix và maintenance không phải workflow mới: chúng map lần lượt vào Bypass/Check, Full+Check, Full, Finish, Debug+Lite/Full và Lite/Full. RIPER, EPCC và spec-driven workflow cũng không trở thành mode mới; chúng chỉ cung cấp practice cho semantic phase hiện có. Chỉ thêm workflow/skill khi có state, artifact, transition hoặc completion semantic không thể biểu diễn bằng contract hiện tại và evidence eval chứng minh overlap không giải quyết được.

## Workflow đích

```text
session start
  -> resolve initialized root + stable AGENTS boundaries
  -> inspect active state/integrity (hidden read-only operation)
  -> Restore/Triage: resume active task hoặc chọn Bypass/Lite/Full
  -> Evidence: inspect/research material unknown có giới hạn
  -> Requirements: khóa WHY/WHAT và acceptance
  -> Plan/Ready: khóa HOW/WHEN, validation và legal transition
  -> Execute: source/test/docs diff; RED -> GREEN -> REFACTOR khi phù hợp
  -> Verify: compliance -> quality/security
  -> Persist/Finish: supporting evidence -> journal -> clear matching pointer

Execute/Verify failure -> Debug -> Replan hoặc Execute
Missing authority/dependency -> Blocked -> Continue về recorded stage
```

Hook chỉ làm activation và inject bản tóm tắt có giới hạn; không scan, query repo-map, ghi state hoặc lặp lại workflow.

## Các quyết định đã khóa

1. Giữ TaskRecord v1; giải quyết enforcement và operation trước khi cân nhắc schema mới.
2. Thêm hidden workflow operation, không thêm public command thứ chín.
3. Giới hạn patch-version policy trong phạm vi phát triển package Harnix.
4. Bảo toàn historical defect và không persist transcript/thread ID.
5. Dùng history-derived fixture đã ẩn danh để giữ bài học lâu dài.
6. Đồng bộ dogfood state sau khi integrity boundary đã được kiểm chứng.
7. Giữ một workflow và bảy skill; harden router/description/eval thay vì tạo workflow mới.
8. Giữ Evidence → Requirements như artifact backbone nhưng thêm Plan, Verify và Persist vào lifecycle; adapt practice từ RIPER/EPCC/spec-driven workflow, không adopt package hoặc Git behavior của chúng.
9. Giữ work kind trực giao với action/mode; mở rộng Check cho standalone read-only review thay vì thêm review skill, và khóa test/hotfix profile bằng eval.
10. Hoàn thiện protocol review trong `harnix-check`; không tạo skill thứ tám vì không có state, artifact hoặc transition semantic mới.
11. Mỗi legal checkpoint có một stage owner; blocked precedence và finishing handoff được khóa bằng router lẫn skill-source regression tests.
12. Manual global smoke dùng evidence theo từng platform; không dùng bypass trust, không copy credential và không hạ readiness để che external blocker.

## Acceptance và traceability

| Requirement | Outcome quan sát được | Plan slice |
|---|---|---|
| R0 | Không còn consumer version side effect hoặc contradiction về command/phase/hook | S0 |
| R1 | Corrupt-state fixture bị reject/report đúng severity mà không rewrite history | S1 |
| R2 | Hidden inspect/save/finish pass atomicity và safety fixture; public CLI không đổi | S2 |
| R3 | Instruction ownership rõ, prompt nhỏ hơn baseline và routing eval vẫn pass | S3 |
| R4 | Journal chỉ giữ supporting/latest-required evidence; task giữ failure history | S4 |
| R5 | Tám failure mode lịch sử có regression fixture đã ẩn danh | S5 |
| R6 | Self-host migration pass trên fake repo và preserve user-owned state | S6 |
| R7 | Exact acceptance, integrity/Doctor và release checks có fresh evidence | S7 |
| R8 | Active task và normalized request facts route có reason code; status/checkpoint map đúng owner; prompt eval không overclaim | S3, S5 |
| R9 | Mỗi semantic phase map duy nhất tới state/artifact/skill/gate; Lite/Full không tạo workflow thứ hai; Plan/Verify/Persist không bị bỏ qua | S0, S3, S5 |
| R10 | Feature/fix/hotfix/review/refactor/test và các operational work kind có deterministic route, skill owner, evidence profile và forbidden shortcut | S3, S5 |
| R11 | `harnix-check` trigger được review, khóa bounded scope/finding/verdict/feedback contract và giữ platform parity mà không thêm skill | S8 |
| R12 | Blocked/replan, Debug/Implement và Check/Finish route thống nhất giữa router, skill prose và completion persistence | S9 |
| R13 | Disposable lifecycle pass; Antigravity rule/hook có runtime evidence; Kiro/Codex chỉ active khi có external hook/trust evidence | S10 |
