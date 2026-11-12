# Implementation Plan: Làm gợi ý repo-map thực sự đến được agent khi đọc code

## Execution Slices

### Slice 1: Tip ngoài khung untrusted và khi không có task (ac-1, ac-2)
- [x] [chk-ctx] RED: thêm test trong `test/unit/core/context/effective-context.test.ts` (tip nằm trước `UNTRUSTED_CONTEXT_PREFIX`/ngoài khung) và `test/unit/commands/internal-context.test.ts` + `test/workflow/internal-context-hooks.test.ts test/workflow/internal-context-boundary.test.ts` (dự án init, không task active, vẫn có tip; không đọc cache). GREEN: sửa `src/core/context/effective-context.ts` (`withLearning`, `taskSummaryHeader`, `REPO_MAP_TIP`) và `src/commands/internal-context.ts` (`renderInternalContext`, nhánh `!active`); giữ `forceBounded`, cap ký tự và session-cache; chuỗi tip đổi theo tên công cụ.

### Slice 2: Chỉ thị theo tên công cụ, trong ngân sách (ac-3, ac-4)
- [x] [chk-gates] RED: test/golden/instruction-budget đòi chữ mới ở `HARNIX_RULES` và dòng repo-map ở `harnix-review`. GREEN: sửa `src/templates/harnix/activation.ts` (quy tắc Token economy: Grep tìm symbol, Read/`sed -n` lần hai trên một file; rút gọn phần khác của khối để còn ≤ 1540 token), thêm một dòng vào `src/skills/harnix-review/SKILL.md` (+ dòng phiên bản), `pnpm selfhost:sync` nếu template workflow đổi, cập nhật golden bằng `HARNIX_UPDATE_GOLDEN=1` chỉ cho chuỗi mới.

### Slice 3: Đồng bộ, version, xác minh (ac-1..ac-4)
- [x] [check-suite] Đồng bộ README, AGENTS.md, template platform, docs canonical (checklist `harnix-self-host`); `pnpm version:sync <patch> --summary ...` + CHANGELOG; `pnpm format`; chạy `pnpm test` và lint/typecheck xanh.

## Guardrails & Invariants
- Tip tĩnh, không I/O repo-map; nội dung repository vẫn trong khung untrusted.
- Không nâng trần token; `alwaysLoaded` ≤ 1540, `harnix-plan` không tăng.
- Tương thích ngược: payload hook ngoài dự án init vẫn rỗng; định dạng payload từng platform (Codex, Antigravity) không đổi.
- Hook PreToolUse chỉ đề xuất (deferred), không làm trong task này.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2 | chk-ctx | `pnpm exec vitest run test/unit/core/context/effective-context.test.ts test/unit/commands/internal-context.test.ts test/workflow/internal-context-hooks.test.ts test/workflow/internal-context-boundary.test.ts` | focused |
| ac-3, ac-4 | chk-gates | `pnpm test:gates` | focused |
| ac-1, ac-2, ac-3, ac-4 | check-suite | `pnpm run test` | full |
