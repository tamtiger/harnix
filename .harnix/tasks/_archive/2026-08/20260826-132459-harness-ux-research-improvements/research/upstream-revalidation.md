# Revalidation ba upstream gốc

- Task: `20260826-132459-harness-ux-research-improvements`
- Ngày kiểm tra: 2026-08-26
- Câu hỏi vật chất: Các upstream đã thay đổi gì sau frozen baseline, và thay đổi nào làm đổi quyết định sản phẩm Harnix?
- Ngưỡng dừng: frozen/current ref, ngày, license, diff summary, ít nhất một nguồn release/issue hoặc source cho mỗi repo, và quyết định Harnix rõ ràng.
- Phương pháp: `git ls-remote`, shallow object fetch trong thư mục tạm bên ngoài active repository, `git diff --stat`, `git show`, source/docs/issues chính chủ. Không chạy code tải về, không thêm remote vào Harnix.

## Kết quả

| Upstream | Frozen baseline | Current ref kiểm tra | Chênh lệch | License | Quyết định |
|---|---|---|---|---|---|
| mindfold-ai/Trellis | `516b34e3591001b28fda5e2d4df3f717e82f5785`, tag `v0.6.12`, 2026-08-01 | `64e663694201005bc87766ef22de89b8da3d4d79`, main, commit 2026-08-21 | 54 commit; 303 file, +16,952/-5,392 | AGPL-3.0-or-later | Chỉ adapt bounded status/continue observability; reject channel, worker, watcher và multi-platform expansion |
| affaan-m/ECC | `f1fec0e53934737d3b3b8388b0fd1651e8b62f4f`, 2026-08-04 | `d8409a4b0813771235555e32e3d8046a73988bfa`, main, commit 2026-08-19; release line đến `v2.1.0` | 77 commit; 468 file, +33,937/-3,122 | MIT | Adapt deterministic status/attention/next-action projection; không dùng SQLite, global state, cloud hoặc statusline |
| obra/superpowers | `44c9b2d6e889982ac18c27d05a19fefe335194e1`, 2026-07-28 | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`, tag `v6.3.0`, 2026-08-12 | Một squash release; 40 file, +2,888/-67 | MIT | Giữ adaptive ceremony, evidence và resume discipline đã có; không thêm mandatory subagent/worktree/commit |

## Facts theo repo

### Trellis

- Current source giới hạn task-context injection, refresh sau thay đổi file, deduplicate shared context và surface active task không đọc được.
- `trellis-continue` route theo persisted status và artifact presence; parent task hiển thị tiến độ dạng tổng hợp.
- Issue #470 ghi nhận referenced files bị inline không giới hạn làm phình context.
- Issue #491 ghi nhận child repository scan không bounded có thể treo ở polyrepo lớn.
- Issue #549 ghi nhận session lồng nhau có thể nhận sai task context qua biến môi trường kế thừa.
- Current changes về channel/events/torn-tail recovery và platform breadth không phù hợp product boundary Harnix.

Nguồn:
- https://github.com/mindfold-ai/Trellis/commit/64e663694201005bc87766ef22de89b8da3d4d79
- https://github.com/mindfold-ai/Trellis/issues/470
- https://github.com/mindfold-ai/Trellis/issues/491
- https://github.com/mindfold-ai/Trellis/issues/549
- https://github.com/mindfold-ai/Trellis/blob/64e663694201005bc87766ef22de89b8da3d4d79/LICENSE

### ECC

- Current source có `loop-status`, `harness-audit` và `scripts/status.js` với deterministic readiness, attention và top actions.
- `loop-status` tổng hợp phase, checkpoint, failing checks, drift và recommended intervention.
- `scripts/status.js` phụ thuộc các surface rộng như SQLite/global/home và nhiều harness; Harnix chỉ nên lấy projection principle.
- Issue #2694 cho thấy danh sách 773 skill làm vượt budget discovery; #2696 cho thấy Doctor có thể tạo permanent drift khi chuẩn hóa link.
- Các thay đổi installer/hook gần đây củng cố yêu cầu output nhỏ, deterministic và ownership-preserving.

Nguồn:
- https://github.com/affaan-m/ECC/tree/d8409a4b0813771235555e32e3d8046a73988bfa
- https://github.com/affaan-m/ECC/releases/tag/v2.1.0
- https://github.com/affaan-m/ECC/issues/2694
- https://github.com/affaan-m/ECC/issues/2696
- https://github.com/affaan-m/ECC/blob/d8409a4b0813771235555e32e3d8046a73988bfa/LICENSE

### Superpowers

- v6.3.0 phân cấp ceremony theo bounded/spike/architectural, ghi ruling thay vì dừng ở conflict không nguy hiểm, và dùng progress ledger để giảm chi phí resume.
- Release notes ghi nhận một phiên bị block gần chín giờ do non-blocking conflict và thiết kế ledger cũ tốn 6–13 tool call mỗi lần resume.
- Current skill chỉ dừng khi có irreversible/destructive action, security issue, external side effect hoặc plan hỏng hoàn toàn.
- Harnix đã có Bypass/Lite/Full, material-only blocking và persisted state; không có gap đủ độc lập để thêm feature Superpowers mới trong batch này.

Nguồn:
- https://github.com/obra/superpowers/releases/tag/v6.3.0
- https://github.com/obra/superpowers/commit/b36e0829c6d0140e93cfef2ca599b1b07d4a7797
- https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/skills/subagent-driven-development/SKILL.md
- https://github.com/obra/superpowers/blob/b36e0829c6d0140e93cfef2ca599b1b07d4a7797/LICENSE

## Suy luận và kết luận

- Fact: cả ba upstream đều thay đổi sau frozen baseline; license không đổi.
- Inference: thay frozen baseline bằng current head sẽ làm mất reproducibility. Vì vậy frozen record phải giữ nguyên, current refs chỉ được ghi thành revalidation observation.
- Fact: Harnix đã persist status/checkpoint/criteria/check evidence nhưng public CLI chưa có `status`.
- Inference: điểm giao nhau có giá trị cao nhất là một projection read-only nhỏ từ state sẵn có, không phải nhập kiến trúc orchestration mới.
- Kết luận: giữ nguyên frozen ownership baseline; current observations của ba upstream hỗ trợ clean-room status. Các feature mở rộng từ Cline, Aider, Spec Kit và BMAD được tách riêng trong landscape/decision artifacts và provenance mapping; không copy code/prose upstream.

## Bất định còn lại

- Chưa có benchmark người dùng Harnix quy mô lớn; metric batch dùng reproducible local payload/discoverability và upstream issue evidence.
- Không xác nhận behavior runtime của code upstream bằng execution; đây là chủ ý an toàn và không cần thiết cho quyết định contract.