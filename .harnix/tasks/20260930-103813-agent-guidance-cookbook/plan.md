# Plan — Hướng dẫn skill và template cho agent

## Checklist

- [x] S1 — Ba mệnh đề persistence/clock trong `HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS` (`src/templates/harnix/activation.ts`).
- [x] S2 — Mục `## Persistence rules` trong 6 skill và đoạn "cái gì đổi `inputDigest`" trong `harnix-brainstorm`, `harnix-continue`, `harnix-check`; sửa mâu thuẫn evidence-transport ở `harnix-check`.
- [x] S3 — `### Command cookbook` trong `src/templates/harnix/workflow.ts` (PowerShell + bash).
- [x] S4 — Test bảo vệ: `test/workflow/persistence-guidance.test.ts` (nội dung + đối chiếu flag với CLI).
- [x] S5 — Chạy `harnix update` cho repo này để `.harnix/workflow.md` khớp template; `pnpm build && pnpm measure:footprint` (advisory); PRD/docs nếu cần; `pnpm version:sync` một lần (patch, kind changed); `pnpm format`.

## Cách làm và cách kiểm

Mỗi slice RED (test fail vì nội dung chưa có) rồi GREEN tối thiểu. Đoạn mới ngắn, tiếng Anh như các skill hiện có; không đổi các cụm mà `skill-sources.test.ts` và `activation-instructions.test.ts` đang đòi.

- S1/S2/S3: `persistence-guidance.test.ts` kiểm từng nguồn chứa các cụm bắt buộc: `Persistence rules`, cấm `.ps1`/`.sh`/`.json` tạm, `stop and report`, `clock`, `64 KiB`, `PowerShell`, `bash`, `--run-check`, `--criterion`, mô tả digest (`inputDigest changes when`, `does not change when`, `replan`).
- S4: trích mọi `--flag` trên dòng chứa `harnix workflow` trong `workflow.md` (cookbook) và 6 skill, so với option long của command `workflow` do `createProgram()` đăng ký; flag lạ làm test fail.
- S5: chạy `pnpm test:platform` và toàn bộ suite; kiểm bằng `harnix skill harnix-check` rằng nội dung sau cập nhật khớp bản cài.

## Bảo toàn

Không đổi CLI. Không sửa home người dùng thật. Không commit.
