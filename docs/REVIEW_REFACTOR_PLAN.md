# Kế hoạch review và refactor Harnix

## 1. Trạng thái và mục tiêu

Tài liệu này ghi nhận đợt review toàn repository được thực hiện ngày 2026-08-10 và là kế hoạch triển khai remediation cho Phase 5. Mục tiêu là đưa implementation khớp một cách có thể kiểm chứng với PRD, workflow chuẩn, schema v1 đã đóng băng, quy tắc an toàn vòng đời và các release gate, nhưng không tạo thêm package hoặc compatibility surface.

Ưu tiên lần lượt là correctness và bảo toàn dữ liệu người dùng, sau đó đến tính đầy đủ của chẩn đoán, khả năng bảo trì, hiệu năng và vệ sinh dependency. Các field public, enum, path, hook protocol và ý nghĩa exit code hiện có phải tiếp tục backward-compatible.

## 2. Baseline bằng chứng review

Baseline review được thực hiện trên worktree sạch. Các kiểm tra mới nhất cho kết quả:

- `pnpm build`, `pnpm lint` và `pnpm typecheck`: pass.
- `pnpm test:acceptance`: 87/87 test pass, nhưng còn thiếu một số assertion bắt buộc về destructive state và persisted state.
- Static dependency scan: 29 source module, 72 relative-import edge, không có circular dependency.
- `pnpm measure:init`: lần chạy tệ nhất 381 ms trong ba lần trên fixture tổng hợp hiện có.
- `pnpm measure:footprint`: 13.528 bytes/33 file, giảm 98,99% so với baseline đã đóng băng.
- Runtime dependency audit: không có vulnerability đã biết.
- Full dependency audit: một advisory Low trong `esbuild@0.27.7` qua development build toolchain; bản vá nằm từ `esbuild >=0.28.1`.
- CLI probe: setup không hợp lệ in stack trace và exit 1 thay vì 2; doctor chưa emit JSON theo contract.

Việc các gate lịch sử pass không chứng minh Phase 5 đã hoàn tất. Mỗi mục bên dưới cần có regression test quan sát disk state hoặc process output tại đúng boundary mà contract yêu cầu.

## 3. Findings và task remediation

### P0 — an toàn dữ liệu và correctness của workflow

- [x] Migration inventory, copy/transform và verify spec, task, journal legacy trong staging trước khi activation; cleanup tùy chọn chỉ được thực hiện trên bằng chứng đã verify.
- [x] Setup dùng managed ownership state machine và safe path resolution cho Kiro, Antigravity và Codex; rerun bảo toàn managed file đã bị người dùng sửa.
- [x] Codex hook merge bảo toàn các top-level key và hook configuration không thuộc Harnix.
- [x] Uninstall lập kế hoạch không ghi trước khi confirmation, bảo toàn injected block đã sửa, đồng thời cập nhật config/manifest còn giữ để update không cài lại platform đã gỡ.
- [x] Workflow finish persist task completed một cách an toàn trước khi xóa active pointer; resume từ blocked xóa blocker; completion yêu cầu mọi criterion và fresh evidence mới nhất.
- [x] CLI vẫn tự động detection khi không có `--languages`, không prompt trên non-TTY, doctor emit JSON theo contract, map public error về exit code chuẩn, không in stack trace hoặc machine path mặc định.
- [x] Memory lookup validate developer ID và journal entry để traversal hoặc JSON sai hình dạng được fail closed hoặc degrade gracefully.
- [x] Mọi project write đi qua filesystem boundary có kiểm tra containment; test symlink/junction escape bao phủ command, task artifact, rule và platform setup.

### P1 — đầy đủ lifecycle và diagnostic

- [x] Init chỉ seed common/language rule liên quan, tạo root `AGENTS.md` bootstrap cho AI agent và ghi managed hash mà không overwrite nội dung hiện có của người dùng.
- [x] Update xóa file obsolete nhưng chưa bị sửa, bảo toàn file obsolete đã sửa và mô hình hóa rõ structural/injected surface.
- [x] Context normalize source path, deduplicate theo path và content, persist ranked order hợp lệ, ghi nhận duplicate omission và chừa chỗ output cho disclosure file bị omit.
- [x] Doctor triển khai đầy đủ inventory check v1, báo warning bằng exit 1 có thể xử lý, xuất JSON deterministic, lập kế hoạch fix trước mutation và chạy diagnose lại sau fix.
- [x] Release scan kiểm tra tarball đã chốt và generated fixture cô lập cho mọi category được mô tả, gồm required TODO, forbidden surface, dead packaged import, attribution và duplicate hook.
- [x] Kiro và Antigravity được đưa vào configurator module riêng để materialize desired surface; template rendering chỉ còn một source of truth.

### P2 — chất lượng harness, hiệu năng và dependency hygiene

- [x] Mọi test repository tạm dùng shared cleanup fixture; process/global state được khôi phục sau mỗi test.
- [x] Test mới và test thay đổi đáng kể dùng tên theo dạng `should_<expected>_when_<condition>` và assertion vào persisted state/side effect có ý nghĩa.
- [x] Fixture detection/performance đại diện có cây coverage/cache bị ignore và React Native exclusion; traversal dùng bounded concurrency ở nơi phép đo hỗ trợ.
- [x] Package version được đọc từ một build/runtime source thay vì lặp lại string literal.
- [x] TOML merge mang tính structural và reject input malformed mà không partial write.
- [x] Journal append/search an toàn khi concurrent và giới hạn memory khi xử lý history lớn.
- [x] Dependency graph development giải quyết advisory esbuild, hoặc ghi nhận exception hẹp, có thời hạn, không làm yếu compatibility Node 18 hay release gate.

## 4. Thứ tự triển khai và dependency

| Thứ tự | Workstream | Effort | Phụ thuộc |
|---:|---|---:|---|
| 1 | Regression harness và shared fixture | M | Không có |
| 2 | Migration và uninstall plan/apply/verify | L | 1 |
| 3 | Managed platform setup và safe write boundary | L | 1 |
| 4 | Workflow persistence và evidence semantics | M | 1 |
| 5 | CLI và memory/journal validation | M | 1 |
| 6 | Managed update, context, doctor và release scan | L | 2–5 |
| 7 | Configurator/template consolidation và performance | M | 3, 6 |
| 8 | Dependency remediation và final release verification | S–M | 1–7 |

## 5. Chiến lược test

Với mỗi behavior change:

1. Viết regression test đang fail trước.
2. Assert disk content, manifest/config state, exit code, stdout và stderr khi phù hợp.
3. Dùng temporary repository cô lập cùng clock/process/network/prompt dependency được inject.
4. Chạy focused suite đến khi xanh.
5. Review compliance theo PRD/workflow/contract trước quality/security review.
6. Chạy toàn bộ acceptance sequence trong mục 11 của `IMPLEMENTATION_PLAN.md`.

Các regression scenario quan trọng gồm migration với legacy content thật, từ chối cleanup khi verification mismatch, setup rerun sau user modification, external directory symlink, purge không confirmation, update sau uninstall, evidence pass mới nhất rồi fail, blocked resume và finish persistence, CLI non-TTY, journal shape malformed, hook missing/duplicate/unsafe, cùng scanner fixture có một violation cho mỗi category được mô tả.

## 6. Completion gate

Phase 5 chỉ hoàn tất khi mọi checkbox phía trên có code/test evidence hiện tại, toàn bộ acceptance sequence pass từ dependency state sạch, tarball đã kiểm tra pass smoke test cho mọi tổ hợp platform, runtime và development audit không còn advisory chưa được chấp nhận, đồng thời `CHANGELOG.md` có thay đổi người dùng trong mục `Unreleased`.

Exception `GHSA-g7r4-m6w7-qqqr` từng được chấp nhận cho `esbuild@0.27.7` qua `tsup@8.5.1` vào 2026-08-10 đã được đóng ngày 2026-08-14. Harnix dùng local `.pnpmfile.mjs` `readPackage` hook với exact package/version/range match để resolve `esbuild@0.28.1`, đồng thời resolve `nanoid@3.3.18` cho advisory mới GHSA-2v37-7h3g-55p8. Cách này giữ no-workspace contract; mọi thay đổi upstream về package/version/range sẽ không bị hook sửa âm thầm mà phải quay lại dependency review.

## 7. Bằng chứng hoàn tất — 2026-08-11

- Chuỗi mục 11 chạy pass từ `pnpm install --frozen-lockfile` đến `pnpm scan:release`; mọi command exit 0.
- `pnpm test`: 156/156 test trên 23 file; các suite tách riêng trong `test:acceptance` cũng pass.
- Tarball smoke: Kiro, Antigravity, Codex và setup kết hợp cả ba platform đều pass từ isolated install.
- Fixture init đại diện: ba lần chạy, median 393,45 ms và worst 452,74 ms, thấp hơn gate 5 giây.
- Footprint: 16.393 bytes trên 33 file, giảm 98,78% so với upstream baseline đã đóng băng.
- Release scan: tarball đã kiểm tra cùng generated fixture pass secrets, machine path, required TODO, forbidden surface, one-package/bin, dead import, duplicate hook và attribution check; scanner có fixture âm cho từng category công bố.
- Tại evidence 2026-08-11, `pnpm audit --prod --audit-level low` zero advisory và full audit còn exception esbuild development-only; exception lịch sử này đã được đóng bằng resolution hook cùng fresh audit ngày 2026-08-14 như ghi phía trên.
- Các major upgrade hiện có của Commander, Inquirer, ESLint và Vitest yêu cầu Node 20/22+, nên được hoãn để giữ contract Node 18; mọi version trong range tương thích hiện tại đã được cài đặt.

## 8. Continuation audit toàn repository — 2026-08-14

Task `20260814-142615-repository-review-refactor-continuation` tiếp tục mục tiêu review/refactor toàn repository sau khi xác nhận skill content version chỉ là một lát cắt nhỏ, không phải task mục tiêu độc lập. Coverage matrix mới kiểm tra docs, package/build/dependencies, CLI, lifecycle project/global, core workflow, memory/research, repo-map, migration, filesystem primitives, templates/skills/guides, release scripts và test harness.

Chín finding F1–F9 đã được xử lý bằng observed RED và focused GREEN: prototype-safe managed JSON; desired fragment preflight; machine-path/secret redaction; repo-map containment/order/limits; strict filesystem existence; shared bounded input/safe glob; và split pure marker/JSON khỏi global transaction hotspot. Evidence chi tiết, root cause và disposition được lưu trong research artifact của task. Completion chỉ được claim sau fresh dependency audit và exact acceptance sequence mục 11; repository sau refactor được đồng bộ ở release `1.0.0`.

Fresh completion evidence ngày 2026-08-14:

- Production và full dependency audit: không có known vulnerability từ mức Low; package contract 2/2 pass.
- Exact sequence mục 11 exit 0 từ frozen install đến `git diff --check`; full/acceptance suites có 390 pass và một permission-mode skip hợp lệ trên Windows.
- Tarball smoke pass cho Kiro, Antigravity, Codex và tổ hợp cả ba trên fake home; không chạm user profile thật.
- Init fixture worst 510,24 ms; footprint 193.824 bytes/50 files, giảm 85,57% so với frozen baseline.
- Release scan kiểm 16 packaged files và 50 generated files; non-Harnix hook p95 176,32 ms. Scanner giữ true UNC detection nhưng có negative controls chống tự match escaped code và HTTPS URLs.
