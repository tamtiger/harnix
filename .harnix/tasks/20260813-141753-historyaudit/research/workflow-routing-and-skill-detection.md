# Research: taxonomy workflow và độ tin cậy của skill routing

## Câu hỏi

Harnix nên có bao nhiêu workflow, implicit skill detection của Codex dựa trên tín hiệu nào, và có cần thêm workflow/skill riêng cho review, security, migration hoặc release không?

## Phạm vi và nguồn

Ngày truy cập: 2026-08-13. Các trang dưới đây là tài liệu sống, không công bố revision cố định; kết luận cần được kiểm tra lại khi behavior Codex hoặc chuẩn skill thay đổi.

1. OpenAI, [Build skills](https://developers.openai.com/codex/skills/).
2. OpenAI, [Custom instructions with AGENTS.md](https://developers.openai.com/codex/guides/agents-md/).
3. Repository Harnix: `docs/HARNIX_WORKFLOW.md`, `docs/HARNIX_PRD.md`, `src/core/workflow.ts`, `src/core/tasks/task.ts`, `src/skills/*`, `src/templates/harnix/agents.ts` và workflow tests tại commit/worktree được kiểm toán ngày 2026-08-13.

## Sự thật từ nguồn chính thức

- OpenAI mô tả skill là format cho reusable workflow; Codex dùng progressive disclosure: ban đầu chỉ thấy name, description và path, sau đó mới đọc toàn bộ `SKILL.md` khi chọn skill.
- Implicit invocation xảy ra khi task khớp `description`. OpenAI khuyến nghị description ngắn, scope/boundary rõ và đưa trigger quan trọng lên đầu vì description có thể bị rút gọn.
- Initial skill list có context budget; khi có nhiều skill, description có thể bị rút ngắn hoặc một số skill bị bỏ khỏi danh sách ban đầu. Vì vậy thêm skill chồng lấn không miễn phí.
- OpenAI khuyến nghị test prompt với skill description để xác nhận trigger đúng. `agents/openai.yaml` có thể tắt implicit invocation cho skill chỉ nên dùng khi gọi rõ, nhưng mặc định implicit invocation được bật.
- Codex đọc AGENTS instruction chain một lần khi bắt đầu run/session, merge từ global tới thư mục hiện tại và giới hạn tổng kích thước mặc định. Instruction gần current directory có precedence cao hơn.

## Sự thật từ repository

- Harnix định nghĩa đúng **một canonical state machine**; Kiro, Antigravity và Codex chỉ là adapter, không có workflow riêng.
- Có ba entry route: Bypass, Lite và Full. Lite/Full là ceremony mode của cùng workflow; Bypass không tạo task.
- TaskRecord v1 có sáu persisted status và tám checkpoint. Bảy skill là stage owner/procedure, không phải bảy workflow.
- `routeWorkflow()` hiện nhận intent và bốn flag đã được caller phân loại rồi trả một string `bypass|lite|full`. Hàm chỉ được gọi trong unit test; không có command/configurator/runtime path dùng nó để đọc user prompt hoặc route active task.
- `continueWorkflowTask()` chỉ trả task và context path; mapping từ persisted status/checkpoint sang stage skill hiện chỉ tồn tại trong prose của `harnix-continue`.
- `validateTask()` kiểm tra status và checkpoint độc lập nhưng chưa kiểm tra ma trận tổ hợp. `transitionTask()` chỉ cho đổi status, nên không biểu diễn được an toàn một số checkpoint nội trạng thái như `in_progress/debugging` hoặc `ready/replan` qua cùng API.
- `harnix-continue` phân biệt `ready/ready` đã được phép implement với plan-only, nhưng TaskRecord v1 không có field lưu authorization. Sau compaction, không thể suy ra an toàn distinction này chỉ từ status/checkpoint.
- Routing test hiện chỉ có bốn ví dụ entry route và không có bảng case cho active state, mutation authority, plan-only, migration/refactor, mixed intent hoặc description truncation.

## Suy luận cho Harnix

1. **Không thêm canonical workflow.** Review, security, migration, release, hotfix và maintenance đều là route/stage hoặc risk signal của state machine hiện có. Tách chúng thành workflow riêng sẽ tạo transition và completion semantics trùng lặp.
2. **Không thêm core skill lúc này.** `harnix-brainstorm`, `implement`, `debug`, `check`, `research`, `finish-work` và `continue` đã bao phủ lifecycle. Thêm `harnix-review`, `harnix-security`, `harnix-migrate` hoặc `harnix-release` sẽ chồng scope, làm implicit matching kém rõ và tăng skill-list budget.
3. `routeWorkflow()` không nên được mô tả như NLP detector. Nó nên trở thành policy oracle thuần nhận facts đã chuẩn hóa và trả decision có reason code; semantic interpretation vẫn do host agent thực hiện qua AGENTS + skill description.
4. Routing phải ưu tiên persisted state: active task hợp lệ → `continue` → đúng stage owner; chỉ khi không có active task mới phân loại Bypass/Lite/Full.
5. Detection cần hai loại test riêng: deterministic decision-table test cho facts/state và representative prompt/description eval cho implicit activation. Unit test không được tuyên bố chứng minh model sẽ chọn skill đúng trên cả ba platform.
6. Không cần thêm field authorization vào TaskRecord v1: contract an toàn là task được phép implement phải persist `ready` rồi chuyển ngay sang `in_progress/implementing` trước product edit; một task còn `ready` sau interruption chỉ tiếp tục implement khi current user request cấp quyền rõ. Đây là fail-closed recovery, không suy diễn approval đã mất.

## Phương án đã loại

| Phương án | Lý do loại |
|---|---|
| Một workflow riêng cho từng platform | Làm drift state/gate semantics; adapter khác cú pháp không đồng nghĩa khác workflow. |
| Workflow riêng cho review/security/migration/release | Các behavior này đã map được vào Bypass/Full, Check, Debug hoặc Finish; tạo workflow mới làm tăng branch và recovery path. |
| Một mega-skill chứa toàn bộ lifecycle | Mất progressive disclosure và luôn nạp procedure không liên quan. |
| Thêm nhiều skill chỉ để tăng trigger keyword | Context budget và scope overlap có thể làm implicit matching tệ hơn; description/eval cần được sửa trước. |
| Parser keyword trong CLI để đọc prompt tự do | Dễ sai với mixed intent, phủ định và ngữ cảnh; Harnix không sở hữu host prompt pipeline trên cả ba platform. |

## Kết luận

Giữ **1 workflow, 3 entry route và 7 stage skill**. Không bổ sung workflow/skill mới trong refactor này. Bổ sung contract routing có reason code, ma trận status/checkpoint → stage owner, precedence active-task-first, description trigger rõ và eval table đại diện. Đây là hardening của workflow hiện tại, không phải mở rộng taxonomy.

## Bất định còn lại

- Tài liệu OpenAI không công bố classifier/scoring cụ thể cho implicit skill selection, nên không thể chứng minh detection chỉ bằng static/unit test.
- Nguồn OpenAI không xác lập behavior implicit selection của Kiro và Antigravity; parity cần fixture và disposable-platform smoke riêng.
- Harnix hiện không có model-eval runner đóng gói. Kế hoạch phải phân biệt deterministic contract test với manual/host evaluation cho tới khi có một runner được chấp thuận trong product scope.
