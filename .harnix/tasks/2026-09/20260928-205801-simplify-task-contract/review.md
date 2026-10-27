# [03] Đơn giản hóa hợp đồng task và evidence

- **ID:** 20260928-205801-simplify-task-contract
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-28T20:58:01+07:00
- **Updated:** 2026-09-29T02:44:36.780Z

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Thay TaskRecord v2 + sidecar verification-inputs + contractRevision 5 bước + ready-trace grammar + execution-notes grammar bằng record gọn: checks có criterionIds, evidence có exit code và digest tùy chọn nội tuyến, replan một bước có reason; v1/v2 chỉ đọc qua adapter; Lite không cần prd/plan. Harness không tự chạy lệnh (không thêm process runner). Không tách module code (thuộc restructure-code).

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở release-v2 (quyết định người dùng 2026-09-28).
- Không thêm process runner hay cho harness tự chạy lệnh từ task.json (rủi ro command injection; root cause sự cố pause là check quá hẹp, xử lý ở add-verify-detection).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-docs-sync` (met): PRD/WORKFLOW/IMPLEMENTATION_PLAN, README, skill, template và AGENTS.md phản ánh đúng schema v3 trong cùng task; managed output được sinh lại bằng harnix update.
- `ac-legacy-read` (met): 69 task lịch sử (v1 và v2) vẫn được validateTask chấp nhận và được status, tasks, roadmap đọc bình thường.
- `ac-migrate-unfinished` (met): Task v1/v2 chưa hoàn tất nâng lên v3 bằng một lần save bảo toàn tiêu chí, nghĩa vụ bắt buộc và evidence; mọi save khác lên task cũ bị từ chối kèm hướng dẫn migrate.
- `ac-no-execution-notes` (met): Execution-notes grammar, ready-trace grammar và --audit-ready được gỡ khỏi validator, skill và docs; plan.md cũ có vùng execution-notes vẫn lưu và đọc được như văn bản tự do.
- `ac-no-sidecar` (met): Task mới không tạo verification-inputs.json; một vòng đời mẫu (planning, ready, evidence, finish) ghi tổng cộng ≤ 200 dòng dưới .harnix/tasks/<id>/.
- `ac-replan-one-step` (met): Một lần --save đặt checkpoint replan cùng contractRevision.reason sửa được nghĩa vụ chưa được chứng minh; nghĩa vụ đã có pass vẫn bất biến; sau đó chỉ cần một --save ready/ready, không có bước audit riêng.
- `ac-schema` (met): Schema v3 được đóng băng trong docs và validator; workflow --save chấp nhận task v3 hợp lệ và từ chối task mới ở schema cũ; workflow --schema mô tả đúng v3.

## Required checks

- `check-contract-unit` (focused): Test đơn vị schema v3 và digest nội tuyến pass — pass (2026-09-29T09:44:29.206+07:00)
- `check-docs-sync` (focused): Test đồng bộ docs, skill, template và self-host pass — pass (2026-09-29T09:44:29.673+07:00)
- `check-legacy-read` (focused): Test đọc dữ liệu lịch sử v1/v2 và plan cũ pass — pass (2026-09-29T09:44:30.141+07:00)
- `check-save-flow` (focused): Test luồng save v3, migration, replan một bước và churn mẫu pass — pass (2026-09-29T09:44:30.557+07:00)
- `check-suite` (full): Toàn bộ lint, typecheck và mọi suite test pass — pass (2026-09-29T09:44:31.047+07:00)

## Decisions

- **d-v3-schema** — Đóng băng TaskRecord schema v3: cùng bộ field với v2, check v3 bỏ token @task-contract, evidence pass của check bắt buộc mang inputDigest và exitCode khớp kết quả.
  - _Why:_ Gọn hơn v2 mà vẫn giữ gate dựa trên evidence; hợp đồng task luôn được gộp ngầm vào digest nên không cần khai báo.
- **d-no-sidecar** — Digest được tính lại tại chỗ từ inputs hiện hành và so với evidence.inputDigest; không lưu snapshot ra file.
  - _Why:_ Sidecar sinh ~69K dòng churn trong lịch sử dogfood; đổi lại mất danh sách file thay đổi cụ thể trong chẩn đoán stale, chấp nhận vì chi phí lớn hơn lợi ích.
- **d-one-step-revision** — contractRevision hợp lệ trong cùng lần save đặt checkpoint replan; sau đó một save ready/ready thông thường. Bỏ bước audit riêng và bỏ --audit-ready.
  - _Why:_ Năm bước cũ là bộ máy tự bảo vệ; bất biến của nghĩa vụ đã có pass được giữ nguyên nên an toàn không giảm.
- **d-self-migrate** — Task này bắt đầu ở v2 và tự migrate sang v3 sau khi đường migration xanh; mã v2 chỉ bị gỡ ở lát PURGE.
  - _Why:_ Kiểm chứng migration bằng dữ liệu thật và tránh tự phá đường lưu evidence của chính task.
- **d-migrate-scope** — Migration v1/v2→v3 cho phép ở mọi status chưa hoàn tất, giữ nguyên status/checkpoint; evidence pass cũ trở nên stale vì digest v3 khác payload cũ.
  - _Why:_ Fail-closed: không tin bằng chứng tính theo hợp đồng khác; các task member v2 còn lại migrate khi được kích hoạt.

## Evidence

- pass (2026-09-29T09:29:19.967+07:00): Migrated TaskRecord schema to v3 with explicit authorization.
- `check-contract-unit` — pass (2026-09-29T09:44:29.206+07:00): Check check-contract-unit passed (exit 0):       Tests  23 passed (23) |    Start at  09:43:45 |    Duration  705ms (transform 170ms, setup 0ms, collect 493ms, tes
- `check-docs-sync` — pass (2026-09-29T09:44:29.673+07:00): Check check-docs-sync passed (exit 0):       Tests  21 passed (21) |    Start at  09:43:47 |    Duration  1.46s (transform 811ms, setup 0ms, collect 2.47s, tes
- `check-legacy-read` — pass (2026-09-29T09:44:30.141+07:00): Check check-legacy-read passed (exit 0):       Tests  4 passed (4) |    Start at  09:43:51 |    Duration  2.50s (transform 311ms, setup 0ms, collect 700ms, tests
- `check-save-flow` — pass (2026-09-29T09:44:30.557+07:00): Check check-save-flow passed (exit 0):       Tests  14 passed (14) |    Start at  09:43:55 |    Duration  2.19s (transform 306ms, setup 0ms, collect 716ms, tes
- `check-suite` — pass (2026-09-29T09:44:31.047+07:00): Check check-suite passed (exit 0):       Tests  648 passed | 1 skipped (649) |    Start at  09:44:06 |    Duration  13.81s (transform 4.44s, setup 0ms, col
