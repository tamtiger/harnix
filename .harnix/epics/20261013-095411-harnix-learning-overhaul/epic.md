# Epic: Đại tu tính năng learning để bài học thực sự được áp dụng

Nghiên cứu lại rồi refactor learning: giảm nhiễu khi capture, gộp gần trùng để draft hội tụ, hoàn thiện vòng đời review/approve/promote vào spec và mở rộng kênh áp dụng; đóng epic bằng tài liệu và bản phát hành minor.

- **Cập nhật:** 2026-10-13 10:03:55 +07:00

## Non-goals

- Không thêm dịch vụ, telemetry hay mạng
- Không tự ghi vào .harnix/spec khi chưa có approval
- Không nới learning-safety

## Next task

Không còn task nào chưa hoàn tất.

## Members (5 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261013-095412-learning-research` | Nghiên cứu lại tính năng learning: dữ liệu thật, kỹ thuật gộp gần trùng, mô hình áp dụng | `lite` | `completed` |
| 2 | `20261013-095415-learning-promotion-lifecycle` | Hoàn thiện vòng đời learning: review, approve, reject, promote vào spec | `full` | `completed` |
| 3 | `20261013-095413-learning-capture-quality` | Giảm nhiễu khi capture learning bằng bộ lọc chất lượng | `lite` | `completed` |
| 4 | `20261013-095414-learning-near-duplicate-merge` | Gộp gần trùng learning để draft hội tụ thành candidate | `full` | `completed` |
| 5 | `20261013-095416-learning-overhaul-close` | Đóng epic learning: tài liệu gốc, kiểm chứng end-to-end và phát hành | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261013-095412-learning-research` — Nghiên cứu lại tính năng learning: dữ liệu thật, kỹ thuật gộp gần trùng, mô hình áp dụng

- **Trạng thái:** `completed`
- **Mục tiêu:** Trả lời R1–R5 bằng bằng chứng: phân loại 130 learning hiện có, so sánh các harness khác, kỹ thuật gộp gần trùng offline, tiêu chí bài học tái sử dụng được và đường áp dụng an toàn; ghi research note làm đầu vào cho các member sau.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 2. `20261013-095415-learning-promotion-lifecycle` — Hoàn thiện vòng đời learning: review, approve, reject, promote vào spec

- **Trạng thái:** `completed`
- **Mục tiêu:** Thêm lệnh công khai (JSON mặc định) để xem hàng đợi, approve, reject và promote; promote dùng promotionProposal để sinh diff reviewable vào .harnix/spec/guides chỉ khi có approval tường minh; ghi status approved, promoted, rejected vào journal append-only; mở rộng kênh áp dụng theo kết quả research.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261013-095413-learning-capture-quality` — Giảm nhiễu khi capture learning bằng bộ lọc chất lượng

- **Trạng thái:** `completed`
- **Mục tiêu:** Chỉ capture ghi chú tái sử dụng được: lọc độ dài tối thiểu, chuỗi không dấu hoặc chuỗi test, ghi chú gắn chặt id hoặc đường dẫn task; ưu tiên residualRisks và decision tường minh; có cách dọn draft rác hiện có mà vẫn giữ journal append-only.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261013-095414-learning-near-duplicate-merge` — Gộp gần trùng learning để draft hội tụ thành candidate

- **Trạng thái:** `completed`
- **Mục tiêu:** Thay băm exact của observationCandidateId bằng so khớp gần trùng deterministic, offline (chuẩn hoá dấu tiếng Việt, token/shingle), giữ ID ổn định và tương thích ngược với entry cũ; đánh giá lại ngưỡng candidate theo dữ liệu nghiên cứu.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 5. `20261013-095416-learning-overhaul-close` — Đóng epic learning: tài liệu gốc, kiểm chứng end-to-end và phát hành

- **Trạng thái:** `completed`
- **Mục tiêu:** Cập nhật docs/HARNIX_WORKFLOW.md, PRD, workflow template (pnpm selfhost:sync), kiểm chứng end-to-end trên journal thật và phát hành X.(Y+1).0 bằng pnpm version:sync --fold-dev.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
