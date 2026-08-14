# Nghiên cứu 02 — Các cơ chế harness hiện hành

## Phạm vi trước khi kiểm tra sâu source

- Task: `20260814-081624-harness-capability-research`
- Ngày/ngày truy cập: 2026-08-14
- Một ẩn số đáng kể: Những cơ chế nhỏ nào từ coding-agent harness/framework hiện tại giúp cải thiện đáng kể lifecycle, context, verification, safety hoặc recovery cho Harnix mà không đưa vào các giả định về service, Git, telemetry, daemon hoặc multi-agent bắt buộc?

Việc tìm kiếm khám phá dự án ban đầu diễn ra khi hoàn tất Nghiên cứu 01. Trước khi dựa vào bất kỳ ứng viên nào để quyết định, tài liệu này đóng băng bằng chứng phân biệt và yêu cầu kiểm tra trực tiếp nguồn sơ cấp; riêng snippet khám phá không phải là bằng chứng.

## Quyết định có thể thay đổi

Catalog đã chuẩn hóa và backlog có thể thay đổi nếu một triển khai hiện hành chứng minh cơ chế có thể kiểm thử cho các giới hạn về evidence cũ, context cũ, khả năng truy vết hoặc recovery đã quan sát trong Harnix. Một cơ chế bị loại khỏi danh sách rút gọn nếu giá trị của nó phụ thuộc vào hosted service, model network bắt buộc, tự động thay đổi Git, global memory, thay đổi trust/permission rộng hoặc bề mặt runtime thứ hai.

## Bằng chứng repository đã biết trước khi kiểm tra sâu

- `src/core/workflow.ts:52-63,90` chỉ định nghĩa độ mới bằng tuổi timestamp của evidence và thứ tự mới nhất theo từng kiểm tra; không có fingerprint của source/task artifact tham gia.
- `src/core/tasks/task.ts:9-10` không có ánh xạ từ tiêu chí tới xác minh hoặc digest input đã xác minh trong ValidationCheck/Evidence.
- `src/core/context/context.ts:6,59-63` ghi `contentHash`, còn `src/core/workflow.ts:83-85` chỉ tiếp tục bằng relevant path/spec; không có kiểm tra context drift khi resume.
- `.harnix/tasks/20260813-221700-workflow-audit-fix/prd.md:55,97` nói rõ kiểm thử định dạng xác định không chứng minh khả năng chống prompt injection của host model.
- `src/core/journal/learning.ts:2-6` thăng hạng theo số lượng task/evidence lặp lại và ngưỡng confidence mà không có ngữ nghĩa mâu thuẫn/thay thế.

## Bằng chứng phân biệt các phương án

Kiểm tra source/docs/release chính thức về graph phụ thuộc artifact, kiểm tra tính nhất quán, fingerprint trạng thái source, checkpoint, event/trajectory persistence, replay, manifest bao phủ/loại trừ, làm mới context, kiểm tra được quản lý trong source và quyền sở hữu learning. Ghi chính xác giả định runtime/network, chế độ lỗi, khả năng di chuyển và license.

## Điều kiện dừng

Dừng khi đã kiểm tra trực tiếp ít nhất tám framework bổ sung và nguồn mới chỉ lặp lại cơ chế đã chuẩn hóa hoặc phụ thuộc vào bề mặt hosted/multi-agent/Git bị loại trừ. Nhận định marketing không có hỗ trợ và bản tóm tắt cộng đồng không kéo dài việc tìm kiếm.

## Registry nguồn trực tiếp

Mọi nguồn được truy cập ngày 2026-08-14. Dùng release tag/commit khi có; tài liệu sống được ghi nhãn tương ứng.

| Công cụ/nguồn | Version/revision | License | Cơ chế được hỗ trợ trực tiếp | Phụ thuộc runtime/network và giới hạn |
|---|---|---|---|---|
| [Tài liệu GitHub Spec Kit](https://github.github.com/spec-kit/) / [v0.16.3](https://github.com/github/spec-kit/releases/tag/v0.16.3) | `v0.16.3`, xuất bản 2026-08-13 | MIT | Spec → Plan → Tasks → Implement, các bước Clarify/Checklist/Analyze tùy chọn để kiểm tra tính nhất quán, workflow mở rộng được | Một số luồng tạo branch và bề mặt tích hợp rộng; bản thân phân tích AI không phải bằng chứng xác định |
| [Tổng quan OpenSpec](https://github.com/Fission-AI/OpenSpec/blob/main/docs/overview.md) / [package](https://github.com/Fission-AI/OpenSpec/blob/main/package.json) | package `1.6.0`; đã kiểm tra docs/main ngày 2026-08-14 | MIT | Delta spec, graph phụ thuộc/trạng thái artifact, apply checklist, archive/sync vào nguồn sự thật hiện tại | Có telemetry opt-out; hỗ trợ hơn 25 công cụ và store cross-repo beta, cả hai đều ngoài phạm vi tinh gọn của Harnix |
| [Release BMAD-METHOD](https://github.com/bmad-code-org/BMAD-METHOD/releases) | `v6.8.0`, `3bcd6c3`, 2026-05-25 | MIT | Hình dạng kế hoạch thích ứng theo quy mô, kiểm tra mức sẵn sàng triển khai, trạng thái sprint/checkpoint và workflow tùy chỉnh được | Catalog multi-agent/persona lớn và nghi thức là giả định cốt lõi; chi phí điều chỉnh cao |
| [Triển khai trạng thái OpenHands](https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-sdk/openhands/sdk/conversation/state.py) / [release OpenHands](https://github.com/OpenHands/OpenHands) | OpenHands `1.8.0`, 2026-06-10; đã kiểm tra SDK `main` ngày 2026-08-14 | MIT cho core; thư mục enterprise có license riêng | Event log cộng trạng thái lưu bền vững, autosave, branch/view đang hoạt động, tiếp tục sau gián đoạn, sandbox runtime | Toàn bộ event stream có thể giữ dữ liệu model/session và phụ thuộc vào agent runtime/LLM; bề mặt enterprise/cloud ngoài phạm vi |
| [Release mini-SWE-agent](https://github.com/SWE-agent/mini-swe-agent/releases) / [trajectory SWE-agent](https://github.com/SWE-agent/SWE-agent/blob/main/docs/usage/trajectories.md) | mini `v2.4.5`, `e187bcb`, 2026-07-06; SWE-agent `v1.1.0` | MIT | Vòng lặp agent tối giản, giới hạn time/cost, output trajectory/config và replay có thể tái tạo | Cần model/environment để chạy; trajectory có thể chứa prompt/reasoning và chi tiết máy/session mà Harnix không được lưu |
| [Release Aider](https://github.com/Aider-AI/aider/releases/tag/v0.86.0) / [lịch sử](https://github.com/Aider-AI/aider/blob/main/HISTORY.md) | `v0.86.0`, `a4be6cc`, 2025-08-09 | Apache-2.0 | Repo map xác định, xử lý cache hỏng, làm mới cấu hình được (`always|files|manual|auto`), vòng lặp lint/test tự động | Chủ yếu được vận hành bởi model/network và định hướng Git mạnh; analytics opt-in và hành vi auto-commit bị loại trừ |
| [Repository Cline](https://github.com/cline/cline) | CLI `v3.0.24`, 2026-06-11 | Apache-2.0 | Tách Plan/Act, approval cho mỗi edit/command, checkpoint task, diff và edit có thể đảo ngược, JSON headless | Checkpoint là trạng thái runtime IDE/session; Kanban thêm phụ thuộc worktree/auto-commit/multi-agent mà Harnix từ chối |
| [Repository Continue](https://github.com/continuedev/continue) | VS Code mới nhất được lập chỉ mục `v1.2.22`, 2026-03-27; repository báo read-only ngày 2026-08-14 | Apache-2.0 | Các kiểm tra được quản lý trong source và cấu hình context/index trước đây | Repository hiện không còn được duy trì tích cực/read-only; chỉ dùng như cơ chế lịch sử, không làm phụ thuộc mới hoặc kiến trúc hiện tại có thẩm quyền |
| [Checkpoint Claude Code](https://code.claude.com/docs/en/checkpointing), [hook](https://code.claude.com/docs/en/hooks), [memory](https://code.claude.com/docs/en/memory) | tài liệu chính thức hiện hành ngày 2026-08-14; release feed quan sát `v2.1.220` (2026-07-25) | Sản phẩm/tài liệu độc quyền; không có license tái sử dụng mã core | Snapshot file theo từng prompt lưu bền cùng session tiếp tục; PreToolUse deny/ask; rule có scope; auto memory | Snapshot file không bao phủ tác dụng phụ bên ngoài; auto memory do agent ghi/toàn cục tới repository và dùng model hosted không ngoại tuyến; chỉ sao chép nguyên tắc |
| [Repository Roo Code](https://github.com/RooCodeInc/Roo-Code) | `v3.54.0`, 2026-05-15 | Apache-2.0 | Tách mode Architect/Code/Ask/Debug và custom mode | Extension chính thức đã dừng ngày 2026-05-15; cơ chế mang tính lịch sử và không nên neo công việc tương thích mới |
| [Đặc tả Agent Skills](https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx) | đặc tả sống `main`, truy cập 2026-08-14 | mã Apache-2.0, tài liệu CC-BY-4.0 | Progressive disclosure; metadata license và compatibility tùy chọn; validator xác định | Distribution/signature/attribution vẫn là câu hỏi mở của hệ sinh thái; hỗ trợ field tùy chọn và allowed-tools khác nhau theo host |

## Dữ kiện đã xác minh theo cơ chế chuẩn hóa

### Quan hệ phụ thuộc và tính nhất quán của artifact

- Spec Kit cung cấp rõ các bước Clarify, Checklist và Analyze xung quanh chuỗi spec/plan/task. Giá trị nằm ở việc phát hiện mơ hồ/không nhất quán giữa artifact, không phải tên các phase.
- OpenSpec làm cho quan hệ phụ thuộc artifact có thể truy vấn và gộp delta spec đã hoàn tất vào nguồn sự thật hiện tại khi archive. Tài liệu của chính nó gọi artifact là yếu tố hỗ trợ thay vì cổng nghiêm ngặt.
- BMAD có kiểm tra mức sẵn sàng triển khai cùng workflow checkpoint/trạng thái nhưng đóng gói chúng trong một phương pháp lớn hơn nhiều.

Cơ chế tương đương trong Harnix: tự rà soát cổng Ready đã kiểm tra danh mục quyết định, placeholder, tính nhất quán và độ bao phủ spec. Khoảng trống còn lại: `ValidationCheck` không có ánh xạ tiêu chí rõ ràng, vì vậy xác thực máy không thể chứng minh kiểm tra bắt buộc nào hỗ trợ tiêu chí nào.

### Trạng thái, checkpoint và tiếp tục

- OpenHands lưu bền vững event log và phép chiếu trạng thái với autosave cùng ngữ nghĩa active-branch.
- Claude Code và Cline chụp snapshot edit file để session tiếp tục có thể kiểm tra hoặc khôi phục trạng thái code trước đó.
- SWE-agent lưu trajectory cùng cấu hình lần chạy để có thể kiểm tra/phát lại một lần thực thi.

Cơ chế tương đương trong Harnix: status/checkpoint TaskRecord và `.active` cung cấp khả năng phục hồi stage bền vững. Khoảng trống còn lại: resume không so trạng thái task/context đã lưu với file hiện tại; thu thập event/trajectory đầy đủ là quá mức và có thể lưu reasoning riêng tư hoặc secret.

### Độ mới và lựa chọn context

- Repo map của Aider có cache xác định, xử lý cache hỏng và chính sách làm mới rõ ràng dựa trên thay đổi file hoặc lựa chọn người dùng.
- Agent Skills dùng progressive disclosure ba giai đoạn và khuyến nghị SKILL.md gọn với reference theo nhu cầu.

Cơ chế tương đương trong Harnix: context xếp hạng có giới hạn, `contentHash`, lý do bỏ sót, cache repo-map cấu trúc và skill tập trung đã tồn tại. Khoảng trống còn lại: `contentHash` không được kiểm tra khi Continue/resume, nên context manifest đã lưu có thể âm thầm mô tả nội dung file cũ.

### Xác minh, replay và độ bao phủ bằng chứng

- Artifact trajectory/config của SWE-agent làm các lần chạy thử nghiệm có thể kiểm tra và lặp lại, nhưng chứa nhiều dữ liệu session hơn mức Harnix có thể lưu an toàn.
- Các kiểm tra được quản lý trong source của Continue thể hiện dạng check-as-code có thể rà soát, nhưng repository hiện đang mở là read-only và cơ chế thường cần model/CI service.
- Analyze/Checklist của Spec Kit và validation OpenSpec nhấn mạnh độ bao phủ giữa artifact; tài liệu Codex Security chính thức riêng biệt dùng scan manifest và file coverage với bề mặt loại trừ/hoãn rõ ràng.

Cơ chế tương đương trong Harnix: tiêu chí tham chiếu ID evidence và kiểm tra bắt buộc yêu cầu lần đạt mới nhất còn mới. Khoảng trống còn lại: độ mới evidence chỉ dựa trên timestamp, và độ bao phủ ngữ nghĩa từ tiêu chí tới kiểm tra chưa được biểu diễn.

### An toàn và quyền sở hữu

- Checkpoint Cline/Claude giảm chi phí phục hồi edit cục bộ; permission hook Claude có thể chặn trước khi thực thi.
- Agent Skills có thể khai báo license/compatibility, nhưng mức hỗ trợ field tùy chọn khác nhau.

Cơ chế tương đương trong Harnix: quyền sở hữu sidecar, khóa ổn định, thay thế nguyên tử giữ permission, rollback, giới hạn đường dẫn và trust/readiness thận trọng mạnh hơn đối với file do setup sở hữu. Thay đổi permission trước tool là mục tiêu chủ ý không thực hiện; snapshot file toàn task sẽ trùng với source control và mở rộng quyền sở hữu.

## Chế độ lỗi và giới hạn riêng cho Harnix

1. **Lưu toàn bộ event/trajectory:** hữu ích cho replay, nhưng có thể thu thập prompt thô, reasoning riêng tư, secret, đường dẫn tuyệt đối và metadata provider. Harnix chỉ nên lưu các dữ kiện/evidence có giới hạn.
2. **Snapshot/undo tự động:** an toàn cho edit do tool sở hữu nhưng không thể rollback command, database, deployment hoặc edit đồng thời của người dùng; coi chúng như transaction tạo sự tự tin sai.
3. **Kiểm tra tính nhất quán bằng AI:** có thể tìm điểm mơ hồ nhưng không phải cổng xác định trừ khi output ánh xạ tới schema đóng băng và validation tái tạo được.
4. **Tích hợp công cụ rộng:** Spec Kit/OpenSpec/Cline tối ưu cho nhiều agent/bề mặt; Harnix chỉ hỗ trợ rõ ba và không nên sao chép số lượng tích hợp như một giá trị.
5. **Permission hook:** chính sách chặn trước tool rất mạnh nhưng yêu cầu thẩm quyền trust/permission mà setup Harnix rõ ràng không có.
6. **Auto memory:** memory do agent ghi giảm lặp lại nhưng thiếu kiểm soát thăng hạng/quyền sở hữu của Harnix và xung đột với ràng buộc không có global memory.
7. **Tính liên tục của dự án:** Continue và Roo cho thấy rủi ro bảo trì — cả hai trang sơ cấp hiện tại đều công bố trạng thái read-only/dừng. Cơ chế phải do Harnix sở hữu, không gắn chặt với runtime upstream.

## Suy luận cho Harnix

Những cơ chế nhỏ có giá trị nhất không phải checkpoint đầy đủ hoặc event sourcing. Chúng là các phép chiếu xác định trên trạng thái Harnix đã sở hữu:

1. so sánh hash context đã lưu với file hiện tại khi resume;
2. biểu diễn rõ độ bao phủ từ tiêu chí tới kiểm tra bắt buộc;
3. gắn bằng chứng xác minh đạt với đúng snapshot hợp đồng/input mà nó đã xác minh.

Các cơ chế này giữ mô hình một agent/ngoại tuyến của Harnix và có thể kiểm thử mà không cần model. Chúng mượn nguyên tắc từ làm mới Aider, phân tích nhất quán Spec Kit, trạng thái artifact OpenSpec, checkpoint Claude/Cline và trạng thái lưu bền vững OpenHands/SWE-agent, nhưng cần schema do Harnix sở hữu cùng cơ chế bảo toàn thận trọng.

## Kết luận và tác động tới kế hoạch

Nghiên cứu đã bão hòa: mười một nguồn bổ sung bao phủ vòng đời spec, readiness, làm mới context, checkpoint, lưu bền vững event/trajectory, replay, kiểm tra và progressive disclosure. Nguồn mới khó có khả năng thay đổi ba khoảng trống xác định hàng đầu.

Trở lại lập kế hoạch với ba ứng viên `adapt`: chẩn đoán context drift khi resume, độ bao phủ tiêu chí/kiểm tra có thể thực thi và độ mới xác minh gắn với input. Giữ learning nhận biết mâu thuẫn, checkpoint file và metadata skill ở trạng thái hoãn; đánh dấu đánh giá hành vi host-model đa platform là `research-more`; loại bỏ replay event thô đầy đủ, delegation bắt buộc, thay đổi permission, mở rộng platform rộng, daemon/global memory/telemetry và workflow Git tự động.

Bất định còn lại: biểu diễn tương thích ngược tối thiểu cho ánh xạ tiêu chí/kiểm tra và fingerprint xác minh là quyết định schema Harnix. Quyết định này phải được giải quyết trong kế hoạch cuối cùng — không hoãn tới triển khai.
