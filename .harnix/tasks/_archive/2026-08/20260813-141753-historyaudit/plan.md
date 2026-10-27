# Kế hoạch refactor: biến trạng thái Harnix thành contract có thể thực thi và tinh gọn instruction

Đây là kế hoạch triển khai, không phải quyền triển khai. Các slice được sắp theo ảnh hưởng tới người dùng và độ an toàn migration. Mỗi slice thay đổi behavior phải bắt đầu bằng RED quan sát được; thay đổi chỉ liên quan docs phải ghi TDD exception và dùng kiểm tra parity/search chính xác.

## PRD và plan khác nhau thế nào

`prd.md` là contract WHY/WHAT: vấn đề, người dùng, outcome, scope, behavior và acceptance. File này là contract HOW/WHEN: file/interface nào đổi, slice nào chạy trước, RED/GREEN ra sao, migration/rollback thế nào và bằng chứng nào đóng requirement. Plan không được tự mở rộng product scope; nếu một phát hiện mới làm đổi behavior hoặc acceptance thì phải quay lại PRD rồi mới replan.

## Trạng thái implementation

Task chưa có production implementation vì request tạo task chỉ cho audit, research và planning, đồng thời yêu cầu dừng ở `ready/ready`. Harnix Full workflow không có artifact chuẩn tên `implement.md`: implementation là stage `ready -> in_progress -> verifying`, biểu hiện bằng source/test/docs diff và evidence được persist trong `task.json`.

Request refactor task hiện tại chỉ chuẩn hóa artifact và traceability, không tự cấp quyền thực thi S0–S7. Khi người dùng yêu cầu implement task `20260813-141753-historyaudit`, tiếp tục chính task này, review lại PRD/plan, persist `in_progress/implementing`, rồi bắt đầu S0.

## Các quyết định đã khóa

1. Giữ nguyên tên field và legal status của TaskRecord v1. Siết validation nhưng không âm thầm viết lại historical task thuộc sở hữu người dùng.
2. Giữ đúng tám public command. Mọi workflow-state transport được bổ sung theo kế hoạch này phải nằm ẩn dưới `harnix internal workflow` cho tới khi có quyết định sản phẩm riêng để công khai.
3. Giới hạn chính sách “tăng patch version cho mỗi task hoàn tất” trong phạm vi phát triển package Harnix. Generated instruction và global skill cho consumer không được yêu cầu repository .NET, Java, Python hoặc repository khác phải có `package.json`/`CHANGELOG.md`.
4. Giữ failed/debug evidence trong `task.json`; completion journal chỉ tham chiếu bằng chứng hỗ trợ criterion cuối cùng và kết quả mới nhất của required check.
5. Không lưu Codex transcript, prompt, raw terminal output, secret, machine path hoặc host thread ID vào generated consumer state.
6. Activation hook tiếp tục no-write/no-network và không gọi repo-map.
7. Giữ một canonical workflow, ba entry route và bảy stage skill; không thêm review/security/migration/release workflow riêng.
8. Dùng Evidence-Gated Lifecycle làm semantic view: Evidence → Requirements → Plan → Execute → Verify → Persist; không thêm enum hoặc đổi frozen TaskRecord v1.
9. Tách requested action khỏi work kind và risk; feature/fix/hotfix/review/refactor/test dùng cùng lifecycle, không thêm skill thứ tám.

## Mapping lifecycle phải được triển khai

| Semantic phase | Persisted state/checkpoint | Artifact canonical | Stage owner | Gate/exit |
|---|---|---|---|---|
| Restore/Triage | current active state hoặc `planning/triage` | `.active`, `task.json` | Continue, rồi Brainstorm khi tạo/replan | Valid root/state; Bypass hoặc persisted planning |
| Evidence | `planning/planning|replan` | audit/research khi material | Brainstorm + conditional Research | Fact/inference/uncertainty tách rõ |
| Requirements | `planning/planning|replan` | acceptance trong TaskRecord; PRD cho Full | Brainstorm | Scope, non-goals, behavior và acceptance đã khóa |
| Plan | `planning|ready` với `planning|replan|ready` | validation trong TaskRecord; plan cho Full | Brainstorm | Fresh ready review; persist `ready/ready` |
| Execute | `in_progress/implementing|debugging|replan` | source/test/docs diff và evidence | Implement hoặc Debug | Focused behavior evidence; failure route Debug/Replan |
| Verify | `verifying/verifying|debugging|replan` | compliance và quality/security evidence | Check hoặc Debug | Compliance pass trước quality/security |
| Persist/Finish | `verifying/finishing → completed/finishing` | supporting evidence, journal, active-pointer update | Finish | Atomic completion; Git chỉ khi được yêu cầu và approve riêng |

Lite gộp Evidence + Requirements + Plan vào compact TaskRecord khi không có material decision cần artifact riêng. Full giữ PRD/plan và targeted research. Mapping này là view của cùng state machine, không phải workflow thứ hai.

## S0 — Sửa normative guidance không an toàn hoặc đã lỗi thời

File: `AGENTS.md`, `README.md`, `CHANGELOG.md`, `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `src/skills/harnix-finish-work/SKILL.md` và test docs/template.

- Viết RED/parity assertion tái hiện: consumer bị bắt buộc tăng version; tài liệu nói bảy thay vì tám command; routing Phase 6 còn ghi bắt đầu từ G0; mô tả `/hooks` mơ hồ; changelog nói “theo commit” và chứa compare link tới Git tag không tồn tại.
- Chuyển completion-version policy vào contributor instruction riêng của repository Harnix. Consumer finish check tuân theo project-specific release instruction nếu có, nhưng không tự phát minh chính sách.
- Nêu rõ `/hooks` là luồng trust của Codex CLI; việc desktop app phát hiện skill không chứng minh hook activation.
- Đồng bộ current-state pointer và số command từ một nguồn canonical khi phù hợp.
- Đổi normative wording từ pattern ba bước mơ hồ sang Evidence-Gated Lifecycle; giữ bảng artifact ownership và nêu rõ RIPER/EPCC/spec-driven chỉ là nguồn practice, không phải Harnix mode.
- Verification: focused template/CLI/doc contract tests, scan link/reference và `git diff --check`.
- Rollback: chỉ đổi prose/template; có thể revert slice mà không cần migrate state.

## S1 — Bổ sung workflow integrity engine đầy đủ

File: `src/core/tasks/task.ts`, file mới `src/core/tasks/integrity.ts`, `src/core/journal/journal.ts`, `src/commands/doctor.ts` và unit/integration fixture liên quan.

- RED fixture bao phủ ISO timestamp không hợp lệ; criterion/check/evidence/journal ID trùng; `checkId` không tồn tại; command evidence thiếu `exitCode` số nguyên; artifact path không relative hoặc không an toàn; tổ hợp status/checkpoint bất khả thi; completed task còn active; thiếu Full artifact; thiếu completion journal; journal tham chiếu evidence không có trong task.
- Enforce legality matrix: `planning` cho phép `triage|planning|replan`; `ready` cho phép `ready|replan`; `in_progress` cho phép `implementing|debugging|replan`; `verifying` cho phép `verifying|debugging|replan|finishing`; `completed` chỉ cho `finishing`. Với `blocked`, checkpoint phải thuộc tập hợp của `blocker.resumeStatus`; completed task không được còn active.
- Bổ sung API checkpoint transition atomic cho cùng status thay vì buộc caller sửa JSON hoặc gọi illegal same-status `transitionTask`. `ready/replan` quay lại `ready/ready` sau fresh ready review; authorized implementation đi `ready/ready -> in_progress/implementing` trước product edit.
- Buộc `saveTask`/`loadTask` enforce frozen v1 invariant. Thêm inventory path tolerant cho Doctor để một historical task lỗi tạo finding có giới hạn thay vì ngăn kiểm tra mọi record khác.
- Severity rule: active/unfinished state không hợp lệ làm project invalid và fail-closed; drift trong completed historical record không active là warning cần sửa rõ ràng. Doctor không viết lại task, research hoặc journal.
- Migration: báo cáo hai record đang thiếu exit code và hai historical artifact path không còn tồn tại. Bảo toàn chúng cho tới khi người dùng cấp quyền sửa evidence riêng; không suy diễn exit code hoặc tái tạo artifact đã xóa.
- Verification: task/journal unit tests, Doctor corrupt-state fixtures, path/safety suite, typecheck và lint.
- Rollback: không rewrite schema; gỡ validation mới sẽ khôi phục cách đọc trước đó mà không thay đổi user data.

## S2 — Cung cấp persistence boundary an toàn cho coding agent

File: `src/cli-program.ts`, `src/commands/internal-workflow.ts`, task/workflow core, workflow/CLI/security tests.

Bổ sung các operation ẩn, chỉ trả JSON:

- `harnix internal workflow inspect`: read-only; resolve active task, Full artifact và integrity finding; trả JSON có giới hạn, chỉ dùng repository-relative path.
- `harnix internal workflow save`: đọc JSON envelope có giới hạn từ stdin, validate record hiện có trên disk, chỉ cho phép tạo task hoặc legal transition của cùng task, cấm xóa/sửa evidence đã tồn tại, persist task/artifact atomically và chỉ update `.active` cho đúng task đó.
- `harnix internal workflow finish`: load active task, áp dụng fresh-completion check, persist completed state, append journal entry chỉ chứa supporting evidence, sau đó clear đúng matching pointer. Operation này không sửa package version hoặc Git state.

RED fixture chứng minh invalid payload ghi thủ công, transition nhảy cóc, stale evidence, path escape, partial persistence, stdin quá giới hạn, sai active task và xóa evidence đều bị reject. Direct core API hiện có tiếp tục dùng nội bộ trong package. Public help vẫn liệt kê tám command.

Rollback: có thể gỡ hidden command mà không đổi TaskRecord v1; record được ghi qua chúng vẫn là file v1 chuẩn.

## S3 — Làm routing audit được và giảm lặp instruction luôn được nạp

File: `src/core/workflow.ts`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `src/skills/catalog.ts`, bảy canonical skill, `.harnix/workflow.md`, `AGENTS.md`, `test/workflow/routing.test.ts` và workflow/platform fixtures.

Khóa contract thuần sau; tên TypeScript có thể dùng trực tiếp nếu không xung đột convention hiện có:

```ts
type WorkflowEntry = "bypass" | "create" | "resume" | "wait" | "fail-closed";
type WorkflowAction = "inspect" | "plan" | "change" | "review" | "verify";
type WorkflowWorkKind =
  | "feature" | "bugfix" | "hotfix" | "refactor" | "test" | "docs"
  | "maintenance" | "migration" | "dependency" | "security"
  | "performance" | "release";
type WorkflowRiskSignal =
  | "material-unknown" | "cross-layer" | "security-sensitive"
  | "migration" | "contract-change" | "architecture-refactor"
  | "multi-layer" | "complex-rollback";
type WorkflowStageOwner =
  | "harnix-brainstorm" | "harnix-implement" | "harnix-debug"
  | "harnix-check" | "harnix-finish-work" | "harnix-continue";

interface WorkflowRouteFacts {
  mutation: "none" | "task-artifact" | "project";
  action: WorkflowAction;
  workKind: WorkflowWorkKind;
  explicitMode?: "lite" | "full";
  riskSignals: readonly WorkflowRiskSignal[];
  activeTask?: Pick<TaskRecord, "mode" | "status" | "checkpoint" | "blocker">;
}

interface WorkflowRouteDecision {
  entry: WorkflowEntry;
  mode?: "lite" | "full";
  owner?: WorkflowStageOwner;
  reasonCodes: readonly string[];
}
```

Precedence và output bắt buộc:

1. Malformed/future/unsafe active state → `fail-closed`, owner `harnix-continue`.
2. Active checkpoint `replan` hoặc status `planning` → `resume`, owner `harnix-brainstorm`.
3. Active `ready/ready` + current task-artifact revision → `resume`, owner `harnix-brainstorm`; persist `ready/replan` trước sửa artifact.
4. Active `ready/ready` + current explicit implementation request → `resume`, owner `harnix-implement`; không suy diễn authorization từ conversation cũ.
5. Active `ready/ready` không có implementation/replan request → `wait`, owner `harnix-continue`.
6. Active `in_progress/implementing` → Implement; `in_progress|verifying` với checkpoint `debugging` → Debug; `verifying/verifying` → Check; `verifying/finishing` → Finish; blocked/completed-active → Continue hoặc fail closed theo integrity result.
7. Không có active task + `mutation:none` + `action:review` → Bypass với owner `harnix-check` read-only; generic inspect/run-test vẫn Bypass không cần stage owner. Có mutation → Create qua Brainstorm; explicit mode thắng heuristic, nếu không bất kỳ risk signal nào chọn Full, còn lại Lite.

Stable reason code tối thiểu: `read-only`, `standalone-review`, `active-replan`, `active-ready-authorized`, `active-ready-wait`, `active-stage`, `explicit-lite`, `explicit-full`, `risk-full`, `low-risk-lite`, `invalid-active-state`. Reason code là diagnostic/test output, không thêm field vào TaskRecord v1.

- RED decision table bao phủ active-task-first, read-only Bypass, localized implementation Lite, cross-layer/migration/refactor/security Full, explicit mode override, plan-only, mixed review+fix và invalid/ambiguous normalized facts.
- Thay `routeWorkflow()` string-only bằng typed policy decision gồm route/mode, stage owner khi có active state và stable reason codes. Helper chỉ nhận normalized facts; không parse free-form prompt hoặc tuyên bố là model detector.
- Bổ sung pure status/checkpoint-to-stage mapping dùng cùng legality matrix của S1. Active valid task luôn route qua continue trước khi phân loại task mới; invalid/future state fail closed.
- Bổ sung pure semantic-phase mapping khớp bảng lifecycle phía trên; mỗi legal state phải có đúng một stage owner chính, còn Research là conditional support chứ không thay owner.
- Giữ AGENTS ổn định và ngắn: activation, authority/safety, source routing, preservation và điểm vào skill.
- Giữ workflow ở phạm vi lifecycle, persistence order, ownership và completion invariant.
- Mỗi quy trình chi tiết chỉ nằm trong đúng một skill chuyên biệt, tận dụng progressive disclosure.
- Front-load trigger/boundary trong bảy description, giảm overlap và nêu rõ research/debug là conditional stage skill. Không thêm skill chỉ để chứa synonym.
- Mở rộng `harnix-check` thành hai profile rõ: standalone code review nhận Bypass/read-only không active task và active-task verification nhận `in_progress|verifying`. Review-only chỉ report finding có severity, location, evidence và uncertainty; nếu user yêu cầu fix thì route Brainstorm trước mọi mutation.
- Thêm work-kind validation profile: feature cần acceptance/behavior RED; bugfix/failing-test cần reproducer và regression; hotfix cần incident constraint/rollback nhưng không được skip compliance/security; refactor cần behavior-preservation/characterization; test-only cần evidence test value mà không ép production diff; dependency/security/performance/release mặc định Full khi có material risk.
- Thay prose mô tả current phase bằng tham chiếu tới persisted active state và normative docs.
- RED eval bao phủ routing khi description bị rút gọn, không hỏi approval lặp, continuation sau compaction, plan-only update quay về brainstorm/replan, plan-only dừng ở ready và consumer repository không có release file.
- Đo số ký tự generated prompt và bắt buộc giảm mà không làm mất history-derived safety eval. Không đặt token target tùy ý trước khi có baseline.
- Migration: managed file chưa sửa được update bình thường; workflow/AGENTS consumer đã sửa phải được preserve và report. Không force overwrite.

## S4 — Làm completion evidence rõ nghĩa

File: `src/core/workflow.ts`, task/journal tests, instruction của `harnix-check` và `harnix-finish-work`.

- RED chứng minh finisher hiện tại ghi cả failed và superseded evidence vào journal vì sao chép toàn bộ evidence ID.
- Completion journal chỉ chọn evidence được criterion trạng thái met tham chiếu cộng với latest passing evidence của từng required validation check. Mọi failure cũ vẫn ở `task.json` để giữ debugging provenance.
- Reject completion khi artifact path được tham chiếu không an toàn; chỉ report, không invalidate completed historical record vì ephemeral artifact được chủ động dọn sau này.
- Bổ sung final-state summary phân biệt passed, failed-then-superseded, skipped, waived, omitted và manual check mà không đổi field của JournalEntry v1.

## S5 — Chuyển correction trong history thành regression eval

File: file mới `test/workflow/history-regressions.test.ts` và workflow/template/CLI/integration fixture hiện có.

Tạo fixture đã ẩn danh, thuộc repository, cho các failure quan sát được:

1. test xanh nhưng migration không bảo toàn data;
2. tuyên bố hoàn tất trước compliance review;
3. lệch docs/template command chỉ được phát hiện sau khi người dùng sửa;
4. locale sort khác comparator của validator;
5. framework/tooling evidence suy diễn quá mức source language;
6. hook trust chỉ có trên CLI nhưng được mô tả như có trong desktop app;
7. người dùng thu hẹp phạm vi changelog sau một chỉnh sửa quá rộng;
8. consumer không có package version/changelog.
9. active `ready/ready` plan-only nhận yêu cầu sửa plan phải route Continue → Brainstorm/Replan, không tự implement;
10. localized implementation không bị ép Full chỉ vì verb `implement`, còn migration/refactor/security vẫn route Full;
11. read-only review là Bypass nhưng review kèm yêu cầu sửa tạo task phù hợp;
12. skill description bị rút gọn vẫn giữ trigger/boundary quan trọng ở đầu.
13. Full task không được chuyển từ Evidence/Requirements thẳng sang Execute khi chưa có Plan/Ready gate.
14. Green focused implementation không được Finish trước independent Verify; Verify failure phải route Debug/Replan.
15. Source/test pass không được coi completed nếu supporting evidence, journal hoặc matching active-pointer cleanup chưa persist atomically.
16. RIPER/EPCC/spec wording trong prompt không được tạo mode/skill mới; normalized risk và active state vẫn quyết định route.
17. Feature nhỏ route Lite nhưng feature cross-layer route Full; verb “implement” không tự ép Full.
18. Bug đã có root cause route Implement với regression RED; bug chưa rõ root cause và failing test route Debug sau ready gate.
19. Hotfix không được bỏ ready/compliance/security/finish gate; urgency chỉ làm scope/check tập trung và yêu cầu rollback rõ.
20. Standalone code review route Bypass → Check read-only, không tạo task hoặc sửa file; “review and fix” tạo Lite/Full task.
21. Refactor localized dùng Lite với behavior-preservation evidence; architecture/cross-layer refactor dùng Full và có rollback.
22. “Run/analyze tests” là Bypass; add/change tests là mutation task; failing-test fix route Debug; test-only change không bị buộc tạo production diff.
23. Docs/config/build/maintenance chọn Lite/Full theo risk và dùng documented TDD exception có alternate evidence; migration/dependency/security/performance/release có profile evidence tương ứng.
24. Representative host eval dùng synonym thực tế (`feature`, `implement`, `fix bug`, `hotfix`, `review`, `refactor`, `add tests`, `test failing`) và negative/mixed prompts, không chỉ kiểm tra keyword trong description.

Fixture lưu normalized facts, expected route/stage/reason và requirement, không lưu transcript. Deterministic fixture kiểm tra policy; representative prompt eval kiểm tra implicit activation trên host có hỗ trợ. Verification đo task success, correction count, state validity và evidence completeness; giảm token/turn chỉ là chỉ số phụ. Không suy diễn cross-platform model detection từ unit test.

## S6 — Đồng bộ dogfood state của chính repository Harnix

File: `.harnix/config.yaml`, `.harnix/.template-hashes.json`, `.harnix/workflow.md`, managed guide path, repo-map cache policy và self-host integration tests.

- Trước tiên chạy integrity/Doctor check mới ở chế độ no-write và ghi lại finding chính xác.
- Dùng fake-repository fixture để chứng minh migration và preservation.
- Sau khi có explicit authorization cho project state thuộc sở hữu người dùng: migrate config, thay workflow do chính repository duy trì bằng canonical version hiện tại, rebaseline ownership an toàn, materialize common guide và repo-map cache hiện tại, đồng thời bảo toàn mọi task/research/journal artifact.
- Thêm self-host assertion ngăn canonical source, packaged template và managed workflow của repository Harnix drift sau release task.
- Rollback từ backup trước write/atomic transaction; không rollback task hoặc journal.

## S7 — Full verification và quyết định release

- Chạy focused test sau mỗi slice, sau đó chạy đúng acceptance sequence trong `docs/IMPLEMENTATION_PLAN.md` mục 18, gồm fake-home tarball smoke, performance, footprint, safety, attribution và release scan.
- Chạy lại read-only artifact inventory và `harnix doctor`; không được còn active-state error, source-of-truth contradiction hoặc warning chưa được giải trình.
- Manual G10 smoke trên tool session/profile disposable vẫn là external action cần cấp quyền riêng. Không tuyên bố platform activation thật từ automated fixture.
- Trước mọi commit, trình bày đầy đủ diff summary và commit message đề xuất rồi chờ approval rõ ràng.

## S8 — Hoàn thiện code-review protocol trong `harnix-check`

File: `src/skills/harnix-check/SKILL.md`, `src/templates/harnix/agents.ts`, `test/workflow/skill-sources.test.ts`, `test/workflow/history-regressions.test.ts`, platform parity fixture, `package.json` và `CHANGELOG.md`.

- Research frozen `obra/superpowers` revision đã khóa và lưu fact/inference/adapt/reject trong task-owned artifact; checkout chỉ là nguồn đọc tạm, không vendor hoặc chạy upstream.
- RED static contract chứng minh description hiện không trigger standalone code review/review feedback và body thiếu bounded scope, structured finding, omitted-check/residual-risk report cùng verdict.
- GREEN cập nhật đúng một `harnix-check`: chọn working-tree diff, explicit commit range hoặc bounded paths; review read-only; compliance trước quality/security; finding có severity, file/line, defect, impact, evidence và fix direction; verdict `ready|ready-with-fixes|not-ready`; feedback vẫn là hypothesis và mọi mutation route qua lifecycle.
- Giữ bảy canonical skill. Không thêm subagent/Git/merge/PR requirement, không tự checkout/move HEAD, không tự fix, không thêm platform-specific review protocol.
- Đồng bộ AGENTS wording để standalone code review trỏ rõ tới `harnix-check`; platform adapters tiếp tục cài cùng canonical SKILL byte content.
- Tăng patch version và cập nhật changelog trong cùng slice trước completion persistence.
- Verification: observed RED rồi GREEN cho `test/workflow/skill-sources.test.ts`; routing/history regression; platform setup/global-adapter parity; build, typecheck, lint, full test và release scan theo completion gate.
- Rollback: revert prose/test/version slice; managed global files của người dùng không bị chạm trong repository implementation.

## S9 — Đồng bộ stage owner và checkpoint contract

File: `src/core/workflow.ts`, `src/skills/harnix-brainstorm/SKILL.md`, `src/skills/harnix-implement/SKILL.md`, `src/skills/harnix-finish-work/SKILL.md`, `src/skills/harnix-continue/SKILL.md`, `test/workflow/routing.test.ts`, `test/workflow/skill-sources.test.ts` và `CHANGELOG.md`.

- RED router fixture chứng minh valid `blocked/verifying+replan` hiện route Brainstorm thay vì Continue; static skill fixture chứng minh Implement nhận debugging và Finish từ chối finishing dù Continue/router giao finishing cho Finish.
- GREEN đưa blocked branch trước replan, giới hạn Implement ở `ready/ready|in_progress/implementing`, và khóa handoff `verifying/verifying -> verifying/finishing -> Finish -> completed/finishing`.
- Brainstorm chỉ nhận no-active/planning owner state; Continue giữ quyền restore mọi active task trước stage routing.
- Giữ frozen TaskRecord v1, bảy skill và public CLI; không thêm status, checkpoint, command hoặc platform surface.
- Verification: observed RED/GREEN cho router + skill source, neighboring workflow/platform tests, quick validation cho cả bảy skill, rồi exact acceptance sequence.
- Rollback: revert pure routing/prose/test slice; không migrate task schema hoặc user data.

## S10 — Authorized global tool-session smoke và platform drift

File: `src/configurators/antigravity.ts`, `test/platform/global-adapters.test.ts`, `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`, `docs/IMPLEMENTATION_PLAN.md`, task research/evidence và real/disposable Harnix-owned global surfaces đã preview.

- Chạy setup dry-run/apply trên injected test home, kiểm non-Harnix no-op, initialized bounded context, plugin validator, uninstall preview/apply và unrelated-config preservation.
- Launch đúng Kiro/Antigravity/Codex tool khi executable/credential cho phép; tách skill discovery, hook execution, precedence và trust thành claim độc lập.
- RED runtime-derived assertion cho Antigravity rule frontmatter; GREEN thêm metadata tối thiểu và update hai managed plugin root sau preview.
- Không bypass Codex hook trust, không copy credential vào test home và không suy session prompt/model reply thành hook execution nếu thiếu objective event/output evidence.
- Persist Kiro/Codex external blocker nếu không thể có activation evidence; resume verification sau khi exact hook được review/trust hoặc platform session cung cấp authoritative evidence. Một manual platform probe chỉ được defer bằng explicit user decision, phải giữ residual risk và không được đổi thành active claim.

## Traceability từ requirement tới implementation

| Requirement | Slice | RED hoặc exception chính | Fresh verification |
|---|---|---|---|
| R0 | S0 | Parity assertion cho version policy, command count, phase, hook trust và changelog | Focused template/CLI/doc tests + link/reference scan |
| R1 | S1 | Corrupt TaskRecord/journal/active/path fixture | Unit + Doctor integration + safety/typecheck/lint |
| R2 | S2 | Illegal/stale/oversized/partial workflow operation fixture | Workflow/CLI/security tests + public-help assertion |
| R3 | S3 | Routing, compaction, plan-only và no-release-file eval | Prompt-size baseline + workflow/platform fixtures |
| R4 | S4 | Journal đang lấy failed/superseded evidence | Task/journal unit tests + completion summary assertions |
| R5 | S5 | Tám history-derived failure fixture | `history-regressions` suite và correction/evidence metrics |
| R6 | S6 | Fake-repository migration/preservation fixture | Self-host parity + fresh Doctor/integrity inventory |
| R7 | S7 | Không áp dụng; đây là verification/release gate | Exact acceptance sequence + fake-home/manual authorized smoke |
| R8 | S3, S5 | Router hiện ép mọi implementation thành Full, bỏ active state và không có reason code | Decision-table contract + static description test + representative host eval |
| R9 | S0, S3, S5 | Pattern ba bước hiện không biểu diễn Plan/Verify/Persist và recovery loop | Normative parity + phase/state decision table + skip-phase regression eval |
| R10 | S3, S5 | Router/skill hiện chưa tách work kind khỏi action; standalone review, test-only và hotfix chưa có contract/eval đầy đủ | Work-kind decision table + skill profile tests + representative cross-platform prompt eval |
| R11 | S8 | Description/body hiện chưa khóa review trigger, bounded scope, structured finding, verdict và residual-risk behavior | Skill-source RED/GREEN + routing/history regression + platform parity + release gates |
| R12 | S9 | Router xét replan trước blocked; Implement/Debug và Check/Finish incoming state overlap hoặc mâu thuẫn | Blocked-precedence decision fixture + cross-skill ownership assertions + completion tests |
| R13 | S10 | File/validator pass nhưng real session có thể không execute hook; Antigravity rule bị runtime parser từ chối | Fake-home lifecycle + real tool discovery + objective event/output probe + conservative Doctor status |

## Bàn giao triển khai

Người dùng đã cấp full authority để hoàn tất chính active task này, gồm S9, dependency validation, self-host reconciliation và disposable-profile G10 smoke. Task giữ toàn bộ failed/passing evidence và đã sửa contained Antigravity frontmatter defect. Ngày 2026-08-13 user explicit defer Kiro CLI manual hook activation và xác nhận đã trust Codex hook; fresh Codex CLI probe không dùng bypass đã chứng minh hook-injected developer context. Kiro vẫn có implementation/automated coverage và không được claim active; không commit/push và không bypass trust.
