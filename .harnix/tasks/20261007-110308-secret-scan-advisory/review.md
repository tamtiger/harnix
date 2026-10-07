# Cảnh báo dấu hiệu secret trong file thuộc phạm vi task khi finish

- **ID:** 20261007-110308-secret-scan-advisory
- **Mode:** full
- **Epic:** 20261006-202542-harnix-self-improvement
- **Status:** completed/finishing
- **Created:** 2026-10-07 11:03:08 +07:00
- **Updated:** 2026-10-07 14:52:39 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Harnix nhắc người dùng khi file thuộc phạm vi task (relevantPaths và input của check) chứa dấu hiệu secret như mật khẩu, connection string hay private key, mà không in giá trị và không dùng Git.

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): --finish --brief trả secretAdvisory { files, paths } (tối đa 5 đường dẫn tương đối và tên luật) khi file khớp relevantPaths hoặc input của check chứa mẫu secret; chỉ là advisory, không chặn finish.
- `ac-2` (met): Không bao giờ in giá trị hay dòng chứa secret; không đọc file ngoài repo hay qua symlink/junction thoát; giới hạn số file và kích thước mỗi file; bỏ qua file nhị phân.
- `ac-3` (met): Không gọi Git và không dùng mạng; tái dùng bộ mẫu secret hiện có của Harnix nếu phù hợp; có test với file giả chứa secret và file sạch.

## Required checks

- `check-1` (full): Toàn bộ test, lint và typecheck của dự án phải xanh — pass (2026-10-07 14:52:11 +07:00)
- `check-secret` (focused): Test quét secret: luật, placeholder, giới hạn, symlink, không lộ giá trị, finish và --finish --brief — pass (2026-10-07 14:50:58 +07:00)
- `check-gates` (focused): Contract tests (schema, golden, docs, instruction budget) xanh sau khi thêm secretAdvisory vào --finish — pass (2026-10-07 14:51:02 +07:00)

## Decisions

- **d-own-patterns** — Bộ mẫu secret của bước quét nằm trong src/core/workflow/secret-scan.ts, mô phỏng CREDENTIAL của learning-safety và structuredSecretPatterns của scripts/scan-secrets.mjs, không import hai nơi đó.
  - _Why:_ scripts/*.mjs nằm ngoài src và không được đóng gói vào runtime; learning-safety.ts có regex riêng tư và mục đích khác (câu mô tả ngắn). Trùng lặp mẫu là chi phí chấp nhận, ghi rõ để lần sau gom về một module chung.
- **d-scope-no-git** — Phạm vi quét là file khớp relevantPaths và input của mọi check của task (glob qua globby, không theo symlink); không dùng Git nên file chưa commit nằm ngoài phạm vi vẫn không được quét.
  - _Why:_ Ranh giới sản phẩm cấm tích hợp Git tự động; góp ý gốc (appsettings.CI.json) chỉ được cảnh báo nếu nằm trong relevantPaths hoặc input.
- **d-brief-only** — secretAdvisory chỉ có trong --finish --brief; --finish không brief giữ nguyên hình dạng (chỉ trả task).
  - _Why:_ Đổi hình dạng output không brief là đổi hợp đồng; quy tắc của dự án đã yêu cầu agent dùng --brief cho mọi lệnh ghi.

## Evidence

- `check-secret` — pass (2026-10-07 14:50:58 +07:00): pnpm exec vitest run test/unit/core/workflow/secret-scan.test.ts test/unit/core/workflow/finish.test.ts test/integration/commands/workflow-handlers.test.ts — exit 0
- `check-gates` — pass (2026-10-07 14:51:02 +07:00): pnpm test:gates — exit 0
- `check-1` — pass (2026-10-07 14:52:11 +07:00): pnpm test — exit 0
