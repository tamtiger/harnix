# PRD — Viết lại hướng dẫn skill và template cho agent

## Vấn đề

Skill và steering chỉ nói "never edit `task.json` directly": không cấm file tạm `.ps1`/`.sh`/`.json`, không có câu "thiếu lệnh thì dừng và báo", không có ví dụ PowerShell/bash (redirect `<` không chạy trong PowerShell), không nhắc giới hạn stdin 64 KiB, `harnix-check` vừa bảo append evidence qua `--save` vừa bảo dùng `--evidence`, quy tắc `clock` chỉ có ở vài skill, và không skill nào nói cái gì làm đổi `inputDigest` hay cách phục hồi sau replan. Kiro chỉ có steering (guard) và skill nên agent Kiro tự chế script.

## Phạm vi

- Trong phạm vi: `src/templates/harnix/activation.ts` (mọi nền tảng dùng chung), `src/templates/harnix/workflow.ts` (`.harnix/workflow.md` — thêm Command cookbook), 6 skill (`harnix-brainstorm`, `-implement`, `-check`, `-continue`, `-debug`, `-finish-work`), test bảo vệ nội dung và test đối chiếu flag với CLI.
- Ngoài phạm vi: đổi hành vi CLI, thêm skill/nền tảng, sửa lịch sử task, cập nhật `~/.kiro` hay `~/.claude` thật (người dùng chạy `harnix update --global` sau).

## Nội dung chính xác

- Ba mệnh đề mới ở cuối `HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS` (tự lan sang steering Kiro/Antigravity, khối Claude/Codex và `AGENTS.md`): (1) chỉ đổi state qua `harnix workflow ...`, cấm file tạm và regex/`sed`/`Set-Content` lên `task.json`/`review.md`/`.active`, thiếu lệnh hoặc lỗi lặp thì dừng và báo lệnh + lỗi; (2) truyền JSON bằng pipe stdin (PowerShell `$json | harnix workflow --save`, bash `printf`), không dùng `<`, dưới 64 KiB, ưu tiên transport dạng flag; (3) mọi `recordedAt`/`createdAt`/`updatedAt` và tiền tố ID lấy từ `clock` của preflight.
- Mục `## Persistence rules` giống hệt nhau trong 6 skill, trỏ tới cookbook.
- Mục `### Command cookbook` trong `workflow.md`: ví dụ PowerShell và bash cho evidence (flag và envelope), criterion met, transition, snapshot trước/sau, run-check, migrate, finish, cancel; ghi chú lệnh ghép `a && b` phải qua shell tường minh.
- Đoạn "cái gì đổi `inputDigest`" ở `harnix-brainstorm`, `harnix-continue`, `harnix-check` kèm quy trình phục hồi sau replan và khuyến nghị gộp mọi sửa contract vào một replan.
- Sửa mâu thuẫn evidence-transport trong `harnix-check`.

## Tiêu chí chấp nhận

Xem `task.json`.

- ac-forbid-temp-scripts, ac-clock-rule — **Verifies:** chk-guidance-focused (persistence-guidance.test.ts: nội dung 6 skill và tài liệu activation).
- ac-cookbook-both-shells — **Verifies:** chk-guidance-focused (test kiểm cookbook có cả `PowerShell` lẫn `bash`, giới hạn 64 KiB, không dùng `<`).
- ac-digest-explained — **Verifies:** chk-guidance-focused (test kiểm cụm mô tả digest trong 3 skill).
- ac-docs-match-cli — **Verifies:** chk-guidance-focused (test trích mọi `--flag` trên dòng chứa `harnix workflow` trong skill/cookbook và đối chiếu với option đăng ký của command).
- Toàn bộ — **Verifies:** chk-full-suite.

## Rủi ro

- Test nội dung sẵn có (`skill-sources.test.ts`, `activation-instructions.test.ts`) đòi các cụm cũ: giữ nguyên các cụm đó, chỉ thêm.
- Skill/template lớn thêm: giữ đoạn mới ngắn; đo `pnpm measure:footprint` như check advisory.
- Bản đã cài ở home người dùng cần `harnix update --global`: không tự làm.
