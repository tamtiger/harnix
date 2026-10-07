# PRD: Hook context chỉ mang learning khi agent sắp lập kế hoạch

## Vấn đề

Hook `UserPromptSubmit` gắn khối "Project learning" (tối đa 5 note) vào mọi prompt khi có task active, kể cả khi task đang `ready`, `in_progress` hay `verifying`, lúc agent không còn lập kế hoạch. Tốn token mỗi lượt mà không đổi quyết định.

## Mục tiêu

- `buildEffectiveContext` (dùng chung cho hook và `harnix context-report`) chỉ gắn khối learning khi task active có `status === "planning"`; bỏ khi `ready`, `in_progress`, `verifying`, `blocked`, `completed`, `cancelled`.
- Khi chưa có task active, hook vẫn không phát context như hiện tại; learning cho giai đoạn này đã nằm trong trường `learning` của `workflow --preflight` (xem decision `d-no-task-learning`).
- `pnpm measure:tokens` gieo sẵn 5 note learning vào fixture và báo số token learning của hook ở planning và in_progress cùng mức giảm; lệnh thất bại nếu in_progress còn mang learning.
- Tài liệu phản ánh quy tắc mới.

## Ngoài phạm vi

Không đổi nội dung hay giới hạn 5 note của khối learning, không đổi `workflow --preflight`, không đổi cách chọn guide/file trong hook context.

## Rủi ro

Task ở `in_progress/replan` không nhận learning từ hook (vẫn có trong preflight vì `nextStage` là `plan`); chấp nhận để giữ quy tắc đơn giản theo `status`.
