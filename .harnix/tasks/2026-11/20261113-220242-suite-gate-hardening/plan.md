# Plan: Siết suite gate

## Execution Slices

- [x] [chk-focused] Slice 1 (ac-1): RED trong `test/unit/core/workflow/suite-gate.test.ts`: `coversSourceAndTest(["*"])` là false; `["src/a.ts","test/a.test.ts"]` là false; `["src/**","test/**"]`, `["**"]`, `["src/**/*.ts","test/**/*.ts"]`, `["Foo.Api/**","Foo.Api.Tests/**"]` vẫn true. GREEN: bỏ `*` khỏi `WILDCARD_INPUTS` và thêm điều kiện "input là cây (`isTree`) hoặc có đoạn `**`" trong `coversSource`/`coversTest`. Cập nhật test hiện có khẳng định file đơn (dòng 33).
- [x] [chk-focused] Slice 2 (ac-2): RED trong `test/unit/core/workflow/suite-command.test.ts`: `acceptsSuiteCommand(root, "pnpm run test", "packages/a", known, packages)` là false khi package a có lệnh test khác; true khi package a có đúng lệnh đó; `cwd` `.`/undefined giữ true. GREEN: thêm tham số `packages` (path và lệnh test) cho `acceptsSuiteCommand`, truyền từ `selectSuiteCheck` (`plan.packages` ở cả vòng trực tiếp và vòng recursive).
- [x] [chk-gates] Slice 3 (ac-3): sửa thông báo lỗi `suiteCommandError`/ready/finish nêu luật mới và `--set-check ... --reason`; đồng bộ AGENTS.md, `docs/HARNIX_WORKFLOW.md` (Suite Gate), `docs/IMPLEMENTATION_PLAN.md`; `pnpm selfhost:sync` nếu template workflow đổi; `HARNIX_UPDATE_GOLDEN=1` chỉ cho đúng chuỗi mới rồi kiểm diff golden.
- [x] [check-suite] Slice 4: bump `pnpm version:sync 2.33.0` với `--fold-dev` (member cuối theo `--epic-order`, đóng epic bằng release minor), `pnpm format`, `pnpm lint`, rồi toàn bộ `pnpm run test`.

## Guardrails & Invariants

- Không đổi công thức digest, circuit breaker, hay hành vi `dotnet test` (`cwd` hoặc đường dẫn `.sln`).
- Input và lệnh đang hợp lệ trong các test hiện có (suite-gate, suite-command, ready, finish, init) phải vẫn xanh trừ hai test cố ý khẳng định hành vi cũ.
- Thông báo lỗi giữ dạng một câu kèm hint chạy được.

## Verification Matrix

| Check | Chứng minh | Lệnh |
| --- | --- | --- |
| chk-focused | ac-1, ac-2: hai kẽ hở đóng, các dạng phổ biến vẫn chấp nhận | `pnpm exec vitest run test/unit/core/workflow/suite-gate.test.ts test/unit/core/workflow/suite-command.test.ts --coverage.enabled=false` |
| chk-gates | ac-3: tài liệu, CLI, golden đồng bộ | `pnpm run test:gates` |
| check-suite | không hồi quy toàn bộ | `pnpm run test` |
