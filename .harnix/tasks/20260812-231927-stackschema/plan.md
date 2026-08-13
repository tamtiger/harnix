# Implementation plan: catalog stack và guide dựa trên bằng chứng

## S-1 — Refactor bảy workflow skill thành source canonical

1. Ghi research artifact đối chiếu frozen Trellis `516b34e…`, ECC `f1fec0e…` và Superpowers `44c9b2d…`; khóa behavior được giữ/loại cho từng Harnix skill.
2. Viết RED test mới `test/workflow/skill-sources.test.ts` yêu cầu đủ bảy source `src/skills/harnix-*/SKILL.md`, frontmatter khớp thư mục, description có trigger cụ thể, activation guard, stage ownership, incoming/persist/exit, upstream attribution và các guardrail behavior tương ứng.
3. Thêm raw Markdown loader trong `tsup.config.ts` và declaration TypeScript. Tạo catalog parse/validate source; `src/templates/harnix/workflow.ts` chỉ giữ workflow template và re-export catalog, không chứa prose skill.
4. Adapt từng `SKILL.md` từ mapping PRD. Mỗi skill phải tự đủ dùng, dưới 500 dòng, imperative, không phụ thuộc reference không được cài, không yêu cầu universal worktree/subagent/Git mutation.
5. Refactor configurator Kiro/Antigravity/Codex để xuất cùng canonical content; bỏ guard renderer lặp. Giữ path/sourceId/ownership manifest hiện tại.
6. GREEN test source/frontmatter, behavior invariants, byte parity ba platform, setup/update/doctor preservation, typecheck/build/pack. Forward-test ít nhất planning-pressure case và verification-pressure case bằng context tối thiểu; không cho evaluator biết expected fix.
7. Cập nhật `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/UPSTREAM_MAPPING.md`, `README.md`, `CHANGELOG.md` và attribution nếu behavior/public source layout thay đổi.

Ready gate riêng cho S-1: source layout, mapping behavior, rejected upstream behavior, packaging method, parity contract và validation đã được chốt; không còn quyết định product material. Đây là prerequisite trước S0 stack/catalog.

## S0 — Đóng băng contract chuẩn

Cập nhật `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/UPSTREAM_MAPPING.md`, `docs/UPSTREAM_BASELINE.md`, `README.md` và `CHANGELOG.md` trước khi sửa runtime. Đóng băng config v2, schema catalog, ID/kind ban đầu, mapping v1, confidence, CLI transition, metadata/path guide, precedence, provenance và output shape.

Checkpoint:

- Tài liệu chuẩn phân biệt language nguồn với technology; không gọi NestJS, Spring, React, Vue, ABP hoặc .NET là language.
- Tài liệu có `--technologies` và evidence output nhưng không mở rộng boundary bảy command.
- Detection catalog và guide catalog là hai contract riêng.
- Ý tưởng kiến trúc được attribution; không copy content ngoài trước khi freeze revision/license.

### Review checkpoint 2026-08-13

Resume target là S0, không phải S2/S3. Normative docs hiện vẫn khóa `LanguageId` compound và config v1, nên chưa được sửa runtime catalog/config cho tới khi source-of-truth patch của S0 pass consistency review.

Các contract từng còn mơ hồ đã được khóa trong task PRD trước handoff:

- `DetectorPredicate` là discriminated union `file | dependency | content`; glob chỉ hỗ trợ POSIX literal, `*`, `**`, content match là bounded literal và expression có semantics `allOf`/`anyOf`/`noneOf` xác định.
- Catalog có `LanguageDescriptor`, `TechnologyDescriptor`, `GuideDescriptor`, provenance chung, `contentPath`, reference/cycle validation và initial technology-kind mapping cụ thể.
- Language evidence phải độc lập với framework/runtime evidence. NestJS không tự suy ra TypeScript; Spring/build file không tự suy ra Java; `.sln`/`global.json` không tự suy ra C#; React/Vue không tự suy ra JavaScript hoặc TypeScript.
- Detection output dùng `DetectionMatch`/`DetectionEvidence` bounded, redacted, deterministic. Init result thêm `technologies` và `detection.matches`; evidence không được persist vào config.
- Compatible unknown key round-trip áp dụng ở top-level và nested package/context/runtime object.

S0 là docs-first exception cho TDD: verification thay cho RED runtime test gồm link/schema consistency search, `pnpm lint`, `pnpm typecheck`, `git diff --check`, và review rằng bảy-command/platform/global contracts không đổi. Sau S0 mới bắt đầu RED `test/unit/catalog.test.ts`.

### Immediate implementation handoff

1. **S0a — normative schema:** thay mục config v1 trong `docs/IMPLEMENTATION_PLAN.md` bằng parse compatibility v1 + write schema v2; thêm exact catalog/detection/guide types và mapping v1. Không đổi TaskRecord, journal, project/global managed manifest hoặc Doctor report schema version.
2. **S0b — product/workflow:** cập nhật `docs/HARNIX_PRD.md` và `docs/HARNIX_WORKFLOW.md` cho language/technology, explicit migration, read-only no-write, confidence/evidence và guide activation.
3. **S0c — public/provenance:** cập nhật `README.md`, `CHANGELOG.md`, `docs/UPSTREAM_MAPPING.md`, `docs/UPSTREAM_BASELINE.md`; phân biệt nguồn architecture research với content adaptation. Không thêm guide content ngoài trong slice này.
4. **S0 verify:** chạy consistency search để không còn compound ID được mô tả như v2 language, rồi `pnpm lint`, `pnpm typecheck`, `git diff --check`.
5. **S1 RED:** tạo `test/unit/catalog.test.ts` trước, cover duplicate IDs, invalid enum/confidence/provenance, unsafe glob/contentPath, empty/duplicate predicates, missing/cyclic references, deterministic ordering và frozen descriptor snapshot.
6. **S1 GREEN:** tạo `src/catalog/types.ts`, `src/catalog/catalog.ts`, `src/catalog/validation.ts` và `src/utils/stack.ts`. Catalog chỉ phụ thuộc pure types/data; `utils/stack.ts` sở hữu normalization/mapping v1 và có thể import catalog, không có filesystem/CLI/platform import ngược vào catalog.

S1 không đổi config persistence, detector filesystem, rules seeding hoặc CLI. Những consumer đó bắt đầu ở S2 trở đi, nhờ vậy RED/GREEN đầu tiên review được độc lập và không gộp migration với detection rewrite.

## S1 — Thêm type và validator cho catalog

Tạo module ít dependency dưới `src/catalog/` hoặc `src/utils/stack.ts`. Định nghĩa `LanguageId`, `TechnologyId`, `TechnologyKind`, detector predicate/expression, guide metadata, label, validator, normalization, reference, provenance và mapping v1. Config/core được import catalog; catalog không import detector filesystem, command, UI hoặc platform template.

Viết RED test cho ID trùng, kind/confidence sai, reference `implies`/guide/extends/supersedes thiếu, cycle, path/glob/content predicate không an toàn, thứ tự xác định, snapshot descriptor và provenance thiếu. Giữ technology ban đầu gồm .NET, ABP, NestJS, Spring, React web, Vue, CodeIgniter nhưng phải biểu diễn được mọi kind.

## S2 — Config v2 và migration explicit

Đổi persistence mixed `LanguageId` hiện tại thành `languages` và `technologies` ở project/package. Parse YAML unknown thành v1, v2, corrupt hoặc future; validate v1 bằng legacy ID; normalize v1 trong memory; serialize v2 theo thứ tự ổn định; giữ unknown key tương thích; cung cấp primitive migration atomic, giữ permission.

Viết RED test cho output v2 mặc định, ID sai, mảng trùng/không sort, package validation, mọi mapping v1, unknown-key preservation, idempotency, read không ghi, YAML hỏng và future schema. Migration không quét lại repository.

## S3 — Detection khai báo dựa trên evidence

Tách collection khỏi classification:

1. Thu thập bounded fact về file, path, manifest dependency và content được chọn; giữ exclusion generated/vendor/cache/docs/binary/symlink.
2. Evaluate expression catalog bằng `allOf`, `anyOf`, `noneOf`.
3. Áp dụng `implies` và `supersedes` xác định.
4. Trả match language/technology có confidence, evidence repository-relative đã redact và source.
5. Normalize match confirmed/probable thành config ID; báo match weak để xác nhận.

Khóa regression trước khi implement: .NET thuần không phải ABP; Maven/Gradle chung không phải Spring; Composer chung không phải Laravel/CodeIgniter; dependency có thẩm quyền mới thêm technology; React Native không suy ra React web; TypeScript/JavaScript độc lập; monorepo union xác định; path loại trừ và symlink không ảnh hưởng. Không chạy tool project hoặc parse source không giới hạn.

## S4 — Xây guide catalog và thư viện ban đầu

Thay rule record một-file-per-legacy-stack bằng guide registry và content tập trung:

```text
src/guides/common/<topic>.md
src/guides/languages/<language>/<topic>.md
src/guides/technologies/<kind>/<technology>/<topic>.md
```

Slice đầu tiên chỉ phân rã guidance Harnix đang sở hữu; không đồng thời mở rộng content ngoài. Mỗi descriptor khai báo category (`rule`, `guide`, `skill`), description, profile/path/topic applicability, activation, priority, relation composition và provenance. Validate hai chiều giữa packaged file và descriptor.

Selection ghép common → language → technology cụ thể hơn, rồi priority/ID. Chỉ materialize content được chọn dưới `.harnix/spec/guides/`. Rule luôn active phải ngắn; guide theo path và skill theo task load on demand. Test multi-technology, glob, topic task, dedupe, precedence, supersedence và context bound.

Batch content ngoài về sau phải freeze commit upstream, license, mapping, adaptation và release-scan evidence cho từng guide. Catalog cộng đồng chỉ là nguồn discovery, không tự động import.

## S5 — CLI, init, template và managed lifecycle

Thêm `technologies?: TechnologyId[]` vào init option/result và `--technologies <csv>` vào Commander. Validate override trước mutation. Giữ parser alias cho compound legacy nhận qua `--languages`; normalize kèm deprecation warning và không persist ID legacy. Bỏ unsafe cast.

Render riêng `Languages:` và `Technologies:` trong `AGENTS.md`, có thể tóm tắt confidence/evidence mà không lộ absolute path. Trong `update`, migrate config explicit, chọn guide catalog, rồi reconcile managed file. Chỉ xóa flat/compound file cũ còn nguyên; giữ file đã sửa, collision không tracked, task, journal, file khác và global integration.

## S6 — Doctor, context, provenance và fixture tương thích

Doctor báo config v1 là outdated/fixable và dùng cùng migration primitive cho `--fix`. Thêm finding về catalog integrity, unknown ID, profile conflict, guide thiếu và guide cũ đã sửa, với JSON/exit deterministic.

Mở rộng context signal với technology và topic guide. Match ở một trong hai facet chỉ nhận một stack bonus `+100` có giới hạn, không cộng theo từng facet. Chọn metadata trước, chỉ đọc content phù hợp, không tăng hook bound và không biến hook thành writer.

Thêm fixture cho mọi v1 ID, package profile hỗn hợp, ambiguity React/Vue lịch sử, unknown field tương thích, atomic failure recovery, thao tác lặp byte-idempotent, guide legacy đã sửa, CLI alias chuyển tiếp, provenance chính xác và attribution release. Cập nhật Trellis migration để tạo config v2 nhưng không đổi schema task, journal, project/global manifest hoặc Doctor nếu shape không đổi.

## S7 — Verification và release gate

Chạy focused catalog plan, sau đó typecheck, lint, build, full test, acceptance, pack, fake-home tarball smoke, release/attribution scan và `git diff --check`. Smoke project monorepo mới và upgrade v1 trong repository/home tạm biệt lập.

Compliance review phải xác nhận không field hiện tại nào lưu technology dưới `languages`, evidence chung không nhận nhầm framework, detection không chạy code repository, read-only không migration, content đã chọn có provenance hợp lệ và user content được giữ.

Quality/security review phải xác nhận catalog order deterministic, path/glob an toàn, read có giới hạn, evidence được redact, reference/cycle được validate, config replacement atomic, context bound, package footprint và không lộ machine path/secret.

Evidence lịch sử ngày 2026-08-12 từng ghi `pnpm-workspace.yaml` untracked làm package-invariant test fail. Tại review 2026-08-13 file này không còn hiện diện và worktree trước review sạch; không suy diễn ai đã xóa nó. Full-suite/final gate vẫn phải chạy fresh và mọi user-owned file xuất hiện lại phải được giữ nguyên.

## Thứ tự giao hàng

Triển khai thành bảy slice RED–GREEN có thể review: contract/catalog schema, config/migration, evidence detector, guide library/selector ban đầu, CLI/template/update, doctor/context/compatibility, release verification đầy đủ. Không gộp config migration, detector rewrite và guide reconciliation vào một slice chưa có test.
