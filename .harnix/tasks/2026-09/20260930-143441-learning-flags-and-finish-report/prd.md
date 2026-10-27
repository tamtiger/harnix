# PRD — Ghi learning bằng flag và báo kết quả capture khi finish

## Vấn đề

`workflow --finish` chỉ chép `decisions`, `residualRisks` và `findings` của evidence vào learning. Ở repo payment-hub, 3 task Kiro hoàn tất có cả ba nguồn rỗng nên journal không có dòng `learning`. Cách ghi duy nhất các field đó là `--save` với JSON, đúng thứ agent né, và `--finish` im lặng khi không capture được gì nên agent không biết.

## Phạm vi

- Trong phạm vi: `--add-decision`, `--add-risk` (module `plan-edit`, flag, schema), báo cáo capture trong `--finish --brief`, cookbook, skill `harnix-finish-work` và `harnix-brainstorm`, PRD/WORKFLOW/IMPLEMENTATION_PLAN/AGENTS.
- Ngoài phạm vi: suy ra learning tự động từ đoạn hội thoại, đổi luật lọc an toàn của learning, capture lại cho task đã hoàn tất, đổi output `--finish` không có `--brief`.

## Hợp đồng chính xác

- `workflow --add-decision <id> --text <t> --rationale <t>`: thêm một `decisions` item vào task v3 active. `workflow --add-risk <id> --text <t> [--severity low|medium|high]` (mặc định `low`): thêm một `residualRisks` item. Đây là dữ liệu review nằm ngoài contract hash: không cần `--reason`, không replan, dùng được ở mọi stage chưa terminal. Id trùng, text rỗng hoặc rationale rỗng bị từ chối. Đi qua `saveWorkflow` nên guard hỏng mã hóa vẫn áp dụng.
- `workflow --finish --brief` trả thêm `learning: { notes, captured, hint? }`: `notes` là số decisions + residualRisks + findings của task; `captured` là số observation đã ghi vào journal lần finish này (đã qua bộ lọc an toàn và giới hạn 5); `hint` chỉ có khi `captured` bằng 0 và nêu lý do (task không có note, hoặc note bị lọc vì dài hơn 500 ký tự, giống lệnh, chứa credential hoặc chỉ thị). `--finish` không `--brief` vẫn trả đúng TaskRecord như cũ.
- Hướng dẫn: cookbook có ví dụ cả hai lệnh; `harnix-finish-work` yêu cầu ghi bằng chúng trước `--finish` mỗi lần có bài học tái dùng (câu tự đứng được) và đọc `learning.captured` sau khi finish; `harnix-brainstorm` nhắc ghi decisions bằng `--add-decision`.

## Tiêu chí chấp nhận

Xem `task.json`. Bằng chứng: `chk-learning-flags-focused` và `chk-full-suite`.

## Rủi ro

- Ghi quá nhiều note làm loãng learning: giữ giới hạn 5 observation mỗi task và hướng dẫn chỉ ghi bài học tái dùng.
- Đếm `captured` phải khớp thứ thực sự được ghi (idempotent khi retry finish): lấy từ giá trị trả về của `captureLearningAtFinish`.
