# PRD - Hoàn thiện nội dung review.md và đưa vào workflow canonical

## Outcome

`review.md` hiện đủ để biết task còn thiếu gì (required checks) mà không cần mở `task.json`; và agent chạy ở **bất kỳ repository nào khác** — không chỉ trong chính repo Harnix — biết `review.md` tồn tại, biết đó là derived-only, và biết trỏ người dùng tới đó.

## Vấn đề được chứng minh

1. `renderTaskReview` (task.ts) chỉ liệt kê `Evidence` đã ghi; một required check **chưa từng chạy** không xuất hiện ở đâu cả trong `review.md`. Không có timestamp. Không trỏ tới `prd.md`/`plan.md`/`design.md`.
2. `grep -n "review.md" src/templates/harnix/workflow.ts src/templates/harnix/agents.ts src/skills/*/SKILL.md` → **0 kết quả**. Tài liệu tôi cập nhật trước đó (`docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`) chỉ là meta-doc nội bộ của repo Harnix, không phải canonical template được ship ra `.harnix/workflow.md`/`AGENTS.md` của **consumer project**. Agent chạy ở repo khác đọc đúng hai file đó và bảy skill — không file nào trong số này nhắc `review.md` — nên sẽ không biết nó tồn tại.

## In scope

- `renderTaskReview` thêm: mục "Required checks" (id, scope/required, kết quả evidence mới nhất hoặc "chưa chạy"), timestamp `createdAt`/`updatedAt`, mục "Artifacts" trỏ tới `prd.md`/`plan.md`/`design.md` khi các file đó tồn tại trên đĩa.
- Thêm một đoạn ngắn về `review.md` vào `workflowTemplate` (`src/templates/harnix/workflow.ts`) và `renderAgentsTemplate` (`src/templates/harnix/agents.ts`) — hai nguồn được ship vào **mọi** consumer project qua `harnix init`/`harnix update`.
- Thêm hướng dẫn ngắn vào skill `harnix-finish-work` (trỏ người dùng tới review.md khi hoàn tất) và `harnix-brainstorm` (không tự tay sửa review.md, nó tự sinh).

## Out of scope

- Không đổi cơ chế regenerate (vẫn hook trong `saveTask`).
- Không thêm freshness/digest computation vào review.md (chi phí I/O không tương xứng cho một trang derived-only).
- Không liệt kê `research/*.md` trong Artifacts (thấp giá trị so với chi phí thêm).

### AC `ac-review-md-required-checks`

`review.md` có mục "Required checks" liệt kê mọi `validationPlan` item với scope/required và evidence mới nhất (dùng lại `selectLatestEvidence`) hoặc rõ ràng "chưa chạy" nếu không có evidence nào khớp `checkId`.

### AC `ac-review-md-metadata`

`review.md` hiện `createdAt`/`updatedAt`, và mục "Artifacts" chỉ liệt kê đúng file thực sự tồn tại trên đĩa tại thời điểm save (`prd.md`/`plan.md`/`design.md`).

### AC `ac-workflow-canonical-wiring`

`workflowTemplate` và `renderAgentsTemplate` — hai nguồn được `harnix init`/`harnix update` ghi vào **mọi** consumer project — đều nhắc `review.md` là derived-only, không hand-edit, và là nơi review task. Test xác nhận bằng cách init một project mới rồi grep `AGENTS.md`/`.harnix/workflow.md` sinh ra.

### AC `ac-skill-wiring`

`harnix-finish-work` và `harnix-brainstorm` (đọc qua `harnix skill <name>`) đều nhắc `review.md`.

### AC `ac-release-readiness`

Patch version và changelog cập nhật một lần trước `verifying`; exact acceptance sequence pass.
