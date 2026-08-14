# PRD — Context drift và TaskRecord v2

## Kết quả

Khi tiếp tục hoặc hoàn tất task, Harnix phải fail closed nếu context hay input xác minh đã thay đổi, đồng thời truy vết được từng tiêu chí tới đúng kiểm tra bắt buộc mà không phá dữ liệu TaskRecord v1.

## C1 — Context drift

`inspectContextDrift` chỉ đọc entry đã có trong context manifest, so SHA-256 và trả `not-recorded|current|stale` cùng thay đổi `changed|missing|unreadable|unverified`, sắp xếp xác định và chỉ chứa đường dẫn repository-relative. Hidden workflow inspect luôn trả `contextDrift`. Skill Continue phải lưu checkpoint `replan` trước khi dựa vào context stale; không có tự động mutation runtime.

## C2 — Coverage TaskRecord v2

TaskRecord hỗ trợ schema `1 | 2`; task mới sau thay đổi dùng v2. ValidationCheck v2 có `criterionIds` và `inputs`. Mọi required check phải map ít nhất một criterion, mọi criterion không waiver phải có required check, và completion chỉ chấp nhận evidence nằm tại giao điểm criterion/check. Required-check definition gồm cả hai field mới và bất biến sau persistence.

V1 vẫn được đọc theo đúng ngữ nghĩa cũ. Completed v1 không bị viết lại. V1 chưa hoàn tất chỉ migrate tại checkpoint `replan`, giữ nguyên ID/text/evidence cũ và nối evidence migration xác định; không suy đoán mapping.

## C3 — Freshness gắn với input

Mỗi required check v2 có `inputs` đã sắp xếp/duy nhất, luôn chứa `@task-contract`; check mô tả build/test/runtime/source phải có ít nhất một pattern repository. Pattern dùng POSIX, cấm absolute/traversal và fail closed nếu không match hoặc thoát root/symlink.

Hidden workflow snapshot tạo digest SHA-256 từ canonical task contract, hash byte PRD/plan của Full task và các `{path,sha256}` đã sắp xếp. Evidence pass của required check phải có `inputDigest`. `saveWorkflow` đối chiếu digest với snapshot hiện tại và lưu sidecar task-owned chỉ gồm hash/đường dẫn tương đối để phát hiện race trước persistence. `finish` tính lại, so sidecar và báo check ID cùng path changed/missing an toàn. Không lưu nội dung, secret, đường dẫn tuyệt đối, environment hay output command.

## Phân loại check yêu cầu pattern repository

Một check cần pattern ngoài `@task-contract` nếu có command, hoặc description chứa một trong các từ khóa không phân biệt hoa thường: `repository`, `source`, `file`, `build`, `test`, `lint`, `typecheck`, `package`, `runtime`, `code`, `compile`, `smoke`, `acceptance`. Check chỉ kiểm tra artifact task có thể dùng riêng `@task-contract`.

## Bảo toàn và tương thích

Không đổi public command, JSON hoặc exit semantics. Update/Doctor chỉ diagnostic `legacy-task-schema`, không migrate. Sidecar snapshot là task-owned, bất biến theo evidence ID và chỉ được hidden workflow tạo khi digest khớp. C2+C3 phát hành cùng một package version; không có trạng thái phát hành trung gian.