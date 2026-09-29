# PRD — Chuẩn hóa cấu trúc và chất lượng test

## Kết quả và giá trị

Bộ test có cấu trúc dự đoán được, file nhỏ dễ đọc, fixture dùng chung và một sàn coverage chặn giảm chất lượng. Sau task này, các task tiếp theo (`add-verify-detection`, `add-platform-registry`...) thêm test vào đúng chỗ, dùng builder có sẵn và không làm coverage tụt.

## Phạm vi

Trong phạm vi:

- Bố cục: `test/unit/**` phản chiếu `src/**` (`test/unit/<đường dẫn module>.test.ts`); `test/integration/commands/<command>.test.ts` phản chiếu `src/commands`; các suite còn lại (`integration/scenarios`, `workflow`, `platform`, `safety`, `migration`) đặt tên theo tính năng. Mọi file test có đuôi `.test.ts`. `test/README.md` mô tả mục đích từng suite.
- Không file test nào quá 400 dòng: tách `internal-workflow.test.ts`, `task-state.test.ts`, `global-managed-files.test.ts`, `routing.test.ts`, `doctor.test.ts`, `setup.test.ts`, `internal-context.test.ts`, `cli.test.ts`, `task-contract-v3.test.ts` theo module mới của `restructure-code`.
- Builder dùng chung trong `test/support/`: TaskRecord (v1/v2/v3), check, evidence, criterion, EpicRecord, project tạm, home tạm, clock và múi giờ cố định; các file test thay fixture dựng tay lặp lại bằng builder.
- Mọi module trong `src` có ít nhất một test trực tiếp hoặc nằm trong danh sách ghi rõ lý do; bổ sung test cho các module chưa có (`internal-context-cli`, `repo-map-internal`, `workflow-helpers`, `global-surface`, `global-managed-error`, `global-managed-markers`...).
- Coverage bằng `@vitest/coverage-v8` (đã được người dùng cho phép cài), `pnpm test` chạy coverage, ngưỡng đặt bằng mức đo cuối cùng và ghi trong `vitest.config.ts`.
- Không nới lỏng: số test và số assertion không giảm so với baseline (689 test chạy, 2.338 lệnh `expect`).

Ngoài phạm vi: đổi hành vi hay code sản phẩm, bump version, commit/push/PR.

## Quyết định đã chốt

- Suite `migration` được giữ làm suite tương thích dữ liệu cũ (task v1/v2, `context.json`, `.harnix/roadmaps` sang `.harnix/epics`).
- Test kiểm cấu trúc và baseline là một file `test/unit/test-structure.test.ts`, không nằm trong mô hình phản chiếu `src`.
- Khi tách một file test, giữ nguyên từng test và assertion; chỉ chuyển chỗ và thay fixture bằng builder tương đương.

## Tiêu chí chấp nhận

### AC `ac-test-layout`

Thư mục test phản chiếu `src` theo bố cục trên và mọi file theo quy ước `<module>.test.ts`; có `test/README.md` mô tả mục đích từng suite.

**Verifies:** `check-test-structure`.

### AC `ac-split-large-tests`

Không file test nào quá 400 dòng.

**Verifies:** `check-test-structure`.

### AC `ac-shared-builders`

Builder dùng chung cho TaskRecord, EpicRecord, project tạm, home tạm, clock và múi giờ; fixture bản ghi task/epic dựng tay chỉ còn ở danh sách ngoại lệ ghi lý do (kiểm tra hình dạng sai, dữ liệu cũ).

**Verifies:** `check-test-structure`.

### AC `ac-untested-modules`

Mọi module trong `src` có ít nhất một test trực tiếp hoặc được ghi rõ lý do trong danh sách.

**Verifies:** `check-test-structure`.

### AC `ac-coverage-floor`

`pnpm test` chạy coverage với ngưỡng bằng mức đo hiện tại, ghi trong `vitest.config.ts`.

**Verifies:** `check-coverage`.

### AC `ac-no-weakening`

Số test và số assertion không giảm so với baseline; toàn bộ suite pass.

**Verifies:** `check-test-structure` và `check-suite`.

### AC `ac-docs-sync`

Docs, `README.md`, `AGENTS.md` và `CHANGELOG.md` mô tả bố cục test, builder và sàn coverage.

**Verifies:** `check-docs-sync` và `check-suite`.
