# PRD — Chuẩn hóa CLI một command

## Mục tiêu

Mọi invocation Harnix chỉ có đúng một command token sau `harnix`. Action phụ được biểu diễn bằng option flags để cú pháp ngắn, nhất quán và dễ tích hợp vào hooks/agent skills.

## Contract đích

- `harnix context --platform <kiro|antigravity|codex>` là hidden platform-hook command.
- `harnix repo-map --query <text> [--limit <count>]` giữ public query hiện tại.
- `harnix repo-map --refresh` là hidden-action behavior trên command chính; `--refresh` xung đột với `--query` và `--limit`.
- `harnix workflow --inspect|--save|--snapshot|--finish` là hidden agent transport. Phải chọn đúng một action; `--snapshot` yêu cầu `--check <id>`, và `--check` không hợp lệ với action khác.
- Không còn `harnix internal ...`, `harnix workflow <action>` hoặc nested `repo-map <action>`.

## Compatibility và migration

Nested syntax cũ bị loại theo yêu cầu người dùng. Global setup mới ghi `harnix context --platform <id>`. Global update chỉ thay hook fragment cũ khi ownership manifest và hash chứng minh unchanged; modified/colliding content vẫn preserve. Project task/state schema và hook payload protocol không đổi.

## Ngoài phạm vi

Không đổi tám public product commands, không đổi JSON result schemas, không thêm network/telemetry và không chạm profile thật trong test.

## Chấp nhận

CLI tree không có command con; action flags fail deterministic khi thiếu, trùng hoặc kết hợp sai. Existing behavior của context, repo-map và workflow persistence giữ nguyên qua focused/integration/acceptance tests.