# Báo cáo kiểm toán lịch sử Codex và trạng thái Harnix đã lưu

Ngày kiểm toán: 2026-08-13. Phạm vi chỉ gồm phân tích, research và lập kế hoạch. Không có production file, global integration, historical task artifact, Git state hoặc user profile nào bị thay đổi.

## Tóm tắt điều hành

Harnix có định hướng an toàn bằng văn bản khá tốt và mô hình TaskRecord/journal hữu ích, nhưng khoảng trống rủi ro cao nhất là workflow chủ yếu được enforce bằng prose trong khi agent ghi state thủ công. Completed record của chính repository đã vi phạm một frozen invariant, self-hosted managed workflow chậm hơn canonical template và nhiều normative document không đồng nhất với behavior hiện tại.

Vấn đề cần sửa khẩn cấp nhất liên quan đến an toàn cho consumer: yêu cầu tăng version cho từng task phát triển Harnix đã được lan truyền vào global skill và generated project template. Kết quả là repository consumer bất kỳ cũng bị yêu cầu tăng package patch version và sửa `CHANGELOG.md` trước mỗi task completion, kể cả project .NET, Java, Python, repository không phải package hoặc không sở hữu các file đó.

Refactor được khuyến nghị không tạo workflow thứ hai và không đổi TaskRecord v1. Harnix hiện có một canonical workflow, ba entry route và bảy stage skill; taxonomy đủ dùng nhưng detection mới chỉ đúng ở tầng prose/skill, chưa được nối thành contract routing có thể kiểm tra. Kế hoạch sẽ giới hạn đúng phạm vi release policy theo repository, bổ sung executable state integrity cùng hidden persistence operation an toàn, harden routing, loại instruction thường trực bị lặp bằng progressive disclosure, làm completion evidence rõ nghĩa và chuyển các lần người dùng sửa yêu cầu đã quan sát được thành regression eval.

## Phạm vi và độ tin cậy

Codex app trả về toàn bộ 38 task non-pinned hiện có thể liệt kê, không có pinned task hoặc unavailable host. Bảy entry khớp Harnix theo working directory, title hoặc summary; một entry bị loại vì nội dung các turn liên quan đến payment callback service chứ không phải sản phẩm Harnix. Sáu task Harnix đã được phân trang tới cuối.

| Tham chiếu | Task Codex | Turn | Compaction | Turn bị gián đoạn | Mục đích sử dụng |
|---|---|---:|---:|---:|---|
| T1 | `019ff8db-ffaa-7971-8629-4a509c9506a0` — Review task active và chuẩn bị code | 30 | 5 | 4 và turn hiện tại | Repo-map, guide, detection, version/changelog, commit approval và audit hiện tại |
| T2 | `019ff3f4-009a-7241-bf8b-e758e0db7ac4` — Rà soát cú pháp harnix init | 12 | 2 | 3 | Init UX, workflow dogfood và lập kế hoạch repo-map |
| T3 | `019ff017-0006-7e33-961d-12641e490cd9` — Explain skipped test | 7 | 0 | 0 | Platform setup, skipped test và sửa mô tả Codex hook trust |
| T4 | `019fe945-e106-7573-9532-294efa35b704` — Review and refactor harness | 29 | 10 | 0 | Review Phase 5/6, global setup và ranh giới manual smoke |
| T5 | `019fdb22-3a15-7f83-a0c8-e5706692ce7f` — Tiếp tục implement phase 2 | 45 | 1 | 1 | Triển khai Phase 2–4 và compliance audit sau đó |
| T6 | `019fd0f7-243e-7b80-8e2a-edfe9df41e3f` — Xây dựng Harnix end-to-end | 30 | 3 | 2 | Lập kế hoạch ban đầu, Phase 1 và sửa changelog/commit |
| **Tổng** |  | **153** | **21** | **10** |  |

Mức độ tin cậy:

- Cao: file hiện tại trong repository, Git commit, task/journal JSON đã parse, output Doctor mới chạy và nguồn chính thức.
- Trung bình: user/assistant message và file-change summary do `read_thread` trả về.
- Thấp hoặc không truy cập được: raw terminal stream và command output đầy đủ của task cũ. `read_thread` không trả command-output item và app terminal của task hiện tại không được attach. Vì vậy historical command claim được đối chiếu với task evidence và Git, không được xem là raw log.
- Không xác định: task đã xóa, archive, ở remote hoặc cũ hơn nhưng không được app listing hiện tại cung cấp. Không xuất hiện trong báo cáo không chứng minh sự kiện chưa từng xảy ra.

## Dòng thời gian chuẩn hóa

- 2026-08-05: tài liệu và Phase 1 bắt đầu. T6 cho thấy implementation bắt đầu trước khi người dùng nhắc lại yêu cầu plan-first; changelog bị thiếu trong commit và phải amend hai lần.
- 2026-08-07: Phase 2–4 được implement và báo cáo xanh. T5 sau đó ghi nhận một full review phát hiện rủi ro mất dữ liệu khi migration/cleanup, purge trước confirmation, ghi đè customization, sai Doctor semantics và thiếu task/context validation dù test suite đã pass.
- 2026-08-10 đến 2026-08-11: Phase 5/6 refactor setup từ project-local sang user-global. Automated fixture pass nhưng manual gate trên disposable profile/tool session vẫn pending. T3 ghi lại việc sửa từ mô tả chung “mở `/hooks` trong Codex” thành luồng chỉ có trên Codex CLI.
- 2026-08-12: self-hosting bổ sung persisted workflow/task artifact và repo-map plan. T2 cho thấy người dùng sửa “cải tiến plan” thành “cải tiến workflow”, sau đó persistence rule được mô tả rõ hơn.
- 2026-08-13: stack/guide/repo-map được triển khai. T1 ghi nhiều lần người dùng sửa phạm vi changelog, public command shape, JSON mặc định, repo-map guidance còn thiếu trong AGENTS và cuối cùng là lỗi `init` trên consumer thật do thứ tự `localeCompare` khác validator.

## Phát hiện theo mức ưu tiên

### F1 — P0: version policy riêng của repository đã lan ra mọi consumer workflow

Sự thật: `src/skills/harnix-finish-work/SKILL.md`, `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts`, `.harnix/workflow.md` và phần workflow trong README yêu cầu tăng package patch version và sửa `CHANGELOG.md` trước mọi task completion. T1 cho thấy yêu cầu này bắt nguồn từ việc hoàn tất task của Harnix, sau đó được sao chép vào AGENTS template.

Ảnh hưởng: consumer không có npm package hoặc changelog không thể hoàn tất task hợp lệ; consumer có release policy riêng bị hướng dẫn thay đổi release metadata ngoài phạm vi thực của task. Điều này vi phạm tính trung lập platform/language và preservation boundary của Harnix.

Khuyến nghị: chỉ giữ rule trong contributor `AGENTS.md` của repository này; generic finish logic tuân theo project-specific release instruction khi tồn tại và không tạo version side effect nếu không có.

### F2 — P0: frozen TaskRecord invariant chưa được enforce tại persistence boundary

Sự thật: mục 4.3 của `docs/IMPLEMENTATION_PLAN.md` yêu cầu ISO timestamp, integer exit code cho command evidence, artifact path relative đã normalize và fail-closed reference. `validateTask` chưa kiểm tra ISO time, ID trùng, `checkId` tồn tại, liên kết command với exit code, path normalization hoặc tính tương thích status/checkpoint. Test fixture còn chủ động dùng timestamp `"x"`. Hai completed record trong `20260813-105600-changelogrelease` có passing evidence gắn với command nhưng thiếu `exitCode`.

Sự thật: workflow helper chỉ được tham chiếu trong test; `src/index.ts` không export và CLI không có task persistence boundary. History cho thấy agent tạo/cập nhật JSON trực tiếp.

Ảnh hưởng: task có thể được persist là completed dù vi phạm frozen schema; workflow viết ra tạo mức bảo đảm cao hơn behavior runtime. Ghi thủ công cũng làm partial persistence và evidence mutation khó ngăn chặn.

Khuyến nghị: triển khai S1 cho strict integrity và S2 cho hidden atomic persistence. Historical completed drift chỉ được chẩn đoán, không âm thầm viết lại.

### F3 — P1: repository Harnix chưa phải dogfood instance sạch của sản phẩm hiện tại

Lệnh mới chạy `node dist/cli.js doctor` trả project `ready` nhưng tổng cộng chín warning. Project finding gồm config v1 đã cũ, `.harnix/workflow.md` modified, `common-rules.md` obsolete, common guide hiện tại untracked, `AGENTS.md` untracked và thiếu repo-map cache. Cả ba global platform có trạng thái `binary-unavailable` trong command environment.

Self-hosted workflow ngắn hơn và chậm hơn `src/templates/harnix/workflow.ts`; manifest vẫn baseline generator version 0.6.0. Vì modified managed content được bảo toàn đúng contract, update thông thường không thể tự hội tụ.

Ảnh hưởng: agent làm việc trên Harnix không chắc đang chạy đúng workflow version được package và test. Vì vậy dogfood evidence có thể đang xác minh instruction path cũ.

Khuyến nghị: implement integrity trước, sau đó thực hiện self-host reconciliation có authorization rõ ràng, preservation và parity regression.

### F4 — P1: normative source không thống nhất với trạng thái sản phẩm hiện tại

Các mâu thuẫn quan sát được:

- `docs/HARNIX_PRD.md` nói có tám public command, trong khi acceptance section của file này và `docs/IMPLEMENTATION_PLAN.md` vẫn nói bảy; historical repo-map artifact nói bảy là đúng tại thời điểm trước task công khai command sau đó.
- `AGENTS.md` nói Phase 6 active “từ G0 trở đi”, trong khi phase plan ghi G0–G9 và phần automated của G10 đã hoàn tất.
- README/global plan yêu cầu review Codex trust qua `/hooks` nhưng không phải nơi nào cũng ghi rõ đây là command của Codex CLI. Official Codex docs và T3 xác nhận tính CLI-specific.
- CHANGELOG nói entry được ghi “theo commit”, nhưng commit `749466c` chuyển package version trực tiếp từ 0.6.1 lên 0.6.7 và chứa sáu task-version heading. Repository không có Git tag nhưng mọi version reference link đều compare các tag không tồn tại.

Ảnh hưởng: agent chọn công việc đã lỗi thời, người dùng nhận instruction vận hành sai và release evidence link không thể truy xuất.

Khuyến nghị: S0 canonicalize sự thật về trạng thái hiện tại và phân biệt task-version history với tagged/published release.

### F5 — P1: green gate nhiều lần không bao phủ compliance boundary thực tế

Sự thật từ history:

- T5 báo Phase 4 hoàn tất với 87 test pass; audit sau đó phát hiện rủi ro P0 ở migration/data cleanup và nhiều defect P1 về ownership/Doctor.
- T1 báo tích hợp docs/command xanh, sau đó người dùng phát hiện generated AGENTS thiếu repo-map guidance.
- T1 ghi nhận 306 test pass, sau đó path mixed-case trên consumer thật làm `harnix init` fail vì creation và validation dùng comparator khác nhau.
- T6 cần người dùng sửa sau khi changelog change không có trong commit.

Suy luận: vấn đề không phải số lượng test chưa đủ. Acceptance fixture và compliance review chưa đại diện cho consumer state, documentation surface và preservation claim thực tế.

Khuyến nghị: S5 chuyển từng correction thành requirement-driven fixture; compliance stage 1 phải chạy trước broad quality gate và không được suy ra từ broad gate.

### F6 — P1: Full planning artifact đôi khi chỉ giữ ceremony thay vì decision

Full PRD của task guide chỉ có 52 từ và plan có 47 từ; plan của task init/repo-map command có 65 từ. Chi tiết state chủ yếu nằm trong `task.json`, nên các file bổ sung ít giá trị cho việc resume. Research artifact của task guide có nguồn chính thức nhưng thiếu mục remaining uncertainty dù canonical research skill yêu cầu. Follow-up ngay trong T1—“guide vẫn còn đơn giản quá”—xác nhận acceptance criterion ban đầu quá yếu.

Ảnh hưởng: `Full` có thể pass chỉ nhờ file tồn tại trong khi acceptance depth, consumer scenario và uncertainty chưa giải quyết vẫn chưa đủ chi tiết.

Khuyến nghị: validate nội dung quyết định thay vì độ dài/sự tồn tại của file; chỉ promote Full khi artifact thực sự chứa thông tin không phù hợp với Lite record ngắn.

### F7 — P1: completion journal trộn bằng chứng cuối với lần thử thất bại hoặc đã bị thay thế

`finishWorkflowTask` ghi toàn bộ task evidence ID vào completion journal. Vì vậy journal hiện tại chứa cả failure đã biết như stale assertion, CRLF issue, sandbox spawn failure và file `pnpm-workspace.yaml` đã xóa bên cạnh final proof.

Ảnh hưởng: journal search không thể phân biệt evidence nào hỗ trợ completion nếu không mở lại toàn bộ task và dựng chronology. Completion entry có thể trông tự mâu thuẫn.

Khuyến nghị: S4 chỉ journal criterion-supporting evidence cùng latest required passing evidence; giữ failure trong task record.

### F8 — P2: historical evidence có thể không còn xác minh được nhưng chưa chắc invalid

Toàn bộ 14 TaskRecord parse thành công; 13 completed task đều có một completion journal; mọi completed criterion là `met`; `.active` trỏ đúng task audit đang planning; timestamp parse được; không phát hiện secret hoặc machine absolute path. Hai historical evidence artifact path không còn tồn tại: `pnpm-workspace.yaml`—transient user file đã chủ động xóa—và `.artifacts/tamtiger-harnix-0.6.0.tgz`—build artifact đã được dọn.

Ảnh hưởng: xem mọi current path bị thiếu là corruption sẽ tạo false failure; bỏ qua hoàn toàn sẽ làm mất khả năng audit.

Khuyến nghị: integrity report cần phân biệt durable source reference với ephemeral artifact mà không đổi field v1; chỉ cân nhắc digest/summary trong schema tương lai nếu audit đại diện chứng minh là cần thiết.

### F9 — P2: host conversation history hữu ích cho thiết kế eval nhưng không phù hợp làm workflow state

Thread title có thể chứa công việc không liên quan được thêm về sau, một task dùng Harnix cwd thực tế nói về payment callback service, raw historical terminal output không được cung cấp và sáu task đã trải qua 21 lần compaction.

Ảnh hưởng: audit tương lai không thể bảo đảm đầy đủ quan hệ nhân quả nếu chỉ dựa trên Codex history.

Khuyến nghị: history access chỉ là read-only tùy chọn. Persist bounded structured evidence ngay khi thực hiện công việc và dùng history-derived fixture đã ẩn danh; không sao chép toàn bộ transcript vào `.harnix`.

### F10 — P2: always-on guidance bị lặp và tốn chi phí đồng bộ

`AGENTS.md` hiện khoảng 1.069 từ, `.harnix/workflow.md` khoảng 622 từ và mỗi skill trong bảy skill thêm khoảng 473–776 từ khi được chọn. Rule về activation, persistence, verification, Git và completion lặp lại giữa nhiều lớp.

Hướng dẫn chính thức của OpenAI nêu rằng phiên dài khuếch đại prompt content bị lặp và Codex skill hỗ trợ progressive disclosure. Điều này ủng hộ việc giảm có đo lường, không phải xóa mù quáng.

Khuyến nghị: S3 áp dụng mô hình ownership bốn lớp từ research artifact và giữ mọi safety behavior bằng routing/state eval.

### F11 — P1: `routeWorkflow()` chưa phải workflow detector thực tế

`src/core/workflow.ts` nhận một intent đã chuẩn hóa cùng `forceMode`, `materialUnknown`, `crossLayer` và `securitySensitive`, rồi trả một string. Search toàn repository cho thấy hàm chỉ được dùng trong `test/workflow/routing.test.ts`; command, hook, configurator và skill runtime không gọi nó để route user request.

Heuristic cũng chưa khớp canonical docs: mọi `intent: implement` bị ép Full dù implementation có thể là Lite; không có migration, architecture/refactor, contract/data, rollback hoặc active-task signal; output không có reason code để review.

Ảnh hưởng: unit test xanh chỉ chứng minh helper trả đúng bốn case đã viết, không chứng minh Kiro/Antigravity/Codex detect đúng workflow từ prompt thật.

Khuyến nghị: S3 đổi helper thành policy oracle trên normalized facts, trả decision + reason codes và ghi rõ semantic prompt interpretation thuộc host agent/skill layer.

### F12 — P1: active-state routing và status/checkpoint legality còn nằm trong prose

`harnix-continue` có routing table đúng hướng, nhưng `continueWorkflowTask()` chỉ trả task/context path. `validateTask()` chưa enforce ma trận status/checkpoint; `transitionTask()` không cho cùng-status checkpoint transition dù docs dùng `in_progress/debugging` và `ready/replan`. Routing table còn phân biệt `ready/ready` đã được phép implement với plan-only dù TaskRecord v1 không lưu authorization, nên sau compaction distinction này không thể được khôi phục deterministic.

Ảnh hưởng: agent có thể chọn đúng stage bằng prose nhưng persist một tổ hợp không hợp lệ hoặc không có API an toàn để ghi checkpoint hợp lệ.

Khuyến nghị: S1 khóa legality matrix; S2 cung cấp atomic operation; S3 thêm pure state-to-stage router dùng chung cho test/diagnostic. Giữ schema v1 bằng fail-closed rule: authorized planning phải chuyển ngay `ready -> in_progress/implementing`; active task còn ở `ready` chỉ implement khi current request cấp quyền rõ.

### F13 — P2: implicit skill detection chưa có representative eval

Bảy source skill có frontmatter hợp lệ và test kiểm tra keyword/behavior needle, nhưng routing test chỉ có bốn entry case. Không có eval cho active task precedence, plan-only update, mixed review+fix, localized implementation, migration/refactor, failure/debug hoặc description bị rút gọn.

OpenAI xác nhận implicit invocation phụ thuộc vào skill `description`, khuyến nghị front-load trigger/boundary và test prompt đại diện. OpenAI cũng cảnh báo initial skill list có budget nên thêm skill chồng lấn có thể làm detection kém ổn định.

Khuyến nghị: S3/S5 thêm decision-table fixture và host-level prompt eval; không thêm workflow hoặc skill mới trước khi có evidence một boundary thật sự chưa được bao phủ.

### F14 — P1: `Evidence → Requirements → Execution` chỉ là artifact backbone, chưa phải full lifecycle

Chuỗi ba bước đã sửa đúng ownership của task artifact nhưng gộp mất Plan/Ready gate vào Requirements hoặc Execution, và không biểu diễn Verify, Persist/Finish, Debug/Replan hay Blocked/Continue. Vì vậy agent có thể hiểu nhầm rằng đủ evidence và requirement là được sửa code, hoặc test cục bộ xanh là đã hoàn tất.

Research đối chiếu RIPER, EPCC, GitHub Spec Kit, Kiro Specs, ReAct và Reflexion cho thấy ba lớp khác nhau: RIPER/EPCC/spec-driven là outer lifecycle; ReAct/Reflexion/TDD là inner loop; Evidence → Requirements → Execution là data flow giữa artifact. Không nên chọn một acronym nguyên khối hoặc tạo mode mới.

Khuyến nghị: giữ artifact backbone nhưng đổi canonical semantic view thành Evidence-Gated Lifecycle: Restore/Triage → Evidence → Requirements → Plan/Ready → Execute → Verify → Persist/Finish, với Debug/Replan và Blocked/Continue làm feedback/recovery loop. Map toàn bộ vào status/checkpoint và bảy skill hiện có.

### F15 — P1: lifecycle có thể biểu diễn đủ work kind nhưng routing/skill contract chưa chứng minh đủ coverage

Source hiện tại cover tốt lifecycle chung cho feature, bug fix, refactor và test mutation qua Brainstorm → Implement/Debug → Check → Finish. Hotfix có thể dùng cùng bug-fix path và urgency không nên là lý do bỏ gate. Docs/config/build/dependency/migration/security/performance/release cũng có thể chọn Lite/Full theo risk rồi dùng cùng stage owner.

Tuy nhiên coverage hiện còn ba lỗ hổng quan sát được:

1. `RouteRequest.intent` chỉ có `question|plan|implement|fix|docs`; feature/refactor/test/hotfix bị suy diễn từ verb, còn `implement` luôn bị ép Full. Chưa có normalized work-kind tách khỏi requested action/risk.
2. Standalone read-only code review được Brainstorm xếp Bypass, trong khi `harnix-check` chỉ nhận implementation đang `in_progress|verifying`. Vì vậy Harnix chưa có review protocol chuyên biệt có thể được skill detect; review-and-fix lại là mutation và phải tạo/resume task.
3. Test hiện chỉ được mô tả như kỹ thuật verification/TDD, chưa phân biệt run/analyze test, add characterization/coverage test, fix failing test và test-infrastructure change. Hotfix cũng chưa khóa rollback/time-critical semantics và rule không bỏ compliance/security gate.

Khuyến nghị: không thêm workflow hoặc skill. S3 tách `action` khỏi `workKind` và cho `harnix-check` hai entry rõ ràng: standalone read-only review không persist task, hoặc active-task verification. S5 thêm work-kind decision table và prompt eval cho feature, bugfix, hotfix, review-only, review-and-fix, refactor, test-only, failing-test, docs, migration, dependency/security/performance/release. Mỗi case phải có mode, initial owner, stage path, required evidence và forbidden shortcut.

## Ma trận coverage theo loại công việc

| Loại request | Có thể biểu diễn bằng lifecycle hiện tại | Skill/procedure hiện tại | Verdict trước refactor S3/S5 |
|---|---|---|---|
| Feature | Có | Brainstorm → Implement → Check → Finish | Partial: procedure đủ, router hiện ép `implement` thành Full và chưa có feature eval |
| Bug fix | Có | Brainstorm → Implement hoặc Debug → Check → Finish | Partial: debug tốt nhưng initial known/unknown-root-cause route chưa deterministic |
| Hotfix | Có | Bug-fix path | Partial: chưa có urgency/rollback profile và negative eval chống skip gate |
| Standalone code review | Có qua Bypass | Chưa có incoming profile hợp lệ trong Check | Gap: generic agent review được, nhưng Harnix skill contract chưa cover rõ |
| Review rồi fix | Có | Brainstorm → Implement/Debug → Check → Finish | Partial: cần eval phân biệt read-only với mutation |
| Refactor | Có | Brainstorm → Implement → Check → Finish | Partial: Implement nêu refactoring, chưa có preservation/characterization route eval |
| Run/analyze tests | Có qua Bypass | Generic diagnostic | Partial: chưa khóa distinction với test mutation |
| Add/change tests | Có | Brainstorm → Implement → Check → Finish | Partial: chưa có test-only evidence profile; TDD prose thiên về production behavior |
| Fix failing test | Có | Brainstorm → Debug → Check → Finish | Partial: procedure đủ, chưa có representative route eval |
| Docs/config/build/maintenance | Có | Brainstorm → Implement exception → Check → Finish | Mostly covered; cần work-kind parity eval |
| Migration/dependency/security/performance/release | Có | Full + optional Research → Implement/Debug → Check → Finish | Semantic coverage đủ; cần profile-specific risk/evidence eval |

Do đó verdict chính xác là **lifecycle cover đủ về khả năng biểu diễn, nhưng skill routing và eval mới cover một phần**. Sau S3/S5, có thể tuyên bố full coverage nếu deterministic decision, static skill contract và host prompt eval đều pass trên representative case.

## Kết quả kiểm tra tính nhất quán của persisted state

| Hạng mục kiểm tra | Kết quả |
|---|---|
| Parse task JSON và đối chiếu directory ID | 14/14 pass |
| Criterion của completed task | 13/13 chỉ chứa `met`; không có pending criterion |
| Completion journal coverage | 13/13 completed task có entry liên kết |
| Active pointer | Hợp lệ; trỏ tới `20260813-141753-historyaudit` |
| Full artifact | Có đủ cho cả sáu Full task, bao gồm task audit này |
| Evidence và criterion reference | Mọi ID được tham chiếu đều tồn tại |
| Timestamp | Mọi task/evidence/journal timestamp parse được và thứ tự task hợp lý |
| Persisted machine path/secret không an toàn | Không phát hiện bằng bounded pattern scan |
| Frozen command evidence invariant | Fail: hai command-linked evidence record thiếu integer `exitCode` |
| Khả năng truy xuất artifact hiện tại | Warning: hai historical path không còn tồn tại |
| Research contract | Warning: official-source research của task guide thiếu remaining uncertainty |
| Đối chiếu Git | 18 commit từ documentation baseline tới `749466c`; không có tag; working tree sạch trước audit |

## Tổng hợp research

Tài liệu chính thức của Codex xác định AGENTS file được nạp làm session guidance, trong khi skill dùng progressive disclosure và chỉ nạp toàn bộ instruction khi được chọn. Hướng dẫn model của OpenAI khuyến nghị nêu rule một lần, giữ always-on prompt gọn, xác định authority ngắn gọn và đánh giá trên task đại diện. Tài liệu hook chính thức cũng xác định `/hooks` là luồng trust của CLI.

Vì vậy Harnix nên giữ stable boundary trong AGENTS, state contract ngắn trong workflow, mỗi procedure chỉ trong một skill và toàn bộ dữ kiện/evidence thay đổi trong task artifact. Research mới cũng kết luận không bổ sung workflow/skill: cần sửa routing contract, description và eval trước. So sánh pattern bổ sung Plan, Verify và Persist vào semantic view nhưng không đổi state machine. Bản ghi đầy đủ source/fact/inference/uncertainty nằm tại `research/codex-long-running-workflows.md`, `research/workflow-routing-and-skill-detection.md` và `research/coding-workflow-pattern-comparison.md`.

## Inventory workflow và verdict detection

| Lớp | Số lượng hiện tại | Kết luận |
|---|---:|---|
| Canonical state machine | 1 | Đúng; không tạo platform-specific workflow. |
| Entry route | 3 | Bypass, Lite, Full; Lite/Full là ceremony, không phải workflow riêng. |
| Persisted status | 6 | `planning`, `ready`, `in_progress`, `verifying`, `blocked`, `completed`. |
| Checkpoint | 8 | `triage`, `planning`, `ready`, `implementing`, `debugging`, `replan`, `verifying`, `finishing`. |
| Stage skill | 7 | Đủ bao phủ lifecycle; research/debug là conditional nhưng vẫn được cài như canonical skill. |
| Verification stage | 2 | Compliance trước quality/security. |

**Task hiện tại được route đúng là Full** vì đây là cross-layer architecture/refactor, có external research, migration/preservation risk và nhiều normative/runtime/test boundary. **Request hiện tại được route đúng qua Continue → Brainstorm/Replan**, không phải Implement: user yêu cầu cập nhật PRD/plan của task plan-only đang `ready`, chưa yêu cầu sửa production code.

Ở cấp sản phẩm, verdict là **partially correct**: taxonomy và skill ownership đúng, nhưng detector không hoàn toàn operational. Actual implicit detection phụ thuộc host model khớp description; helper TypeScript chỉ là test oracle chưa được runtime dùng và chưa bao phủ đủ signal/state.

## Đánh giá pattern của task hiện tại

Task đang dùng pattern **Full + plan-only + evidence-first**: audit/research đi trước, PRD/plan khóa quyết định, sau đó dừng tại ready. Lifecycle này đúng nhưng bản artifact đầu chưa tách ownership tốt: báo cáo kiểm toán chứa cả target workflow và decision log, trong khi PRD chủ yếu mô tả deliverable kiểm toán.

`Evidence → Requirements → Execution` **đã ổn như artifact backbone nhưng chưa ổn nếu gọi là workflow đầy đủ**. Pattern canonical được khuyến nghị là **Evidence-Gated Lifecycle**:

1. Restore/Triage khôi phục active state hoặc chọn Bypass/Lite/Full.
2. Evidence dùng `audit-report.md` và targeted `research/*.md` cho fact, provenance, finding và uncertainty.
3. Requirements dùng `prd.md` cho WHY/WHAT; Plan dùng `plan.md` cho HOW/WHEN và ready gate.
4. Execute tạo source/test/docs diff; inner loop có thể là RED → GREEN → REFACTOR, ReAct-style observe/act hoặc hypothesis-driven debug.
5. Verify tách compliance khỏi quality/security; Persist/Finish ghi supporting evidence, journal và clear matching pointer.
6. `task.json` giữ lifecycle, acceptance, validation và traceability machine-readable; không có `implement.md`.

| Pattern tham khảo | Phần nên adapt | Phần không nhận |
|---|---|---|
| RIPER | Research, so sánh phương án, explicit Plan, Review | Strict ceremony cho mọi task, branch/memory-bank assumption |
| EPCC | Explore, collaborative Plan, Code QA và resume artifact | Commit/PR là lifecycle phase, auto-stage/commit |
| Spec Kit/Kiro Specs | Requirements/Design/Tasks traceability, ceremony level | Dùng artifact tồn tại thay cho operational persistence/finish |
| ReAct/Reflexion/TDD | Inner observe-feedback-test loop | Biến private reasoning/memory thành project state |

Chi tiết normative của pattern, workflow đích và decision log đã được chuyển sang `prd.md`; báo cáo này chỉ giữ các quan sát làm đầu vào cho chúng.

## Bàn giao sang PRD và plan

- `prd.md` biến F1–F15 thành R0–R10, xác định behavior đích và ranh giới sản phẩm.
- `plan.md` ánh xạ R0–R10 sang S0–S7 với test, migration, rollback và verification cụ thể.
- Chưa có implementation vì request gốc chỉ cho audit/research/planning và yêu cầu dừng ở `ready/ready`. Khi người dùng yêu cầu thực thi task hiện tại, workflow chuyển sang `in_progress/implementing`; không tạo task mới và không tạo `implement.md`.

## Khuyến nghị cuối

Triển khai S0 và S1 trước. Hai slice này loại bỏ rule không an toàn cho consumer, sửa current contract và làm frozen invariant hiện có quan sát được mà không chạm historical evidence. Sau đó triển khai hidden persistence boundary; tại S3/S5 phải khóa work-kind matrix và standalone review profile trước khi tuyên bố feature/fix/hotfix/review/refactor/test được cover đầy đủ. Không chạy global update, setup trên profile thật, sửa historical evidence, manual G10 smoke, commit hoặc push trong task audit này.
