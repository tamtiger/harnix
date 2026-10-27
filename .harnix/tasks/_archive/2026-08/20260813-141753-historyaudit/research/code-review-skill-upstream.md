# Nghiên cứu skill code review upstream

- Task: `20260813-141753-historyaudit`
- Ngày: 2026-08-13 (Asia/Bangkok)
- Câu hỏi quyết định: Harnix nên mở rộng `harnix-check` hay thêm một skill riêng để standalone code review được kích hoạt và thực hiện nhất quán?

## Điều đã biết từ repository

- `harnix-check` đã có body mô tả profile standalone read-only review và active-task verification.
- Description hiện chỉ nhấn mạnh verification của implementation trước completion, nên chưa bảo đảm truy vấn “review code” kích hoạt skill.
- PRD/plan hiện xem code review là action trong một workflow, không phải workflow mới; plan S3 ưu tiên mở rộng `harnix-check` và tránh skill trùng lặp.
- Frozen provenance đã khóa `obra/superpowers` tại commit `44c9b2d6e889982ac18c27d05a19fefe335194e1`, gồm `requesting-code-review` và `receiving-code-review`.

## Evidence cần phân biệt phương án

- Trigger, input, output, severity, feedback handling và mutation boundary của hai skill upstream tại đúng frozen commit.
- Phần nào đã có trong `harnix-check`; phần nào còn thiếu và có thể kiểm thử.
- Việc tách skill có tạo overlap/routing ambiguity hoặc thêm workflow surface trái product boundary hay không.

## Điều kiện dừng

Dừng khi có đủ source-level evidence để khóa một lựa chọn, nêu rõ phần adapt/reject, file/test cần đổi và bất định còn lại; không chạy mã upstream và không vendor checkout vào package.

## Sources, findings và quyết định

### Nguồn

- `https://github.com/obra/superpowers/tree/44c9b2d6e889982ac18c27d05a19fefe335194e1/skills/requesting-code-review`, revision `44c9b2d6e889982ac18c27d05a19fefe335194e1`, truy cập 2026-08-13.
- `https://github.com/obra/superpowers/tree/44c9b2d6e889982ac18c27d05a19fefe335194e1/skills/receiving-code-review`, cùng revision và ngày truy cập.
- `src/skills/harnix-check/SKILL.md`, `src/core/workflow.ts`, `test/workflow/skill-sources.test.ts` và `test/workflow/history-regressions.test.ts` tại Harnix HEAD `50c3a49`.

Checkout chỉ dùng để đọc source tại frozen revision; không chạy mã upstream và không vendor nội dung vào package.

### Sự thật từ source

- `requesting-code-review` kích hoạt khi hoàn tất task/feature hoặc trước merge, yêu cầu reviewer so implementation với requirement, kiểm tra quality/architecture/tests/production readiness và trả finding theo severity cùng file/line, impact, cách sửa và verdict.
- Skill upstream buộc lấy Git SHA, dispatch reviewer subagent, review trước merge và sửa issue theo severity. Đây là ceremony gắn Git/subagent mà Harnix đã loại khỏi product boundary.
- `receiving-code-review` yêu cầu đọc đủ feedback, hiểu, verify trên codebase, đánh giá technical fit, phản hồi bằng evidence, làm từng item và test; feedback mơ hồ hoặc xung đột quyết định người dùng phải dừng/clarify.
- `harnix-check` đã có compliance-first, quality/security, evidence mapping, severity và feedback-as-hypothesis, nhưng description không nhắc standalone code review; review profile chưa khóa scope selection, output contract và verdict đủ cụ thể.
- Router hiện đã map `action: review` + `mutation: none` tới Bypass owner `harnix-check`; catalog và platform adapters cố định đúng bảy skill self-contained `SKILL.md`.

### Suy luận cho Harnix

- Gap chính là discoverability và procedural completeness của `harnix-check`, không phải thiếu lifecycle state/owner. Thêm skill thứ tám sẽ overlap cùng owner, làm mơ hồ router và tăng global managed surface mà không thêm semantic mới.
- Protocol review nên hỗ trợ working-tree diff, explicit commit range hoặc bounded paths mà không mặc định mutation Git; mọi claim phải dựa trên code/diff/test thực sự đã đọc.
- Output tối thiểu nên ưu tiên finding theo severity và vị trí chính xác; mỗi finding nêu defect, impact, evidence và fix direction. Nếu không có finding, vẫn nêu scope đã kiểm tra và residual/omitted checks; không tạo praise section bắt buộc.

### Quyết định

Giữ bảy skill và mở rộng `harnix-check` thay vì thêm `harnix-code-review`. Adapt scope selection, evidence-backed finding contract, severity calibration, verdict và feedback verification từ hai skill upstream; reject mandatory subagent, Git SHA, merge gate, praise ceremony, auto-fix và GitHub-thread behavior. Cập nhật frontmatter description để trigger trực tiếp cho standalone code review và review feedback.

### Tác động tới PRD/plan

- Thêm requirement R11 và slice S8 cho review protocol discoverability/completeness.
- RED static contract phải fail trên description/output/scope hiện tại; GREEN cập nhật đúng một canonical `harnix-check/SKILL.md` và generated platform content tiếp tục lấy cùng byte source.
- Focused verification gồm `test/workflow/skill-sources.test.ts`, routing/history regression, platform parity và skill validator tương thích với Harnix frontmatter.

### Bất định còn lại

Host model activation không thể được chứng minh tuyệt đối bằng unit test; static description contract và representative prompt eval chỉ cung cấp regression evidence. Nếu ba platform sau này có metadata schema riêng bắt buộc, cần research riêng thay vì thêm file không được adapter hiện tại cài đặt.
