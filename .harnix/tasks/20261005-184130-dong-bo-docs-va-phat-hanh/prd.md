# PRD — Đồng bộ tài liệu, skill, test cấu trúc và phát hành 2.0.5

Thuộc epic `20261005-184125-harnix-hardening-2-0-5` (task 6/6, làm cuối). Nguồn: báo cáo review 2.0.4 (R-022, R-029, R-030, R-033, R-035 và các mục P3) cộng với kết quả rà soát tài liệu/skill sau task 1–2 (xem "Kết quả rà soát" bên dưới).

## Mục tiêu

Mọi bề mặt người dùng và agent nhìn thấy (skill, template, README, docs, help CLI, test) mô tả đúng hành vi hiện tại của Harnix sau cả epic, rồi phát hành 2.0.5 với một entry CHANGELOG.

## Kết quả rà soát (đối chiếu với code hiện tại, sau task 1–2)

### A. Skill và reference

| Vị trí | Vấn đề | Việc cần làm |
|---|---|---|
| `src/skills/harnix-implement/SKILL.md:27,37` | `pnpm format`/`pnpm lint` và `pnpm version:sync` là quy ước riêng của repo Harnix, nhưng skill được cài user-global cho mọi repo | Thay bằng "lệnh format/lint từ `verify-plan`/`project-facts`"; chuyển phần release version sang chỉ dẫn chung |
| `src/skills/harnix-plan/SKILL.md:32` | "unit tests must mirror their `src/` modules in `test/unit/`" là luật của repo này | Bỏ khỏi skill (đã có trong `test/README.md`) |
| `src/skills/harnix-plan/SKILL.md:36` | Còn yêu cầu dòng `**Verifies:**`, tàn dư ready-trace grammar đã gỡ | Bỏ |
| `src/skills/harnix-plan/references/replan.md:4` | Mô tả retire check thủ công, không nhắc `--replace-check`, chưa nêu quy tắc bản thay phải khác `command`/`inputs`/`cwd` | Cập nhật |
| `src/skills/harnix-plan/references/ready-review.md` | Chưa nêu suite check phải chạy lệnh test của dự án (task 2) | Thêm một dòng |
| `src/skills/harnix-verify/references/evidence.md:8-9` | `evidence-expired` liệt kê như lý do stale chung (v3 không bao giờ hết hạn); danh sách thư mục bỏ qua thiếu `__pycache__`; chưa mô tả `--run-check` đúng `command`/`cwd`, evidence không được đề ngày tương lai, breaker `stop` | Cập nhật |
| `src/skills/harnix-debug/SKILL.md:34` | Nêu một vòng remediation nhưng chưa trỏ tới breaker thực thi (task 2) | Thêm tham chiếu `--replace-check` |
| Chưa có | Không có hướng dẫn `cwd`/multi-repo ở bất kỳ skill nào | Reference mới `multi-repo` của `harnix-plan` |

### B. Template và cookbook

- `src/templates/harnix/workflow.md` (và bản sinh `.harnix/workflow.md`): cookbook đã đúng với `--run-check` sau task 2, nhưng chưa nhắc reference `multi-repo`. Cập nhật template rồi `harnix update`.
- `activation.ts` (khối luật luôn nạp): đã liệt kê `--replace-check` và các cờ; chưa cần đổi, chỉ kiểm lại ngân sách token (`test/workflow/instruction-budget.test.ts`).

### C. Số platform và bề mặt CLI (6 platform)

- `src/cli-workflow-commands.ts:133` help `--platform` chỉ liệt kê 4 platform.
- `src/cli-program.ts:24` mô tả chương trình chỉ nêu 4 platform.
- `src/core/global/uninstall.ts:250` thông báo lỗi "Only Kiro, Antigravity, Codex, and Claude Code".
- `README.md:172` hàng `setup` và `README.md:184` hàng `uninstall` chỉ có 4 cờ; bảng platform (dòng ~202) đã đủ.
- `test/README.md:11` bảng platform chỉ có 4.
- `docs/HARNIX_PRD.md:124-129,496` và `docs/GLOBAL_SETUP_REFACTOR_PLAN.md:143,177` danh sách cờ thiếu `--opencode`, `--cursor`.
- `docs/UPSTREAM_MAPPING.md:23` ghi "Registry đóng chỉ Kiro, Antigravity và Codex" (lịch sử).
- Đã có `test/unit/docs/supported-platforms.test.ts`: mở rộng để giữ các danh sách trên không lệch nữa.

### D. Quy tắc và số liệu lệch giữa các tài liệu

- `docs/HARNIX_PRD.md:402`, `docs/HARNIX_WORKFLOW.md:12` và `:290` còn ghi "không xin approval lần hai" cho yêu cầu triển khai rõ ràng, mâu thuẫn `docs/HARNIX_WORKFLOW.md:136` (Full task và Epic luôn dừng ở `ready`/`await`). PRD có ưu tiên cao hơn nên phải sửa PRD trước.
- Help `status --summary` ghi "under 100 tokens" (`src/cli-workflow-commands.ts:67`), tài liệu ghi 80.
- `workflow --schema` `transports` thiếu `--init`, `--preflight`, `--snapshot`, `--inspect`.
- `test/README.md:32-33` ghi sàn coverage 93.1/98.1/86.8; hiện hành là 95/98.6/89 (task 1–2).
- `docs/prompts/*`: `comprehensive-review-refactor.md` (đường dẫn máy `C:\FPT\...`, "Chỉ 4 platforms"), `review-instruction-layer-sufficiency.md` ("9 điều luật", "4 platform"), `harnix-overhaul-audit.md` (nhắc `roadmap`, `--audit-ready`). Cập nhật hoặc đánh dấu đầu file là tài liệu lịch sử.

### E. Test và cấu hình

- `test/workflow/behavior-snapshot.test.ts:229`: `HARNIX_UPDATE_GOLDEN=1` ghi đè golden rồi pass xanh; phải thất bại khi chạy trong CI.
- `test/unit/test-structure.test.ts:170`: sàn `{assertions: 2338, tests: 628}` quá thấp so với hiện tại (nâng lên mức hiện tại).
- `src/index.ts` trong `UNTESTED_MODULES` ghi lý do sai (file xuất `packageName`/`packageVersion`).
- `eslint.config.mjs:11,16,61`: comment `release-v2 ... must remove this block` lỗi thời.

### F. `workflow --init` (R-029)

Lệnh/input mặc định cứng `pnpm test` và `src/**`, `--mode` sai thì thành `lite`, slug có thể kết thúc bằng `-` làm id sai regex, fallback ngày cứng `20261005-000000` nằm ngoài `src/utils/clock.ts`, `--input` không tách theo dấu phẩy.

### G. Phát hành

- `CHANGELOG.md:11` nêu tên repo khách hàng `frt-payment-*`.
- `pnpm version:sync 2.0.5 --summary ...` đúng một lần với một entry gộp cả epic.

## Không thuộc phạm vi

- Không thêm tính năng sản phẩm mới. Nội dung hướng dẫn mới chỉ mô tả hành vi đã có.
- Không đổi hành vi runtime ngoài `--init` (F) và việc `HARNIX_UPDATE_GOLDEN` thất bại trong CI.
- Không commit/publish khi chưa được duyệt.

## Phụ thuộc

Task này làm **cuối**: nội dung hướng dẫn phụ thuộc hành vi cuối của task 3–5 (config global, state machine, bảo mật). Khi các task đó xong, rà lại danh sách trên và bổ sung mục mới phát sinh trước khi `ready`.

## Tiêu chí chấp nhận

Xem `task.json` (ac-1 đến ac-9). Ánh xạ: ac-1 test kiến trúc; ac-2 `--init`; ac-3 skill/reference; ac-4 số platform; ac-5 quy tắc và số liệu; ac-6 CHANGELOG và version; ac-7 cổng chất lượng; ac-8 hướng dẫn multi-repo và quy tắc check; ac-9 vệ sinh test.

## Rủi ro

- Sửa skill làm đổi token: `instruction-budget` và `catalog` test là hàng rào.
- Template `workflow.md` đổi phải đồng bộ `.harnix/workflow.md` (`harnix update`) và hash, nếu không `self-host` test đỏ.
- Sinh lại golden chỉ khi `workflow --schema` đổi có chủ ý (đã xảy ra ở task 2); xem diff trước khi giữ.
