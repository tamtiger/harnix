# Nghiên cứu 01 — Platform được hỗ trợ và baseline đã đóng băng

## Phạm vi trước khi tìm kiếm

- Task: `20260814-081624-harness-capability-research`
- Ngày/ngày truy cập: 2026-08-14
- Một ẩn số đáng kể: Hành vi chính thức hiện tại của Kiro, Antigravity, Codex, Trellis, ECC và Superpowers bộc lộ những cơ chế riêng biệt nào có thể thay đổi backlog năng lực Harnix khi so với snapshot đã đóng băng và cách triển khai hiện tại của Harnix?

## Quyết định có thể thay đổi

Backlog có thể thay đổi nếu nguồn sơ cấp hiện tại cho thấy một cơ chế (a) giải quyết giới hạn Harnix đã được repository chứng minh, (b) phù hợp với guardrail bắt buộc mà không có giả định ẩn về service/network/trust, và (c) chưa tương đương với hành vi Harnix. Thay đổi schema hoặc vòng đời platform cũng có thể buộc phân loại `research-more` hoặc làm mất hiệu lực một phương án thích nghi đã giả định trước đó.

## Điều đã biết từ bằng chứng repository

- Harnix đã đóng băng provenance của Trellis, ECC và Superpowers và chủ ý chỉ điều chỉnh để dùng các phương pháp workflow/context/research có giới hạn.
- Phase 6 chụp lại đường dẫn tích hợp toàn cục của Kiro, Antigravity và Codex, đồng thời thận trọng tách file đã cài khỏi bằng chứng có thẩm quyền về activation/trust/precedence.
- Harnix đã có trạng thái task được lưu bền vững, cổng ready, context có giới hạn, debug theo giả thuyết, xác minh hai giai đoạn, bằng chứng hoàn tất, quyền sở hữu được quản lý, sidecar manifest và rollback thận trọng.
- Runtime chạy cục bộ/có thể ngoại tuyến và không âm thầm truy cập network, thay đổi trust/credential/permission hoặc yêu cầu điều phối multi-agent.

Đây là các dữ kiện tạm thời cho tới khi bằng chứng ở cấp dòng của repository được ghi trong phần tổng hợp.

## Bằng chứng phân biệt các phương án

Với mỗi nguồn, ghi URL chính thức, chủ sở hữu, release/version hiện tại hoặc revision bất biến, ngày xuất bản/sự kiện nếu có, ngày truy cập, license, nhận định được hỗ trợ chính xác và giới hạn/xung đột. Bằng chứng phân biệt là hành vi hoặc schema của source/docs — không phải tên tính năng — và phải trả lời về phụ thuộc runtime/network, chế độ lỗi, ownership/trust và khả năng di chuyển.

## Điều kiện dừng

Dừng khi tài liệu/source/release note chính thức bổ sung cho sáu dự án bắt buộc chỉ lặp lại các cơ chế đã chuẩn hóa và khó có khả năng thay đổi quyết định adopt/adapt/defer/reject/research-more. Nếu không thể xác minh schema, license hoặc hành vi hiện tại chính thức, giữ lại điểm bất định và trả về `research-more` thay vì suy đoán.

## Nguồn

| Nguồn | Version/revision | License | Nhận định được hỗ trợ | Giới hạn/xung đột |
|---|---|---|---|---|
| [Repository Trellis](https://github.com/mindfold-ai/Trellis) | Harnix đóng băng `516b34e3591001b28fda5e2d4df3f717e82f5785`; đã kiểm tra `main` hiện tại ngày 2026-08-14 | AGPL-3.0 | Spec, task, journal/memory workspace, CLI vòng đời và các bề mặt multi-platform được sinh ra trong repository | Dự án hiện tại lớn hơn đáng kể và gồm các bề mặt Harnix chủ ý loại bỏ; tái sử dụng mã AGPL cần ánh xạ và ghi công rõ ràng |
| [Working context của ECC](https://github.com/affaan-m/everything-claude-code/blob/main/WORKING-CONTEXT.md) và [giải thích release v1.10](https://github.com/affaan-m/everything-claude-code/discussions/1272) | Harnix đóng băng `f1fec0e53934737d3b3b8388b0fd1651e8b62f4f`; bề mặt release repository `v1.10.0` (2026-04), npm vẫn là `1.9.0` theo maintainer | MIT | Cài đặt có chọn lọc, catalog hook/rule/skill, quy tắc an toàn và khả năng điều chỉnh giữa các harness | Độ lệch tên release/package được thừa nhận rõ; daemon/control-plane ECC 2.0 đang alpha và xung đột với phạm vi Harnix |
| [Release Superpowers v5.1.0](https://github.com/obra/superpowers/releases/tag/v5.1.0) | Harnix đóng băng `44c9b2d6e889982ac18c27d05a19fefe335194e1`; `v5.1.0` / `f2cbfbe` (2026-05-04) | MIT | Mẫu lập kế hoạch hoàn tất quyết định, TDD, debug có hệ thống, xác minh và cô lập reviewer | Release hiện tại bắt buộc phát triển theo subagent trên harness có năng lực và giả định luồng Git/worktree/finish-branch mà Harnix từ chối |
| [Hook Kiro IDE](https://kiro.dev/docs/hooks/) và [ghi chú Kiro IDE 1.0](https://kiro.dev/docs/whats-new-1-0/) | Schema hook JSON IDE `v1`; tài liệu cập nhật 2026-07-09/23 | Sản phẩm/tài liệu độc quyền; không nêu license tái sử dụng mã | Event có version, ngữ nghĩa exit chặn, hook user-prompt và trước/sau tool/task; file `.hook` cũ không còn chạy cho tới khi migrate | Hook IDE định hướng workspace; dùng tự động hóa chặn/an toàn sẽ mở rộng thẩm quyền setup và bề mặt trust của Harnix |
| [Kiro CLI 3.0 EA](https://kiro.dev/docs/cli/v3/) | CLI `3.0` Early Access; tài liệu cập nhật 2026-07-24 | Sản phẩm/tài liệu độc quyền; không nêu license tái sử dụng mã | Spec engine hợp nhất, hook độc lập có version và permission dựa trên năng lực | Định dạng session Early Access không tương thích ngược với v2; Harnix không được thay đổi permission hoặc suy ra tính tương thích từ sự hiện diện của file |
| [Hook Antigravity](https://antigravity.google/docs/hooks) và [codelab Antigravity 2.0](https://codelabs.developers.google.com/getting-started-google-antigravity) | Antigravity `2.0`; truy cập tài liệu hiện tại ngày 2026-08-14 | Sản phẩm/tài liệu độc quyền; không nêu license tái sử dụng mã | `PreInvocation` có thể trả `injectSteps`; bundle plugin có thể chứa skill/rule/hook/MCP; skill dùng progressive disclosure | Precedence của plugin/hook và hành vi đã cài so với đang hoạt động không được chứng minh có thẩm quyền chỉ bằng sự hiện diện của file; bundle rộng có thể đưa vào bề mặt MCP/network/subagent |
| [Hook Codex chính thức](https://learn.chatgpt.com/docs/hooks), [AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md), [skill](https://learn.chatgpt.com/docs/build-skills) và [sandbox](https://learn.chatgpt.com/docs/sandboxing) | Tài liệu chính thức hiện hành được làm mới 2026-08-14; hook GA được ghi nhận 2026-05-05 | Sản phẩm/tài liệu OpenAI; không nêu license tái sử dụng tài liệu. License source Codex tách biệt với hành vi trong tài liệu | Instruction lồng nhau, skill progressive, hook được tin cậy, ranh giới sandbox/approval, cô lập reviewer tùy chọn và goal bền vững | Goal hosted, app/plugin, Record & Replay và tính năng multi-agent có thể cần account/network/năng lực platform; Harnix không thể tuyên bố activation chỉ từ file đã cài |

Mọi nguồn được truy cập ngày 2026-08-14. Tài liệu platform hiện tại là tài liệu sống; hành vi ảnh hưởng tới schema được sinh vẫn cần được xác minh lại theo release/snapshot có ngày trước khi triển khai hoặc phát hành.

## Dữ kiện đã xác minh

1. Kiro IDE 1.0 đặt hook JSON `v1` làm chuẩn có thẩm quyền và chỉ coi file hook cũ là dữ liệu migration. CLI 3.0 là ranh giới tương thích Early Access riêng với hook độc lập và permission theo năng lực.
2. Hợp đồng `PreInvocation` của Antigravity hỗ trợ trực tiếp việc inject context tạm thời có giới hạn qua `injectSteps`; mô hình plugin rộng hơn cũng có thể chứa MCP và subagent, nhưng có thể tách rời và không bắt buộc với Harnix.
3. Codex chính thức tách instruction lồng bền vững, skill theo nhu cầu, hook, kiểm soát sandbox/approval và workflow multi-agent/hosted tùy chọn. Việc cài đặt tự nó không chứng minh hook được tin cậy hoặc kích hoạt.
4. Trellis, ECC và Superpowers vẫn chứa các cơ chế Harnix ban đầu đã điều chỉnh để dùng, nhưng sản phẩm hiện tại của họ đã mở rộng theo hướng catalog lớn hơn, daemon/control plane, delegation bắt buộc hoặc giả định workflow Git.

## Xung đột và giới hạn

- Bề mặt release repository của ECC (`v1.10.0`) và package npm (`1.9.0`) không đồng bộ theo maintainer. Dùng SHA đã đóng băng của Harnix cho provenance và không suy ra hành vi đã cài từ version marketing.
- Kiro có hai context hook hiện hành: IDE 1.0 và CLI 3.0 EA. Hợp đồng Kiro toàn cục của Harnix phải giữ thận trọng cho tới khi có bằng chứng chính xác về version/khám phá bề mặt đích.
- Tài liệu Antigravity thiết lập schema nhưng không thiết lập precedence có thẩm quyền giữa plugin và workspace trên một host đã cài cụ thể.
- Tài liệu Codex mô tả năng lực hook GA, nhưng Harnix vẫn yêu cầu trust của người dùng cùng bằng chứng activation có thẩm quyền; sự hiện diện của file vẫn không đủ.

## Suy luận cho Harnix

Các cơ chế platform được hỗ trợ chủ yếu xác nhận Phase 6 thay vì chỉ ra khoảng trống sản phẩm mới. Chặn trước tool rộng hơn, chính sách permission, MCP, goal hosted, auto memory, daemon/control plane và subagent bắt buộc đều vượt quá thẩm quyền rõ ràng hoặc vi phạm guardrail bắt buộc. Sự tồn tại của chúng không phải lý do để bổ sung vào Harnix.

Nguyên tắc hữu ích là thương lượng năng lực mà không tuyên bố readiness sai: tích hợp được sinh nên giữ tối thiểu, còn Doctor nên báo trạng thái thận trọng khi thiếu bằng chứng chính xác về schema/version/activation. Harnix đã triển khai nguyên tắc này; độ lệch Kiro CLI 3.0 EA hiện tại là nghĩa vụ xác minh lại khi phát hành, không phải năng lực core mới.

## Kết luận và tác động tới kế hoạch

Không có hạng mục backlog nào được biện minh chỉ bởi sáu nguồn baseline/platform bắt buộc. Chúng xác nhận các lựa chọn hiện tại của Harnix: progressive disclosure, guard kích hoạt theo dự án, trust/readiness thận trọng, dữ liệu workflow được lưu bền vững và không có network/MCP mặc định. Độ lệch version platform hiện tại nên nằm trong nghiên cứu release/kiểm tra tương thích. Vì vậy, quyết định tiếp theo phải đến từ cơ chế khép lại một khoảng trống đã được repository chứng minh về trạng thái cũ, khả năng truy vết hoặc phục hồi.

Bất định còn lại: precedence chính xác của plugin Antigravity và khả năng tương thích Kiro CLI 3.0 GA vẫn do bên ngoài/host sở hữu. Chỉ theo dõi khi Harnix thay đổi schema đích hoặc trước khi một release tuyên bố hỗ trợ version platform mới hơn.
