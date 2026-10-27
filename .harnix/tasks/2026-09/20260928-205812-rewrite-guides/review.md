# [14] Viết lại guides theo dạng lệnh + ràng buộc, bổ sung spec/project-facts

- **ID:** 20260928-205812-rewrite-guides
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28 20:58:12 +07:00
- **Updated:** 2026-10-01 20:46:05 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Viết lại common và các guide ngôn ngữ/công nghệ còn giữ theo format ngắn (≤ 600 tok): lệnh verify chuẩn, ràng buộc bắt lỗi thật, lỗi thường gặp; sửa nội dung lỗi thời (Next.js, Django, Go); gỡ guide không đem lại khác biệt. KHÔNG chuyển guide thành SKILL.md — guides là bản dịch đúng của ECC rules/ (docs/UPSTREAM_MAPPING.md §7). Bổ sung .harnix/spec/project-facts.md (derived, sinh lại khi init/update) chứa stack đã xác nhận và lệnh verify theo package từ add-verify-detection.

## Non-goals

- Không commit, push hay tạo PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không chuyển guide thành SKILL.md: guide là bản dịch của ECC rules/ (docs/UPSTREAM_MAPPING.md mục 7).
- Không đổi cơ chế chọn guide (catalog, extends, activation) và không đổi schema TaskRecord v3.
- Mỗi task thành viên epic tăng phiên bản 2.0.0-dev.x một lần bằng pnpm version:sync (quyết định người dùng 2026-10-01 thay cho quy tắc cũ; 2.0.0 chỉ bump ở release-v2).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-format` (met): Mọi guide ≤ 600 tok và có mục lệnh verify.
- `ac-stale` (met): Các nội dung lỗi thời đã nêu (Next.js, Django, Go) được sửa.
- `ac-project-facts` (met): .harnix/spec/project-facts.md được sinh tại init/update, chứa stack đã xác nhận và lệnh verify theo package; là derived, không phải user-owned.
- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN (và README/skill liên quan) được cập nhật trong cùng task cho mọi contract mà task này đổi; không dồn sang release-v2.
- `ac-token-measured` (met): pnpm run measure:tokens in thêm khối guides { files, totalTokens, maxTokens, commonPlusLanguage } tính ceil(ký tự/4) trên src/guides; sau khi viết lại totalTokens không quá 20.400 (giảm ít nhất 50% so với baseline 41.676 token của 34 file) và maxTokens không quá 600; số trước và sau được ghi bằng decision.

## Required checks

- `check-suite` (focused): Toàn bộ lint, typecheck và mọi suite test pass (bản nháp, bổ sung check tập trung khi planning) — pass (2026-10-01 20:45:45 +07:00)
- `chk-guide-format` (focused): Test định dạng guide (<=600 token, mục Verify/Constraints/Common mistakes), nội dung lỗi thời đã sửa và tài liệu đồng bộ — pass (2026-10-01 20:43:27 +07:00)
- `chk-project-facts` (focused): Test project-facts.md: render, ghi derived lúc init/update, idempotent, bootstrap nhắc tới file — pass (2026-10-01 20:44:38 +07:00)
- `chk-guide-tokens` (focused): Test hàm đo guide của measure:tokens — pass (2026-10-01 20:43:36 +07:00)
- `chk-measure` (focused): Đo lại token của guide trên bản build (chạy pnpm build trước) — pass (2026-10-01 20:43:51 +07:00)

## Decisions

- **d-draft-checks** — check-suite là bản nháp; trong planning của chính task phải bổ sung check tập trung cho từng AC (lệnh, inputs, criterionIds) trước khi ready.
  - _Why:_ Review trước implement: một check chung pnpm lint/typecheck/test không chứng minh được các AC định lượng (token, churn, số hệ sinh thái).
- **d-stale-verified** — Đã kiểm chứng giả thuyết lỗi thời bằng nguồn chính thức (2026-10-01): Next.js đổi file convention middleware thành proxy từ v16.0.0, hàm export tên proxy, chạy mặc định Node.js (nextjs.org/docs proxy, v16.3.8); INP là metric kế nhiệm FID (web.dev/articles/inp); bleach ngừng bảo trì từ 2026-06-05, không còn bản phát hành kể cả bản vá bảo mật (pypi.org/project/bleach), nh3 là binding Ammonia còn phát hành (0.3.7, 2026-08-23); gosimple và stylecheck đã gộp vào staticcheck từ golangci-lint v2 (golangci-lint.run migration guide); hướng dẫn layout module Go chính thức dùng internal/ và cmd/ và không nhắc pkg/ (go.dev/doc/modules/layout).
  - _Why:_ Audit chỉ ghi các mục này là giả thuyết; sửa guide dựa trên nguồn chính thức thay vì trí nhớ.
- **d-guide-format** — Mọi guide có đúng ba mục sau tiêu đề H1: "## Verify" (lệnh chuẩn trong khối ```text, chỉ lệnh của công cụ chính thức), "## Constraints" (tối đa 10 gạch đầu dòng, mỗi dòng một ràng buộc kiểm chứng được và bắt lỗi thật) và "## Common mistakes" (tối đa 6 dòng); tổng không quá 600 token theo ceil(ký tự/4); không có đoạn giới thiệu hay giải thích dài.
  - _Why:_ Audit: guide hiện toàn bullet 4 mục x 5 nhưng gần như không có lệnh chạy cụ thể (0-4 dòng); định dạng lệnh + ràng buộc vừa giảm token đọc vừa hữu dụng hơn.
- **d-no-guide-removed** — Không gỡ guide nào: database/relational.md là guide cơ sở mà postgresql, mysql, sqlserver mở rộng (extends) nên gỡ sẽ mất nội dung chung; mọi guide còn lại gắn với một ngôn ngữ hoặc công nghệ được catalog phát hiện, và chỉ guide khớp stack mới được cài. Tiết kiệm đến từ việc co từng file về 600 token.
  - _Why:_ Mục tiêu gốc cho phép gỡ guide không đem lại khác biệt, nhưng kiểm tra descriptor cho thấy không guide nào dư.
- **d-project-facts-derived** — project-facts.md do updateProject ghi (init gọi updateProject nên cùng đường): nội dung tất định từ config (ngôn ngữ, công nghệ, package đã xác nhận) cộng buildVerifyPlan (lệnh verify theo package), không có timestamp hay version để không churn; luôn ghi đè nếu khác, bỏ qua khi giống, không nằm trong manifest .template-hashes.json (derived, không phải user-owned); tối đa 20 package rồi ghi "và N package khác"; bootstrap AGENTS.md nhắc tới file nhưng hook context không nhúng nó.
  - _Why:_ Hook chạy mỗi prompt nên không nhúng thêm nội dung; agent đọc file khi cần stack và lệnh verify mà không chạy lại detection.
- **d-measured-after** — Đo lại bằng pnpm run measure:tokens sau thay đổi (trước → sau, ceil(ký tự/4)): 34 guide tổng 41.676 → 11.607 token (-72%), lớn nhất 1.631 → 539, cả 34 file đạt <=600 (trước đó 34/34 vượt); một lần đọc common + typescript 2.891 → 666 (-77%), thêm nextjs 4.062 → 1.066. Chi phí tăng: bootstrap AGENTS.md 1.242 → 1.273 (+31, câu nhắc project-facts.md); phần còn lại không đổi (hook fixture 130, preflight, lệnh ghi --brief 337). Trên repo này hook context mỗi prompt còn 625 token (11 con trỏ + ghi chú learning).
  - _Why:_ Mức giảm nằm ở token mỗi lần agent đọc guide; chi phí tăng là một câu trong bootstrap.

## Residual risks

- **r-managed-hash-mismatch** (low) — update coi .harnix/spec/guides/languages/typescript.md của chính repo là bị sửa tay (hash thô trong manifest không khớp bản template cũ lẫn bản CRLF của checkout autocrlf) nên giữ bản cũ; chưa tìm ra nguyên nhân gốc. Đã đặt đúng nội dung template mới rồi update; cần điều tra riêng nếu người dùng Windows thấy guide không được làm mới.
- **r-relevantpaths-pointers** (low) — Mỗi mục relevantPaths dài tạo một con trỏ ~25 token lặp ở mọi prompt (11 mục = ~275 token trên repo này), và hook cũng chạy ở mỗi thông báo hệ thống của agent nền (6 lần trong lượt chạy song song = ~4k token); nên giữ relevantPaths ngắn và bỏ tài liệu lớn khỏi danh sách khi không cần.

## Evidence

- pass (2026-10-01 20:32:20 +07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- skipped (2026-10-01 20:33:27 +07:00): Task contract revised at persisted replan: Task migrate từ schema v2 cũ, chưa có evidence nào: thay check nháp bằng các check tập trung cho từng tiêu chí và thêm tiêu chí đo token để hợp đồng đủ trước khi ready.
- skipped (2026-10-01 20:33:27 +07:00): Task contract revised at persisted replan: Task migrate từ schema v2 cũ, chưa có evidence nào: thay check nháp bằng các check tập trung cho từng tiêu chí và thêm tiêu chí đo token để hợp đồng đủ trước khi ready.
- skipped (2026-10-01 20:33:37 +07:00): Task contract revised at persisted replan: Task migrate từ schema v2 cũ, chưa có evidence nào: thay check nháp bằng các check tập trung cho từng tiêu chí và thêm tiêu chí đo token để hợp đồng đủ trước khi ready.
- skipped (2026-10-01 20:33:37 +07:00): Task contract revised at persisted replan: Task migrate từ schema v2 cũ, chưa có evidence nào: thay check nháp bằng các check tập trung cho từng tiêu chí và thêm tiêu chí đo token để hợp đồng đủ trước khi ready.
- skipped (2026-10-01 20:33:38 +07:00): Task contract revised at persisted replan: Task migrate từ schema v2 cũ, chưa có evidence nào: thay check nháp bằng các check tập trung cho từng tiêu chí và thêm tiêu chí đo token để hợp đồng đủ trước khi ready.
- `chk-guide-format` — pass (2026-10-01 20:43:27 +07:00): pnpm — exit 0
- `chk-project-facts` — pass (2026-10-01 20:44:38 +07:00): pnpm — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
- `chk-guide-tokens` — pass (2026-10-01 20:43:36 +07:00): pnpm — exit 0
- `chk-measure` — pass (2026-10-01 20:43:51 +07:00): pnpm — exit 0
- `check-suite` — pass (2026-10-01 20:45:45 +07:00): pwsh.exe — exit 0 _(1 earlier rerun not shown; see task.json for full history)_
