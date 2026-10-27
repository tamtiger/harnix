# Nghiên cứu: instruction thường trực và bằng chứng theo task trong phiên Codex dài

- Task: `20260813-141753-historyaudit`
- Ngày research: 2026-08-13
- Câu hỏi chưa biết có ảnh hưởng lớn: Harnix nên giữ bao nhiêu nội dung workflow trong context thường trực, và phần nào chỉ nên nạp cho stage hiện tại hoặc lưu thành bằng chứng của task?
- Điều kiện dừng: có đủ bằng chứng sơ cấp để phân tách chính sách ổn định, quy trình theo stage và trạng thái thực thi thay đổi vào các lớp lưu trữ riêng mà không tạo hosted service hoặc global memory mới.

## Bằng chứng trong repository

- Sáu task Codex liên quan Harnix có thể truy cập chứa 153 turn và 21 dấu mốc context compaction. Các lần người dùng sửa lại yêu cầu lặp lại chủ yếu liên quan đến phạm vi, tuyên bố hoàn tất, tính đồng bộ docs/template và các command đã được mô tả ở nơi khác.
- Instruction hiện tại lặp lại activation, persistence, verification, Git và completion rule trong `AGENTS.md`, `.harnix/workflow.md`, generated template và bảy file `SKILL.md`.
- Tóm tắt thread của Codex không cung cấp raw terminal output như bằng chứng task bền vững. Vì vậy TaskRecord và journal của Harnix là execution record duy nhất do repository sở hữu sau khi hội thoại thay đổi hoặc không còn truy cập được.
- File self-host `.harnix/workflow.md` đã chậm hơn canonical template và Doctor bảo toàn file này ở trạng thái modified, cho thấy managed guidance bị lặp có thể drift.

## Nguồn sơ cấp

| Nguồn | Revision/version | Ngày truy cập | Sự thật liên quan |
|---|---|---|---|
| [Hướng dẫn prompting model của OpenAI](https://developers.openai.com/api/docs/guides/latest-model) | Hướng dẫn GPT-5.6 hiện hành; trang không có revision bất biến | 2026-08-13 | Mỗi instruction chỉ nên nêu một lần; prompt gọn và tập tool phù hợp có thể cải thiện hiệu quả; phiên dài khuếch đại nội dung prompt/tool lặp; autonomy boundary nên ngắn gọn và thay đổi phải được đánh giá trên task đại diện. |
| [Custom instruction Codex với AGENTS.md](https://developers.openai.com/codex/guides/agents-md) | Trang ChatGPT Learn hiện hành; không có revision bất biến | 2026-08-13 | Codex kết hợp global và project guidance một lần cho mỗi run/session theo thứ tự ưu tiên thư mục. Thay đổi instruction cần run/session mới để dựng lại chuỗi. Session log là tùy chọn, không phải project record có tính portable. |
| [Codex skills](https://developers.openai.com/codex/skills) | Trang ChatGPT Learn hiện hành; không có revision bất biến | 2026-08-13 | Skill dùng progressive disclosure: context ban đầu chỉ có name/description, toàn bộ `SKILL.md` chỉ được nạp khi skill được chọn. Description cần ngắn gọn và mỗi skill nên tập trung vào một nhiệm vụ. |
| [Codex hooks](https://developers.openai.com/codex/hooks) | Trang ChatGPT Learn hiện hành; không có revision bất biến | 2026-08-13 | Non-managed command hook cần được trust theo đúng hash hiện tại. `/hooks` được xác định rõ là luồng của Codex CLI. Nhiều hook source được merge thay vì thay thế nhau. |

## Sự thật và suy luận của Harnix

### Sự thật

1. Codex nạp AGENTS guidance ngay cho session, trong khi nội dung skill chỉ được nạp theo điều kiện.
2. OpenAI khuyến nghị nêu rule một lần, giữ always-on prompt gọn và đo trên task đại diện thay vì mặc định rằng ngắn hơn luôn tốt hơn.
3. Lịch sử hội thoại và Codex log tùy chọn thuộc host. Harnix không thể dựa vào chúng như workflow database bền vững.
4. Hook trust và `/hooks` là đặc điểm vận hành của CLI; việc desktop app hiển thị skill không chứng minh hook đã chạy.

### Suy luận cho Harnix

1. `AGENTS.md` chỉ nên chứa project boundary ổn định, activation, authority, preservation, cách tìm source of truth và điểm vào Harnix. File này không nên lặp lại thuật toán của từng stage.
2. `.harnix/workflow.md` nên là state machine và artifact contract ngắn gọn. Quy trình chi tiết cho planning, implementation, debugging, research, verification, continuation và finishing chỉ nằm trong skill tương ứng.
3. Goal, decision, path, checkpoint, failure, command, exit code và supporting evidence riêng của task phải nằm trong `task.json` cùng task-owned Markdown. Không được dựng lại chúng từ conversation memory hoặc sao chép vào global instruction.
4. Hook chỉ nên inject bản tóm tắt active task có giới hạn sau khi activation thành công. Hook không được scan repository, replay history hoặc mang một bản workflow thứ hai.
5. Cần validator/Doctor check có tính deterministic cho workflow state vì instruction dạng văn bản không thể bảo đảm record được ghi thủ công luôn tuân thủ frozen schema.

## Quyết định và ảnh hưởng

Áp dụng mô hình bốn lớp:

| Lớp | Nội dung sở hữu | Nội dung không được sở hữu |
|---|---|---|
| Project/global AGENTS | Activation ổn định, authority/safety boundary và con trỏ tới workflow/skills | Thuật toán theo stage, phase hiện tại, task evidence |
| `.harnix/workflow.md` | Lifecycle ngắn gọn, thứ tự persistence, artifact ownership | Quy trình skill chi tiết bị lặp hoặc roadmap project thay đổi theo thời gian |
| Skill chuyên biệt | Input, procedure, persistence và exit chính xác của một stage | Toàn bộ instruction của stage khác hoặc dữ kiện task hiện tại |
| Task/journal | Objective, decision, state, validation và evidence hiện tại | Global policy, raw prompt log/secret, machine path |

Refactor cần làm cho state integrity có thể thực thi trước, sau đó loại từng nhóm prose lặp. Đo số ký tự prompt, routing accuracy, state validity, correction rate và độ đầy đủ của final evidence trên regression corpus lấy từ history. Không xem việc giảm token đơn thuần là thành công.

## Phương án loại bỏ

- Giữ mọi rule trong mọi lớp: loại vì repository đã cho thấy drift và OpenAI cảnh báo phiên dài khuếch đại nội dung lặp.
- Lưu toàn bộ Codex transcript hoặc terminal log vào `.harnix`: loại vì rủi ro privacy, kích thước, phụ thuộc host và lộ machine path/secret.
- Chuyển toàn bộ workflow policy vào hook: loại vì hook có ràng buộc trust/platform lifecycle và phải nhanh, read-only, non-blocking.
- Bỏ skill và dùng một workflow file lớn: loại vì làm mất progressive disclosure của Codex và khiến mọi stage phải trả chi phí context đầy đủ.

## Bất định còn lại

- Các số liệu hiệu quả prompt chỉ mang tính định hướng cho model/API, không bảo đảm cho mọi session Codex desktop, Kiro hoặc Antigravity. Vẫn cần cross-platform eval đại diện trước khi xóa rule từng khép lại một safety gap đã đo được.
- Tài liệu chính thức của Codex là trang sống, không có revision identifier bất biến. Hook và instruction behavior phải được kiểm tra lại trước release thay đổi global adapter.
- Kiro và Antigravity có thể nạp instruction khác Codex; Harnix phải giữ semantic parity bằng platform fixture thay vì giả định mô hình layering của Codex áp dụng cho mọi platform.
