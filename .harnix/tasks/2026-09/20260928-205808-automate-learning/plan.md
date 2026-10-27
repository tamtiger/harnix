# Kế hoạch — Learning tự kích hoạt

## Checklist thực thi

- [x] MODEL — trạng thái `draft`/`archived`, chuẩn hóa quan sát, decay hiệu lực, kho đọc trạng thái mới nhất
- [x] CAPTURE — tự động capture tại `workflow --finish`, gộp nguồn và nâng `draft` lên `candidate`
- [x] SURFACE — tóm tắt learning trong hook context và `workflow --preflight`, `mem` hiển thị trạng thái hiệu lực
- [x] TESTS — test đơn vị, luồng và hồi quy an toàn
- [x] DOCS — docs, skill, template, `AGENTS.md`, `CHANGELOG.md`
- [x] GATE — chạy bộ kiểm chứng đầy đủ và ghi evidence

## Chi tiết

### MODEL

Làm: `LearningCandidate.status` thêm `draft` và `archived`; `src/core/journal/learning.ts` (hằng TTL, `effectiveLearningStatus`, chuẩn hóa và id ổn định); `src/core/journal/learning-store.ts` (đọc mọi entry learning, lấy trạng thái mới nhất mỗi candidate).

### CAPTURE

Làm: `src/core/journal/learning-capture.ts` rút quan sát từ task, bỏ quan sát rủi ro, gộp với trạng thái hiện có, ghi entry idempotent; `src/core/workflow/finish.ts` gọi best-effort sau khi completed.

### SURFACE

Làm: `learning-summary` (bounded, redacted, JSON-quoted); `buildEffectiveContext` thêm mục learning; `preflightWorkflow` thêm `learning`; `searchMemory` trả trạng thái hiệu lực.

### TESTS

Làm: `test/unit/core/journal/*.test.ts` và `test/workflow/learning-automation.test.ts`.

### DOCS

Làm: mô tả trong docs, skill finish-work và brainstorm, template workflow.

### GATE

Làm: chạy từng check tập trung rồi bộ đầy đủ, ghi evidence với digest trước và sau.
