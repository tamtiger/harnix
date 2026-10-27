# Đặc tả: bố cục task và epic theo tháng, lưu trữ sau 30 ngày và migration

## Vấn đề (đo ngày 2026-10-27)

- 252 thư mục task nằm phẳng trong `.harnix/tasks/` (43 / 50 / 159 task cho 08, 09, 10/2026), 9,7 MB, 878 file được git theo dõi. Có thêm 32 epic trong `.harnix/epics/` (5 của 09/2026, 27 của 10/2026).
- `harnix tasks --limit 3` mất 0,8 giây và `harnix epic` mất 2,9 giây, vì `readdir` rồi nạp toàn bộ task (`scanned: 252`; `collectEpicMembers` nạp từng task).
- Chi phí quét tăng tuyến tính theo toàn bộ lịch sử.

## Bố cục đích (áp dụng giống nhau cho task và epic)

```text
.harnix/tasks/.active                       con trỏ, không đổi
.harnix/tasks/<YYYY-MM>/<id>/               task mới và task còn sống
.harnix/tasks/<id>/                         bố cục phẳng cũ, vẫn đọc được đến khi migration chạy
.harnix/tasks/_archive/<YYYY-MM>/<id>/      kho chỉ đọc

.harnix/epics/<YYYY-MM>/<id>/               epic mới và epic còn sống (epic.json, epic.md, spec.md, research.md)
.harnix/epics/<id>/                         bố cục thư mục cũ
.harnix/epics/<id>.json                     bố cục phẳng cũ và .harnix/roadmaps/<id>.json (legacy)
.harnix/epics/_archive/<YYYY-MM>/<id>/      kho chỉ đọc
```

Tháng lấy từ 6 ký tự đầu của ID (`YYYYMM`), nên đường dẫn suy ra được từ ID mà không cần chỉ mục. Mọi ID epic hiện có đều có tiền tố ngày giờ.

## Quyết định thiết kế (để duyệt)

1. **Một resolver duy nhất** (`src/core/tasks/task-location.ts`, mở rộng cho epic). Thứ tự dò: bucket tháng, bố cục cũ (phẳng, thư mục epic, `<id>.json`, roadmaps), `_archive`. Ghi mới luôn vào bucket tháng. Test kiến trúc cấm chuỗi `tasks/${id}` và `epics/${id}` ngoài resolver.
2. **Đường dẫn logic không đổi trong dữ liệu đã lưu.** `artifactPaths` của evidence (`task-schema-to-v3`) và ngoại lệ digest dùng `.harnix/tasks/<id>/...` làm định danh logic; chỉ phần truy cập đĩa dùng resolver. Ngoại lệ digest phải khớp mọi bố cục.
3. **Không đổi schema TaskRecord/EpicRecord, ID, enum.** Chỉ đổi nơi lưu.
4. **Migration** (`harnix update` và `doctor --fix`): rename nguyên tử từng task và epic dưới khóa workflow, idempotent, `--dry-run`, không ghi đè đích tồn tại, lỗi giữa chừng để lần sau tiếp tục, chạy sau migration `roadmaps → epics` đã có. Không sửa nội dung file. `doctor` báo `task-layout-legacy` khi còn mục phẳng.
5. **Archive là lệnh công khai riêng** `harnix archive [--days 30] [--apply] [--restore <id>]`. Mặc định dry-run. Không tự động chạy trong `init`, `update` hay `finish`, vì đây là thao tác ghi hàng loạt.
6. **Điều kiện archive task:** chỉ `completed` hoặc `cancelled`; mốc tính là `completedAt` hoặc `cancelledAt` (thiếu thì `updatedAt`), quá `--days`. Task `planning`, `ready`, `in_progress`, `verifying`, `blocked` không bao giờ bị archive (muốn dọn thì `--cancel` trước); task `invalid` bị bỏ qua và liệt kê riêng. Không archive: task đang active, task chưa kết thúc, task cha của follow-up chưa kết thúc.
7. **Điều kiện archive epic:** mọi thành viên đã kết thúc và quá hạn. Epic được lưu trữ **cùng toàn bộ thành viên** như một cụm. Thành viên của epic chưa hoàn tất không bao giờ được archive riêng; thành viên của epic hoàn tất chỉ đi cùng epic. Việc archive cụm bị gián đoạn giữa chừng được hoàn tất ở lần chạy sau (idempotent).
8. **Kho lưu trữ chỉ đọc.** Mọi thao tác ghi workflow vào task hoặc epic đã archive bị từ chối kèm hint `harnix archive --restore <id>`. `mem`, learning, epic và `--follow-up` vẫn đọc được. `--restore` một epic đưa cả cụm về bucket tháng.
9. **Quét epic có giới hạn.** Thành viên epic luôn có ID không sớm hơn epic (đã kiểm khi so theo tiền tố ngày giờ, 31 epic đều thỏa), nên chỉ cần quét bucket từ tháng của epic trở đi, cả sống lẫn `_archive`. Kết quả phải bằng quét toàn bộ (test đối chiếu).
10. **`harnix tasks` và `harnix epic` (danh sách)** mặc định chỉ quét phần sống; `--archived` quét kho.
11. **Không lồng task vào thư mục epic**: đường dẫn sẽ không suy ra được từ ID và `epicId` chỉ gắn lúc tạo.

## Thứ tự và phiên bản

Phiên bản hiện tại 2.22.3. Thành viên bump `2.23.0-dev.N`, thành viên cuối đóng epic bằng `2.23.0` với `--fold-dev`.

| # | Task | Phiên bản | Nội dung |
|---|---|---|---|
| 1 | `task-location-resolver` | 2.23.0-dev.1 | Resolver cho task và epic, ghi bucket tháng, chuyển các chỗ dựng đường dẫn, đọc được mọi bố cục |
| 2 | `task-scan-and-archived-views` | 2.23.0-dev.2 | `tasks` / `epic` / `status` / doctor / baseline-hint / learning / resume qua nhiều bố cục, `--archived`, đo tốc độ |
| 3 | `task-layout-migration` | 2.23.0-dev.3 | Migration phẳng → bucket cho task và epic qua `update` và `doctor --fix` |
| 4 | `task-archive-after-30-days` | 2.23.0 | `harnix archive` cho task và epic, kho chỉ đọc, đóng epic, tài liệu và changelog |

## Rủi ro

- **Thay đổi hợp đồng đường dẫn** (`.harnix/tasks/<id>`, `.harnix/epics/<id>`): phải đồng bộ PRD, workflow, implementation plan, README, AGENTS (root và template), skill, `pnpm selfhost:sync`. 109 file test chạm đường dẫn task; đọc tương thích với bố cục phẳng nên phần lớn vẫn xanh, test khẳng định vị trí ghi mới phải cập nhật. Không regenerate golden để cho qua.
- **Git:** migration đổi vị trí ~878 file task và các file epic (git nhận ra rename). Không tự commit; bạn xem diff rồi duyệt.
- **Worktree/subagent song song:** migration và archive chạy dưới khóa workflow; không chạy khi có worktree khác đang ghi task. Ghi rõ trong docs.
- **Archive epic là nhiều rename:** không nguyên tử như một rename; cần thứ tự thao tác và khả năng hoàn tất ở lần chạy sau, có test gián đoạn giữa chừng.
- **Footprint:** thêm lệnh làm tăng bytes `setup` ghi ra; kiểm tra `measure:footprint`, không nâng `maxBytes` để cho qua.
- **`versionSkew`:** bản `harnix` trên PATH phải đủ mới để đọc bố cục bucket; ghi chú upgrade trong changelog.
- **Windows:** rename trên cùng ổ, đường dẫn dài và khóa file (đã có EPERM lẻ tẻ trong learning).

## Ngoài phạm vi

Cải tiến skill từ hve-core nằm ở task độc lập `20261027-102937-hve-core-skill-improvements`, không thuộc epic này.
