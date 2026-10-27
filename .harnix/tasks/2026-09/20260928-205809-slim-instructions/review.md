# [11] Tinh gọn lớp chỉ dẫn, gộp skill và sửa C4–C8

- **ID:** 20260928-205809-slim-instructions
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:09 +07:00
- **Updated:** 2026-09-30 16:41:12 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Gộp 7 skill thành 6 (harnix-plan, harnix-implement, harnix-verify, harnix-review, harnix-research, harnix-debug) và đưa nội dung dài vào reference nạp theo yêu cầu; viết lại AGENTS.md root, .harnix/workflow.md, marker block các nền tảng theo bộ 8 rule trong design.md; guard một chỗ; chế độ không hook; test ngân sách token; sửa C4–C8; bảo đảm mọi status/checkpoint hợp lệ có đúng một skill chủ sở hữu.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-skills` (met): Catalog có đúng 6 skill (harnix-plan, harnix-implement, harnix-verify, harnix-review, harnix-research, harnix-debug), mỗi skill ≤ 2K tok; phần nội dung dài đưa vào reference nạp theo yêu cầu qua `harnix skill <tên> --reference <chủ đề>`; tên cũ được alias hoặc migrate khi update --global.
- `ac-budget` (met): Test đo: chỉ dẫn luôn nạp ≤ 1.5K tok, đường direct ≤ 4K, Full ≤ 15K.
- `ac-hookless` (met): Skill hoạt động đúng khi không có hook bằng cách tự gọi preflight.
- `ac-coverage-matrix` (met): Test liệt kê toàn bộ status/checkpoint hợp lệ (planning, replan, ready, in_progress/implementing, verifying/verifying, verifying/finishing, mọi blocked/*, cancelled, completed) và xác nhận mỗi trạng thái có đúng một skill chủ sở hữu.
- `ac-contradictions-c4-c8` (met): C4–C8 trong research/inventory.md của task audit không còn trong chỉ dẫn mới.
- `ac-template-exemptions` (met): src/templates/** được gỡ khỏi danh sách miễn trừ max-lines sau khi viết lại.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.
- `ac-references` (met): Mỗi reference (replan, migration, epic, ready-review cho plan; evidence, finish-cancel cho verify; feedback cho implement) là nội dung Markdown ≤ 2K tok nạp bằng `harnix skill <tên> --reference <chủ đề>`; chủ đề không tồn tại trả lỗi kèm danh sách chủ đề hợp lệ; `harnix skill` không tham số liệt kê reference của từng skill.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — pass (2026-09-30 16:40:40 +07:00)
- `chk-instructions-focused` (focused): Test tập trung cho skill, template, định tuyến nextStage, ngân sách token và bề mặt nền tảng — pass (2026-09-30 16:39:26 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **d-budget-definitions** — Ngân sách đo bằng ký tự/4: bề mặt luôn nạp ≤ 1.500, skill ≤ 2.000, đường Bypass = luôn nạp + harnix-implement ≤ 4.000, task Full = luôn nạp + workflow.md + plan + implement + verify ≤ 15.000.
  - _Why:_ Design chỉ nêu số; định nghĩa đường đo phải cụ thể để test tự động được và khớp context.tokenApproximation trong config
- **d-nextstage-owner** — nextStage của preflight trả thẳng owner plan|implement|verify|debug|await|stop; continue và finish biến mất; blocked trả owner của resumeStatus.
  - _Why:_ Design §1 bỏ tầng continue: preflight đã biết trạng thái nên trả đúng owner, giảm một skill và một lần đọc
- **d-legacy-skill-aliases** — Tên skill cũ được alias sang skill mới trong harnix skill (resolvedFrom) và update --global xoá bản cài cũ do Harnix sở hữu.
  - _Why:_ Agent đã cài bản cũ không được vỡ đột ngột; nội dung người dùng đã sửa vẫn được giữ theo luật managed
- **d-research-own-skill** — Research độc lập chỉ đọc là skill riêng `harnix-research`, tách khỏi `harnix-review`; tổng là 6 skill thay vì 5.
  - _Why:_ Review đánh giá diff/code đã có và trả findings kèm verdict, research điều tra một unknown và trả kết luận có nguồn; hai giao thức khác nhau. Design §1 không có dòng cho research độc lập nên đây là quyết định của người dùng ngày 2026-09-30, sửa câu gộp 7 thành 5.
- **d-skill-references** — Nội dung dài (replan, migration, epic, ready self-review, finish/cancel, convergence) chuyển vào reference nạp theo yêu cầu bằng `harnix skill <tên> --reference <chủ đề>`, không cài thành file riêng.
  - _Why:_ Giữ mỗi skill ≤ 2K token mà không mất quy tắc; agent chỉ nạp reference khi checkpoint hoặc tình huống cần, và không phải đổi manifest cài đặt của 4 nền tảng.
- **d-references-cli-only** — Reference của skill chỉ được phục vụ bằng lệnh harnix skill <tên> --reference <chủ đề>, không cài thành file cạnh SKILL.md.
  - _Why:_ Research 2026-09-30: Kiro (issue 6955) và Antigravity không đưa đường dẫn thư mục skill cho model nên link tương đối tới references/ hỏng với skill global; lệnh chạy giống nhau trên cả bốn nền tảng và luôn khớp catalog
- **skills-six-with-cli-references** — Sáu skill (plan, implement, verify, review, research, debug); chi tiết ít dùng nằm ở reference nạp qua harnix skill <name> --reference <topic>, không cài thêm file vì Kiro và Antigravity không lộ đường dẫn thư mục skill.
  - _Why:_ Giữ đủ năng lực workflow mà mỗi skill vẫn dưới 2000 token; CLI luôn có sẵn trên mọi nền tảng.

## Residual risks

- **old-skill-names** (low) — Agent đã cache tên skill cũ (brainstorm, check, continue, finish-work) chỉ chạy được nhờ alias legacySkillAliases; người dùng cần chạy harnix update --global để gỡ bốn skill cũ.

## Evidence

- pass (2026-09-30 15:47:02 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-09-30 15:48:59 +07:00): Task contract revised at persisted replan: Bổ sung check tập trung cho từng tiêu chí trước khi ready theo quy tắc áp cho member task
- skipped (2026-09-30 15:49:12 +07:00): Task contract revised at persisted replan: Thêm eslint.config.mjs vào inputs vì ac-template-exemptions đọc file này
- skipped (2026-09-30 15:56:05 +07:00): Task contract revised at persisted replan: Tách harnix-research thành skill riêng (6 skill) và thêm reference nạp theo yêu cầu theo quyết định người dùng 2026-09-30
- skipped (2026-09-30 15:56:07 +07:00): Task contract revised at persisted replan: Thêm tiêu chí cho reference nạp theo yêu cầu của thiết kế 6 skill
- skipped (2026-09-30 15:56:41 +07:00): Task contract revised at persisted replan: Sửa lại văn bản tiêu chí ac-references bị shell thay mất đoạn lệnh khi thêm bằng flag
- `chk-instructions-focused` — pass (2026-09-30 16:39:26 +07:00): C:\Program Files\Git\usr\bin\bash.exe — exit 0
- `check-suite` — pass (2026-09-30 16:40:40 +07:00): C:\Program Files\Git\usr\bin\bash.exe — exit 0
