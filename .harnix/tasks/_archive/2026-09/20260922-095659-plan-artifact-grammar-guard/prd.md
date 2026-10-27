# PRD: Chặn corruption ngữ pháp execution-notes ngay tại --save, và phân biệt rõ nguyên nhân khi audit/checks phát hiện

## Bối cảnh

Người dùng phát hiện và tôi đã tái hiện thành công bằng test tạm (đã xoá sau khi xác nhận): khi một task Full đã có evidence pass hợp lệ, sau đó một lần `harnix workflow --save` khác chỉ sửa `plan.md` (ví dụ: tick checklist, ghi execution-notes) mà **không** kèm evidence mới trong cùng lần gọi, nội dung `plan.md` được ghi thẳng xuống đĩa mà không hề được validate ngữ pháp execution-notes (`check:<id>=pending|passed|failed|skipped` / `slice:<id>=...`). Nếu nội dung đó sai ngữ pháp (ví dụ `slice:S1=done` thay vì `slice:S1=passed`), lỗi chỉ lộ ra sau đó, và lộ ra không nhất quán:

- `harnix workflow --finish` (qua `assertVerificationInputsFresh`) ném thẳng lỗi cụ thể: "Planning execution-note region accepts only inert check/slice status grammar."
- `harnix audit`/`harnix checks`/preflight (qua `inspectRequiredChecks`) nuốt lỗi này vào một `catch` chung, biến nó thành trạng thái `stale` với `reasonCodes: ["inputs-unavailable"]` — hoàn toàn không phân biệt được với trường hợp một file input thật sự bị xoá/đổi tên.

**Nguyên nhân gốc (2 phần độc lập, đã xác nhận qua code + test tái hiện):**

1. `validateTaskArtifacts`/`saveTaskArtifacts` ([src/core/tasks/task.ts:353-372](../../../src/core/tasks/task.ts#L353-L372)) chỉ kiểm tra `plan.md`/`prd.md` không rỗng, không kiểm tra ngữ pháp execution-notes. Ngữ pháp chỉ được kiểm tra bên trong `canonicalizePlanningArtifactV1`, và hàm này chỉ được gọi khi `persistNewVerificationInputSnapshots` ([src/core/verification/input-freshness.ts:157-190](../../../src/core/verification/input-freshness.ts#L157-L190)) có evidence pass/fail mới để xử lý trong cùng lần `--save`. Không có evidence mới → hàm `return` sớm, không validate gì.
2. `inspectRequiredChecks` ([src/core/verification/check-report.ts:65-67](../../../src/core/verification/check-report.ts#L65-L67)) bọc lời gọi `computeVerificationInputSnapshot` trong một `catch` không phân loại, biến **mọi** lỗi (file thiếu, glob rỗng, hay ngữ pháp execution-notes sai) thành cùng một `reasonCodes: ["inputs-unavailable"]`.

## Quyết định phạm vi (đã được người dùng xác nhận)

Sửa cả hai phần trên (người dùng chọn phương án rộng hơn khi được hỏi):

1. Chặn corruption ngay tại `--save` — tái sử dụng `canonicalizePlanningArtifactV1` đã có sẵn, không viết lại logic ngữ pháp.
2. Thêm một `RequiredCheckReasonCode` mới (`plan-artifact-invalid`) để `inspectRequiredChecks` phân biệt "nội dung plan/prd bị hỏng ngữ pháp" với "input thật sự thiếu/đổi" — đây là thay đổi vào enum công khai đã đóng băng ở `docs/IMPLEMENTATION_PLAN.md` §4.5J, nên PRD/docs phải cập nhật đồng thời trong cùng lần này theo đúng AGENTS.md mục "Frozen contracts".

## Mục tiêu và giá trị người dùng

`harnix workflow --save` không bao giờ ghi xuống đĩa một `plan.md` có execution-notes sai ngữ pháp nữa — lỗi bị chặn ngay lập tức, task không bị đổi trạng thái, không file nào bị ghi. Nếu một task cũ (tạo trước khi có fix này) đã lỡ bị corrupt theo kiểu này, `harnix audit`/`harnix checks`/preflight báo đúng `reasonCodes: ["plan-artifact-invalid"]` thay vì `inputs-unavailable` mơ hồ, giúp agent/người dùng biết ngay cần sửa nội dung `plan.md`/`prd.md` chứ không phải đi tìm file nguồn bị mất.

## Trong phạm vi

- Thêm bước validate ngữ pháp execution-notes của `artifacts.plan` (khi `task.mode === "full"`) ngay trong `saveWorkflowLocked` ở `src/commands/internal-workflow.ts`, tại cả 3 điểm hiện đang gọi `validateTaskArtifacts(candidate, artifacts)` (dòng 94, 104, 124), bằng cách gọi thêm `canonicalizePlanningArtifactV1(artifacts.plan, "plan")` (chỉ để lấy tác dụng phụ validate, bỏ qua kết quả trả về) qua một hàm bọc dùng chung.
- Thêm class lỗi `PlanningArtifactGrammarError extends Error` trong `src/core/verification/input-freshness.ts`; 5 chỗ `canonicalizePlanningArtifactV1` hiện đang `throw new Error(...)` cho lỗi marker/ngữ pháp chuyển sang `throw new PlanningArtifactGrammarError(...)` với đúng nguyên văn message hiện tại (không đổi message).
- Thêm reason code `plan-artifact-invalid` vào `RequiredCheckReasonCode` ([src/core/verification/check-report.ts](../../../src/core/verification/check-report.ts)); sửa catch ở `inspectRequiredChecks` để phân biệt `error instanceof PlanningArtifactGrammarError` (trả `plan-artifact-invalid`) với mọi lỗi khác (giữ nguyên `inputs-unavailable`).
- Cập nhật `docs/IMPLEMENTATION_PLAN.md` §4.5J: bổ sung `plan-artifact-invalid` vào danh sách "safe categorical causes" hiện có.
- Test hồi quy cho cả hai phần, tái hiện đúng kịch bản đã xác nhận.

## Ngoài phạm vi

- Không đổi hình dạng field JSON khác của `ChecksReportResultV1`/`TaskAuditResultV1` (chỉ thêm 1 giá trị vào union `RequiredCheckReasonCode` đã có, không đổi field nào).
- Không hồi cứu/sửa tự động các task cũ đã lỡ bị corrupt trước khi có fix này (chỉ giúp chẩn đoán rõ hơn khi audit/checks gặp lại).
- Không đổi ngữ pháp execution-notes hiện có, không đổi giới hạn 100 dòng/16384 ký tự.
- Không đổi hành vi `assertVerificationInputsFresh`/`--finish` (đã báo lỗi đúng/rõ ràng từ trước, không cần sửa).

## Rủi ro và bảo toàn

- Rủi ro chính: validate thêm tại `--save` có thể làm một số `--save` từng "vô tình" đi qua (vì rơi vào nhánh không có evidence mới) nay bị chặn — nhưng đây chính xác là hành vi đúng cần có, và nội dung hợp lệ (đúng ngữ pháp, hoặc execution-notes rỗng) không bị ảnh hưởng.
- Bảo toàn: không đổi bất kỳ message lỗi hiện có nào (giữ nguyên văn 5 message ngữ pháp); không đổi hành vi TaskRecord v1 (execution-notes chỉ áp dụng cho `plan.md` của task Full, v1 không có khái niệm này); toàn bộ test hiện có trong `test/unit/check-report.test.ts` và `test/workflow/internal-workflow.test.ts` phải tiếp tục pass nguyên trạng.

## Tiêu chí chấp nhận

### AC `save-rejects-malformed-plan-grammar`

`harnix workflow --save` (hàm `saveWorkflowLocked`) từ chối ngay lập tức — trước khi ghi bất kỳ file nào, trước khi persist `task.json` — bất kỳ `plan.md` nào (của task Full) có execution-notes vi phạm ngữ pháp hiện có, dù lần `--save` đó có kèm evidence required-check mới hay không. Áp dụng nhất quán tại cả 3 nhánh gọi `validateTaskArtifacts` trong `saveWorkflowLocked`.

### AC `checks-distinguish-artifact-corruption`

Khi `computeVerificationInputSnapshot` thất bại vì ngữ pháp execution-notes của `plan.md`/`prd.md` sai (ném `PlanningArtifactGrammarError`), `inspectRequiredChecks` trả về `reasonCodes: ["plan-artifact-invalid"]` thay vì `inputs-unavailable`. Mọi nguyên nhân `inputs-unavailable` khác (file input thật sự thiếu/không đọc được, glob rỗng) không đổi. `docs/IMPLEMENTATION_PLAN.md` §4.5J liệt kê thêm `plan-artifact-invalid` trong cùng lần sửa.

### AC `no-regression-existing-behavior`

Toàn bộ test hiện có trong `test/unit/check-report.test.ts`, `test/workflow/internal-workflow.test.ts`, và cổng kiểm chứng rộng (`pnpm build && pnpm lint && pnpm typecheck && pnpm test:unit && pnpm test:workflow`) tiếp tục pass nguyên trạng sau khi thêm validate mới.
