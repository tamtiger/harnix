# PRD — Sửa suite gate và input digest cho monorepo

## Vấn đề

Trên repo .NET (Kiro, Windows) agent buộc phải dùng `inputs: ["**"]` vì ready gate chỉ nhận `**` hoặc cặp prefix `src/` + `test/`; snapshot toàn repo chậm và trôi. Bản sửa `input-digest.ts` chưa commit ignore theo tên ở mọi độ sâu nên có thể loại source thật (fresh giả). Finish gate còn lấy pass đầu tiên thay vì pass mới nhất.

## Phạm vi

- Trong phạm vi: `src/core/workflow/suite-gate.ts`, `src/core/workflow/ready.ts`, `src/core/verification/input-digest.ts`, test tương ứng, và mô tả trong `docs/HARNIX_WORKFLOW.md` (những gì đổi digest, luật nhận diện source+test).
- Ngoài phạm vi: transport CLI mới, skill/template, đổi schema.

## Tiêu chí chấp nhận

Xem `task.json`. Mỗi tiêu chí do `chk-gate-digest-focused` và `chk-full-suite` chứng minh.

- ac-gate-monorepo-layout — **Verifies:** chk-gate-digest-focused (suite-gate.test.ts).
- ac-finish-gate-latest-pass — **Verifies:** chk-gate-digest-focused (test hai pass cũ/mới).
- ac-digest-signal-based-ignore, ac-digest-targeted-by-segment, ac-digest-case-insensitive, ac-digest-deterministic-parallel — **Verifies:** chk-gate-digest-focused (input-digest.test.ts).
- Toàn bộ — **Verifies:** chk-full-suite (không hồi quy, coverage floor không giảm).

## Quyết định đã chốt

Xem `decisions` trong `task.json` (thứ tự epic, ignore theo marker, luật nhận diện gate, giữ diff chưa commit).

## Rủi ro

- Luật nhận diện gate quá lỏng làm gate mất tác dụng: giữ test âm tính (`docs/app/**`, `src/**` một mình).
- Đọc marker tốn I/O: cache theo thư mục trong một lần tính digest.
- Diff `input-digest.ts` là công việc dở của người dùng: chỉ mở rộng, không revert.
