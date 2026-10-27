# PRD: Sửa lỗi tiêu chí "pending" giả khi check bao phủ nhiều tiêu chí

## Bối cảnh

Người dùng báo cáo rằng sau một vòng remediation trong `verifying` (harnix-check phát hiện lỗ hổng test, sửa lại đúng các file đã có evidence pass, ghi thêm evidence pass mới), `harnix audit` trả về hai bức tranh mâu thuẫn trong cùng một lần gọi: `completion.requiredChecks` báo toàn bộ required check đã `passed` (0 stale), nhưng `completion.criteria.pending` vẫn liệt kê đủ các tiêu chí mà check đó bao phủ.

Điều tra mã nguồn thực tế cho thấy giả thuyết ban đầu của báo cáo ("finish so lịch sử đầy đủ, requiredChecks chỉ so evidence mới nhất") không đúng: `assertVerificationInputsFresh` ([src/core/verification/input-freshness.ts](../../../src/core/verification/input-freshness.ts)) và `inspectRequiredChecks` ([src/core/verification/check-report.ts](../../../src/core/verification/check-report.ts)) dùng chung đúng một thuật toán "chỉ evidence mới nhất theo timestamp mỗi check", và `harnix audit` cũng tái sử dụng đúng classifier này qua `inspectRequiredCheckEvidence` ([src/core/status.ts](../../../src/core/status.ts)).

Nguyên nhân gốc thực sự nằm ở tầng cao hơn, và tồn tại ở **hai nơi độc lập nhưng giống hệt nhau về logic**:

1. `criterionHasFreshSupport` trong [src/core/tasks/task-audit.ts](../../../src/core/tasks/task-audit.ts) (dòng 176-198) — dùng bởi `harnix audit`.
2. `canCompleteTask` trong [src/core/workflow.ts](../../../src/core/workflow.ts) (dòng 72-90) — dùng bởi `harnix workflow --finish` để quyết định có cho phép hoàn tất task hay không, và được `task-audit.ts` tái sử dụng để tính `completion.status` tổng thể.

Cả hai đều đòi hỏi evidence mà một acceptance criterion trỏ tới (`criterion.evidenceIds`) phải **chính là** evidence có timestamp mới nhất tuyệt đối của cả check (`task-audit.ts`: `latestByCheck.get(evidence.checkId)?.id !== evidence.id` → loại; `workflow.ts`: `latestByCheck.get(evidence.checkId)?.id === evidence.id` trong điều kiện lọc `freshPasses`). Khi một check bao phủ nhiều tiêu chí và một vòng remediation ghi nhiều evidence pass riêng biệt (thay vì một evidence dùng chung), chỉ tiêu chí trỏ tới evidence có timestamp muộn nhất mới được tính "met"; mọi tiêu chí khác — dù evidence của chúng có `inputDigest` vẫn khớp hoàn toàn với trạng thái file hiện tại, và check vẫn đang "passed" — bị tính sai thành "pending". Vì `canCompleteTask` là gate thật sự của `--finish`, chỉ sửa `task-audit.ts` (như task ban đầu khoanh phạm vi) không đủ để `harnix workflow --finish` hoạt động đúng — phát hiện này qua TDD (test hồi quy vẫn RED sau khi sửa `task-audit.ts` vì `completion.status` tái sử dụng `canCompleteTask`) buộc mở rộng phạm vi kỹ thuật sang `workflow.ts` trong cùng slice, không phải một quyết định sản phẩm mới.

Một triệu chứng liên quan (không phải cùng cơ chế) là thông báo lỗi "stale" của `harnix workflow --finish` hiện chỉ liệt kê `changed:`/`missing:` path mà không cho biết evidence nào đã ghi nhận hash không còn khớp, khiến người dùng khó phân biệt "dữ liệu bị hỏng" với "file vừa bị sửa lại sau khi evidence được ghi nhận" (ví dụ: autoSave chỉnh lại file giữa lúc ghi evidence và lúc chạy `--finish`).

## Quyết định phạm vi (đã được người dùng xác nhận)

Chỉ sửa logic completion không nhất quán và cải thiện nội dung thông báo lỗi/tài liệu hướng dẫn. **Không** thêm transport `--evidence --supersedes`, **không** nới quy tắc retire-check, và **không** thay đổi bất kỳ field/schema JSON công khai nào đã đóng băng ở `docs/IMPLEMENTATION_PLAN.md` §4 (bao gồm hình dạng chính xác của `ChecksReportResultV1`/`TaskAuditResultV1`). Lý do: nguyên nhân gốc đã xác nhận là một lỗi logic cục bộ trong `criterionHasFreshSupport`, không phải thiếu một cơ chế supersede; sửa đúng chỗ này giải quyết triệu chứng mà không cần đổi frozen contract.

## Mục tiêu và giá trị người dùng

Khi một required check đang ở trạng thái `passed` (dữ liệu hiện tại khớp với evidence mới nhất của check), mọi acceptance criterion mà check đó bao phủ phải được tính "met" ngay khi có ít nhất một evidence pass với `inputDigest` khớp đúng trạng thái hiện hành — bất kể evidence đó có phải là evidence có timestamp mới nhất tuyệt đối của check hay không. `harnix audit`/`harnix workflow --finish` không còn tự mâu thuẫn giữa `requiredChecks` và `criteria` trong cùng một lần gọi. Khi `--finish` báo "stale", thông báo lỗi nêu rõ evidence nào không còn khớp và khi nào evidence đó được ghi nhận.

## Trong phạm vi

- Sửa `criterionHasFreshSupport` để chấp nhận bất kỳ evidence pass nào của criterion có `inputDigest` khớp với `inputDigest` hiện hành của check (thay vì bắt buộc là evidence có id trùng với evidence mới nhất tuyệt đối).
- Thêm test hồi quy tái hiện chính xác kịch bản báo cáo: một check v2 bao phủ nhiều criteria, nhiều evidence pass được ghi trong cùng vòng verifying, tất cả cùng `inputDigest` hợp lệ hiện hành.
- Cải thiện nội dung thông báo lỗi của `assertVerificationInputsFresh` (dùng bởi `harnix workflow --finish`) để nêu rõ evidence id và `recordedAt` của evidence không còn khớp, bên cạnh danh sách path đã có.
- Bổ sung một câu hướng dẫn trong `src/skills/harnix-finish-work/SKILL.md` cảnh báo về khoảng hở thời gian giữa lúc ghi evidence và lúc chạy `--finish` (autoSave/formatter có thể làm file trôi), và giải thích thông báo lỗi mới giúp phân biệt hai nguyên nhân.

## Ngoài phạm vi

- Bất kỳ thay đổi nào tới field/schema JSON công khai của `harnix checks`, `harnix audit`, `harnix status`, hoặc `RequiredCheckReasonCode`.
- Cơ chế supersede evidence tường minh (`--evidence --supersedes`).
- Nới quy tắc retire-check cho phép thay thế một check đã từng pass.
- Thay đổi thuật toán "latest evidence theo timestamp" dùng chung bởi classifier (`inspectRequiredChecks`) — thuật toán này đã đúng và nhất quán, không cần sửa.

## Rủi ro và bảo toàn

- Rủi ro chính: nới lỏng điều kiện "phải là evidence mới nhất" có thể vô tình chấp nhận một evidence cũ đã lỗi thời (file đã đổi thật sự từ khi evidence đó được ghi). Giảm thiểu: điều kiện mới vẫn bắt buộc `evidence.inputDigest` của evidence được tham chiếu phải **bằng đúng** `inputDigest` của evidence mới nhất hiện hành của check (không chỉ dựa vào trạng thái "passed" chung chung) — nghĩa là chỉ evidence nào đã ghi nhận đúng digest hiện hành mới được chấp nhận; evidence có digest khác (kể cả cũ hơn hoặc là bản ghi lỗi thời thật sự) vẫn bị loại.
- Bảo toàn: không sửa `check-report.ts`, `input-freshness.ts` (ngoài câu message), hay bất kỳ field JSON công khai nào; không đổi hành vi của TaskRecord schema v1 (giữ nguyên nhánh `task.schemaVersion === 1`).

## Tiêu chí chấp nhận

### AC `criterion-fresh-any-evidence`

Cả `criterionHasFreshSupport` ([src/core/tasks/task-audit.ts](../../../src/core/tasks/task-audit.ts)) và `canCompleteTask` ([src/core/workflow.ts](../../../src/core/workflow.ts)) coi một criterion/evidence là "tươi" nếu evidence có `result: "pass"`, `checkId` trỏ tới một required check đang ở trạng thái `passed`, và `evidence.inputDigest` bằng đúng `inputDigest` của evidence mới nhất hiện hành của check đó (không còn bắt buộc `evidence.id` phải trùng với id của evidence mới nhất). Hành vi TaskRecord schema v1 giữ nguyên không đổi ở cả hai hàm.

### AC `regression-test-multi-criteria-check`

`test/unit/task-audit.test.ts` và `test/workflow/routing.test.ts` mỗi file có một test mới: một TaskRecord v2 với một required check bao phủ ≥2 acceptance criteria qua `criterionIds`; mỗi criterion trỏ tới một evidence pass khác nhau (không phải evidence có timestamp mới nhất) nhưng tất cả cùng `inputDigest` với evidence mới nhất thật sự của check; `createTaskAudit` trả về `completion.criteria.pending: 0` và `completion.status: "pass"`, và `canCompleteTask` trả về `true`, khi check ở trạng thái `passed`. Test thất bại trước khi sửa (RED) và pass sau khi sửa (GREEN).

### AC `finish-stale-message-detail`

Khi `assertVerificationInputsFresh` phát hiện input không còn tươi cho một check, thông báo lỗi ném ra chứa id và `recordedAt` của evidence đang được đối chiếu (evidence mới nhất của check), bên cạnh danh sách `changed:`/`missing:` path hiện có. Không có field/schema JSON công khai nào thay đổi — đây thuần túy là nội dung chuỗi message của một lỗi nội bộ (hidden `workflow --finish` không có body phản hồi công khai ngoài exit code/stderr).

### AC `finish-work-skill-race-guidance`

`src/skills/harnix-finish-work/SKILL.md` bổ sung một câu giải thích: `--finish` tính lại độ tươi dựa trên nội dung file tại đúng thời điểm gọi lệnh, nên bất kỳ chỉnh sửa nào (kể cả autoSave/formatter) xảy ra giữa lúc ghi evidence pass cuối cùng và lúc gọi `--finish` sẽ khiến `--finish` báo stale một cách chính đáng; thông báo lỗi mới nêu rõ evidence/thời điểm liên quan để người dùng phân biệt được với một snapshot bị hỏng thật sự.
