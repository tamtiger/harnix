# Cắt các nguồn token lớn nhất theo số đo

- **ID:** 20261001-185520-cut-measured-token-load
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-10-01 18:55:20 +07:00
- **Updated:** 2026-10-01 19:45:53 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Dùng đường cơ sở của measure:tokens để giảm token theo thứ tự đo được: (1) hook context mỗi prompt chỉ liệt kê guide (đường dẫn + kích thước) thay vì nhúng nội dung, vẫn nhúng file nguồn/task; (2) preflight chỉ trả learning khi nextStage là plan; (3) rule 2 và workflow.md: đọc workflow.md và --schema một lần mỗi phiên, cookbook gộp thành một khối; (4) harnix epic <id> --brief; (5) thông báo lỗi envelope nêu tên field lạ và dạng { task }. Chạy lại measure:tokens để ghi số sau. Bump 2.0.0-dev.12 và CHANGELOG.md.

## Non-goals

- Không thêm cờ patch/--set-field và không đổi hình dạng tạo task (chờ dữ liệu tần suất sửa task)
- Không gộp các lệnh transition/criterion vì chạm bảng transition đã frozen
- Không sửa AGENTS.md gốc (quyết định riêng của chủ repo)
- Không đổi schema v3 hay giá trị mặc định context.maxCharacters của config hiện có

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-hook-pointer` (met): harnix context --platform <p> khi có active task không nhúng nội dung guide mà liệt kê đường dẫn và kích thước từng guide; file nguồn/task vẫn được nhúng, mục Omitted vẫn được liệt kê; trên fixture của measure:tokens tổng hook context giảm ít nhất 60% so với đường cơ sở 1.307 token.
- `ac-preflight-learning` (met): workflow --preflight trả learning khi nextStage là plan và trả mảng rỗng ở implement, verify, debug; nền tảng không hook vẫn nhận learning ở stage plan.
- `ac-rules-docs` (met): Rule block ghi rõ đọc .harnix/workflow.md và --schema một lần mỗi phiên, cookbook của workflow.md là một khối thay vì hai khối shell; test instruction-budget (1.500/2.000/4.000/15.000) và test guidance vẫn đạt.
- `ac-epic-brief` (met): harnix epic <epic-id> --brief trả id/title epic, đếm theo trạng thái, next task và id+status từng member, nhỏ hơn 25% output đầy đủ của epic cùng kích thước; không --brief thì output không đổi.
- `ac-save-error` (met): Khi envelope --save chứa field lạ hoặc thiếu bọc { task }, thông báo lỗi nêu đúng tên field lạ và dạng envelope mong đợi { task, artifacts?, ... } thay vì chỉ nói unknown schema field.
- `ac-measured` (met): pnpm run measure:tokens sau thay đổi cho thấy hook context giảm ít nhất 60% và preflight ở nextStage khác plan giảm so với đường cơ sở; số trước/sau được ghi vào task bằng add-decision.
- `ac-preflight-brief` (met): workflow --preflight --brief được chấp nhận và bỏ learning (vẫn giữ clock, activeTask, requiredChecks, nextStage); lệnh không hỗ trợ --brief báo lỗi nêu danh sách lệnh hỗ trợ --brief thay vì chỉ nói không hỗ trợ.
- `ac-hook-whole-entries` (met): Hook context không bao giờ cắt giữa một entry: mỗi file được chèn nguyên vẹn hoặc là con trỏ; file dài từ 1.500 ký tự trở lên (kể cả relevantPaths như package.json) là con trỏ; tổng độ dài không vượt context.maxCharacters và mục Omitted vẫn đúng.
- `ac-docs-gaps` (met): workflow.md ghi rõ harnix context --platform <p> và harnix context-report --platform <p> (cờ bắt buộc), và reference epic nêu cách sửa member không active bằng harnix pause rồi harnix resume <id>; test guidance kiểm các câu này.
- `ac-schema-constraints` (met): workflow --schema liệt kê ràng buộc mà validator thực thi: enum mode, status, checkpoint, scope (focused|full), result, định dạng id, mảng criterionIds/inputs sorted và unique, evidenceIds: [] bắt buộc trên criterion, và dạng envelope { task, ... }; test đối chiếu danh sách với validator để schema không lệch khỏi mã.
- `ac-brief-coverage` (met): Rule 10, cookbook của workflow.md và --schema nêu --brief cho mọi lệnh ghi mà tập BRIEF_ACTIONS hỗ trợ (gồm --set-check, --add-criterion, --set-paths, --run-check) lấy từ một tập duy nhất đặt trong src/core/workflow/brief.ts; thông báo lỗi --brief liệt kê tập này; test đối chiếu văn bản hướng dẫn với tập đó để lệnh ghi không còn in lại cả task vì thiếu --brief.
- `ac-run-check-hint` (met): Khi --run-check trên Windows từ chối đối số vì ký tự không an toàn với cmd.exe, thông báo nêu cách xử lý (dùng tên có đuôi như pwsh.exe hoặc đường dẫn đầy đủ) và cookbook của workflow.md ghi điều này cho lệnh ghép như lint && typecheck && test; test check-runner kiểm thông báo.
- `ac-epic-order` (met): Thứ tự member của epic khớp thứ tự thực thi: reference epic và workflow.md dặn gán idPrefix tăng dần theo thứ tự thực thi cho từng member; --save với epicMembers báo lỗi nêu cách sửa khi ID các member (task đầu rồi epicMembers theo thứ tự khai báo) không tăng dần chặt; nextTask của harnix epic là member chưa hoàn tất đầu tiên theo thứ tự đó.

## Required checks

- `chk-hook` (focused): Test hook context: guide là con trỏ, không cắt giữa entry, file dài là con trỏ — pass (2026-10-01 19:41:57 +07:00)
- `chk-preflight` (focused): Test preflight chỉ trả learning ở stage plan và chấp nhận --brief — pass (2026-10-01 19:42:02 +07:00)
- `chk-rules` (focused): Test ngân sách instruction, guidance rule/workflow.md và độ phủ --brief — pass (2026-10-01 19:43:54 +07:00)
- `chk-epic-save` (focused): Test epic --brief, thông báo lỗi envelope và thứ tự member epic — pass (2026-10-01 19:42:17 +07:00)
- `chk-measure` (focused): Đo lại token trên bản build sau thay đổi (chạy pnpm build trước) — pass (2026-10-01 19:44:09 +07:00)
- `chk-suite` (full): Project suite gate — pass (2026-10-01 19:45:16 +07:00)
- `chk-schema` (focused): Test --schema mô tả đủ ràng buộc, khớp validator và khớp BRIEF_ACTIONS — pass (2026-10-01 19:43:49 +07:00)
- `chk-runner` (focused): Test thông báo --run-check nêu cách xử lý ký tự cmd.exe — pass (2026-10-01 19:42:21 +07:00)

## Decisions

- **d-hook-pointer** — Hook context liệt kê guide dạng con trỏ (đường dẫn + kích thước) thay vì nhúng nội dung; file nguồn/task vẫn nhúng.
  - _Why:_ Hook không được ghi (no-write) nên không thể khử trùng lặp theo phiên; guide nhúng lại ở mọi prompt (~1,3-2,9k token) và tích lũy trong context. AGENTS.md đã yêu cầu agent chỉ đọc guide liên quan, nên con trỏ giữ được việc phát hiện mà bỏ chi phí lặp. Cần chủ repo xác nhận vì đổi hành vi hook đã tài liệu hóa.
- **d-observed-friction** — Lỗi gặp khi chạy workflow thật (đã xác minh bằng mã): (1) --preflight --brief bị từ chối "not supported" mà không nêu lệnh nào hỗ trợ; (2) --save với task trần báo "unknown schema field" không nêu tên field hay dạng { task }; (3) --set-check, --add-criterion, --set-paths hỗ trợ --brief nhưng rule 10, cookbook và --schema không nêu nên in lại cả task (~1,3k token mỗi lần, 3 lần liên tiếp); (4) --schema không có enum scope/status/mode, sorted/unique hay regex id nên agent phải đọc văn xuôi trong workflow.md; (5) harnix context và context-report bắt buộc --platform nhưng workflow.md không ghi; (6) hook boundedContext cắt cứng giữa file (internal-context.ts:156) nên guide bị cụt giữa câu và hook nhúng cả package.json từ relevantPaths; (7) reference epic không nói cách sửa member không active (cần harnix pause rồi harnix resume).
  - _Why:_ Mỗi lỗi buộc agent chạy lại hoặc đọc thêm tài liệu; sửa tại nguồn (mã, schema, guide) rẻ hơn lặp lại ở mọi phiên và là cùng mục tiêu giảm token của epic.
- **d-hook-pointer-approved** — Chủ repo chọn phương án A (2026-10-01): guide trong hook context là con trỏ (đường dẫn + kích thước), không nhúng nội dung; ngưỡng con trỏ cho file khác guide là 1.500 ký tự.
  - _Why:_ Hook no-write không khử trùng lặp theo phiên; phương án A giảm token mỗi prompt và dòng con trỏ nhắc đọc guide khi khớp file đang sửa.
- **d-run-check-cmd-exe** — Quan sát thêm khi triển khai task 1: --run-check với executable tên trần trên Windows đi qua cmd.exe và từ chối & | < > ^ % với thông báo "unsafe for cmd.exe" không nêu cách xử lý (src/utils/check-runner.ts:35); lệnh ghép chạy được bằng tên có đuôi như pwsh.exe. Agent phải chạy lại và đọc mã runner.
  - _Why:_ Cùng nhóm lỗi thông báo thiếu hành động; sửa ở thông báo và cookbook rẻ hơn mỗi phiên tự dò.
- **d-epic-order-lesson** — Khi tạo epic với mọi member dùng cùng idPrefix, harnix epic sắp member theo tên thư mục (epic.ts:143) nên thứ tự thực thi bị đảo: trang epic ghi task phụ thuộc là #1 và nextTask khuyến nghị nó trước task nền. Hướng dẫn epic chỉ nói dùng clock.idPrefix cho epic và mọi task, không nói phải tăng dần.
  - _Why:_ Lỗi do hướng dẫn thiếu dẫn tới khuyến nghị sai thứ tự; sửa ở reference và chặn ở --save rẻ hơn để người dùng tự phát hiện.
- **d-golden-schema-update** — Cập nhật test/workflow/behavior-snapshot.golden.json một lần có chủ đích: chỉ output của workflow --schema đổi (thêm khối constraints, câu mô tả --brief); mọi output khác của golden giữ nguyên.
  - _Why:_ Đây là thay đổi hành vi được duyệt (schema có ràng buộc), không phải refactor thuần; diff đã được đọc và chỉ gồm +65/-1 dòng của schema.
- **d-measured-after** — Đo lại bằng pnpm run measure:tokens sau thay đổi (trước → sau, token ceil(ký tự/4)): hook context 1.307 → 130 mỗi prompt (-90%) ở fixture; ở repo Harnix với task active ~2,9k ước → 942 đo thật. preflight ở stage implement 375 → 135 (learning chỉ ở stage plan). Chi phí tăng: khối luôn nạp 1.173 → 1.242 (+69), workflow.md 3.551 → 3.593 (+42), --schema 744 → 1.012 (+268, đọc một lần mỗi phiên). Lệnh ghi có --brief không đổi (337 token cả vòng đời Lite).
  - _Why:_ Mức giảm lớn nhất nằm ở chi phí lặp mỗi prompt; phần tăng nhỏ và chỉ trả một lần, nên tổng chi phí mỗi phiên giảm rõ rệt.

## Residual risks

- **r-pointer-ignored** (medium) — Hook liệt kê guide dạng con trỏ nên agent có thể không mở guide và bỏ qua quy tắc kỹ thuật; chủ repo đã chọn phương án này (d-hook-pointer-approved), giảm nhẹ bằng dòng nhắc đọc guide khi khớp file đang sửa.
- **r-measure-fixture-no-learning** (low) — measure:tokens dùng fixture không có learning nên không thể hiện mức giảm của preflight ở stage khác plan; số đó chỉ đo trực tiếp trên repo có learning (375 → 135 token).
- **r-epic-order-strict** (low) — --save với epicMembers nay từ chối ID không tăng dần chặt; luồng tạo epic cũ dùng chung idPrefix cho mọi member theo thứ tự slug không tăng dần sẽ bị từ chối cho tới khi tăng idPrefix từng member.

## Evidence

- `chk-hook` — pass (2026-10-01 19:41:57 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-preflight` — pass (2026-10-01 19:42:02 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-schema` — pass (2026-10-01 19:43:49 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- skipped (2026-10-01 19:31:51 +07:00): Task contract revised at persisted replan: Thông báo lỗi envelope và kiểm tra thứ tự epicMembers được cài trong src/core/workflow/envelope.ts nên file này phải nằm trong inputs của check để digest phản ánh đúng thay đổi.
- `chk-runner` — pass (2026-10-01 19:42:21 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-rules` — pass (2026-10-01 19:43:54 +07:00): pnpm — exit 0 _(2 earlier reruns not shown; see task.json for full history)_
- `chk-epic-save` — pass (2026-10-01 19:42:17 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-measure` — pass (2026-10-01 19:44:09 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-suite` — pass (2026-10-01 19:45:16 +07:00): pwsh.exe — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
