# Nghiên cứu 03 — Các quyết định năng lực đã chuẩn hóa

## 1. Tóm tắt điều hành

Harnix đã mạnh hơn phần lớn harness được khảo sát ở quyền sở hữu thận trọng, vòng đời dự án ngoại tuyến, cổng ready/completion rõ ràng, context có giới hạn, tính ngang bằng trên ba platform và việc từ chối coi file đã cài là đồng nghĩa với trust hoặc activation. Điểm yếu hẹp hơn: trạng thái được lưu bền vững, nhưng độ mới và khả năng truy vết chỉ có thể được máy kiểm tra một phần.

Ba khoảng trống đã được repository chứng minh vượt qua guardrail bắt buộc:

1. context manifest đã lưu có thể trở nên cũ mà không có diagnostic khi resume;
2. tiêu chí chấp nhận được liên kết với ID evidence nhưng không liên kết với kiểm tra bắt buộc dự kiến chứng minh chúng;
3. evidence đạt chỉ hết hạn theo thời gian, không hết hạn khi hợp đồng task hoặc input repository đã xác minh thay đổi.

Số lượng quyết định: `adopt 0`, `adapt 3`, `defer 3`, `reject 5`, `research-more 1`. Độ tin cậy cao với ba khoảng trống và thứ tự của chúng vì mỗi khoảng trống đều xuất phát từ hợp đồng source hiện tại và có thể kiểm thử ngoại tuyến. Độ tin cậy trung bình với nỗ lực triển khai chính xác vì hai hạng mục evidence cần một migration TaskRecord v2 phối hợp. Không thực hiện triển khai production.

## 2. Baseline repository

| Phân loại | Dữ kiện hiện tại và bằng chứng |
|---|---|
| Sứ mệnh | Harnix chuyển yêu cầu thành task dựa trên acceptance, context dự án có giới hạn và bằng chứng hoàn tất mới (`docs/HARNIX_PRD.md:19`). |
| Platform/phạm vi | Chính xác Kiro, Antigravity và Codex (`docs/HARNIX_PRD.md:34,58`); không có multi-agent bắt buộc, telemetry/service, daemon/global memory hoặc silent runtime network (`docs/HARNIX_PRD.md:65-70`). |
| Workflow hiện có | Vòng đời hợp lệ, dừng plan-only ở ready, task đang hoạt động bền vững, nghĩa vụ bất biến, tự rà soát cổng ready, TDD/debug và xác minh hai giai đoạn là chuẩn mực (`docs/HARNIX_PRD.md:273-307`). |
| Context hiện có | Context có giới hạn, văn bản lấy từ repository rõ ràng là dữ liệu không đáng tin cậy và repo map chỉ lưu metadata cấu trúc cùng fingerprint SHA-256 (`docs/HARNIX_PRD.md:335,372`). `ContextEntry` đã ghi `contentHash` tùy chọn (`src/core/context/context.ts:6,59-63`). |
| An toàn setup hiện có | Tích hợp toàn cục dùng trạng thái activation/trust thận trọng; sự hiện diện của file không có tính quyết định (`docs/HARNIX_PRD.md:172-196,255-257`). |
| Quyền sở hữu hiện có | Task, research và journal do người dùng sở hữu; update không chạm vào chúng (`docs/HARNIX_PRD.md:162,239`). |
| Khoảng trống đã chứng minh: context | `resumeActiveTask` chỉ trả task cộng đường dẫn đã loại trùng; không so context manifest với nội dung hiện tại (`src/core/workflow.ts:83-85`). |
| Khoảng trống đã chứng minh: độ bao phủ | `ValidationCheck` không có ID tiêu chí và `Evidence` không có digest input đã xác minh (`src/core/tasks/task.ts:8-12`). Một tiêu chí met chỉ cần bất kỳ pass mới nào được tham chiếu, độc lập với kiểm tra bắt buộc dự kiến chứng minh nó (`src/core/workflow.ts:52-63`). |
| Khoảng trống đã chứng minh: độ mới | Độ mới Evidence là tuổi timestamp cộng thứ tự mới nhất theo kiểm tra; thay đổi source, plan và contract không làm mất hiệu lực (`src/core/workflow.ts:52-63,90`). |
| Khoảng trống hoãn | Confidence của learning đếm ID task/evidence độc lập nhưng không có mô hình mâu thuẫn hoặc thay thế (`src/core/journal/learning.ts:1-6`). Hữu ích nhưng kém cấp bách hơn tính toàn vẹn của bằng chứng hoàn tất. |
| Chưa giải quyết rõ ràng | Fixture định dạng/adversarial xác định không chứng minh khả năng chống prompt injection của host model (`.harnix/tasks/20260813-221700-workflow-audit-fix/prd.md:55,97`). Chưa thiết lập hợp đồng eval host ngoại tuyến có thể di chuyển. |

Thay đổi có trước trong `.harnix/.template-hashes.json` nằm ngoài task này và không được chỉnh sửa.

## 3. Registry nguồn

Mọi nguồn được truy cập ngày 2026-08-14. Tài liệu sống được phân biệt với release đã đóng băng.

| Công cụ/nguồn (chủ dự án) | URL chính thức | Version/revision | Ngày truy cập | License | Nhận định được hỗ trợ | Giới hạn |
|---|---|---|---|---|---|---|
| Trellis (`mindfold-ai`) | https://github.com/mindfold-ai/Trellis | đóng băng `516b34e3591001b28fda5e2d4df3f717e82f5785`; đã kiểm tra main hiện tại | 2026-08-14 | AGPL-3.0 | Spec/task/journal trong repository và bề mặt harness được sinh | Sản phẩm rộng hơn và gánh nặng provenance copyleft mạnh hơn |
| Everything Claude Code (`affaan-m`) | https://github.com/affaan-m/everything-claude-code/blob/main/WORKING-CONTEXT.md | đóng băng `f1fec0e53934737d3b3b8388b0fd1651e8b62f4f`; repository `v1.10.0` | 2026-08-14 | MIT | Rule/skill/hook có chọn lọc và working context | Độ lệch package/release; daemon/control plane 2.0 xung đột phạm vi |
| Superpowers (`obra`) | https://github.com/obra/superpowers/releases/tag/v5.1.0 | `v5.1.0`, `f2cbfbe`, 2026-05-04 | 2026-08-14 | MIT | Mẫu lập kế hoạch hoàn tất quyết định, TDD, debug và review | Subagent bắt buộc và luồng Git/worktree trên host có năng lực |
| Kiro IDE (Amazon Web Services) | https://kiro.dev/docs/hooks/ | hook JSON v1; tài liệu cập nhật 2026-07-09 | 2026-08-14 | Sản phẩm/tài liệu độc quyền | Event hook có version và ngữ nghĩa exit chặn | Thẩm quyền trust/permission do host sở hữu; hook cũ dừng chạy trong IDE 1.0 |
| Kiro CLI (Amazon Web Services) | https://kiro.dev/docs/cli/v3/ | 3.0 Early Access, cập nhật 2026-07-24 | 2026-08-14 | Sản phẩm/tài liệu độc quyền | Hook độc lập có version và permission theo năng lực | Định dạng session EA không tương thích v2; không được thay đổi permission |
| Antigravity (Google) | https://antigravity.google/docs/hooks | 2.0/tài liệu hiện tại | 2026-08-14 | Sản phẩm/tài liệu độc quyền | `PreInvocation.injectSteps`; skill/rule/hook trong plugin | Precedence/activation không được chứng minh bởi sự hiện diện của file; bundle rộng có thể thêm MCP/network |
| Codex (OpenAI) | https://learn.chatgpt.com/docs/hooks | tài liệu chính thức hiện hành 2026-08-14; hook GA 2026-05-05 | 2026-08-14 | Sản phẩm/tài liệu OpenAI | Instruction lồng nhau, skill progressive, hook, ranh giới sandbox/approval | Goal/app/replay hosted và multi-agent có thể cần account/network; cài đặt không phải activation |
| GitHub Spec Kit (GitHub) | https://github.github.com/spec-kit/ | `v0.16.3`, 2026-08-13 | 2026-08-14 | MIT | Chuỗi spec-plan-task với các bước kiểm tra tính nhất quán Clarify/Checklist/Analyze | Một số luồng tạo branch; phân tích AI không phải bằng chứng xác định |
| OpenSpec (`Fission-AI`) | https://github.com/Fission-AI/OpenSpec/blob/main/docs/overview.md | package `1.6.0`; đã kiểm tra main | 2026-08-14 | MIT | Delta spec, graph phụ thuộc/trạng thái và archive vào nguồn sự thật | Telemetry opt-out, hơn 25 công cụ và store beta vượt phạm vi |
| BMAD-METHOD (`bmad-code-org`) | https://github.com/bmad-code-org/BMAD-METHOD/releases | `v6.8.0`, `3bcd6c3`, 2026-05-25 | 2026-08-14 | MIT | Kế hoạch thích ứng theo quy mô và checkpoint mức sẵn sàng triển khai | Phương pháp persona/multi-agent lớn và nghi thức cao |
| OpenHands (`OpenHands`) | https://github.com/OpenHands/software-agent-sdk/blob/main/openhands-sdk/openhands/sdk/conversation/state.py | OpenHands `1.8.0`, 2026-06-10; đã kiểm tra SDK main | 2026-08-14 | MIT core | Lưu bền vững event/state, autosave, branch/view và resume | Toàn bộ event stream có thể giữ dữ liệu session/model; phụ thuộc hosted/runtime |
| mini-SWE-agent/SWE-agent (`SWE-agent`) | https://github.com/SWE-agent/mini-swe-agent/releases | mini `v2.4.5`, `e187bcb`, 2026-07-06 | 2026-08-14 | MIT | Vòng lặp có giới hạn cùng trajectory/config replay có thể kiểm tra | Cần model/environment; trajectory có thể lộ prompt và chi tiết máy |
| Aider (`Aider-AI`) | https://github.com/Aider-AI/aider/blob/main/HISTORY.md | `v0.86.0`, `a4be6cc`, 2025-08-09 | 2026-08-14 | Apache-2.0 | Phục hồi cache repo-map và chính sách làm mới rõ ràng dựa trên thay đổi | Định hướng model/network và Git; loại trừ analytics/auto-commit |
| Cline (`cline`) | https://github.com/cline/cline | CLI `v3.0.24`, 2026-06-11 | 2026-08-14 | Apache-2.0 | Approval Plan/Act, diff và checkpoint file | Checkpoint là trạng thái host session; loại trừ bề mặt worktree/auto-commit/multi-agent |
| Continue (`continuedev`) | https://github.com/continuedev/continue | repository read-only vào ngày truy cập; VS Code được lập chỉ mục `v1.2.22` | 2026-08-14 | Apache-2.0 | Cấu hình check/context được quản lý trong source trước đây | Không còn được duy trì tích cực; không phải neo phụ thuộc hiện tại |
| Claude Code (Anthropic) | https://code.claude.com/docs/en/checkpointing | tài liệu sống; release feed quan sát `v2.1.220` | 2026-08-14 | Sản phẩm/tài liệu độc quyền | Snapshot file theo prompt, hook và memory có scope | Snapshot loại trừ tác dụng phụ bên ngoài; auto memory do agent ghi/toàn cục tới repository |
| Roo Code (`RooCodeInc`) | https://github.com/RooCodeInc/Roo-Code | `v3.54.0`, 2026-05-15 | 2026-08-14 | Apache-2.0 | Tách mode Architect/Code/Ask/Debug | Extension chính thức dừng ngày 2026-05-15 |
| Đặc tả Agent Skills (`agentskills`) | https://github.com/agentskills/agentskills/blob/main/docs/specification.mdx | main/đặc tả sống | 2026-08-14 | mã Apache-2.0; tài liệu CC-BY-4.0 | Progressive disclosure và metadata license/compatibility tùy chọn | Mức hỗ trợ host và hành vi distribution/signature khác nhau |

Xung đột chi tiết về nhận định/ngày được giữ trong Nghiên cứu 01 và Nghiên cứu 02.

## 4. Ma trận so sánh harness

| Công cụ | Cơ chế liên quan | Phụ thuộc runtime/network | Mô hình an toàn/quyền sở hữu | Độ mạnh bằng chứng | Mức liên quan với Harnix |
|---|---|---|---|---|---|
| Trellis/ECC/Superpowers | Workflow lưu bền vững, rule/skill, TDD/debug/review | Thay đổi theo công cụ; biến thể mới thêm daemon hoặc delegation | Chủ yếu do repository/plugin sở hữu | Source đóng băng cộng release hiện tại | Baseline Harnix hiện có; riêng chúng không tạo hạng mục mới |
| Kiro/Antigravity/Codex | Hook, context progressive, ranh giới trust/capability | Riêng từng host; một số năng lực hosted | Host sở hữu trust/activation | Tài liệu chính thức hiện tại | Xác nhận thiết kế Phase 6 thận trọng |
| Spec Kit/OpenSpec/BMAD | Chuỗi artifact, phụ thuộc, readiness và nhất quán | Model thường dùng cho phân tích | Artifact repository; tích hợp rộng | Docs/source/release chính thức | Hỗ trợ nguyên tắc bao phủ tiêu chí/kiểm tra rõ ràng |
| OpenHands/SWE-agent | State/event/trajectory lưu bền vững và resume | Cần agent runtime/model | Artifact session do runtime sở hữu | Source cộng docs/release | Hỗ trợ phép chiếu lưu bền, không phải thu thập toàn bộ event |
| Aider | Làm mới/sửa cache repo-map nhạy với thay đổi | Dùng model network trong vận hành thông thường | Định hướng Git/repo-map | Lịch sử source/release | Tương tự mạnh cho context drift xác định |
| Cline/Claude Code | Checkpoint, diff, hook trước tool | Phụ thuộc host/session/model | Host kiểm soát snapshot/permission | Docs/source chính thức | Phục hồi file hữu ích nhưng quá rộng cho core Harnix |
| Continue/Roo | Check/mode | Sản phẩm lịch sử | Extension sở hữu | Đã xác minh trạng thái bảo trì hiện tại | Chỉ lấy cơ chế; rủi ro phụ thuộc cao |
| Agent Skills | Progressive disclosure và metadata | Phụ thuộc host | Chia sẻ giữa tác giả skill/host | Đặc tả sống | Đã có cơ chế disclosure tương đương; metadata còn bất định |

## 5. Catalog năng lực đã chuẩn hóa

| ID | Năng lực | Công cụ nguồn | Cơ chế | Cơ chế tương đương / khoảng trống đã chứng minh của Harnix | Rủi ro chính |
|---|---|---|---|---|---|
| C1 | Diagnostic context drift khi resume | Aider, OpenHands, Claude/Cline | So trạng thái nội dung đã lưu trước khi tái sử dụng | Hash tồn tại; resume không bao giờ kiểm tra | Kết quả stale sai, đọc đường dẫn không an toàn |
| C2 | Độ bao phủ từ tiêu chí tới kiểm tra bắt buộc | Spec Kit, OpenSpec, BMAD | Graph rõ từ nghĩa vụ tới bước chứng minh | Tiêu chí và kiểm tra tồn tại độc lập | Migration schema đã đóng băng |
| C3 | Độ mới xác minh gắn với input | SWE-agent, OpenHands, Aider | Fingerprint hợp đồng và input chính xác được evidence xác minh | Độ mới chỉ theo timestamp | Khai báo input thiếu có thể tuyên bố độ mới quá mức |
| C4 | Thăng hạng learning nhận biết mâu thuẫn | Hệ thống memory/knowledge có scope | Chặn thăng hạng khi nhận định xung đột hoặc bị thay thế | Có lặp lại/confidence; không có mô hình xung đột | Phát hiện xung đột ngữ nghĩa không xác định |
| C5 | Checkpoint/undo file cục bộ | Claude Code, Cline | Chụp snapshot trước edit và khôi phục trạng thái file | Source control và checkpoint task tồn tại | Không thể rollback tác dụng bên ngoài; mở rộng quyền sở hữu |
| C6 | Metadata license/compatibility Agent Skills | Đặc tả Agent Skills | Provenance/yêu cầu host dạng khai báo tùy chọn | Frontmatter skill Harnix chủ ý chỉ có name/description | Tính ngang bằng host và hỗ trợ schema chưa giải quyết |
| C7 | Corpus eval workflow/an toàn host-model xác định | Khái niệm eval/replay Codex; fixture adversarial hiện có | Replay kịch bản đóng băng trên host/model thực | Có fixture định dạng; hành vi host chưa chứng minh | Không có runner ngoại tuyến có thẩm quyền và có thể di chuyển |
| C8 | Trajectory/replay event-sourced đầy đủ | OpenHands, SWE-agent | Lưu mọi event, prompt, action và phép chiếu state | Harnix lưu dữ kiện task/evidence/journal có giới hạn | Privacy, secret, footprint và gắn chặt runtime |
| C9 | Cô lập reviewer/subagent bắt buộc | Superpowers, reviewer Codex tùy chọn | Tách context triển khai/review | Review hai giai đoạn dựa trên vai trò và hỗ trợ một agent | Vi phạm guardrail multi-agent bắt buộc |
| C10 | Enforcement permission trước tool | Hook Kiro, Codex, Claude | Deny/ask trước khi gọi tool | Setup chủ ý tránh thay đổi permission/trust | Thẩm quyền mới và hành vi riêng host |
| C11 | Daemon/global auto-memory/telemetry | ECC 2.0 alpha, harness hosted, memory Claude | Thu thập/kiểm soát nền và truy hồi toàn cục | Chỉ learning cục bộ dự án do người dùng sở hữu | Xung đột trực tiếp hard-guardrail |
| C12 | Marketplace platform rộng hoặc workflow Git tự động | Spec Kit/OpenSpec/Cline/Superpowers | Nhiều adapter, worktree, tự động branch/commit | Chính xác ba platform; không tự động hóa Git | Mở rộng sản phẩm/an toàn/bề mặt |

## 6. Ma trận quyết định tính năng

Điểm là `gap/fit/correctness/safety/low-cost/testability/license`; tổng dùng trọng số `25/20/15/15/10/10/5%`. Điểm cost cao nghĩa là chi phí thấp.

| Năng lực | Điểm | Có trọng số | Hard-gate | Quyết định | Lý do riêng cho Harnix |
|---|---|---:|---|---|---|
| C1 context drift | `4/5/4/4/4/5/5` | 4.35 | pass | adapt | Dùng hash hiện có và khép lại ma sát stale-resume quan sát được mà không cần daemon |
| C2 độ bao phủ tiêu chí/kiểm tra | `5/5/5/4/2/5/5` | 4.55 | pass | adapt | Làm bằng chứng completion có thể truy vết về cấu trúc; chi phí schema là hợp lý |
| C3 độ mới gắn với input | `5/5/5/4/2/5/5` | 4.55 | pass | adapt | Ngăn evidence xanh cũ tồn tại sau thay đổi contract/source; phải dùng chung migration C2 |
| C4 xung đột learning | `3/5/4/4/3/4/5` | 3.90 | pass | defer | Khoảng trống biểu diễn có thật, nhưng chưa có detector ngữ nghĩa xác định hoặc lỗi completion cấp bách |
| C5 checkpoint file | `3/2/3/5/1/3/5` | 3.00 | pass | defer | Giá trị recovery có thật, nhưng Harnix không phải runtime transaction của editor |
| C6 metadata skill | `2/4/2/3/4/5/5` | 3.20 | pass | defer | Field đặc tả tùy chọn hữu ích; tính ngang bằng ba host và ngữ nghĩa provenance chưa giải quyết |
| C7 corpus eval host | `4/3/4/4/2/2/5` | 3.45 | pass | research-more | Giới hạn assurance đã chứng minh, nhưng chưa đóng băng runner/ranh giới nhận định ngoại tuyến có thể di chuyển |
| C8 replay event đầy đủ | `2/2/4/1/0/3/4` | 2.15 | fail | reject | Lưu toàn session thô xung đột với quy tắc privacy/secret/path có giới hạn; chỉ giữ phép chiếu do task sở hữu |
| C9 reviewer bắt buộc | `2/1/4/2/1/2/4` | 2.10 | fail | reject | Delegation bắt buộc xung đột với phạm vi hỗ trợ một agent |
| C10 enforcement permission | `1/1/3/2/2/3/5` | 1.95 | fail | reject | Harnix không có thẩm quyền thay đổi trust/permission của host |
| C11 daemon/global memory/telemetry | `1/0/2/1/0/1/4` | 1.00 | fail | reject | Xung đột trực tiếp với vòng đời ngoại tuyến, cục bộ, do người dùng sở hữu |
| C12 platform rộng/workflow Git tự động | `1/0/2/1/0/1/4` | 1.00 | fail | reject | Vi phạm ranh giới đúng ba platform, không tự động hóa Git và core tinh gọn |

Không có năng lực nào là `adopt`: mọi cơ chế bên ngoài hữu ích đều cần schema, bảo toàn và hành vi ngoại tuyến do Harnix sở hữu.

## 7. Tóm tắt lựa chọn backlog

Chỉ C1–C3 vào backlog. C2 và C3 là hai năng lực nhìn thấy được bởi người dùng nhưng dùng chung một ranh giới phát hành TaskRecord v2 phối hợp; không được phát hành v2 trung gian có fingerprint input đã khai báo nhưng completion lại bỏ qua. Hợp đồng chính xác, migration, lát cắt RED–GREEN và verification được đóng băng trong `plan.md`.

Thứ tự ưu tiên là C1, sau đó C2, rồi C3. C1 nhỏ và độc lập. C2 thiết lập độ bao phủ ngữ nghĩa trước khi C3 gắn evidence vào input source.

## 8. Ý tưởng bị loại rõ ràng

- Subagent/reviewer bắt buộc: xung đột với vận hành hỗ trợ một agent. Chỉ xem xét lại nếu PRD thay đổi rõ chính sách điều phối bắt buộc; review tùy chọn do người dùng gọi vẫn được phép.
- Replay event/trajectory thô đầy đủ: xung đột với lưu trữ có giới hạn, an toàn secret/path và footprint tinh gọn. Chỉ xem xét lại nếu phép chiếu đã biên tập được chứng minh là không đủ và hợp đồng lưu giữ mới do người dùng sở hữu được phê duyệt.
- Thay đổi permission/trust/credential: xung đột với ranh giới thẩm quyền setup. Chỉ xem xét lại khi có API host rõ ràng do người dùng sở hữu và mô hình an toàn mới.
- Daemon, telemetry, control plane hosted hoặc global auto-memory: xung đột với quyền sở hữu ngoại tuyến và cục bộ dự án. Chỉ xem xét lại sau thay đổi phạm vi sản phẩm có chủ đích, không phải để thuận tiện triển khai.
- Bổ sung marketplace/số lượng tích hợp platform: xung đột với chính xác Kiro, Antigravity và Codex. Chỉ xem xét lại sau quyết định PRD về platform được hỗ trợ và phân tích đầy đủ chi phí vòng đời.
- Tự động branch/worktree/commit/push/PR: xung đột với mục tiêu Git rõ ràng không thực hiện và quy tắc bảo toàn. Chỉ xem xét lại sau ủy quyền sản phẩm rõ ràng cùng thiết kế hành động phá hủy riêng.

## 9. Xung đột và bất định trong nghiên cứu

### Dữ kiện đã xác minh

Source hiện tại triển khai hash context tùy chọn, tiêu chí/kiểm tra độc lập và độ mới evidence chỉ theo timestamp. Các nguồn chính thức hiện tại thiết lập những cơ chế bên ngoài được liệt kê ở trên.

### Bằng chứng chính thức xung đột

- Version release repository và package npm của ECC khác nhau theo maintainer; provenance Harnix giữ SHA đã đóng băng.
- Kiro IDE 1.0 và CLI 3.0 EA tạo các ranh giới tương thích riêng; session CLI v3 không tương thích ngược với v2.
- Antigravity ghi lại schema hook/plugin nhưng không ghi precedence có thẩm quyền của host đã cài.
- Continue và Roo có cơ chế hữu ích về lịch sử nhưng trạng thái hiện tại là read-only/dừng.

### Suy luận cho Harnix

Các phép chiếu xác định trên trạng thái Harnix đã sở hữu mang lại giá trị cao hơn việc nhập event store, runtime giao dịch file hoặc hệ thống permission host. C1–C3 là phương án thích nghi, không phải sao chép source code.

### Ẩn số chưa giải quyết

Khả năng chống instruction adversarial của host-model thực vẫn chưa được chứng minh. Tính ngang bằng metadata tùy chọn Agent Skills và hành vi activation/version riêng platform vẫn do bên ngoài kiểm soát. Không điểm nào chặn C1–C3.

### Điều kiện theo dõi

Chạy lại nghiên cứu có mục tiêu trước khi thay đổi schema platform, tuyên bố hỗ trợ Kiro CLI 3 GA, dựa vào precedence Antigravity, thêm metadata Agent Skills hoặc thiết kế runner eval host thực.

## 10. Kết quả cổng ready

- Danh mục quyết định: hoàn tất; dữ kiện repository, quyết định do người dùng sở hữu, ẩn số kỹ thuật và mục tiêu không thực hiện đã được ghi.
- Placeholder/điểm mơ hồ: không còn quyết định hợp đồng chưa giải quyết cho C1–C3; không cho phép placeholder triển khai.
- Ánh xạ: mọi yêu cầu được chọn ánh xạ tới lát cắt RED–GREEN và xác minh tập trung/rộng trong `plan.md`.
- Working tree có thay đổi: thay đổi có trước tại `.harnix/.template-hashes.json` được loại khỏi phạm vi và bảo toàn rõ ràng.
- Artifact Full: có `task.json`, `prd.md`, `plan.md` và ba artifact nghiên cứu do task sở hữu.
- Kết quả: task có thể lưu `ready/ready` sau xác thực theo dõi và artifact xác định. Không được đi vào triển khai trong lần chạy này.

## 11. Khuyến nghị cuối cùng

Ưu tiên: (1) diagnostic context drift khi resume, (2) độ bao phủ rõ ràng từ tiêu chí tới kiểm tra bắt buộc, và (3) độ mới evidence gắn với input. Không bao giờ thêm điều phối multi-agent bắt buộc, thay đổi trust/permission, daemon/global memory/telemetry, mở rộng platform rộng hoặc thao tác Git tự động theo PRD hiện tại. Nghiên cứu thêm đánh giá workflow/an toàn trên host thực trước khi quyết định.

C1 không cần thay đổi TaskRecord đã đóng băng. C2 và C3 cần một thay đổi TaskRecord v2 phối hợp cùng cập nhật đồng thời `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, hành vi migration và kiểm thử. Nếu được ủy quyền sau này, triển khai C1 trước, rồi C2, sau đó C3, và phát hành C2+C3 nguyên tử.
