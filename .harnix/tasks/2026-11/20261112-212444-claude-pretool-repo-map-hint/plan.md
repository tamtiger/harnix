# Implementation Plan: Hook PreToolUse nhắc dùng repo-map cho Claude Code

## Execution Slices

### Slice 0: Xác minh hợp đồng PreToolUse của Claude Code (không sửa mã)
- [x] [chk-claude-hook] Xác nhận từ tài liệu Claude Code rằng `PreToolUse` nhận `tool_name`, `tool_input` trên stdin, hỗ trợ `matcher` và `hookSpecificOutput.additionalContext` mà không cần `permissionDecision`. Ghi kết luận bằng `--add-decision`. Nếu `additionalContext` không được hỗ trợ cho `PreToolUse`: dừng, báo người dùng, không tự đổi sang chặn.

### Slice 1: Bộ phát hiện thuần (RED rồi GREEN)
- [x] [chk-hint] Test trước `test/unit/commands/pretool-hint.test.ts`: Grep với pattern `holds_stock` hoặc `\bholds_stock\b` có hint; `foo.*bar`, `TODO:`, chuỗi có dấu cách, pattern ngắn dưới 3 ký tự: không hint; Bash `grep -rn holds_stock src`, `rg holds_stock` có hint; `grep -r "đang tải" .`, `git grep`, `cat file`, `grep foo file` (không `-r`): không hint; tool `Read`, `Edit`: không hint; JSON hỏng hoặc thiếu field: không hint, không ném lỗi.
- [x] [chk-hint] Mã `src/commands/pretool-hint.ts` (hàm thuần `pretoolHintFor(event)`; không `node:fs`, không process, dưới 300 dòng code, complexity dưới 20); đầu ra `{ hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext } }`, văn bản tĩnh ngắn, có `--refs <symbol>` chỉ khi symbol khớp regex định danh chặt.

### Slice 2: Nối vào lệnh hidden `context` (RED rồi GREEN)
- [x] [chk-hint] Test trước trong `test/unit/commands/internal-context.test.ts` / `internal-context-cli.test.ts` (hoặc file mới nếu vượt 400 dòng): `harnix context --platform claude` nhận sự kiện `PreToolUse` thì gọi bộ phát hiện; ngoài dự án đã khởi tạo thì không in gì; không ghi file, không tạo slot cache phiên; sự kiện `UserPromptSubmit` giữ nguyên hành vi.
- [x] [chk-hint] Mở rộng `normalizeHookEvent` (`src/commands/internal-context.ts`) và nhánh trong `internal-context-cli.ts` bằng `harnix repo-map --outline` trước khi sửa; không thêm lệnh public mới, cập nhật `test/workflow/cli-contract.test.ts` nếu bề mặt hidden đổi.

### Slice 3: Cấu hình Claude Code (RED rồi GREEN)
- [x] [chk-claude-hook] Test trước `test/platform/claude-global.test.ts` và `settings-json-fidelity.test.ts`: setup thêm nhóm `hooks.PreToolUse` có `matcher: "Grep|Bash"` và lệnh `harnix context --platform claude`; chạy lại là `unchanged`; hook người dùng cùng mảng được giữ; update cập nhật nhóm chưa bị sửa; uninstall gỡ đúng nhóm; nhóm bị người dùng sửa được giữ (collision); BOM và định dạng giữ nguyên.
- [x] [chk-claude-hook] Mã trong `src/configurators/claude.ts`: selector `/hooks/PreToolUse` memberId `harnix-repo-map-hint`, nhóm mong muốn, `memberMatcher` nhận diện theo cặp matcher + command (không nhầm nhóm `UserPromptSubmit`), thêm một mục `json-member` vào `claudeGlobalDesiredFiles`.
- [x] [chk-claude-hook] Doctor và registry: kiểm `src/core/platform/registry.ts`, `src/core/doctor/` xem nhóm mới có được báo trạng thái; nếu cần mã finding mới thì thêm vào `DOCTOR_FINDING_CODES` kèm fixture (mức `warning` trước).

### Slice 4: Tài liệu, ngân sách, phát hành
- [x] [chk-gates] Đồng bộ AGENTS.md (dòng Claude Code: hai nhóm sở hữu), `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, README.md, `src/templates/harnix/*` nếu có chữ về hook, `src/core/platform/facts.ts`; chạy `pnpm selfhost:sync` nếu template workflow đổi; rà checklist `harnix-self-host`.
- [x] [chk-gates] Trần token: `pnpm measure:tokens`; không nâng `token-budgets.json`.
- [x] [chk-gates] `pnpm version:sync <patch>` một lần kèm `--summary` và `--kind added`, cập nhật CHANGELOG cùng mục.
- [x] [check-suite] `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, rồi theo `docs/IMPLEMENTATION_PLAN.md` mục 11 (`pnpm release:check`) và smoke fake-home tarball.
- [x] [check-suite] Smoke thủ công trên profile dùng một lần (không động `~/.claude` thật): cài, kích hoạt hook bằng stdin giả, gỡ.

## Guardrails & Invariants
- Không bao giờ trả `permissionDecision: deny`/`ask` và không đổi quyết định cấp quyền; mọi lỗi nội bộ của hook đều im lặng và exit 0 (một hook hỏng không được làm hỏng công việc của agent).
- Hook không ghi, không mạng, không đọc `.harnix/cache`, không chạy repo-map; chỉ cần `tool_name` + `tool_input` và việc cwd nằm trong dự án đã khởi tạo.
- Test kiểm cả đường im lặng (không hint) nhiều hơn đường có hint, vì chặn nhầm nhắc là chi phí nhiễu cho mọi phiên.
- Chỉ Claude Code; không thêm nhánh nền tảng mới, không đổi `PLATFORM_IDS`.
- Giữ nhóm `harnix-context` ở `UserPromptSubmit` nguyên vẹn; user hook giữ nguyên.
- Test chạy trên home dùng một lần được inject, không động home thật; golden `behavior-snapshot.golden.json` không được tái tạo để qua refactor.

## Rủi ro đã biết
- `additionalContext` của `PreToolUse` có thể phụ thuộc phiên bản Claude Code (Slice 0 xác minh trước khi viết mã).
- Hook chạy trước mọi Grep/Bash nên cộng thêm độ trễ; lệnh `harnix context` phải giữ nhanh (timeout 5s hiện có, mục tiêu vài chục ms).
- Một nhắc tĩnh vẫn có thể bị bỏ qua; chỉ đo được hiệu quả sau khi dùng thực tế, và task này không hứa chặn.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3, ac-4 | check-suite | `pnpm run test` | full |
| ac-1, ac-2 | chk-hint | `pnpm exec vitest run test/unit/commands/pretool-hint.test.ts` | focused |
| ac-3 | chk-claude-hook | `pnpm exec vitest run test/platform/claude-global.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
