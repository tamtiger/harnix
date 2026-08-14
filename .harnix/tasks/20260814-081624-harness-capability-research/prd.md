# PRD — Nghiên cứu năng lực cho coding-agent harness Harnix

## Kết quả mong muốn

Tạo một quyết định backlog có thể triển khai trong task sau: nhỏ gọn, dựa trên bằng chứng, giữ Harnix tinh gọn, có thể hoạt động ngoại tuyến, hỗ trợ mô hình một agent và không phá vỡ các hợp đồng đã đóng băng hoặc trạng thái do người dùng sở hữu.

## Vấn đề

Harnix đã có workflow được lưu bền vững, context có giới hạn, xác minh mới, quyền sở hữu được quản lý và vòng đời tích hợp ở phạm vi toàn cục của người dùng. Tuy nhiên, việc một công cụ khác có nhiều tính năng hơn không chứng minh Harnix đang thiếu năng lực. Task này phải phân biệt lỗi triển khai, năng lực còn thiếu, mục tiêu chủ ý không thực hiện và ý tưởng chưa đủ bằng chứng; chỉ những năng lực còn thiếu đã chứng minh được giá trị cho người dùng, an toàn hoặc tính đúng đắn mới được đưa vào danh sách rút gọn.

## Phạm vi

- Thiết lập baseline hiện tại của repository bằng bằng chứng file:dòng.
- Nghiên cứu Trellis, ECC, Superpowers; các năng lực chính thức của Kiro, Antigravity và Codex; cùng ít nhất tám harness/framework liên quan khác.
- Chuẩn hóa tính năng của công cụ thành các cơ chế nhỏ, loại bỏ trùng lặp, ghi rõ phụ thuộc runtime/network/platform, chế độ lỗi, quyền sở hữu/an toàn và license/provenance.
- Chứng minh khoảng trống của Harnix trước khi chấm điểm.
- Chấm bảy tiêu chí từ 0–5 theo trọng số đã khóa trong prompt và áp dụng riêng rào chắn hard-gate.
- Tạo registry nguồn, ma trận so sánh, catalog đã chuẩn hóa, ma trận quyết định, danh sách loại bỏ rõ ràng, phần bất định và backlog tối đa năm hạng mục.
- Phần nghiên cứu ban đầu dừng ở Full plan-only `ready/ready`; phần sửa đổi phạm vi ngày 2026-08-14 chỉ triển khai chính sách ngôn ngữ task vừa được người dùng ủy quyền, không triển khai ba năng lực trong backlog.

## Ngoài phạm vi và ranh giới bắt buộc

- Không triển khai ba năng lực backlog C1–C3 hoặc sửa runtime workflow ngoài chính sách ngôn ngữ task đã được ủy quyền.
- Không thêm package, executable, platform, service, daemon, telemetry, marketplace, global memory, default MCP, silent runtime network hoặc phụ thuộc multi-agent bắt buộc.
- Không thay đổi credential, trust, permission, real user home hoặc nội dung không liên quan/do người dùng sửa đổi.
- Không đổi field, enum, path, transition, score hoặc exit semantics đã đóng băng nếu tác động tới PRD/workflow/plan/migration/test chưa được quyết định đồng thời.
- Không đánh giá công cụ theo nhãn marketing hoặc sao chép triển khai upstream khi chưa xem xét license/provenance bất biến.

## Danh mục quyết định

### Dữ kiện repository đã xác nhận

- Harnix là một npm package TypeScript ESM và một executable `harnix`, hỗ trợ đúng Kiro, Antigravity và Codex.
- Workflow dùng một state machine được lưu bền vững; Lite/Full là các mức độ nghi thức; research/debug là các skill có điều kiện.
- Task, research và journal do người dùng sở hữu; file được quản lý tuân theo quy tắc quyền sở hữu/hash/bảo toàn.
- Global setup phải được yêu cầu rõ ràng, giới hạn theo platform root và không được thay đổi credential, permission, MCP hoặc trust.
- Working tree hiện tại có thay đổi do người dùng sở hữu tại `.harnix/.template-hashes.json`; task này không được sửa hoặc hoàn nguyên file đó.

### Quyết định do người dùng sở hữu đã được cố định

- Guardrail và mô hình chấm điểm trong prompt là thẩm quyền của task này.
- Chỉ lập kế hoạch; backlog tối đa năm hạng mục và ưu tiên từ một đến ba.
- Bắt buộc nghiên cứu Internet từ nguồn sơ cấp.
- Từ phần sửa đổi phạm vi ngày 2026-08-14, mọi task Harnix và nội dung do task sở hữu mà agent tạo phải dùng tiếng Việt; identifier, command, path, schema field và trích dẫn nguồn được giữ nguyên khi cần để bảo đảm độ chính xác kỹ thuật.

### Các ẩn số kỹ thuật theo thứ tự

1. Những cơ chế nào của platform chính thức và baseline đã đóng băng còn khác hoặc mới hơn snapshot Harnix, và cơ chế nào có liên quan đáng kể?
2. Các harness/framework hiện hành cung cấp cơ chế nhỏ nào có bằng chứng mạnh về workflow, context, verification, safety hoặc lifecycle?
3. Cơ chế nào ánh xạ tới một khoảng trống Harnix đã được chứng minh, vượt qua hard-gate và tạo backlog nhỏ nhất với tỷ lệ giá trị/độ phức tạp cao?

### Công việc hoãn rõ ràng

- Benchmark runtime hoặc chất lượng model giữa các harness.
- Triển khai năng lực hoặc migration.
- Đánh giá lại guardrail đã bị loại nếu người dùng chưa đổi phạm vi.

## Tiêu chí chấp nhận

Các tiêu chí trong TaskRecord là chuẩn mực. Tài liệu lập kế hoạch cuối cùng phải có đủ 11 mục đầu ra của prompt, trích dẫn các nhận định bên ngoài gần kết luận, tách biệt dữ kiện/suy luận/bất định và không để lại placeholder làm thay đổi cách triển khai.

Phần sửa đổi phạm vi phải bổ sung cùng một chính sách tiếng Việt vào root `AGENTS.md` và `src/templates/harnix/agents.ts`, có regression test tập trung chứng minh cả hai bề mặt đều chứa chính sách, đồng thời đồng bộ version/changelog và giữ nguyên các thay đổi sẵn có do người dùng sở hữu.
