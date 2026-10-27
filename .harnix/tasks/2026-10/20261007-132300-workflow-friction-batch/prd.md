# PRD: Gom các ma sát vặt của workflow

## Vấn đề

Trong lúc phát triển epic tự cải tiến có sáu ma sát nhỏ chưa có chỗ xử lý, và một trong số đó có nguyên nhân khác với phỏng đoán ban đầu.

1. `--run-check` so command khai báo với argv bằng chuỗi nên đường dẫn tuyệt đối tới node không khớp command khai báo `node ...` (không liên quan khoảng trắng: cả `/usr/bin/node` cũng lệch). Đây là lý do `pnpm measure:tokens` hỏng và phải dùng tên `node` trần.
2. Tiêu đề khối "Project learning" dính cuối câu cuối của frame untrusted trên cùng một dòng.
3. `harnix workflow --inspect` không nhận `--task`, nên đọc task chưa kết thúc khác phải đọc thẳng `task.json`.
4. Không có cờ sửa nội dung criterion; chỉ có thêm criterion, nên sai chữ phải dựng JSON `--save`.
5. `harnix epic <id>` chỉ báo task kế tiếp; vẫn phải gõ `harnix resume <id>`.
6. Thêm cờ hoặc action workflow phải sửa đồng bộ 6–7 nơi; quên một nơi chỉ lộ ra ở suite cuối.

## Mục tiêu và hành vi

- **ac-1 (so khớp command):** `sameCommand(declared, argv)` tách command khai báo bằng `splitCommand`, so executable theo tên (bỏ thư mục, đuôi `.exe`/`.cmd`, hoa thường) khi command khai báo là tên trần, so đối số theo từng phần tử đúng chuỗi, vẫn bỏ `run` của package manager. Command khai báo có thư mục phải khớp đúng đường dẫn (đã chuẩn hóa dấu gạch). `measure-tokens.mjs` quay lại dùng `process.execPath`. Decision `d-basename-match`.
- **ac-2 (learning):** xuống dòng giữa prefix của frame untrusted và khối learning (cả khi không có entry file nào); nội dung và giới hạn 5 note không đổi.
- **ac-3 (`--inspect --task`):** `--inspect --task <id>` trả `{ activeTask, contextDrift }` của task chưa kết thúc đó (chỉ đọc, không đổi con trỏ); task kết thúc hoặc không tồn tại báo lỗi như các lệnh sửa.
- **ac-4 (`--set-criterion`):** `--set-criterion <id> --text <text> [--reason <why>]` sửa nội dung một criterion có sẵn. Khi còn `planning` là lưu thường; sau planning cần `--reason` và đi qua replan có kiểm soát như `--set-check`; criterion đã có evidence ghi nhận vẫn bất biến (bộ kiểm tra của `--save` từ chối). Id không tồn tại, text rỗng bị từ chối.
- **ac-5 (`resume --epic`):** `harnix resume --epic <epic-id> [--dry-run]` khôi phục `nextTask` của epic; không dùng cùng `<task-id>`; từ chối khi epic không có task chưa kết thúc, và khi đang có task active khác (cùng luật va chạm của `resume`).
- **ac-6 (danh sách nơi phải sửa):** một mục ngắn trong `AGENTS.md` nêu mọi tệp phải cập nhật khi thêm cờ hoặc action workflow; `test/workflow/action-checklist.test.ts` kiểm mọi đường dẫn nêu ở đó còn tồn tại.

## Ngoài phạm vi

Không đổi hợp đồng đóng băng obligations, không cài lại CLI, không tách baseline cấp repo, không đóng epic (việc của task `epic-close-release`).

## Rủi ro

`--set-criterion` và `resume --epic` đổi bề mặt CLI (cli-contract, golden, schema, docs). So executable theo tên làm lỏng nhẹ ràng buộc argv; giữ nghiêm với command có thư mục. Xem các risk `r-duplicate-secret-patterns`, `r-test-line-caps`, `r-no-planning-edit-guard` trong task.
