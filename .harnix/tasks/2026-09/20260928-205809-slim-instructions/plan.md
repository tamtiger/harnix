# Plan — Tinh gọn lớp chỉ dẫn

## Checklist

- [x] S1 — Owner map và `nextStage` mới: `routing.ts`, `preflight.ts`, ma trận phủ trạng thái (test RED trước).
- [x] S2 — Catalog 6 skill, reference nạp theo yêu cầu (`harnix skill <tên> --reference <chủ đề>`) và bí danh tên cũ: `catalog.ts`, `src/commands/skills.ts`, thư mục skill mới, gỡ 4 thư mục cũ.
- [x] S3 — Viết `harnix-plan` (kèm reference replan, migration, epic, ready-review), `harnix-review` và `harnix-research` (≤ 2K token mỗi skill).
- [x] S4 — Viết `harnix-implement` (reference feedback), `harnix-verify` (reference evidence, finish-cancel) và `harnix-debug` (≤ 2K token mỗi skill).
- [x] S5 — Viết lại `workflow.md` (bảng route, một danh sách Bypass, cookbook rút gọn) và bề mặt luôn nạp: activation, steering, khối Claude/Codex, bootstrap `AGENTS.md` ≤ 1,5K token.
- [x] S6 — Migrate bản cài cũ khi `update --global`, cập nhật mọi test và fixture nhắc tên skill cũ.
- [x] S7 — Cập nhật PRD, WORKFLOW, IMPLEMENTATION_PLAN, README, `AGENTS.md`; `harnix update`; `pnpm format`.

## Cách làm và cách kiểm

Mỗi slice RED rồi GREEN tối thiểu. Ngân sách đo bằng `test/workflow/instruction-budget.test.ts` (đã có ở trạng thái RED). Nội dung skill viết ngắn, mệnh lệnh, không lặp guard; chỉ giữ quy tắc có test hoặc có bằng chứng lỗi thực tế.

- S1: `routing.test.ts` và test preflight kiểm ánh xạ trạng thái → owner; `coverage-matrix.test.ts` liệt kê toàn bộ status/checkpoint hợp lệ từ `legalCheckpoints` và xác nhận đúng một owner.
- S2/S6: `skill-sources.test.ts`, `skills.test.ts` (bí danh + `resolvedFrom`), test lifecycle global với home dùng một lần: cài bản cũ (fixture 7 skill) rồi `update --global` phải để lại đúng 5 skill mới.
- S3/S4: mỗi skill có test cụm bắt buộc (preflight ở bước đầu, không lặp guard, trỏ tới danh sách Bypass duy nhất).
- S5: `instruction-budget.test.ts` xanh; `templates.test.ts` và `activation-instructions.test.ts` cập nhật.
- S7: `docs-task-contract.test.ts` và rà tay các mục nhắc tên skill cũ.

## Bảo toàn

Không bump version (epic). Không đụng home thật. Giữ nội dung cookbook/flag transport đã có nhưng rút gọn. Không commit.
