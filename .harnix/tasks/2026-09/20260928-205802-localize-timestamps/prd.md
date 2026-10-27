# PRD — Chuyển mọi thời gian sang múi giờ cấu hình

## Kết quả và giá trị

Mọi mốc thời gian Harnix ghi ra (task, evidence, journal, epic, khóa) dùng ISO 8601 kèm offset của múi giờ cấu hình trong `.harnix/config.yaml` (repo này: `Asia/Ho_Chi_Minh`, `+07:00`). Tiền tố ID `YYYYMMDD-HHMMSS`, ngày phân vùng journal và phần hiển thị trong `review.md`/trang epic dùng cùng múi giờ. Agent không còn phải gọi `date` của shell (Git Bash trên Windows bỏ qua tên múi giờ và trả UTC) mà lấy thời gian hiện tại và tiền tố ID từ output của `workflow --preflight`.

## Phạm vi

Trong phạm vi:

- Trường `timezone` (tên IANA) trong config schema v2, tùy chọn để config cũ vẫn đọc được; `init` mặc định lấy múi giờ hệ thống qua `Intl`, không qua biến `TZ` của shell; validator từ chối tên không hợp lệ.
- Một module thời gian duy nhất `src/utils/clock.ts` (format ISO có offset, ngày cục bộ, tiền tố ID, chuỗi hiển thị); không còn `toISOString()` rải rác trong `src/`.
- Lớp lệnh (`internal-workflow`) lấy thời gian theo múi giờ cấu hình khi không được truyền `now`; ngày phân vùng journal tính theo múi giờ đó kể cả khi task lịch sử lưu dạng `Z`.
- `workflow --preflight` thêm khối `clock` gồm `timezone`, `now`, `idPrefix`; skill hướng dẫn agent dùng giá trị này.
- `review.md` và trang epic hiển thị thời gian theo múi giờ cấu hình, kể cả dữ liệu cũ dạng `Z`. `harnix status` hiện không phát sinh timestamp nên giữ nguyên hình dạng output.
- Đồng bộ PRD/WORKFLOW/IMPLEMENTATION_PLAN, skill, template, `AGENTS.md`, `CHANGELOG.md` (mục `[Unreleased]`).

Ngoài phạm vi: ghi lại task hay journal lịch sử; bump version; commit/push/PR; đụng cấu hình user-global thật.

## Quyết định đã chốt

- Core (`transitionTask`, `finishWorkflowTask`, ...) giữ tham số `now` tùy chọn để không đổi chữ ký hàng loạt; giá trị mặc định đi qua chính module thời gian (UTC). Mọi đường lệnh đều truyền thời gian theo múi giờ cấu hình nên dữ liệu ghi ra luôn có offset cấu hình.
- Khóa file (`file-lock`) là metadata cục bộ nhưng cũng đi qua module thời gian để không còn nơi nào tự gọi `toISOString()`.
- So sánh thứ tự vẫn dùng thời điểm tuyệt đối (`Date.parse`), nên dữ liệu trộn `Z` và `+07:00` sắp xếp đúng.

## Tiêu chí chấp nhận

### AC `ac-config-timezone`

`config.yaml` có `timezone` IANA hợp lệ, mặc định lấy từ hệ thống lúc init, validator từ chối tên không hợp lệ; config cũ thiếu field vẫn đọc được.

**Verifies:** `check-clock-config`.

### AC `ac-single-clock`

Không còn `toISOString()` rải rác trong `src/` ngoài module thời gian; mọi timestamp ghi ra qua đường lệnh có offset của múi giờ cấu hình; có test với clock và múi giờ cố định.

**Verifies:** `check-clock-config` và `check-time-flow`.

### AC `ac-ids-journal`

Tiền tố ID task/epic (do harness cung cấp) và ngày phân vùng journal theo múi giờ cấu hình; có test chuyển ngày quanh nửa đêm giờ Việt Nam.

**Verifies:** `check-clock-config` và `check-time-flow`.

### AC `ac-display`

`review.md` và trang epic hiển thị thời gian theo múi giờ cấu hình, kể cả dữ liệu cũ dạng `Z`; `status` không phát sinh timestamp mới.

**Verifies:** `check-time-flow`.

### AC `ac-agent-time-source`

`workflow --preflight` trả `clock` (`timezone`, `now`, `idPrefix`) theo múi giờ cấu hình và skill hướng dẫn agent dùng giá trị này thay cho lệnh `date` của shell.

**Verifies:** `check-time-flow` và `check-docs-sync`.

### AC `ac-legacy-order`

Dữ liệu trộn `Z` và `+07:00` vẫn sắp xếp đúng theo thời điểm tuyệt đối; task lịch sử không bị ghi lại.

**Verifies:** `check-clock-config` và `check-time-flow`.

### AC `ac-docs-sync`

PRD/WORKFLOW/IMPLEMENTATION_PLAN, skill, template, `AGENTS.md` và `CHANGELOG.md` phản ánh đúng thay đổi trong cùng task.

**Verifies:** `check-docs-sync` và `check-suite`.
