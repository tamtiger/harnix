# PRD: Áp dụng chọn lọc ý tưởng từ hve-core vào skill harnix

## 1. Context & Problem Statement (Bối cảnh & Vấn đề)
Thêm vào skill harnix ba cải tiến chọn lọc từ microsoft/hve-core mà không làm phình ngân sách: plan critique theo lens trước ready cho task Full, quy tắc bốn nấc khi phát hiện điều mới lúc implement, và pass phản chứng cùng cổng kiểm chứng tri thức có sẵn khi research.

## 2. Scope & Boundaries (Phạm vi & Ranh giới)
- **In-Scope**:
  - Áp dụng chọn lọc ý tưởng từ hve-core vào skill harnix
- **Out-of-Scope (Non-Goals)**:
  - (Chưa có non-goals bổ sung)

## 3. Anchored Acceptance Criteria (Tiêu chí Nghiệm thu Cốt lõi)
- **ac-1**: harnix-plan có reference plan-critique (harnix skill harnix-plan --reference plan-critique): bốn lens Coverage, Evidence, Executability, Risk (cộng Reconciliation khi replan), thang severity Critical/High/Medium/Low, critic chỉ trả ứng viên còn bên cha xác minh đoạn trích rồi mới ghi finding, tách Consistent khỏi Not assessed, không bắt buộc subagent, chạy tối đa một vòng và việc bỏ qua được ghi là skipped; SKILL.md chỉ thêm một dòng trỏ tới.
- **ac-2**: harnix-implement có quy tắc bốn nấc cho điều mới phát hiện lúc implement (phán đoán cục bộ; ghi chú chỉ-triển-khai kể cả Guidance cho task sau; follow-up ngoài phạm vi qua --follow-up hoặc thành viên epic mới; replan khi đổi yêu cầu hoặc thiết kế) ánh xạ vào lệnh harnix workflow hiện có, đặt trong reference để SKILL.md giữ trong ngân sách.
- **ac-3**: harnix-research thêm bước phản chứng (tìm ít nhất một nguồn hoặc phương án trong phạm vi có thể bác kết luận, ghi là ủng hộ, làm yếu, bác bỏ hay chưa giải quyết) và cổng tri thức có sẵn (context, artifact và memory được cung cấp là claim cần xác minh), nhất quán giữa profile standalone và task-scoped.
- **ac-4**: Ngân sách giữ nguyên: instruction-budget, skill catalog và test:gates xanh, SKILL.md không vượt ngân sách token, measure:footprint trong maxBytes mà không nâng ngưỡng (nếu vượt thì gộp bớt trước; nâng chỉ khi có lý do ghi trong changelog).
- **ac-5**: Tài liệu, template, skill và CHANGELOG đồng bộ; pnpm selfhost:sync chạy; một lần bump patch bằng pnpm version:sync; pnpm release:check xanh.

## 4. Architectural & Safety Constraints (Ràng buộc Kiến trúc & An toàn)
- Bảo đảm ranh giới kiến trúc và tính toàn vẹn của mã nguồn.
- Giữ vững các invariant hiện tại, tuân thủ TDD và phòng ngừa hồi quy (regression).
- Mọi thay đổi tuân thủ AGENTS.md và các guide trong .harnix/spec/guides/ của dự án, và không để lọt rò rỉ bảo mật.
