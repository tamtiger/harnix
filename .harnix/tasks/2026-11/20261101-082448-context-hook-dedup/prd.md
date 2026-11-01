# Hook context dedup bền theo session và an toàn khi chạy song song

## Context & Problem Statement

Hook `context` (`src/commands/internal-context.ts`, hàm `renderInternalContextForHook`) bỏ qua payload lặp lại bằng một tệp duy nhất `.harnix/tmp/context-cache.json` chứa `{sessionId, payloadHash}`. Tệp này được đọc rồi ghi không khoá, và chỉ giữ được MỘT session: hai session song song trên cùng repo ghi đè lẫn nhau nên mỗi lần xen kẽ (A, B, A, B) payload lại bị inject lặp, dedup mất tác dụng.

Ngoài ra `boundedContext` cắt nội dung bằng `String.prototype.slice` theo code unit UTF-16 (`body.slice(0, contentBudget)` và `summary.slice(0, cap)`), có thể cắt giữa một cặp surrogate (emoji, ký tự ngoài BMP) và để lại surrogate lẻ trong payload gửi cho host, kể cả ở nhánh `kept === 0` (chỉ còn khối lead).

## Scope & Boundaries

Trong phạm vi:

- Thay tệp cache chung bằng một slot cho mỗi session: `.harnix/tmp/context-cache/<hash-của-sessionId>.json`, ghi atomic bằng helper sẵn có, giới hạn số slot và dọn slot cũ nhất.
- Giữ nguyên hành vi: không có `sessionId` thì luôn inject và không đọc hay ghi cache; hash payload đổi thì inject lại; `emptyPayload` theo từng platform giữ nguyên.
- Cắt chuỗi không phá cặp surrogate, qua một helper nhỏ dùng cho cả `contentBudget` và disclosure.

Ngoài phạm vi:

- Hành vi sau compact: host không gửi tín hiệu compact nên không thể kiểm chứng; không bịa tín hiệu, ghi thành residual risk `r-compact`.
- Không đổi hook protocol đóng băng, không đụng `~/.harnix` hay home thật, không xoá tệp legacy `context-cache.json` (nằm trong `tmp/` đã git-ignore, vô hại).

## Anchored Acceptance Criteria

- ac-1: slot cache riêng cho mỗi session, hai session xen kẽ dedup độc lập, số slot bị giới hạn và slot cũ bị dọn.
- ac-2: không có `sessionId` thì luôn inject, không đọc hay ghi cache; hash đổi thì session nhận lại payload; có test từng nhánh.
- ac-3: cắt `contentBudget` và disclosure không phá cặp surrogate hay cắt giữa lead; test với emoji đúng biên cắt.
- ac-4: các test mới và cổng hợp đồng (`pnpm run test:gates`) xanh.

## Architectural & Safety Constraints

- Tuân thủ `AGENTS.md` và `.harnix/spec/guides/` của dự án: logic mới nằm ở `src/core/context/session-cache.ts` (core, không phụ thuộc Commander hay Inquirer) và `src/utils/safe-slice.ts`; `internal-context.ts` chỉ nối dây.
- Tên slot lấy từ `sha256(sessionId)` rút gọn nên `sessionId` do host cấp không bao giờ trở thành đường dẫn; đường dẫn đi qua `resolveSafeProjectPath`.
- Mọi lỗi cache là best-effort: không làm hook thất bại, không in đường dẫn máy.
- Mỗi test mirror module nguồn, tối đa 400 dòng/file; file nguồn tối đa 300 dòng code, complexity tối đa 20.
