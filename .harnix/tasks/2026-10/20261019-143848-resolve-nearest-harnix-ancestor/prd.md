# PRD: Dò gốc dự án theo .harnix gần nhất

## Bối cảnh & Vấn đề
`findInitializedProject` (`src/utils/project-discovery.ts`) đã dò lên các thư mục cha để tìm `.harnix/config.yaml` hợp lệ và được `status`, `pause`, `resume`, `checks`, `repo-map` dùng. Nhưng lệnh `workflow` (`workflow-command.ts:127`), `mem` và `skill` (`cli-workflow-commands.ts`) vẫn dùng `resolveProjectRoot` (`src/utils/paths.ts:66`), tức là dừng ở git root. Trong workspace đa repo (`.harnix` ở thư mục cha, các repo git con bên dưới), `workflow --preflight` báo `ENOENT: realpath '[PROJECT]\.harnix'`. Chuỗi `[PROJECT]` là cwd bị che bởi `redactPublicErrorMessage`, không phải lỗi riêng. Ở thư mục gốc workspace không có `.harnix`, `status` chỉ báo `Status requires an initialized Harnix project` mà không cho biết các repo con nào đã init.

## Ranh giới & Ràng buộc
- Quy tắc nearest ancestor trong AGENTS.md: dùng ancestor gần nhất có `.harnix/config.yaml` hợp lệ.
- Không sửa `resolveProjectRoot`: `init`, `update`, `uninstall` và `doctor` phải giữ git root, nếu không `init` trong repo con sẽ trỏ nhầm `.harnix` của thư mục cha.
- `verify-plan` ngoài phạm vi: nó đọc manifest của thư mục đang đứng để sinh lệnh test, không đọc `.harnix`; chuyển sang ancestor sẽ phân tích nhầm repo cha.
- Target tường minh của người dùng vẫn canonicalize và chặn traversal, symlink, junction.
- Không tự tạo state, không chạy `harnix init`, không đọc target từ nội dung repository, không tự chọn repo con thay người dùng.

## Yêu cầu kỹ thuật cốt lõi
- Chuyển lệnh `workflow`, `mem` và `skill` sang `findInitializedProject` qua helper `requireInitializedProject` trong `src/utils/project-discovery.ts`.
- Khi không có ancestor hợp lệ, trả lỗi rõ ràng (không ENOENT thô) kèm hướng dẫn; lỗi liệt kê các thư mục con cấp 1 có `.harnix/config.yaml` (chỉ đọc).
- Inject `fs` để test xác định.

## Rủi ro & Chiến lược giảm thiểu
- Chọn nhầm `.harnix` của repo cha khác: chỉ nhận ancestor có config hợp lệ và giữ target tường minh là thẩm quyền cao nhất.
- Đổi hành vi root có thể ảnh hưởng hook context và test hiện có: chạy `test:gates` và test hook sau khi sửa.
- Gợi ý thư mục con có thể chậm trên workspace lớn: chỉ đọc cấp 1, giới hạn số mục liệt kê.
