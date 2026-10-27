# Audit repository — 2026-08-17

## Baseline fresh

- Git bắt đầu sạch tại `0351025` (`main == origin/main`), package `1.0.0`, không có active task trước khi tạo task này.
- Repository có 67 module TypeScript, 22 source Markdown và 202 import statement tương đối. Static inspection không thấy `core` import `commands`, `configurators`, `templates`, Commander hoặc Inquirer.
- Build pass và `node dist/cli.js --version` trả `1.0.0`.
- Full `pnpm test` baseline chạy 390 test: 388 pass, 1 skip hợp lệ trên Windows và 2 fail. Hai failure được giữ làm RED evidence, không xem là lỗi môi trường chung:
  - package contract quét nhầm `.pnpm-store/v11/.tmp/.../package.json` là package publishable thứ hai;
  - self-host so sánh raw LF/CRLF, dù ownership hash chuẩn hóa line ending.
- `node dist/cli.js repo-map --query workflow --limit 5` trả `status: invalid`; cache committed dùng outline locale order cũ trong khi reader hiện yêu cầu code-unit order.
- Launcher `pnpm` đầu PATH bị treo trong sandbox; bundled pnpm `11.19.0` chạy được. Store ngoài workspace cần quyền sandbox để test đọc dependency. Đây là điều kiện runner, không phải finding sản phẩm.

## Coverage matrix

| Subsystem | Phạm vi/evidence đã kiểm tra | Invariant | Disposition |
|---|---|---|---|
| Normative docs | `AGENTS.md`, PRD, workflow, implementation/global/review plans, research, mapping, baseline | Precedence, one package/bin, đúng ba platform, patch trước completion | Khớp; current-state release ban đầu là `1.0.0`, dated/historical version phải giữ nguyên. |
| Package/build/dependency | `package.json`, lockfile, `.pnpmfile.mjs`, tsup/tsconfig/ESLint/Vitest, package contract | Node >=18, one package/bin, no workspace, frozen install | F2: package invariant test quét cả ignored cache và user/task/test data. Dependency ranges/resolutions không tự đổi. |
| CLI/diagnostics | `src/cli.ts`, `src/cli-program.ts`, integration CLI tests | exactly one JSON, exit 0/1/2, redaction, hidden command | 20/20 integration CLI baseline pass; không finding mới. |
| Project lifecycle | init/update/doctor/uninstall, config, managed files | preserve user content, atomic safe paths, deterministic config | F1: locale-aware sort mâu thuẫn code-unit validator với Unicode package path. |
| Global lifecycle | setup/update/uninstall/doctor, Kiro/Antigravity/Codex configurators, global managed files | fake home, stable locks, conservative ownership/rollback, no trust inference | Baseline global/unit/platform/integration suites pass; không finding P0-P2 mới. |
| Workflow/task/context | TaskRecord v1/v2, hidden save/snapshot/finish, context freshness | immutable obligations, digest freshness, safe resume/finish | 14/14 internal-workflow và context suites baseline pass; task mới dùng schema v2 hợp lệ. |
| Journal/research/memory | journal, learning, promotion, mem | local, bounded, malformed-safe, no global memory | Baseline pass; historical warnings được preserve, không sửa. |
| Repo-map | inventory/extract/store/search/service/Doctor | deterministic structural cache, no source body/secret, valid self-host cache, bounded traversal/output | F4: committed cache invalid sau đổi comparator; F5: hard-excluded trees vẫn bị enumerate và trả trong `skipped`. |
| Migration/legacy cleanup | discovery, staging, verify, cleanup | explicit confirmation, no symlink follow, source preservation | Baseline migration/safety tests pass; không finding mới. |
| Filesystem primitives | path/user-root discovery, atomic write, file lock, hashing | containment, strict existence, mode preservation, safe rollback | Baseline unit/safety pass; không finding mới. |
| Catalog/guides/rules/templates/skills | catalogs, guide selection, canonical skills, self-host workflow | deterministic output, seven skill parity/version, normalized ownership hash | F1 áp dụng rộng cho deterministic sorting; F3 là raw-EOL test mismatch. Skill source parity 4/4 pass. |
| Release scripts | pack/smoke/measure/scan and isolated-home helper | fake home, no real profile, no forbidden surface/path/secret | Baseline scanner 30/30 pass; exact gates sẽ chạy sau remediation. |
| Test harness | 57 test files, shared temp repositories/homes | không phụ thuộc ignored build/cache state hoặc platform EOL | F2, F3, F4 cần regression protection. |

## Findings

### F1 — P1 correctness/determinism: comparator locale-aware mâu thuẫn frozen sorted contract

- Contract: Unicode repository paths phải hợp lệ; config/manifest/output phải unique, sorted và deterministic cross-platform.
- Vị trí hẹp: `src/core/config/config.ts:237-252`; cùng pattern `localeCompare` xuất hiện ở persisted/public ordering trong commands, core, migration, templates và managed utilities. Stage-1 review còn bắt được `toLocaleLowerCase` trong `src/commands/repo-map-internal.ts` và `src/core/repo-map/search.ts`.
- Reproduction fresh: Node hiện tại sort `['z','ä']` bằng `localeCompare` thành `['ä','z']`, trong khi code-unit validator dùng `previous >= value` và yêu cầu `['z','ä']`. `createConfig` có package paths Unicode vì vậy có thể tự tạo candidate rồi tự reject.
- Impact: init/config với Unicode package paths có thể fail tùy locale; persisted/public order có thể drift theo ICU/host.
- Root cause: repo-map đã có comparator code-unit riêng, nhưng phần còn lại giữ nhiều comparator locale-aware và validator không dùng cùng source of truth.
- Remediation: chuyển comparator code-unit thành utility dùng chung, thay toàn bộ `localeCompare` trong production deterministic sorting và dùng Unicode `toLowerCase` không phụ thuộc default locale cho repo-map terms; giữ reverse/time/depth semantics tương đương.
- Regression: config test với `z-package`/`ä-package`, source-contract test cấm locale-sensitive primitives trong `src`, comparator/repo-map test và toàn bộ neighboring suites. Review RED tìm đúng 2 offender; GREEN package/repo-map 13/13.
- Disposition: `fix-now`.

### F2 — P2 test quality/release hygiene: package invariant phụ thuộc ignored local cache

- Contract: one publishable package/bin; test không được nhầm ignored cache, task history hoặc fixture thành product package.
- Vị trí: `test/unit/package-contract.test.ts:8-18`.
- Reproduction fresh: project-local `.pnpm-store/v11/.tmp/.../package.json` làm test fail dù Git sạch và package phụ không được track/publish.
- Impact: exact acceptance fail giả trên runner dùng project-local pnpm store; có thể khuyến khích xóa cache thay vì kiểm đúng contract.
- Root cause: recursive scanner chỉ loại `.git`, `node_modules`, `dist`, không mô hình hóa non-product roots.
- Remediation: loại exact non-product directories (`.artifacts`, `.git`, `.harnix`, `.pnpm-store`, `coverage`, `dist`, `node_modules`, `test`) nhưng vẫn bắt package thật ở các product roots khác.
- Regression: temporary repository chứa cache/task/test `package.json` và một nested product `package.json` để chứng minh cả negative lẫn positive control.
- Disposition: `fix-now`.

### F3 — P2 compatibility/test quality: self-host test dùng raw EOL thay vì ownership semantics

- Contract: project managed hash chuẩn hóa CRLF/LF qua `normalizeContentForHash`; Windows checkout với `core.autocrlf=true` vẫn là unchanged content.
- Vị trí: `test/workflow/self-host.test.ts:21`.
- Reproduction fresh: clean Windows checkout có `.harnix/workflow.md` CRLF, imported `workflowTemplate` LF; raw `toBe` fail, trong khi `sha256` của hai nội dung khớp.
- Impact: full/acceptance gate fail giả theo Git checkout policy dù generator ownership không drift.
- Root cause: self-host assertion nghiêm hơn production contract.
- Remediation: so sánh normalized hash; tiếp tục assert manifest hash và generator version.
- Regression: chính clean Windows checkout là observed RED; focused self-host GREEN chứng minh fix.
- Disposition: `fix-now`.

### F4 — P1 generated-state correctness: committed repo-map cache invalid

- Contract: fresh/current self-host repository cache phải parse/validate; public query chỉ được trả `invalid` cho cache thật sự corrupt/stale.
- Vị trí: `.harnix/cache/repo-map-v1.json`, `test/workflow/self-host.test.ts`.
- Reproduction fresh: query trả `{status:"invalid"}`; outline `README.md#headings` vẫn theo locale order cũ trong khi `validateRepoMap` yêu cầu code-unit order.
- Impact: agent navigation cache không dùng được và Doctor báo project invalid ngay tại clean HEAD.
- Root cause: refactor comparator đã cập nhật reader/writer nhưng generated self-host cache không được rebuild; test chỉ kiểm file tồn tại.
- Remediation: thêm self-host assertion đọc cache bằng canonical reader rồi regenerate bằng hidden repo-map refresh sau source/docs thay đổi.
- Regression: canonical reader trong self-host suite, public query `status: ready` và repo-map integration/acceptance coverage sau regeneration.
- TDD exception: đây là generated snapshot; RED là canonical reader/query, alternative verification là self-host test + public query + release gates.
- Disposition: `fix-now`.

### F5 — P2 performance/privacy hygiene: repo-map enumerate toàn bộ hard-excluded tree

- Contract: repo-map phải bounded, fast và bỏ qua `.git`, `.harnix`, dependency/build roots; JSON output không nên phơi danh sách path nội bộ bị exclude.
- Vị trí: `src/core/repo-map/inventory.ts:10-41`, `src/commands/repo-map-internal.ts:11`.
- Reproduction fresh: hidden refresh trên repository hiện hành trả hàng trăm `.git/**` và `.harnix/**` path trong `skipped`; fixture riêng chứng minh `.git`, `.harnix` và `node_modules` đều đi qua candidate enumeration trước khi bị filter.
- Impact: chi phí traversal/output tăng theo Git object, task history và dependency tree; hidden JSON có thể chứa path metadata không cần thiết.
- Root cause: `globby("**/*")` chỉ áp dụng hard exclusion sau khi đã materialize mọi file candidate.
- Remediation: truyền exact hard-excluded directory patterns vào `globby.ignore`, đồng thời giữ `isHardExcluded` làm defense-in-depth.
- Regression: repo-map service tạo file trong ba hard-excluded roots và assert chúng không xuất hiện ở record lẫn `skipped`; observed RED 1/8 fail, GREEN 8/8 pass.
- Disposition: `fix-now`.

## Không nâng thành finding

- `global-managed-files.ts` vẫn lớn nhưng đã được tách pure JSON/marker/error; kích thước đơn thuần không đủ cho refactor mới.
- Historical task/journal schema warnings và unlinked journal được Doctor preserve theo contract; không rewrite.
- Dependency/toolchain/upstream SemVer là contract độc lập; không bump theo package release và không major-upgrade trái Node 18.
- Manual Kiro hook activation tiếp tục deferred; task này không có authority chạm real profile.
