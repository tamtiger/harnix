# Kế hoạch — Chuẩn hóa test

## Checklist thực thi

- [x] INFRA — builder dùng chung, cấu hình coverage, `test/README.md`, test cấu trúc và baseline
- [x] REORGANIZE — chuyển file test vào bố cục phản chiếu `src`, tách file quá 400 dòng
- [x] BUILDERS — thay fixture dựng tay lặp lại bằng builder dùng chung
- [x] MISSING — bổ sung test cho module chưa có test trực tiếp
- [x] COVERAGE — chốt ngưỡng coverage bằng mức đo cuối cùng
- [x] DOCS — docs, README, `AGENTS.md`, `CHANGELOG.md`
- [x] GATE — chạy bộ kiểm chứng đầy đủ và ghi evidence

## Chi tiết

### INFRA

Làm: `test/support/builders.ts` (task v1/v2/v3, check, evidence, criterion, epic, clock và múi giờ cố định, project tạm), `vitest.config.ts` coverage v8, script `test` chạy coverage, `test/README.md`, `test/unit/test-structure.test.ts`.

### REORGANIZE

Làm: chuyển và đổi tên file, sửa import tương đối, tách file lớn theo module mới.
Kiểm chứng: `check-test-structure`, số test và assertion không giảm.

### BUILDERS

Làm: thay fixture lặp lại bằng builder; giữ ngoại lệ có lý do.

### MISSING

Làm: test trực tiếp cho module thiếu.

### COVERAGE

Làm: đo lại và đặt ngưỡng bằng mức đo cuối.
Kiểm chứng: `pnpm exec vitest run --coverage`.

### DOCS

Làm: mô tả bố cục, builder và sàn coverage.

### GATE

Làm: chạy từng check tập trung rồi bộ đầy đủ, ghi evidence với digest trước và sau.
