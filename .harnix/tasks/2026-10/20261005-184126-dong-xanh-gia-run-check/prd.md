# PRD — Đóng các đường xanh giả của check và evidence

Thuộc epic `20261005-184125-harnix-hardening-2-0-5` (task 2/6). Nguồn: báo cáo review 2.0.4, finding R-002, R-003, R-005, R-006, R-009, R-034. Task 1 (gate xanh) đã hoàn thành.

## Vấn đề

Hiện có nhiều đường để ghi hoặc giữ một kết quả `pass` mà không chứng minh gì, và chính các đường này đã để lọt bản 2.0.4:

- `workflow --run-check <id> -- <argv>` chạy argv bất kỳ nhưng ghi `pass` cho check đã khai báo một `command` khác (`src/core/workflow/run-check.ts`). Summary chỉ ghi `<exe> — exit N`.
- Suite gate (`src/core/workflow/suite-gate.ts`) chỉ xét hình dạng `inputs`, không xét `command`: một check `scope: full` với `inputs: ["src/**","test/**"]` nhưng `command` chỉ chạy một file test vẫn qua cổng ready và finish.
- Evidence có `recordedAt` ở tương lai được lưu; khi thời điểm đó trôi qua nó trở thành "mới nhất" và che một lần fail thật.
- `cwd` của check chỉ bị chặn ký tự NUL; `--run-check --cwd` có thể chạy ngoài repo và vẫn ghi pass cho check đã khai báo; `cwd` không nằm trong digest hay so sánh frozen.
- `--finish` và `--cancel` ghi `task.json` mà không giữ lock, nên một `--run-check` ghi fail cùng lúc có thể bị ghi đè.
- Circuit breaker chỉ có tác dụng ở preflight; `--run-check` và `--evidence` vẫn ghi lần thứ ba.
- `cwd` và `baseline` đã có trong schema nhưng chưa có trong hợp đồng đóng băng (`docs/IMPLEMENTATION_PLAN.md` §4); `baseline` không có allowlist cho key lồng nhau.

## Mục tiêu

Mọi `pass` được ghi hoặc được chấp nhận ở finish phải đến từ đúng lệnh đã khai báo, đúng thư mục trong repo, tại một thời điểm không ở tương lai, dưới một lock, và tôn trọng circuit breaker.

## Quyết định (mặc định đề xuất, chờ người dùng duyệt cùng kế hoạch)

1. **Khớp lệnh:** so sánh chuẩn hóa. Mỗi bên bỏ dấu nháy `"` `'`, gộp khoảng trắng; `pnpm test`, `pnpm run test`, `npm test`, `npm run test`, `yarn test` được coi là tương đương. Check không khai báo `command` vẫn chạy được, evidence ghi lệnh thật.
2. **Suite gate:** `command` của check suite phải khớp một lệnh test do `buildVerifyPlan` trả về (gốc hoặc package). Nếu `verify-plan` không có lệnh test xác định thì gate giữ hành vi cũ (chỉ xét `inputs`).
3. **Timestamp:** evidence mới bị từ chối nếu `recordedAt` lớn hơn giờ hiện tại quá 5 giây (dung sai lệch đồng hồ).
4. **`--cwd` lúc chạy:** phải bằng `cwd` đã khai báo; check chưa khai báo `cwd` thì không nhận `--cwd`. Muốn đổi thư mục chạy phải `--set-check --cwd`. Đây là thay đổi hành vi có chủ ý so với cookbook cũ; cookbook được sửa.
5. **Circuit breaker:** khi disposition là `stop`, `--run-check` và `--evidence` bị từ chối với thông báo dừng và báo cáo. Lối đi duy nhất là `--replace-check --reason` do người dùng cho phép; replacement không được trùng hệt check bị thay (phải khác `command`, `inputs` hoặc `cwd`).
6. **`cwd`/`baseline`:** chính thức hóa vào §4 và PRD, `baseline` có allowlist key (`result`, `classification`, `authorizedBy`, `scope`) và enum; `cwd` vào hash của task contract.

## Không thuộc phạm vi

- Không chạy lệnh qua shell, không đổi enum/exit code/tên field khác.
- Quy tắc vào `blocked`, waive sau ready, replan, `epicMembers` thuộc task 4.
- Bảo mật thực thi Windows (`resolveInvocation`, kill cây tiến trình) thuộc task 5.

## Tiêu chí chấp nhận

- **ac-1** `--run-check` từ chối khi argv khác `command` đã khai báo; evidence ghi lệnh thật đã chạy.
- **ac-2** Suite gate (ready và finishing) yêu cầu `command` khớp lệnh test của `verify-plan`.
- **ac-3** Evidence có `recordedAt` ở tương lai bị từ chối ở mọi transport; chuỗi pass-tương-lai rồi fail thật không thể `--finish`.
- **ac-4** `cwd` được chuẩn hóa và kiểm bằng realpath lúc save và lúc chạy; `--run-check --cwd` khác khai báo bị từ chối; `cwd` nằm trong contract hash và so sánh frozen.
- **ac-5** `--finish` và `--cancel` chạy dưới project lock và đọc lại task trong lock.
- **ac-6** Circuit breaker có hiệu lực cho v3 ở `--run-check` và `--evidence`; `--replace-check` không thể là bản sao hệt.
- **ac-7** `cwd`/`baseline` có trong §4 và PRD với allowlist; schema, validator, `--schema` và docs thống nhất.
- **ac-8** Cổng `typecheck`, `lint`, `test` (coverage) đều exit 0.

## Rủi ro

- Siết khớp lệnh có thể phá các task/test hiện có dùng lệnh khác nhau: rà fixture trước, sửa fixture thay vì nới luật.
- Thêm `cwd` vào hash chỉ đổi digest của check có `cwd` (thêm có điều kiện), nên digest hiện có không đổi; test bảo vệ điều này.
- Từ chối ở breaker có thể chặn một lần chạy hợp lệ: thông báo phải nêu lối đi `--replace-check`.
