# Implementation Plan — Flatten Guides, Mở rộng Stack và Catalog Detection

## Danh sách công việc (Checklist)

- [x] `S1` — Flatten 21 file guides hiện tại thành *.md và cập nhật catalog import paths
- [x] `S2` — Soạn thảo 5 engineering guides cho các ngôn ngữ mới (rust, kotlin, swift, dart, cpp)
- [x] `S3` — Soạn thảo 8 engineering guides cho các framework mới (nextjs, fastapi, django, laravel, express, angular, gin, axum)
- [x] `S4` — Cập nhật types, catalog registry và cơ chế manifest auto-detection
- [x] `S5` — Kiểm thử chất lượng toàn diện, cập nhật test suite và xác thực full gate

## Chi tiết các lát cắt triển khai (Slices)

### Slice `S1`
Criteria: `ac-flatten-guide-structure`
Checks: `check-guides-catalog-tests`
Paths: `src/guides/**`, `test/unit/rules.test.ts`

Flatten toàn bộ 21 file trong src/guides/ từ category/name/engineering.md sang category/name.md. Cập nhật src/guides/catalog.ts và hàm guideOutputPath.

### Slice `S2`
Criteria: `ac-stack-expansion-guides`
Checks: `check-guides-catalog-tests`
Paths: `src/guides/languages/*`

Tạo mới 5 file guide cho các ngôn ngữ: rust.md, kotlin.md, swift.md, dart.md, cpp.md. Cung cấp context chuẩn của từng stack, best practices và conventions.

### Slice `S3`
Criteria: `ac-stack-expansion-guides`
Checks: `check-guides-catalog-tests`
Paths: `src/guides/technologies/framework/*`

Tạo mới 8 file guide cho các framework: nextjs.md, fastapi.md, django.md, laravel.md, express.md, angular.md, gin.md, axum.md. Cung cấp context chuẩn của từng framework.

### Slice `S4`
Criteria: `ac-catalog-and-detection`
Checks: `check-guides-catalog-tests`
Paths: `src/catalog/catalog.ts`, `src/catalog/types.ts`, `src/utils/detection.ts`, `test/unit/catalog.test.ts`, `test/unit/detection.test.ts`

Mở rộng danh mục LanguageId, TechnologyId trong types.ts, cập nhật mảng supported trong catalog.ts, và bổ sung quy tắc nhận diện manifest files trong detection.ts.

### Slice `S5`
Criteria: `ac-guide-quality-and-tests`
Checks: `check-full-build-and-test`
Paths: `src/guides/**`, `test/unit/**`

Kiểm tra độ dài >= 2.000 chars và >= 3 H2 cho tất cả các guide mới. Chạy toàn bộ test suites, typecheck, lint và build để đảm bảo chất lượng hệ thống.
