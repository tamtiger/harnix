# PRD — Tinh gọn lớp chỉ dẫn, gộp 7 skill thành 6, thêm reference và sửa C4–C8

## Vấn đề

Lớp chỉ dẫn hiện quá nặng và lặp: 7 skill dài 2,1–4,8K token mỗi skill (tổng khoảng 22K token), phần activation guard lặp trong từng skill, `.harnix/workflow.md` khoảng 9K token, bootstrap `AGENTS.md` sinh ra khoảng 2K token. Nhiều chỗ mâu thuẫn hoặc thừa (C4–C8 trong `research/inventory.md` của task audit). Agent phải nạp nhiều văn bản trước khi làm việc nhỏ, và `harnix-continue` chỉ là một tầng gián tiếp thêm vào.

## Phạm vi

- Trong phạm vi: catalog skill (`src/skills/**`), `src/templates/harnix/**` (activation, workflow.md, bootstrap AGENTS.md, steering), khối marker và steering của 4 nền tảng (`src/configurators/**`), định tuyến `nextStage`/stage owner (`src/core/workflow/routing.ts`, `preflight.ts`), bí danh tên skill cũ, migrate bản cài cũ khi `update --global`, test ngân sách token và ma trận phủ trạng thái, cập nhật PRD/WORKFLOW/IMPLEMENTATION_PLAN/README/AGENTS.md.
- Ngoài phạm vi: đổi contract TaskRecord, thêm nền tảng, đổi hành vi CLI ngoài tên `nextStage` và bí danh skill, bump version (chỉ `release-v2`), viết lại guides (`rewrite-guides`).

## Hợp đồng chính xác

**Sáu skill** (mỗi skill ≤ 2.000 token, ước lượng ký tự/4): `harnix-plan`, `harnix-implement`, `harnix-verify`, `harnix-review`, `harnix-research`, `harnix-debug`. Quyết định người dùng 2026-09-30: research độc lập là skill riêng vì khác giao thức với review (design §1 không có dòng cho nó).

| Trách nhiệm | Skill |
| --- | --- |
| Phân loại yêu cầu (Bypass/Lite/Full, danh sách Bypass duy nhất), planning, ready gate, replan và `contractRevision`, `--migrate`, epic, research một unknown khi plan | `harnix-plan` |
| TDD theo slice, đường Bypass sửa trực tiếp, xử lý phản hồi kỹ thuật, chuẩn bị release, nhắc duyệt trước commit | `harnix-implement` |
| Verify hai giai đoạn, `--run-check`/evidence, `--criterion --met`, finish và cancel, ghi note learning, nhắc duyệt trước commit | `harnix-verify` |
| Review độc lập chỉ đọc (không đụng task): findings kèm mức độ, verdict | `harnix-review` |
| Research độc lập chỉ đọc: điều tra một unknown, kết luận kèm nguồn và mức tin cậy | `harnix-research` |
| Checkpoint debugging, giả thuyết, research một unknown khi debug | `harnix-debug` |

`harnix-continue`, `harnix-brainstorm`, `harnix-check`, `harnix-finish-work` không còn là skill (`harnix-research` được giữ). `harnix skill <tên cũ>` trả skill thay thế kèm trường `resolvedFrom`: brainstorm→plan, check→verify, finish-work→verify, continue→plan (kèm ghi chú dùng `workflow --preflight`). `update --global` xoá bản cài tên cũ nguyên vẹn (do Harnix sở hữu) và cài 6 skill mới; nội dung người dùng đã sửa được giữ.

**Reference nạp theo yêu cầu:** nội dung dài chuyển khỏi skill thành reference Markdown ≤ 2.000 token, nạp bằng `harnix skill <tên> --reference <chủ đề>` (không cài thành file riêng): `harnix-plan` có `replan`, `migration`, `epic`, `ready-review`; `harnix-verify` có `evidence`, `finish-cancel`; `harnix-implement` có `feedback`. Chủ đề lạ trả lỗi kèm danh sách hợp lệ; `harnix skill` không tham số liệt kê reference của từng skill. Skill nói rõ khi nào nạp reference nào.

**`nextStage`** của `workflow --preflight` trả thẳng owner: `plan | implement | verify | debug | await | stop`. Ánh xạ trạng thái: `planning|replan` → `plan`; `ready` → `await` cho tới khi yêu cầu hiện tại cấp quyền, sau đó `implement`; `in_progress/implementing` → `implement`; `in_progress/debugging` → `debug`; `verifying/verifying|finishing`, `completed`, `cancelled/cancelling` → `verify`; `verifying/replan` → `plan`; `blocked` → owner của `resumeStatus`; ngữ cảnh `stale` → `plan`; đạt giới hạn thử lại → `stop`; không có task → `plan`. Test ma trận liệt kê mọi status/checkpoint hợp lệ và xác nhận đúng một skill chủ sở hữu.

**Ngân sách token** (test tự động, ước lượng ký tự/4): mỗi bề mặt luôn nạp (steering Kiro/Antigravity, khối Claude, khối Codex, bootstrap `AGENTS.md`) ≤ 1.500; mỗi skill ≤ 2.000; đường Bypass = bề mặt luôn nạp + `harnix-implement` ≤ 4.000; task Full = bề mặt luôn nạp + `workflow.md` + `harnix-plan` + `harnix-implement` + `harnix-verify` ≤ 15.000.

**Một chỗ cho mỗi rule:** guard chọn target nằm ở bề mặt luôn nạp và không lặp trong skill; danh sách Bypass nằm ở `harnix-plan`; các skill khác trỏ tới. Skill hoạt động khi không có hook: bước đầu mỗi skill task là `harnix workflow --preflight`. Nội dung persistence/cookbook/flag transport hiện có được giữ nhưng rút gọn để vừa ngân sách.

**Sửa C4–C8:** C4 evidence chỉ một transport (`--evidence`/`--run-check`, `--save` chỉ khi đổi artifact hoặc nghĩa vụ); C5 checklist 100% chỉ áp cho Full (Lite không có `plan.md`); C6 review/research độc lập không đọc `workflow.md`; C7 không còn đọc `.active` trước preflight (không còn skill continue); C8 một danh sách Bypass duy nhất.

## Tiêu chí chấp nhận

Xem `task.json`. Bằng chứng: `chk-instructions-focused` (test/workflow, test/unit, test/platform, skills) và `check-suite` (lint, typecheck, toàn bộ test).

- ac-skills — **Verifies:** skill-sources.test.ts, skills.test.ts, global-lifecycle (migrate bản cài cũ).
- ac-references — **Verifies:** skills.test.ts và test catalog (reference tồn tại, ≤ 2K token, lỗi chủ đề lạ).
- ac-budget — **Verifies:** instruction-budget.test.ts.
- ac-hookless — **Verifies:** test kiểm mỗi skill task mở đầu bằng `workflow --preflight`.
- ac-coverage-matrix — **Verifies:** routing.test.ts, preflight tests.
- ac-contradictions-c4-c8 — **Verifies:** persistence-guidance/templates tests kiểm từng mâu thuẫn không còn.
- ac-template-exemptions — **Verifies:** test đọc `eslint.config.mjs` và xác nhận `src/templates/**` không nằm trong danh sách miễn trừ.
- ac-docs-sync — **Verifies:** docs-task-contract.test.ts và review diff tài liệu.

## Rủi ro

- Rút gọn quá tay làm mất quy tắc đang được test hoặc đang bảo vệ hành vi: giữ các cụm bắt buộc của `skill-sources`/`activation-instructions`, cập nhật test có chủ đích khi tên skill đổi.
- Đổi tên `nextStage` là breaking cho hook/agent cũ: bí danh tên skill và ghi rõ trong CHANGELOG của `release-v2`.
- Bản cài cũ ở home người dùng: chỉ kiểm bằng home dùng một lần trong test; người dùng tự chạy `harnix update --global`.
