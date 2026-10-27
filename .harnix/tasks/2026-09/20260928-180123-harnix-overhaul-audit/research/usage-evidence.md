# Pha 2 — Bằng chứng dogfooding (2026-09-28)

**Nguồn:** 69 task trong `.harnix/tasks`, 70 entry journal, 3 epic, 58 commit, CHANGELOG (70 header, 222 bullet). Ký hiệu **[F]** là fact, **[H]** là giả thuyết.

## Số liệu tổng

| Chỉ số | Giá trị |
| --- | --- |
| Task full / lite | 49 / 20 |
| Schema v1 / v2 | 19 / 50 |
| Status cuối | 69/69 `completed` |
| AC / check / evidence | 370 / 314 / 781 |
| Evidence `fail` | 144 (~101 là RED có chủ đích, ~43 là fail thật) |
| Dòng prd / plan / design / review | 2.824 / 3.138 / 589 / 1.289 |

## Công sức đổ vào đâu

- **[F]** 31/69 task (45%) dùng để sửa bộ máy của chính Harnix: preflight, routing, guard, bypass, digest, v1→v2, replan, parity.
- **[F]** Chỉ 17 task là feature cho người dùng và 4 task là fix cho người dùng.
- **[F]** 28/58 commit (48%) và 128/222 bullet CHANGELOG (58%) là về workflow/rule/skill.
- **[F]** `AGENTS.md` tăng từ 769 lên 2.606 từ qua 22 commit.

## Chi phí ceremony

- **[F]** Churn trong `.harnix/` là 109.733 dòng, gấp 3,3 lần toàn bộ `src` + `test`. Riêng `verification-inputs.json` chiếm 69.043 dòng.
- **[F]** Commit `340dd16`: `.harnix` 15.901 dòng, src 26 dòng.
- **[F]** Artifact viết tay khoảng 0,32 dòng trên mỗi dòng code.

## Lỗi lặp lại (~43 fail thật)

| Nhóm | Số lần |
| --- | --- |
| Môi trường Windows / sandbox | ~10 |
| `generatorVersion` lệch sau bump | 5 |
| Assertion parity cũ sau khi đổi template | ~5 |
| Worktree ngoài phạm vi | 3 |
| Shell quoting trong `command` | 3 |
| Compliance finding | ~8 |

**[F]** Có 10 lần `contractRevision`. Chỉ 2 lần do đổi phạm vi thật; 8 lần còn lại do quoting, dấu tiếng Việt, môi trường hoặc sai đường dẫn.

**[F] Rule sinh ra để vá một sự cố đơn lẻ:**
- commit approval
- không thêm `--json`
- bỏ `--human`
- future-dated evidence
- dừng khi drift lặp lại
- loại trừ file tự tham chiếu khỏi hash
- checklist 100%
- khai báo đủ member epic ngay từ đầu
- carve-out Bypass
- loại trừ `.kilo` / `.worktrees`

## Tính năng thực sự được dùng

| Tính năng | Mức dùng |
| --- | --- |
| `repo-map --query` / `--impact` | 0 lần trong evidence |
| `context.json` / context-selection | 0/69 task |
| Research artifact | 13 task, tất cả trước 08-26 |
| Epic roadmap | 8 task, chỉ trong 09-24..09-25 |
| Learning (`--learn`) | 0 entry |
| Retry breaker | kích hoạt 1 lần |
| `review.md` | 26/26 task kể từ 09-16 |

## Timeline

- P1–P3 (08-12→08-28): ceremony nặng nhất, trung bình 25,9 evidence/task.
- P4–P5 (09-16→09-28): trung bình 3,9–6,9 evidence/task, gần như 0 fail.
- **[H]** Ở P4–P5, RED không còn được ghi lại, tức ceremony đã trở thành hình thức.
- **[F]** Task gần nhất (`pause`) được đánh dấu completed trong khi HEAD đang đỏ (xem `inventory.md` §0).
- **[H]** Tỷ lệ hoàn thành 100% có khả năng do survivorship bias.
