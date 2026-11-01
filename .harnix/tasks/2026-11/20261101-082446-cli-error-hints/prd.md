# PRD: Mọi lỗi CLI hay gặp đều có hint nêu lệnh đúng

## Context & Problem Statement

- Nhiều lỗi của `harnix` chỉ có `message`, không có `error.hint`: các lỗi trong `src/commands/workflow-flags.ts` (`--brief`/`--full` không hỗ trợ, `--set-baseline requires ...`, `workflow does not accept operands`), `--format requires repo-map --query`, `status` thừa đối số, `No epic found with ID`, và "requires an initialized Harnix project" của nhiều lệnh (chỉ `status` có danh sách dự án con).
- Cờ nhận một giá trị bắt buộc (`--set-baseline <id>`) nuốt token kế tiếp: `workflow --set-baseline --result pass` đặt id là `--result` và báo lỗi "does not accept operands: pass" làm lệch nguyên nhân (đã xác minh bằng CLI thật). `assertIdFlagValues` chỉ bảo vệ 4 cờ id.
- Lệnh lạ như `harnix facts` chỉ trả `error: unknown command 'facts'`; `commandHints` chỉ xử lý unknown option.

## Scope & Boundaries

Trong phạm vi:
- Thêm marker `\nGợi ý:` (đã được `splitHint` tách thành `error.hint`) cho các lỗi trên; `No epic found` dùng `unknownIdError` liệt kê id epic hợp lệ.
- Mở rộng bảo vệ giá trị id cho `--set-check`, `--set-baseline`, `--reset-breaker`, `--remove-decision`, `--remove-criterion`, `--remove-risk` với hint "cờ giá trị nhận token kế tiếp làm giá trị".
- Unknown command: `facts` gợi ý `harnix update`, tên gần đúng gợi ý lệnh gần nhất; `internal` (hook) giữ nguyên.
- Helper dùng chung cho lỗi "requires an initialized Harnix project" (hint `harnix init` và dự án con đã khởi tạo) áp cho pause, resume, repo-map, archive, audit, checks, learning, context report, tasks.
- Cập nhật test hợp đồng CLI, golden đúng chuỗi mới, và tài liệu envelope lỗi nếu khác.

Ngoài phạm vi (residual risk): `--limit` bị nuốt im lặng; mọi lỗi dùng exit 2 (có thể là hợp đồng, không đổi); thay đổi `src/commands/epic.ts` ngoài phần lỗi "No epic found" (thuộc member sau).

## Anchored Acceptance Criteria

- ac-1: các lỗi trong `workflow-flags.ts` và `--format` có `error.hint` nêu lệnh hoặc cờ đúng.
- ac-2: cờ nhận id không nuốt cờ kế tiếp; `--set-baseline --result pass` báo đúng nguyên nhân.
- ac-3: lệnh lạ có hint (`facts` -> `harnix update`, tên gần đúng -> lệnh gần nhất); `internal` giữ nguyên.
- ac-4: `epic <id sai>` liệt kê id epic hợp lệ.
- ac-5: lỗi "requires an initialized Harnix project" có hint.
- ac-6: `status foo` có hint.
- ac-7: golden đúng chuỗi mới và `pnpm run test:gates` xanh.

Check: `chk-focused` (ac-1..6), `chk-gates` (ac-7), `chk-suite` (ac-7).

## Architectural & Safety Constraints

- Tuân thủ `AGENTS.md` và `.harnix/spec/guides/`; file ≤ 300 dòng code, complexity ≤ 20, import alias `src/...`, không phá hướng phụ thuộc.
- Hợp đồng lỗi `{ ok:false, error:{ exitCode, message, hint? } }` không đổi; hook protocol không đổi; hint không chứa đường dẫn máy hay bí mật.
- Golden chỉ cập nhật bằng `HARNIX_UPDATE_GOLDEN=1` cho đúng chuỗi mới và đọc diff.
