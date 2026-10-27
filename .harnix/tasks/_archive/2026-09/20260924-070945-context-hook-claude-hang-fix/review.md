# Fix harnix context --platform claude hang: missing fast-path entry and unbounded stdin read

- **ID:** 20260924-070945-context-hook-claude-hang-fix
- **Mode:** lite
- **Status:** completed/finishing
- **Created:** 2026-09-24T07:09:45Z
- **Updated:** 2026-09-24T07:20:17.290Z

## Goal

Sửa 2 lỗi khiến harnix context --platform claude có thể treo vô hạn khi Claude Code không đóng stdin sau khi ghi hook payload: (1) canonicalInternalContextPlatform trong src/cli.ts thiếu "claude" trong allowlist fast-path nên luôn rơi vào slow path (load toàn bộ Commander CLI); (2) readBoundedInput không có time bound, chỉ có byte bound, nên khi stdin không đóng thì for-await treo vô hạn bất kể timeout phía Claude Code hook là bao nhiêu.

## Non-goals

- Không thay đổi hành vi hiện có của readBoundedInput cho các caller không truyền timeoutMs (workflow --save/--evidence vẫn đọc stdin không giới hạn thời gian).
- Không sửa cách Claude Code (bên thứ ba) quản lý stdin của child process; chỉ làm Harnix tự vệ khỏi trường hợp đó.
- Không đổi cấu trúc PublicCliErrorV1 hay bất kỳ frozen contract nào khác ngoài phạm vi context hook.

## Acceptance criteria

- `fast-path-includes-claude` (met): canonicalInternalContextPlatform (src/cli.ts) nhận diện "claude" giống hệt kiro/antigravity/codex, đưa lời gọi harnix context --platform claude qua fast path thay vì rơi vào Commander CLI đầy đủ.
- `bounded-input-time-bound` (met): readBoundedInput (src/utils/bounded-input.ts) nhận optional timeoutMs; khi truyền vào và không có dữ liệu mới trong khoảng đó, hàm trả về dữ liệu đã đọc được (không treo vô hạn); khi không truyền timeoutMs, hành vi giữ nguyên y hệt trước (không giới hạn thời gian).
- `context-hook-call-sites-bounded` (met): Cả hai call site đọc stdin cho context hook (src/cli.ts fast path và src/cli-program.ts context command trong Commander) truyền timeoutMs hợp lý (không quá vài giây) cho readBoundedInput, đảm bảo harnix context luôn trả lời nhanh kể cả khi stdin không đóng.
- `regression-safe` (met): Toàn bộ test hiện có liên quan (cli-fast-path, bounded-input, context, internal-context) và test:unit tổng thể không liên quan đến thay đổi này vẫn pass, không đổi hành vi workflow --save/--evidence.

## Required checks

- `chk-fast-path-claude-unit` (focused): Unit test: canonicalInternalContextPlatform trả về "claude" cho đúng command shape, giữ nguyên hành vi cho kiro/antigravity/codex và các input không hợp lệ. — pass (2026-09-24T07:17:44Z)
- `chk-bounded-input-timeout-unit` (focused): Unit test: readBoundedInput với async iterable không bao giờ đóng và timeoutMs được truyền vào trả về sau khoảng thời gian bound thay vì treo; không truyền timeoutMs thì hành vi cũ (đợi tới khi stream đóng) không đổi. — pass (2026-09-24T07:17:44Z)
- `chk-context-hook-bounded-integration` (focused): Test end-to-end: gọi context hook (cả fast path lẫn Commander path) với stdin giả lập không đóng, xác nhận lệnh trả lời trong thời gian bound thay vì treo. — pass (2026-09-24T07:17:44Z)
- `chk-full-unit-regression` (full): Toàn bộ test:unit pass sau thay đổi, không regression các nơi khác dùng readBoundedInput (workflow --save/--evidence). — pass (2026-09-24T07:17:44Z)

## Evidence

- `chk-fast-path-claude-unit` — pass (2026-09-24T07:17:44Z): canonicalInternalContextPlatform nhan dien claude giong kiro/antigravity/codex; input khong hop le van tra ve undefined - 2/2 test pass.
- `chk-bounded-input-timeout-unit` — pass (2026-09-24T07:17:44Z): readBoundedInput voi idleTimeoutMs tra ve du lieu da doc thay vi treo vo han (50ms timeout, source khong bao gio dong); khong truyen timeoutMs hanh vi cu khong doi - 5/5 test pass.
- `chk-context-hook-bounded-integration` — pass (2026-09-24T07:17:44Z): Verify thuc nghiem: spawn thuc process voi stdin khong dong -> exit sau ~2.1s (dung idle timeout) thay vi treo vo han nhu truoc fix; case binh thuong (stdin dong dung) van nhanh 108ms.
- `chk-full-unit-regression` — pass (2026-09-24T07:17:44Z): test:unit 285 pass + 1 pre-existing failure khong lien quan (stray .kilo worktree, tu truoc task nay); test:workflow 10/10 files (120 tests) pass; test:integration 21/21 files (130 tests) pass. Khong regression workflow --save/--evidence.
