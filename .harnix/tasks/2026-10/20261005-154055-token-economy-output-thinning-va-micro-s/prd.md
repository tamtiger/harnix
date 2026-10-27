# PRD - Token Economy: Output Thinning và Micro-Summary cho CLI

## 1. Mục tiêu
- Cải thiện đáng kể hiệu suất token cho các tác vụ của coding agent:
  1. `workflow --preflight --brief`: Lược bỏ mảng `learning` khỏi output khi gọi `--brief` để trả routing payload cực kỳ gọn gàng.
  2. `workflow --run-check`: Khi command pass (exit 0), trả về concise tail ngắn gọn (5-10 dòng) thay vì trả cả nghìn ký tự log kiểm thử vào context window.
  3. `harnix status --summary`: Bổ sung cờ `--summary` cho lệnh public `harnix status` để in ra micro-summary ngắn gọn (~50 tokens) cho agent kiểm tra tiến độ nhanh mà không tốn context.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
### ac-1: Token Economy: Output Thinning và Micro Summary
- `workflow --preflight --brief` không chứa trường `learning`.
- `workflow --run-check` khi pass chỉ trả tối đa 10 dòng outputTail cuối cùng.
- `harnix status --summary` in ra thông tin súc tích: task id, stage, tiến độ criteria và next action.
