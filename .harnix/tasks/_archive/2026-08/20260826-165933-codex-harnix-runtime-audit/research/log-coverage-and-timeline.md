# Log coverage, timeline và baseline

## Cutoff và phương pháp

- Cutoff cố định: `2026-08-26T09:58:44.840Z`.
- Current audit turn bị loại khỏi sample để tránh self-observation làm file và số turn tiếp tục tăng.
- Local JSONL được đọc line-by-line đến EOF trước cutoff; JSON parse error được đếm thay vì bỏ silent.
- Codex API metadata, local rollout và Harnix state được inventory độc lập rồi đối chiếu.
- Timestamp event được map sang commit/package era; session-start commit không được dùng cho toàn bộ long-running session nếu source đã đổi giữa chừng.

## Coverage ledger

| Nguồn | Discovered/relevant | Fully parsed | Malformed | Phạm vi | Giới hạn |
|---|---:|---:|---:|---|---|
| Codex task API, non-archived | 50 visible, 15 Harnix-relevant | 15 metadata + recent status | 0 | current host | API trả tối đa page quan sát được; không chứng minh history đã xóa hoặc ở host khác |
| Codex archived API | 0 | 0 | 0 | current host | Không có archived item tại thời điểm audit |
| Local Harnix-relevant rollout | 82 | 82 | 0/89.840 JSON lines | 2026-08-05 → 2026-08-26 cutoff | Raw body không persist vì privacy |
| Harnix task directories | 39 | 39 task records, 149 files tính cả task audit | 0/39 task JSON | project lifetime | Chỉ trong project hiện tại |
| Harnix journals | 9 files, 38 entries | 38 | 0 | completed task history | Chỉ có completion entries; không phải transition trace |
| Verification sidecars | 19 | 19 | 0 | schema-v2 task subset | Không tồn tại cho task không có bound evidence |

Local rollout đóng khoảng trống giữa 15 task liên quan và giới hạn 50 item của API cho chính project này. Audit không tuyên bố đã đọc task bị xóa, task ở host khác hoặc log không còn trên máy.

## Rollout arithmetic

| Class | Files | Bytes | Lines | Task starts | Completes | Aborted | Compactions | Tool calls |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Main | 15 | 156.798.280 | 37.907 | 247 | 230 | 15 | 61 | 6.294 |
| Named worker | 27 | 81.530.059 | 39.313 | aggregate included below | aggregate included below | aggregate included below | 143 | 1.353 |
| Guardian | 40 | 50.124.023 | 12.620 | aggregate included below | aggregate included below | aggregate included below | 12 | 2 |
| Total | 82 | 288.452.362 | 89.840 | 2.147 | 2.101 | 16 | 216 | 7.649 |

Cross-check: `15 + 27 + 40 = 82`; `156.798.280 + 81.530.059 + 50.124.023 = 288.452.362`; `37.907 + 39.313 + 12.620 = 89.840`; `6.294 + 1.353 + 2 = 7.649`. Main có hai turn còn open tại cutoff; toàn population có các lifecycle event không map một-một với user turn, vì vậy không suy ra “missing” bằng phép trừ đơn giản cho worker/guardian.

## Main-session baseline

| Alias | Session start | Starts/completes/aborts | Tools | Compactions | Closed elapsed min | Auto-goal footprint |
|---|---|---:|---:|---:|---:|---|
| M01 | 2026-08-05 | 30/28/2 | 459 | 3 | 128,7 | 3 turns, 96 tools, 23,3 min |
| M02 | 2026-08-07 | 45/44/1 | 263 | 1 | 49,9 | 35 turns, 224 tools, 42,9 min |
| M03 | 2026-08-10 | 29/29/0 | 1.296 | 10 | 260,2 | 6 turns, 1.008 tools, 194,1 min |
| M04 | 2026-08-11 | 1/0/1 | 2 | 0 | unknown | none |
| M05 | 2026-08-11 | 7/7/0 | 22 | 0 | 3,6 | none |
| M06 | 2026-08-12 | 12/9/3 | 181 | 2 | 60,2 | none |
| M07 | 2026-08-13 | 42/36/4 | 861 | 8 | 257,4 | 6 starts/5 complete, 209 tools, 47,6 min |
| M08 | 2026-08-14 | 16/15/1 | 432 | 4 | 104,9 | 1 turn, 166 tools, 41,8 min |
| M09 | 2026-08-14 | 8/7/1 | 358 | 4 | 100,8 | none |
| M10 | 2026-08-18 | 13/13/0 | 277 | 3 | 52,8 | none |
| M11 | 2026-08-18 | 11/10/1 | 277 | 3 | 68,3 | none |
| M12 | 2026-08-19 | 2/2/0 | 167 | 1 | 32,2 | none |
| M13 | 2026-08-20 | 7/7/0 | 242 | 2 | 48,3 | none |
| M14 | 2026-08-21 | 5/5/0 | 221 | 2 | 30,1 | none |
| M15 | 2026-08-26 | 19/18/1 | 1.236 | 18 | 322,5 | current audit excluded after cutoff |

Main closed-turn elapsed sum là 1.422,5 phút, median 68,6 giây, p95 1.945,6 giây, max 6.113,5 giây. Human turns: 196 starts, 180 complete, 15 aborted, một open; 4.591 tools; 1.072,8 phút; median 69,5 giây, p95 1.872,1 giây. Auto-goal: 51 starts, 50 complete, một open; 1.703 tools; 349,7 phút; median 65,5 giây, p95 2.304,5 giây. Đây là elapsed của turn đã đóng; worker overlap làm aggregate không tương đương wall time hay engineering effort.

## Version timeline

| Date | Package era | Evidence point |
|---|---|---|
| 2026-08-05 | `0.1.0` | scaffold và Phase 1 |
| 2026-08-11 | `0.5.0` | Phase 5 và first global integration |
| 2026-08-12 → 2026-08-14 | `0.6.0` → `1.0.0` | global refactor, validation và workflow hardening |
| 2026-08-18 | `1.0.1` → `1.0.8` | simulation, routing, lifecycle và safety fixes |
| 2026-08-20 | `1.0.9` → `1.0.10` | workflow self-improvement |
| 2026-08-21 | `1.0.11` | Codex `config.toml` hook migration fix |
| 2026-08-26 | `1.0.12` → `1.0.14` | lock/security, status/tasks/audit/impact, resume/context/check freshness |

Long session M15 đi qua `1.0.11` đến `1.0.14`; finding trong session đó được bind theo event timestamp, không gắn cứng version lúc session mở.

## Harnix-state baseline

- 39 task directories; 38 completed và task audit hiện tại đang planning tại thời điểm inventory.
- 26 Full, 13 Lite; 19 TaskRecord v1, 20 TaskRecord v2.
- 90 Markdown artifacts, 31 research files, 19 verification-input snapshots trước khi thêm artifacts audit.
- 38/38 completed tasks có đúng một completion journal entry; không malformed, duplicate hoặc unlinked task ref.
- Tổng local task data khoảng 2,53 MiB: bounded và healthy; số task/file không phải defect.

## Timeline behavior đã quan sát

1. Giai đoạn đầu triển khai trước khi khóa plan/docs; user yêu cầu bỏ và replan.
2. Phase 2 dùng auto-goal thành nhiều micro-turn; M02 có 35 auto-goal turns cho 224 tool calls.
3. Phase 5/6 dùng 27 named worker và 40 guardian; nhiều audit scope lặp lại, compaction cao.
4. Green suite từng bỏ sót consumer migration/purge/ownership/doctor và deterministic sort; các lỗi này đã được fix ở version sau.
5. README/CHANGELOG và commit approval từng cần user nhắc; project policy hiện tại đã khóa proposal + approval và README hiện đồng bộ.
6. Một request nêu target bên ngoài trong khi cwd ở Harnix đã bắt đầu đọc ambient state rồi abort; current activation text vẫn thiếu explicit-target precedence.
7. `1.0.13`/`1.0.14` bổ sung status, tasks, audit, impact, resume, context-report và checks; không được re-propose các capability này như feature thiếu.
8. Audit hiện tại phải dựa vào khoảng 275,1 MiB rollout vì Harnix journal chỉ lưu completion, cho thấy observability gap ở transition level.

## Coverage gaps công khai

- Không có API proof cho deleted/nonlocal history.
- Không có authenticated Kiro/Codex real-runtime activation trong audit này; trust/login là external boundary.
- Commit approval chỉ được kiểm tra qua generated contract text; CLI Harnix không và không nên intercept Git của host.
- Per-step raw prompt/output không persist. `research/run-ledger.md` giữ redacted trace class cho từng run, không phải transcript replacement.
