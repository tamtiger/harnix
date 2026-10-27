# Đại tu toàn diện Harnix: audit hiệu quả và lập roadmap

- **ID:** 20260928-180123-harnix-overhaul-audit
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28T11:01:23.000Z
- **Updated:** 2026-09-28T14:21:29.344Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Kiểm kê, đo hiệu quả bằng bằng chứng (lịch sử dogfooding + research bên ngoài) cho từng command, skill, rule, guide, workflow và dữ liệu .harnix; đưa ra quyết định Giữ/Đơn giản hóa/Gộp/Bỏ/Thêm và một Epic Roadmap thực thi được, theo docs/prompts/harnix-overhaul-audit.md.

## Non-goals

- Không sửa code sản phẩm trong task audit này; refactor thuộc các member task của epic sau khi người dùng duyệt.
- Không commit, push, tạo PR hay publish.
- Không đụng cấu hình user-global thật.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.
- [`design.md`](./design.md) — architecture/interface decisions.

## Acceptance criteria

- `ac-evidence-artifacts` (met): Có research/inventory.md, research/usage-evidence.md, research/external-research.md với số liệu, trích dẫn và tách fact/giả thuyết.
- `ac-decision-register` (met): research/decision-register.md có đúng một quyết định có bằng chứng cho từng hạng mục chính, cùng tính năng mới và mục tiêu đo được; learning là GIỮ + THIẾT KẾ LẠI.
- `ac-epic-roadmap` (met): Epic 20260928-180123-harnix-overhaul có đủ 17 member task ở planning, mỗi task có goal, nonGoals, acceptance criteria, decisions; thứ tự thực thi ghi tường minh.
- `ac-round2-answers` (met): design.md trả lời đủ 7 câu hỏi vòng 2 của người dùng.
- `ac-round4-ecc-structure` (met): design.md §8 xác nhận rules/ và skills/ của ECC là hai hệ thống độc lập; rewrite-guides giữ phạm vi gốc; add-technique-skills giới hạn 5–10 skill cùng extension point.
- `ac-review-fixes` (met): design.md §9–§13 ghi kết quả review trước implement và toàn bộ sửa đã áp vào epic và member task: thứ tự mới, OpenCode/Cursor, giờ Việt Nam, tên gọi thống nhất, chuẩn hóa code và test.
- `ac-approved-decisions-doc` (met): docs/OVERHAUL_DECISIONS.md ghi quyết định đã duyệt/bị loại; AGENTS.md trỏ tới epic và ghi ngoại lệ version 2.0.0.

## Required checks

- `check-artifact-review` (focused): Đọc lại research, design.md và docs/OVERHAUL_DECISIONS.md, đối chiếu với decision register và roadmap — pass (2026-09-28T21:16:00.000+07:00)
- `check-roadmap` (focused): Roadmap liệt kê đủ 17 member ở planning — pass (2026-09-28T21:16:00.000+07:00)

## Decisions

- **d-full-mode** — Phân loại Full.
  - _Why:_ Research bên ngoài, đa tầng, sẽ phá frozen contract.
- **d-audit-no-product-edit** — Task audit không sửa code sản phẩm; refactor nằm trong 17 member task.
  - _Why:_ Prompt yêu cầu dừng ở pha 5 để người dùng duyệt.
- **d-learning-keep-redesign** — Learning: GIỮ + THIẾT KẾ LẠI (member automate-learning), không bỏ.
  - _Why:_ Người dùng phản hồi; research/learning-redesign.md xác nhận vấn đề là điểm kích hoạt, không phải ý tưởng.
- **d-ecc-two-systems** — Guides giữ vai trò ECC rules/; skill mở rộng là hệ thống riêng, giới hạn 5–10 skill có bằng chứng + extension point .harnix/spec/skills/.
  - _Why:_ Đọc trực tiếp repo ECC: rules/, skills/, agents/, commands/ là thư mục độc lập; phần lớn 292 skill nằm ngoài biên Harnix.
- **d-user-approvals** — Người dùng duyệt: phá frozen contract (dữ liệu cũ vẫn đọc được); version 2.0.0 bump một lần ở release-v2 thay vì patch mỗi task; về coding tool: ban đầu không thêm, sau đó đổi thành thêm đúng OpenCode và Cursor.
  - _Why:_ Trả lời trực tiếp của người dùng 2026-09-28 cho 3 câu hỏi trong review trước implement, và yêu cầu bổ sung sau đó.
- **d-code-test-standard** — Thay split-god-modules bằng ba task chuẩn hóa: enforce-code-style (Prettier, ESLint type-checked, max-lines 300), restructure-code (đúng tầng commands -> core -> utils, tách module lớn), standardize-tests (cấu trúc test phản chiếu src, builder dùng chung, coverage floor).
  - _Why:_ Người dùng yêu cầu chuẩn hóa toàn bộ code và test. Đo thực tế: không có formatter, 11 file >300 dòng, task.ts 47 dòng >160 ký tự, 11 command import node:fs trực tiếp, logic workflow nằm trong commands/, test lớn nhất 1.148 dòng, 6 module không có test trực tiếp, chưa đo coverage. Tách ba task để diff định dạng không lẫn với diff logic.
- **d-vn-time** — Thêm task localize-timestamps: mọi thời gian theo múi giờ cấu hình (repo này Asia/Ho_Chi_Minh), ISO 8601 kèm offset; dữ liệu của epic này được ghi lại ngay bằng +07:00; task lịch sử không ghi lại.
  - _Why:_ Người dùng yêu cầu chuyển toàn bộ thời gian sang giờ Việt Nam; code hiện có 13 chỗ toISOString() luôn ra UTC; từng có task bị huỷ vì ID dùng UTC.
- **d-epic-naming** — Thêm task unify-epic-naming: dùng một tên epic ở mọi nơi (.harnix/epics/, harnix epic, epicMembers); đổi tên và ID toàn bộ member theo quy ước <động-từ>-<đối-tượng> và thứ tự thực thi.
  - _Why:_ Người dùng chỉ ra roadmap và epicId không đồng bộ; một file trong roadmaps/ thực chất là một epic. Chi tiết ở design.md §12.
- **d-add-opencode-cursor** — Thêm OpenCode và Cursor bằng task riêng add-opencode-cursor ngay sau add-platform-registry; không thêm tool nào khác.
  - _Why:_ Người dùng yêu cầu bổ sung hai tool này. Tách task riêng để add-platform-registry giữ phạm vi chuyển đổi 4 nền tảng hiện có, và việc thêm hai nền tảng là bằng chứng registry chỉ cần dữ liệu. Chi tiết và rủi ro (dự phòng ~/.claude/CLAUDE.md của OpenCode, Cursor không có instruction global, trùng skill) ở design.md §10.
- **d-no-finish-runner** — Bỏ ý tưởng finish tự chạy lại check; thay bằng suite gate dựa trên evidence trong add-verify-detection.
  - _Why:_ Root cause sự cố pause: check chỉ chạy unit+integration, bỏ sót test:workflow; harness không có và không nên có process runner chạy lệnh từ task.json.
- **d-execution-order** — Thứ tự chuẩn: fix-baseline → remove-unused-machinery → simplify-task-contract → localize-timestamps → unify-epic-naming → enforce-code-style → restructure-code → standardize-tests → add-verify-detection → automate-learning → slim-instructions → add-platform-registry → add-opencode-cursor → rewrite-guides → add-technique-skills → add-test-impact-map → release-v2. ID của member tăng dần đúng thứ tự này và title có tiền tố [NN] tương ứng.
  - _Why:_ Cắt trước tái cấu trúc; tái cấu trúc trước khi thêm hành vi; viết lại skill sau khi hành vi chốt; phát hành cuối cùng.
- **d-docs-per-task** — Mỗi member task phá contract tự cập nhật docs trong cùng task (ac-docs-sync); release-v2 chỉ rà nhất quán.
  - _Why:_ AGENTS.md yêu cầu cập nhật docs bị ảnh hưởng trong cùng thay đổi.

## Residual risks

- **r-draft-checks** (medium) — 12 member task hiện chỉ có một check-suite chung; mỗi task phải bổ sung check tập trung khi planning trước khi ready, nếu không các AC định lượng sẽ không có bằng chứng riêng.

## Evidence

- skipped (2026-09-28T13:20:00.000Z): Task contract revised at persisted replan: Người dùng yêu cầu dừng implement để review, và bổ sung OpenCode cùng Cursor vào epic; cập nhật AC ac-epic-roadmap (13 member) và ac-review-fixes, thêm decision d-add-opencode-cursor.
- skipped (2026-09-28T20:59:30.000+07:00): Task contract revised at persisted replan: Người dùng yêu cầu thêm task chuyển mọi thời gian sang giờ Việt Nam, thêm task thống nhất tên epic/roadmap, đổi tên và ID toàn bộ member theo quy ước và thứ tự thực thi; epic nay có 15 member.
- skipped (2026-09-28T21:20:00.000+07:00): Task contract revised at persisted replan: Người dùng yêu cầu chuẩn hóa toàn bộ code và test: thay split-god-modules bằng ba task enforce-code-style, restructure-code, standardize-tests; epic nay có 17 member, ID và thứ tự được đánh lại.
- `check-artifact-review` — pass (2026-09-28T21:16:00.000+07:00): Doc lai research, design.md §1-§13, docs/OVERHAUL_DECISIONS.md; 6 AC do check nay phu deu co bang chung khop decision register. _(1 earlier rerun not shown; see task.json for full history)_
- `check-roadmap` — pass (2026-09-28T21:16:00.000+07:00): harnix roadmap tra 18 member, nextTask dung, moi member o planning. _(1 earlier rerun not shown; see task.json for full history)_
