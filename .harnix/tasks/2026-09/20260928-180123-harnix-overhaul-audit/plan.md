# Plan — Đại tu toàn diện Harnix

## Checklist

- [ ] `S1` — Lưu research pha 1–3 và decision register pha 4 vào task
- [ ] `S2` — Tạo epic và các member task ở trạng thái planning
- [ ] `S4` — Trả lời 7 câu hỏi phản biện vòng 2 và cập nhật roadmap tương ứng
- [ ] `S6` — Sửa mô hình skill sau khi đọc trực tiếp repo ECC
- [ ] `S7` — Áp kết quả review trước implement vào epic và toàn bộ member task
- [ ] `S3` — Viết docs/OVERHAUL_DECISIONS.md và cập nhật AGENTS.md

## Slices

### Slice `S1`
Criteria: `ac-evidence-artifacts`, `ac-decision-register`
Checks: `check-artifact-review`
Paths: `.harnix/tasks/20260928-180123-harnix-overhaul-audit/research/inventory.md`, `.harnix/tasks/20260928-180123-harnix-overhaul-audit/research/decision-register.md`

**Làm:** tổng hợp kết quả các agent research chỉ đọc thành các file research.
**Verify:** đọc lại từng file, kiểm tra số liệu, trích dẫn, fact/giả thuyết tách riêng, mỗi hạng mục có một quyết định.

### Slice `S2`
Criteria: `ac-epic-roadmap`
Checks: `check-roadmap`
Paths: `.harnix/roadmaps/20260928-180123-harnix-overhaul.json`

**Làm:** gửi `epic` và `roadmapMembers` trong envelope `--save`.
**Verify:** `node dist/cli.js roadmap --id 20260928-180123-harnix-overhaul` liệt kê đủ member.

### Slice `S4`
Criteria: `ac-round2-answers`
Checks: `check-artifact-review`
Paths: `.harnix/tasks/20260928-180123-harnix-overhaul-audit/design.md`

**Làm:** trả lời 7 câu hỏi vòng 2 bằng bằng chứng đọc trực tiếp code/file.
**Verify:** đọc lại `design.md` §1–§7, mỗi câu hỏi có mục riêng kèm path:line.

### Slice `S6`
Criteria: `ac-round4-ecc-structure`
Checks: `check-artifact-review`
Paths: `.harnix/tasks/20260928-180123-harnix-overhaul-audit/design.md`, `.harnix/tasks/20260928-180123-harnix-overhaul-audit/research/external-research.md`

**Làm:** đọc trực tiếp cấu trúc repo ECC, đối chiếu `docs/UPSTREAM_MAPPING.md` §7, sửa §8 và roadmap.
**Verify:** §8 phân biệt `rules/` và `skills/`; roadmap có `add-technique-skills` với AC giới hạn số lượng.

### Slice `S7`
Criteria: `ac-review-fixes`
Checks: `check-artifact-review`
Paths: `.harnix/tasks/20260928-180123-harnix-overhaul-audit/design.md`, `.harnix/roadmaps/20260928-180123-harnix-overhaul.json`

**Làm:** áp toàn bộ sửa theo review: bỏ `ac-finish-gate`, thêm suite gate vào `add-verify-detection`, thứ tự mới, gỡ chồng chéo, AC đồng bộ docs, chính sách version 2.0.0, thêm OpenCode và Cursor, thêm `localize-timestamps`, `unify-epic-naming` và ba task chuẩn hóa code/test, đổi tên và ID member theo thứ tự thực thi.
**Verify:** đọc lại §9–§13 và từng member task, đối chiếu với danh sách sửa.

### Slice `S3`
Criteria: `ac-approved-decisions-doc`
Checks: `check-artifact-review`
Paths: `docs/OVERHAUL_DECISIONS.md`, `AGENTS.md`

**Làm:** ghi quyết định đã duyệt, bị loại, và ngoại lệ version cho epic.
**Verify:** đọc lại file và đối chiếu với decision register.
