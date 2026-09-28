# PRD — Đại tu toàn diện Harnix: audit hiệu quả và lập roadmap

## Problem Statement

Harnix đã được dogfood qua 69 task. Bằng chứng (`research/usage-evidence.md`) cho thấy khoảng một nửa công sức dùng để sửa chính bộ máy workflow. Một thay đổi nhỏ tốn khoảng 17–30K token chỉ dẫn. Nhiều tính năng gần như không được dùng. Lệnh verify chỉ tự phát hiện được cho JS. HEAD hiện đang đỏ, dù task gần nhất được ghi `completed`.

## Goals

Tạo một bộ quyết định có bằng chứng cho từng hạng mục của Harnix, cùng một Epic Roadmap thực thi được, đã qua review trước khi implement. Kết quả đưa Harnix về dạng harness gọn nhưng mở rộng đúng chỗ (đa ngôn ngữ, extension point skill, learning tự kích hoạt), giúp engineer code nhanh, bài bản, chính xác và chuẩn hơn.

## Non-Goals

- Không sửa code sản phẩm trong task này.
- Không commit, push hay tạo PR.
- Không đụng cấu hình user-global thật.
- Không thêm coding tool nào ngoài 4 nền tảng hiện có cùng OpenCode và Cursor (quyết định người dùng 2026-09-28).

## Acceptance Criteria

### AC `ac-evidence-artifacts`
**Verifies:** `check-artifact-review`
Task có ba file research: `research/inventory.md`, `research/usage-evidence.md`, `research/external-research.md`. Mỗi file có số liệu định lượng, trích dẫn path/task/commit/URL, và tách rõ fact với giả thuyết.

### AC `ac-decision-register`
**Verifies:** `check-artifact-review`
`research/decision-register.md` chấm điểm và đưa ra đúng một quyết định cho từng hạng mục chính, liệt kê tính năng mới cùng mức bằng chứng và mục tiêu đo được; quyết định learning là GIỮ + THIẾT KẾ LẠI.

### AC `ac-epic-roadmap`
**Verifies:** `check-roadmap`
Epic `20260928-180123-harnix-overhaul` có đủ 17 member task ở `planning`, mỗi task có goal, nonGoals, acceptance criteria và decisions; thứ tự thực thi được ghi tường minh.

### AC `ac-round2-answers`
**Verifies:** `check-artifact-review`
`design.md` trả lời đủ 7 câu hỏi vòng 2: bảng trách nhiệm skill không case mồ côi, khung "lean vs expand", chuẩn artifact, `spec/project-facts`, lỗi renderer roadmap, tách `simplify-task-contract` khỏi `split-god-modules`.

### AC `ac-round4-ecc-structure`
**Verifies:** `check-artifact-review`
`design.md` §8 xác nhận bằng đọc trực tiếp repo ECC rằng `rules/` (≈ guides, đã dịch đúng) và `skills/` là hai hệ thống độc lập; `rewrite-guides` giữ phạm vi gốc; member `add-technique-skills` giới hạn 5–10 skill có bằng chứng cùng extension point `.harnix/spec/skills/`.

### AC `ac-review-fixes`
**Verifies:** `check-artifact-review`
`design.md` §9–§13 ghi lại kết quả review trước implement và toàn bộ sửa đã áp: bỏ `ac-finish-gate` (root cause sự cố `pause` là check quá hẹp, không phải thiếu runner), thứ tự thực thi mới, gỡ chồng chéo phạm vi, AC đồng bộ docs trong từng task, không bump version theo task mà bump 2.0.0 một lần, thêm đúng OpenCode và Cursor qua task `add-opencode-cursor` (`design.md` §10), thời gian theo giờ Việt Nam qua `localize-timestamps` (§11), tên gọi thống nhất qua `unify-epic-naming` và quy ước tên task (§12), chuẩn hóa code và test qua `enforce-code-style`, `restructure-code`, `standardize-tests` (§13).

### AC `ac-approved-decisions-doc`
**Verifies:** `check-artifact-review`
Sau khi người dùng duyệt phạm vi, `docs/OVERHAUL_DECISIONS.md` ghi lại các quyết định đã duyệt và bị loại, kèm liên kết tới research của task; `AGENTS.md` mục "Current state" trỏ tới epic và ghi ngoại lệ version 2.0.0 cho epic này.
