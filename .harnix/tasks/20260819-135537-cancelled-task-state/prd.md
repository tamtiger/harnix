# PRD — Trạng thái cancelled và kỷ luật tải skill

## Outcome

Người dùng có thể dừng một task không còn đáng tiếp tục mà không làm sai evidence completion; task được lưu terminal `cancelled`, có lý do/authority, journal và active-pointer cleanup có thể phục hồi. Agent chỉ load canonical skill của stage hiện tại nên output tổng không bị truncate do batch-read nhiều skill.

## Quyết định contract

- `cancelled` là terminal state khác `completed`; checkpoint terminal là `cancelling` và owner là `harnix-finish-work`.
- Hidden `harnix workflow --cancel` đọc bounded JSON từ stdin với `reason` và `authorizedBy: "user"`; reason không đi qua command argument.
- Mọi unfinished state, gồm `blocked`, có thể cancel khi có explicit user authority. `completed` và `cancelled` không thể cancel lần đầu; `cancelled/cancelling` active chỉ dùng recovery idempotent sau lỗi journal hoặc pointer cleanup.
- Cancel không chạy completion/freshness gate, không đổi acceptance criteria/evidence và không claim pass.
- Skill loading theo single-stage owner: chỉ đọc skill được router chọn, đọc riêng đến EOF; không preload các skill của stage tương lai.

## Compatibility và safety

TaskRecord v1/v2 hiện có vẫn đọc nguyên trạng. Enum mở rộng nhưng không rewrite historical record. Cancellation metadata không chứa credential, machine path hoặc command output; reason phải concise, không rỗng và không có control character. Persist order là task terminal trước, cancellation journal sau, active pointer cuối để retry không mất audit.

## Không thuộc phạm vi

Không thêm public command, không tự cancel từ từ khóa mơ hồ, không đổi completed verification, không tạo skill thứ tám và không tách canonical skill thành cấu trúc platform-specific.

### AC `ac-cancel-terminal`

Một explicit cancel tạo terminal state đúng contract từ mọi unfinished/blocked state mà không giả pass required checks.

### AC `ac-cancel-audit`

Cancellation persistence, journal và pointer cleanup có thứ tự an toàn và retry idempotent.

### AC `ac-cancel-compatibility`

Historical TaskRecord và completion flow giữ nguyên; cancelled recovery được route deterministic và terminal state không resume.

### AC `ac-skill-loading`

Agent load đúng một owner skill riêng đến EOF; canonical source tiếp tục render byte-identical cho Kiro, Antigravity và Codex.