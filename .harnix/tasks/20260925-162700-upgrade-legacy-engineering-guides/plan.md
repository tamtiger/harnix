# Implementation Plan — Nâng cấp nội dung 21 Engineering Guides cũ

## Danh sách công việc (Checklist)

- [x] `S1` — Nâng cấp nội dung 8 guide ngôn ngữ và common (common, typescript, javascript, python, csharp, java, go, php)
- [x] `S2` — Nâng cấp nội dung 7 guide framework, library và runtime (dotnet, react-web, nestjs, spring, vue, abp, codeigniter)
- [x] `S3` — Nâng cấp nội dung 6 guide cơ sở dữ liệu (relational, postgresql, mysql, sqlserver, mongodb, redis)
- [x] `S4` — Cập nhật bản sao spec guides trong .harnix/spec/guides/ và đồng bộ CHANGELOG
- [x] `S5` — Kiểm thử chất lượng toàn diện và xác thực full gate

## Chi tiết các lát cắt triển khai (Slices)

### Slice `S1`
Criteria: `ac-upgrade-language-common-guides`
Checks: `check-guides-catalog-tests`
Paths: `src/guides/common.md`, `src/guides/languages/*`

Biên soạn mở rộng và chuẩn hóa nội dung 8 guide ngôn ngữ và common đạt chiều dài từ 3.200 - 4.500 ký tự với 4 đề mục H2 chuyên sâu.

### Slice `S2`
Criteria: `ac-upgrade-framework-runtime-guides`
Checks: `check-guides-catalog-tests`
Paths: `src/guides/technologies/framework/*`, `src/guides/technologies/library/*`, `src/guides/technologies/runtime/*`

Biên soạn mở rộng nội dung 7 guide framework, library và runtime đạt chiều dài từ 3.500 - 4.800 ký tự với 4 đề mục H2 chuyên sâu.

### Slice `S3`
Criteria: `ac-upgrade-database-guides`
Checks: `check-guides-catalog-tests`
Paths: `src/guides/technologies/database/*`

Biên soạn mở rộng 6 guide cơ sở dữ liệu về indexing, query tuning, transaction isolation, connection pooling và cache invalidation.

### Slice `S4`
Criteria: `ac-guide-quality-and-verification`
Checks: `check-guides-catalog-tests`
Paths: `.harnix/spec/guides/**`, `CHANGELOG.md`

Chạy harnix update để đồng bộ bản sao spec guides trong .harnix/spec/guides/ và cập nhật CHANGELOG.md cho đợt nâng cấp.

### Slice `S5`
Criteria: `ac-guide-quality-and-verification`
Checks: `check-full-build-and-test`
Paths: `src/guides/**`, `test/**`

Xác thực toàn bộ test suites, typecheck, lint và build đảm bảo không phát sinh bất kỳ lỗi nào.
