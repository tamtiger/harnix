# Kế hoạch — [09] Phát hiện lệnh verify đa ngôn ngữ, workspace và suite gate

## Checklist thực thi

- [x] SLICE-1: Tách module `src/core/config/` (schema, validate, core) để file `<= 300` dòng và hỗ trợ `verify:` trong `config.yaml`
- [x] SLICE-2: Phát hiện lệnh verify cho ≥ 8 hệ sinh thái trong `src/core/stack/` (`verify-detection.ts`)
- [x] SLICE-3: Hỗ trợ monorepo workspaces (pnpm, Cargo, go.work, Maven) theo nearest-manifest-wins
- [x] SLICE-4: Xử lý cảnh báo repo không có test (`hasTests: false`), tạo `src/core/stack/verify-plan.ts` và lệnh public `harnix verify-plan`
- [x] SLICE-5: Tách `src/core/stack/detection.ts` `<= 300` dòng và gỡ `VERIFY_DETECTION_MODULES` khỏi `eslint.config.mjs`
- [x] SLICE-6: Triển khai Suite Gate tại `ready` và `finish` trong `src/core/workflow/` kèm regression test kịch bản `pause`
- [x] SLICE-7: Cập nhật docs (PRD, WORKFLOW, IMPLEMENTATION_PLAN, CHANGELOG, skills) và chạy toàn bộ kiểm chứng

## Chi tiết các lát cắt

### SLICE-1: Config module refactoring & `verify:` section
- Tách `src/core/config/config.ts` thành `config-schema.ts`, `config-validate.ts`, `config.ts`.
- Thêm `verify` vào `HarnixConfigV2` và allowlists.
- Bổ sung unit test cho config `verify:`.

### SLICE-2: Multi-ecosystem verify detection
- Tạo `src/core/stack/verify-detection.ts`:
  - Node.js (npm, pnpm, yarn, bun)
  - Python (uv, poetry, pip, pytest, ruff, mypy)
  - Rust (cargo test, clippy, fmt)
  - Go (go test, go vet, golangci-lint)
  - JVM (Gradle, Maven)
  - .NET (dotnet test, dotnet format)
  - PHP (composer test, phpunit)
  - Swift (swift test)
  - Flutter / Dart (flutter test, dart test)
- Viết unit tests với fixtures cho từng hệ sinh thái.

### SLICE-3: Monorepo workspace detection
- Phát hiện pnpm-workspace, Cargo workspace, go.work, Maven modules.
- Áp dụng nguyên tắc nearest-manifest-wins.

### SLICE-4: Verify plan & `harnix verify-plan` CLI command
- Tạo `src/core/stack/verify-plan.ts` tổng hợp plan toàn project và package.
- Cảnh báo rõ khi repo không có test (`hasTests: false`).
- Thêm command `harnix verify-plan` vào `src/cli-program.ts` và lệnh `src/commands/verify-plan.ts`.
- Cập nhật test `cli-contract.test.ts` (16 commands).

### SLICE-5: Line cap & ESLint exemption cleanup
- Bảo đảm `config-*.ts`, `detection.ts`, `verify-detection.ts`, `verify-plan.ts` đều `<= 300` dòng.
- Gỡ `VERIFY_DETECTION_MODULES` khỏi `eslint.config.mjs`.

### SLICE-6: Suite gate implementation & regression test
- Thêm kiểm tra suite check trong `assertReadyRequirements` (`src/core/workflow/ready.ts`).
- Thêm kiểm tra suite check pass với current digest trong `assertTaskReadyForFinishing` (`src/core/workflow/completion.ts`).
- Viết test regression kịch bản task `pause` (check hẹp bị từ chối).

### SLICE-7: Documentation parity & full suite verification
- Đồng bộ PRD, WORKFLOW, IMPLEMENTATION_PLAN, CHANGELOG.
- Chạy `check-detect-ecosystems`, `check-monorepo-workspaces`, `check-no-tests-warning`, `check-suite-gate`, `check-docs-sync`, và `check-suite`.
