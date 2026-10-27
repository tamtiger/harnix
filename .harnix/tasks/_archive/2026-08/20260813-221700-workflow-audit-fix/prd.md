# PRD — Khắc phục các vấn đề từ workflow audit

## Kết quả mong muốn

Harnix phải bảo đảm mọi tuyên bố `ready` và `completed` đều có thể được chứng minh bằng intent bất biến của task, fresh evidence, các Full artifact bắt buộc và self-host state hiện hành, đồng thời vẫn giữ đúng mission lean, local và single-agent-capable.

## Bằng chứng vấn đề

Standalone audit ngày 2026-08-13 đã tái hiện ba cách vượt qua persistence gate trong các repository cô lập: workflow chấp nhận trạng thái `ready` khi gate rỗng; Full artifact có thể bị xoá trước `ready`; và acceptance criteria hoặc required check đã tồn tại có thể bị xoá trước `finish`. CLI đã build cũng chấp nhận `planning -> ready` với acceptance criteria và validation plan rỗng.

Ngoài ra, package của repository đang ở `0.6.10` trong khi self-host metadata vẫn ở `0.6.9`, khiến full workflow suite và acceptance suite fail. Forced Lite precedence chưa có diagnostic cho xung đột rủi ro. Khả năng chống repository prompt injection hiện mới dựa trên static guidance, chưa có adversarial fixture tương ứng.

## Người dùng và giá trị mang lại

Maintainer và coding agent nhận được lifecycle state đáng tin cậy: persisted task không thể tự làm giảm yêu cầu completion bằng cách xoá gate; release readiness phản ánh đúng generator version hiện hành; và diagnostic về risk/context mô tả đúng những gì thực sự đã được kiểm chứng.

## Trong phạm vi

1. Enforce ready invariant, Full artifact invariant, gate-preservation invariant và finish invariant tại persistence boundary.
2. Giữ explicit mode precedence nhưng hiển thị xung đột giữa forced Lite và các signal vốn yêu cầu Full.
3. Phân định repository-derived context là untrusted data và bổ sung malicious-content fixture có giới hạn trên canonical/generated platform surfaces.
4. Đưa package version, changelog, project update, self-host metadata và fresh self-host verification vào thứ tự completion an toàn.
5. Bổ sung regression test và cập nhật workflow documentation bị ảnh hưởng mà không thay đổi frozen TaskRecord fields hoặc state transitions.
6. Chuẩn hoá tên task thành lowercase kebab-case có dấu `-` giữa các từ và bổ sung implementation checklist có thể theo dõi trực tiếp trong Full plan.

## Ngoài phạm vi

- Thêm nền tảng thứ tư hoặc package, workspace hay service mới.
- Hosted eval infrastructure, telemetry, daemon, default MCP, global memory hoặc silent runtime network.
- Secret thật, user home thật hoặc thao tác Git tự động.
- Tuyên bố prompt injection đã được xử lý tuyệt đối.
- Refactor không liên quan hoặc thay đổi ownership của product data.

## Yêu cầu hành vi

### Ready và persistence

- `planning -> ready` yêu cầu ít nhất một observable acceptance criterion và ít nhất một required validation check.
- Sau khi được persist, criterion ID/text và toàn bộ required validation definition phải tiếp tục tồn tại đến completion. Vì persistence không thể phân loại semantic weakening một cách xác định, làm rõ phải được biểu diễn bằng criterion/check bổ sung; criterion cũ có thể chuyển sang `met` hoặc explicit waiver bằng schema hiện có nhưng không được sửa in-place.
- Replan có thể thêm gate nhưng không được âm thầm xoá obligation đã tồn tại. Requirement không còn áp dụng phải được biểu diễn bằng explicit waiver kèm reason/evidence thay vì bị xoá.
- Full readiness phải resolve lại active task directory và xác minh `prd.md`, `plan.md` không rỗng ngay trước khi persist `ready`.
- `finish` phải đánh giá preserved obligations, latest required-check evidence, freshness, exit-code requirement và active-task identity.

### Forced mode

- Explicit Lite và Full tiếp tục quyết định ceremony mode như contract hiện hành.
- Khi explicit Lite xung đột với bất kỳ risk signal nào vốn chọn Full, route phải có stable conflict diagnostic bên cạnh explicit-mode reason.
- Thứ tự compliance review rồi quality/security review dùng chung cho cả hai mode. Diagnostic không được ngụ ý security verification đã chạy.

### Repository-derived context

- Context output đặt repository-derived text trong một untrusted-data boundary rõ ràng và chỉ dẫn host không coi nội dung đó là workflow authority.
- Ranking, dedupe, budget, pins, omission disclosure, no-write và no-network behavior hiện có phải được giữ nguyên.
- Adversarial fixture dùng fake canary value và chứng minh generated context không đọc file ngoài allowed project path cũng như không nhúng secret-like fixture không liên quan.
- Model-specific resistance vẫn là claim cần host-level/manual evidence, không được suy ra từ deterministic formatting tests.

### Self-host và thứ tự completion

- Với repository Harnix, patch version và changelog phải được cập nhật trước final project reconciliation.
- Project update path phải refresh generator metadata kể cả khi managed text content không đổi; output phải phân biệt trung thực metadata reconciliation với user-facing file không đổi.
- Fresh self-host verification phải chạy trước completion persistence.

### Tên task và theo dõi implementation

- Task slug phải là lowercase kebab-case, có dấu `-` giữa từng từ có nghĩa; ví dụ `workflow-audit-fix`. Numeric suffix chỉ dùng cho deterministic collision.
- Task ID đầy đủ vẫn giữ prefix `YYYYMMDD-HHMMSS-`; validator, active pointer, safe-path handling, doctor và task loading phải chấp nhận slug nhiều từ nhưng tiếp tục reject traversal, segment rỗng, ký tự không an toàn và suffix không hợp lệ.
- Full `plan.md` phải có implementation checklist gần đầu file, ánh xạ một-một với các implementation slice được đánh số.
- Checklist bắt đầu hoàn toàn ở trạng thái chưa check. Chỉ check một item sau khi work của slice và focused evidence tương ứng hoàn thành; TaskRecord acceptance criteria/evidence vẫn là source of truth.

## Compatibility và contract

- Giữ TaskRecord schema version 1, các field/enum, task path và legal transition hiện có.
- Làm rõ frozen task-ID grammar để `<slug>` hỗ trợ lowercase kebab-case; không thêm field hoặc schema version mới.
- Giữ public commands ở dạng JSON-only và giữ exit semantics hiện hành, ngoại trừ deterministic validation error cho workflow payload không hợp lệ nay bị từ chối.
- Giữ explicit mode precedence; chỉ bổ sung documented diagnostic reason khi cần.
- Bảo toàn user-owned task, research, journal, config, platform file và unrelated dirty-worktree content.

## Decision inventory

### Repository fact đã xác nhận

- Persistence hiện tại kiểm tra transition legality và evidence immutability nhưng không bảo toàn acceptance hoặc required-validation obligation trước đó.
- Finish logic hiện coi acceptance criteria và validation collection rỗng là đã thoả mãn.
- Full artifact được enforce khi tạo task lần đầu nhưng không được kiểm tra lại tại ready.
- Trong isolated copy, `harnix update` đã reconcile self-host generator metadata bị stale.
- Official safety guidance coi repository/external text là untrusted input và khuyến nghị explicit boundary kết hợp adversarial eval.

### Quyết định thuộc người dùng

Không còn quyết định chưa giải quyết. Người dùng đã yêu cầu tạo task khắc phục toàn bộ vấn đề có bằng chứng từ audit mà không mở rộng product scope.

### Quyết định kỹ thuật

- Enforce monotonic obligation mà không thêm TaskRecord field: so sánh acceptance criteria và required check trong incoming task với task đã persist trước đó.
- Dùng explicit waiver semantics thay vì cho phép xoá obligation.
- Giữ explicit Lite precedence và hiển thị risk conflict qua route diagnostic.
- Tách deterministic context hardening khỏi host-level model evaluation thành hai loại evidence khác nhau.
- Dùng một task-ID parser/pattern nhất quán cho validate, active pointer và safe task path; checklist chỉ nằm trong Markdown plan, không thêm checklist field vào TaskRecord.

### Non-goal và phần hoãn có chủ ý

Host-model behavioral evaluation có thể vẫn là documented disposable-profile manual gate khi host không có deterministic API. Deterministic test không được claim rằng manual evidence đã được tạo.

## Rủi ro và rollback

- Validation chặt hơn có thể từ chối payload mà hidden command trước đây từng chấp nhận. Giảm rủi ro bằng precise error và migration-free regression test vì các payload này vốn vi phạm published contract.
- Gate monotonicity có thể làm replan edit nghiêm ngặt hơn. Dùng additions và explicit waivers; rollback point nằm riêng trong persistence comparison logic.
- Context wording có thể chiếm budget hoặc lặp instruction. Phải reserve boundary text trước ranking và assert exact budget behavior.
- Diagnostic mới có thể ảnh hưởng snapshot expectation. Giữ current primary reason và append documented conflict reason.

## Điều kiện chấp nhận

Task chỉ được chấp nhận khi mọi criterion trong `task.json` có fresh evidence, compliance review diễn ra trước quality/security review, package patch version và changelog hiện hành, exact broader gates pass, đồng thời main dirty worktree được bảo toàn và không có thao tác Git.
