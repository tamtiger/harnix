# PRD — Thiết kế lại learning để tự kích hoạt

## Kết quả và giá trị

Learning không còn phụ thuộc việc agent nhớ gọi `workflow --learn`. Khi một task hoàn tất, Harnix tự rút các quan sát lặp lại từ dữ liệu review agent đã ghi trong task, gom chúng thành candidate qua nhiều task, và đưa tóm tắt đã redact vào đầu công việc kế tiếp, kể cả trên nền tảng không có hook. Việc ghi vào spec vẫn là bước thủ công có review.

## Phạm vi

Trong phạm vi:

- **Tự động capture tại `workflow --finish`:** sau khi ghi `completed`, Harnix lấy các quan sát của task (văn bản `decisions`, `residualRisks` và `findings` của evidence), chuẩn hóa (bỏ khác biệt hoa thường, khoảng trắng), tạo id candidate ổn định từ hash, rồi ghi một journal entry `learning` cho mỗi quan sát (tối đa 5 mỗi lần finish). Việc capture là best-effort: lỗi không làm hỏng finish và không đổi output của `--finish`.
- **Trạng thái `draft`:** quan sát chỉ có một task nguồn là `draft`. Khi task thứ hai có cùng quan sát xuất hiện, candidate được gộp nguồn và nâng lên `candidate` khi đủ ngưỡng hiện hành (≥ 2 task, ≥ 2 evidence, confidence ≥ 0,8). Journal vẫn append-only; trạng thái hiện hành của một candidate là entry mới nhất của nó.
- **Decay:** `draft` và `candidate` chưa promote sau 28 ngày kể từ entry mới nhất được coi là `archived` khi đọc (không ghi lại); `harnix mem --learning` hiển thị trạng thái hiệu lực.
- **Surface tự động:** hook context của task đang active có mục "learning" tối đa 5 dòng, mỗi dòng cắt còn 160 ký tự, nằm trong biên untrusted hiện có; `workflow --preflight` trả cùng tóm tắt trong trường `learning` để nền tảng không hook (OpenCode, Cursor) dùng; skill hướng dẫn đọc trường này.
- **An toàn giữ nguyên:** quan sát có rủi ro (`credential-like`, `instruction-override`, `command-like`) không được capture tự động và không được surface; statement luôn được đưa qua `JSON.stringify` (biên JSON-string); `analyzeLearningStatement`, `promotionProposal` và ngưỡng eligibility không đổi; không có đường tự động ghi vào `.harnix/spec`.
- Phạm vi project-local; đồng bộ docs, skill finish-work/brainstorm, template, `CHANGELOG.md`.

Ngoài phạm vi: learning liên project hay global, tự động promote vào spec, đổi định dạng journal ngoài hai giá trị `status` mới, bump version, commit/push/PR.

## Quyết định đã chốt

- Nguồn quan sát tự động là văn bản review có sẵn trong TaskRecord; không thêm trường mới vào schema v3. Hạn chế đã biết: chỉ khớp được quan sát trùng nội dung sau chuẩn hóa, không khớp theo ngữ nghĩa.
- `--learn` thủ công vẫn hoạt động cho các candidate agent tự soạn.
- TTL 28 ngày là hằng số trong code (theo mô hình TTL của Copilot memory trong nghiên cứu), không phải cấu hình.

## Tiêu chí chấp nhận

### AC `ac-auto-capture`

`workflow --finish` tự tạo entry learning cho quan sát của task mà không cần bước `--learn`; có test.

**Verifies:** `check-learning-flow`.

### AC `ac-auto-surface`

Hook context của task Lite/Full có tóm tắt learning liên quan (giới hạn 5 dòng, 160 ký tự, đã redact) khi có entry.

**Verifies:** `check-learning-flow`.

### AC `ac-hookless-surface`

`workflow --preflight` trả trường `learning` cùng tóm tắt để agent trên nền tảng không hook đọc; skill hướng dẫn dùng nó.

**Verifies:** `check-learning-flow` và `check-docs-sync`.

### AC `ac-draft-upgrade`

Candidate `draft` (một nguồn) tự nâng lên `candidate` khi task thứ hai có cùng quan sát xuất hiện; có test.

**Verifies:** `check-learning-core` và `check-learning-flow`.

### AC `ac-decay`

`draft`/`candidate` chưa promote quá 28 ngày được coi là `archived` và không được surface; có test.

**Verifies:** `check-learning-core`.

### AC `ac-promote-gate-unchanged`

Không có đường tự động ghi vào spec; `promotionProposal` và ngưỡng eligibility không đổi; có test.

**Verifies:** `check-learning-core` và `check-learning-flow`.

### AC `ac-safety-unchanged`

Redaction và biên JSON-string không bị nới lỏng: quan sát rủi ro không được capture hay surface; statement có ký tự xuống dòng hoặc chuỗi giả biên không thoát khỏi biên; có test hồi quy.

**Verifies:** `check-learning-core` và `check-learning-flow`.

### AC `ac-docs-sync`

PRD, WORKFLOW, IMPLEMENTATION_PLAN, skill, template, `AGENTS.md` và `CHANGELOG.md` phản ánh đúng thay đổi.

**Verifies:** `check-docs-sync` và `check-suite`.
