# Audit matrix toàn repository — continuation 2026-08-14

## Phương pháp

Review dùng bốn nguồn bằng chứng: normative contract trong `AGENTS.md`/`docs`, static dependency và trust-boundary inspection, test coverage hiện có, cùng reproduction test cho finding được chọn. Gate đang xanh chỉ là baseline; không được dùng thay cho disposition từng subsystem.

Baseline hiện tại có 60 TypeScript source module, 204 relative-import edge, không có cycle và không có dependency edge vi phạm hướng `commands/configurators/migration -> core -> utils`. File hotspot lớn nhất là `src/utils/global-managed-files.ts` với 1.247 dòng; tiếp theo là `src/commands/global-doctor.ts` 534 dòng và `src/commands/doctor.ts` 449 dòng.

## Coverage matrix

| Subsystem | Phạm vi đã đọc/kiểm tra | Invariant chính | Disposition |
|---|---|---|---|
| Normative docs và release state | `AGENTS.md`, PRD, workflow, implementation/global plans, upstream mapping/baseline, review plan | PRD > workflow > implementation; one package/bin; Node 18; không silent network/Git/global-home write | Baseline task trước đồng bộ phần skill/workflow/dependency; continuation phải cập nhật trạng thái sau toàn bộ finding mới. |
| Package/build/dependencies | `package.json`, lockfile, `.pnpmfile.mjs`, tsconfig, tsup, Vitest, ESLint | one package/bin/workspace; reproducible frozen install; exact audited resolution | Dependency tree hiện sạch; giữ required audit và no-workspace test. |
| CLI và public diagnostics | `src/cli.ts`, `src/cli-program.ts`, CLI tests | JSON output, exit 0/1/2, bounded hook stdin, không leak path/secret | F3, F7. |
| Init/update/rules/guides | init/update, managed-files, rules, guide/catalog selection | preserve unowned/user-modified content; deterministic selection/materialization | F6, F8; không thấy contract break khác. |
| Global configurators/lifecycle | Kiro/Antigravity/Codex configurators; setup/update/uninstall/doctor | verified user roots, stable lock order, sidecar ownership, conservative rollback, trust/precedence evidence | F1, F2, F9 trong pure fragment/JSON layer; transaction/lock ordering hiện có test đầy đủ. |
| Core config/context/task/workflow | config, context, task schema, input freshness, workflow routing/finish | frozen schema; bounded untrusted context; evidence freshness; completed-active recovery | Baseline recovery fix giữ nguyên; không có finding P0–P2 mới sau review transition/freshness paths. |
| Journal/memory/research | journal append/search, mem aggregation, learning/promotion, research persistence | bounded streaming, malformed degradation, safe developer/path | Không có finding mới; journal queue và completion recovery có regression. |
| Repo map | inventory/extract/store/search/service/internal CLI | no secret/content body, realpath containment, bounded deterministic cache | F4, F5. |
| Migration/legacy cleanup | discovery, staging/verify/activation, cleanup, legacy surface uninstall | không follow symlink; verify hash trước activation/delete; explicit confirmation | Không có finding blocking; catch-all discovery chỉ làm operation bảo thủ hơn và không mở delete target. |
| Filesystem primitives | paths, user-paths, project discovery, atomic write, locks, managed files | containment, regular-file/realpath check, atomic permission preservation, ownership before mutation | F6; global transaction snapshot/rollback hiện fail closed. |
| Templates/skills/guides | templates, seven canonical skills, guide Markdown/catalog | single canonical content, portable metadata, activation guard, byte parity | `metadata.version` là baseline slice nhỏ; giữ parity trong focused/full gates. |
| Release scripts | pack, smoke, performance, footprint, release scan, isolated home | disposable roots, one package/bin, secret/path/forbidden/dead-import scan | F3. |
| Test harness | unit/integration/migration/platform/workflow/safety fixtures | isolated repository/home, meaningful persisted side effects, platform-safe skips | Bổ sung RED cho F1–F8; skip permission-mode trên Windows là hợp lệ. |

## Findings xác nhận

### F1 — P1 security/correctness: JSON pointer đi qua prototype

- File: `src/utils/global-managed-files.ts`, `findOrCreateJsonArray` và `normalizeJsonValue`.
- Evidence: root/nested object dùng `{}`, kiểm tra key bằng `token in current` và gán `current[token]`. Pointer canonical `/__proto__/hooks` có thể đi vào `Object.prototype`; JSON key `__proto__` từ input hợp lệ bị biến thành prototype thay vì own data property.
- Impact: prototype mutation trong process hoặc mất dữ liệu JSON trước khi ghi shared config.
- Fix direction: tạo JSON objects không prototype, dùng own-property check và regression cho pointer/key nguy hiểm.

### F2 — P1 correctness: desired fragment có thể tự tạo state không match được

- File: `src/utils/global-managed-files.ts`, `entryFromDesired`, `reconcileManagedBlock`, `reconcileJsonMember`.
- Evidence: managed-block content chứa chính begin/end marker vẫn được ghi; lần sau `locateManagedBlock` thấy marker duplicate và bảo toàn state malformed. JSON desired member không match `memberMatcher`/`memberId` vẫn được append; lần sau không tìm thấy và có thể append duplicate.
- Impact: Harnix tự tạo global integration không thể reconcile idempotently.
- Fix direction: preflight desired marker content và xác nhận normalized desired member match chính selector trước mọi write.

### F3 — P2 privacy/release: machine-path và secret scan chưa bao phủ contract

- File: `src/cli-program.ts`, `scripts/scan-release.mjs`, `test/integration/cli.test.ts`, `test/safety/release-scanner.test.ts`.
- Evidence: public redaction không nhận UNC/device path; release scanner chỉ nhận `C:\\Users\\` và `/home/<user>/`, bỏ lọt Windows forward slash, macOS `/Users/<user>/`, UNC và secret không quote.
- Impact: diagnostic hoặc generated/tarball text có thể để lộ machine-specific path/secret dù release gate xanh.
- Fix direction: regression matrix cho các dạng path/secret rồi dùng explicit conservative patterns.

### F4 — P2 correctness: repo-map containment loại nhầm path hợp lệ

- File: `src/core/repo-map/inventory.ts:isContained`.
- Evidence: `relative(root, candidate).startsWith("..")` coi file trong root như `..source.ts` là ngoài root, dù segment không phải traversal `..`.
- Impact: structural cache bỏ sót source hợp lệ và fingerprint không đại diện repository.
- Fix direction: containment theo `value === ".." || value.startsWith(".." + sep) || isAbsolute(value)`.

### F5 — P2 determinism/correctness: repo-map còn locale sort và limits không validate

- File: repo-map inventory/extract/search/store/service.
- Evidence: record path đã dùng code-unit comparator nhưng candidate, outline và tie-break còn `localeCompare`; cache có thể khác theo host locale. `concurrency <= 0` hoặc negative limits có thể tạo empty cache thay vì fail.
- Impact: non-deterministic persisted cache hoặc silent data omission từ invalid injected limits.
- Fix direction: một comparator code-unit dùng xuyên repo-map và validate positive integer limits trước scan/map.

### F6 — P2 preservation: existence probe nuốt mọi filesystem error

- File: `src/commands/init.ts:pathExists`, `src/rules/rules.ts:exists`.
- Evidence: catch-all biến `EACCES`/I/O error thành “missing”; caller có thể đi tiếp tới replacement thay vì fail closed. `seedRules` dùng `readFile` nên directory collision cũng bị coi như missing rồi mới fail ở rename.
- Impact: sai classification và có nguy cơ thay thế content không đọc được.
- Fix direction: shared stat-based probe chỉ trả `false` cho `ENOENT`, propagate lỗi khác và coi mọi existing node là collision/preserved.

### F7 — P3 maintainability: bounded stdin implementation bị duplicate

- File: `src/cli.ts`, `src/cli-program.ts`.
- Evidence: hai implementation byte-count/65.536 giống nhau nhưng khác formatting, dùng cho cùng trust boundary.
- Impact: drift limit/error semantics khi sửa một entry path.
- Fix direction: pure injectable utility và focused boundary tests; hai CLI consumer dùng cùng implementation.

### F8 — P3 maintainability: safe glob implementation bị duplicate

- File: `src/utils/detection.ts`, `src/guides/catalog.ts`.
- Evidence: hai regex compiler giống từng branch cho literal, `*`, `**`, `**/`.
- Impact: detector và guide activation có thể diverge khi glob contract thay đổi.
- Fix direction: một pure safe-glob matcher có tests; không mở rộng syntax.

### F9 — P3 hotspot boundary: global managed file module trộn nhiều trách nhiệm

- File: `src/utils/global-managed-files.ts` (1.247 dòng).
- Evidence: types/manifest validation, marker parsing, RFC 6901/JSON tree mutation, reconciliation planning, filesystem snapshot, transaction/rollback trong một module.
- Impact: F1/F2 khó test cô lập và thay đổi pure parser buộc load filesystem transaction code.
- Fix direction: trong phạm vi sửa F1/F2, tách pure marker và JSON operations thành module nội bộ; giữ public exports và transaction semantics nguyên vẹn.

## Finding không nâng thành refactor

- Các helper sort nhỏ rải rác ngoài persisted/public deterministic output không tự động trở thành finding.
- `doctor.ts`, `global-doctor.ts` và test files lớn nhưng vẫn có một responsibility boundary rõ; chỉ kích thước không đủ để split.
- Migration discovery cố ý degrade khi optional legacy source thiếu/malformed; không có evidence cho data loss.
- Không đổi Commander/Inquirer/Vitest major vì contract Node 18 và task không mở compatibility surface.

## Disposition và verification

| Finding | Disposition | Regression/verification |
|---|---|---|
| F1 | Fixed: JSON objects dùng null prototype và own-property traversal; key `__proto__` được serialize như dữ liệu, không chạm `Object.prototype`. | `test/unit/global-managed-files.test.ts` prototype-key regression GREEN. |
| F2 | Fixed: desired marker content tự chứa boundary và JSON member không match selector bị reject trong preflight trước target write. | Hai fail-closed regressions GREEN, đồng thời existing idempotency/update/preservation tests vẫn pass. |
| F3 | Fixed: public error redaction nhận UNC/device/Windows slash/macOS paths; release scan nhận các path đó và unquoted high-signal secret, đồng thời tránh self-match escaped code/HTTPS URL. | CLI matrix và 30 release-scanner negative/negative-control fixtures GREEN; packed scan GREEN. |
| F4 | Fixed: containment kiểm tra exact parent segment hoặc absolute relative result, không dùng prefix `..`. | File hợp lệ `..source.ts` xuất hiện trong cache regression GREEN. |
| F5 | Fixed: shared code-unit comparator dùng xuyên inventory/extract/store/search; mọi limit phải là positive integer trước scan. | Persisted-outline ordering và bốn invalid-limit regressions GREEN. |
| F6 | Fixed: shared stat probe chỉ trả missing cho `ENOENT`, propagate I/O/permission errors và coi directory collision là existing node. | Ba pure filesystem tests và guide directory-collision regression GREEN. |
| F7 | Fixed/refactored: `readBoundedInput` là implementation duy nhất cho fast-path và regular CLI. | Byte boundary, UTF-8 overflow/early-return và invalid-limit tests GREEN; CLI integration GREEN. |
| F8 | Fixed/refactored: `matchesSafeGlob` là implementation duy nhất cho detection và guide activation, giữ grammar cũ. | Bảy grammar tests cùng detection/rules consumer tests GREEN. |
| F9 | Fixed/refactored: pure marker, pure JSON và manifest error được tách khỏi transaction orchestrator; public re-export/transaction API giữ nguyên. | `global-managed-files.ts` giảm từ 1.247 xuống 1.057 dòng; typecheck, lint, global/platform/integration regressions GREEN. |

Sau refactor có 67 TypeScript source module. Focused verification cuối pha implementation chạy 10 test files/125 tests, typecheck và lint đều pass. Không có finding P0–P2 bị waive hoặc còn blocking; các thay đổi version skills từ baseline vẫn đi qua platform setup parity trong cùng focused set.

Exact release sequence sau debug exit 0: frozen install, build/lint/typecheck, full tests và acceptance, pack check, smoke cho từng platform/tổ hợp, init worst 510,24 ms, footprint giảm 85,57%, release scan 16 packaged/50 generated files với non-Harnix p95 176,32 ms, và clean diff check. Failure scanner trước đó được giữ làm evidence: generic UNC branch từng match escaped code rồi forward-slash branch match license URL; hai negative controls khóa root-cause fix thay vì bypass scan.
