# Implementation Plan: Nhận diện test project .NET, gom theo solution và lọc phạm vi verify-plan

## Hiện trạng đã đối chiếu với mã
- `src/core/stack/verify-detection.ts`: `detectDotnetVerify()` đồng bộ, trả `hasTests: true`, `test: "dotnet test"`, `format: "dotnet format --verify-no-changes"` cho mọi thư mục có `.csproj|.fsproj|.sln`.
- `src/core/stack/workspace-detection.ts`: `collectDotNetWorkspaces` đọc `.sln` (sâu tối đa 3) và thêm từng thư mục project; `discoverNestedManifests` thêm mọi thư mục có `.csproj`/`.fsproj`/`.sln`; kết quả đi qua `detectEcosystemVerify`.
- `src/core/stack/verify-plan.ts`: `buildVerifyPlan(root, { recursive, impact })`, `mergePackages` gộp workspace với `config.verify.packages`, cảnh báo `No tests detected for package` cho mọi package không có test; `detectChangedFiles` đã đọc `git status --porcelain`.
- `src/commands/verify-plan.ts` và `src/cli-workflow-commands.ts` (khoảng dòng 235): chỉ có `--recursive`, `--impact`.
- Test hiện có kỳ vọng hành vi cũ: `verify-detection.test.ts` ".NET verify commands" (csproj trống vẫn có test) và `workspace-detection.test.ts` hai ca `.sln` (mỗi project một package).

## Hợp đồng (contract)
- Module mới `src/core/stack/dotnet-projects.ts`:
  - `isDotnetTestProject(projectText: string): boolean` theo biểu thức: `Microsoft.NET.Test.Sdk`, `<IsTestProject>true</IsTestProject>` hoặc `<PackageReference Include="xunit|nunit|mstest...">` (không phân biệt hoa thường).
  - `solutionProjectPaths(solutionText: string): string[]` trả đường dẫn project tương đối của solution, chuẩn hóa `/`.
  - `inspectDotnetDirectory(dir: string, entries: readonly string[]): Promise<{ hasTests: boolean; testCommand: string }>`; `testCommand` là `dotnet test <tên>.sln` (tên có khoảng trắng thì bọc nháy kép) khi có solution, ngược lại `dotnet test`.
  - Giới hạn: tối đa 200 project, mỗi file đọc tối đa 256 KiB, lỗi đọc coi như không phải test project.
- `detectEcosystemVerify` nhánh .NET dùng `inspectDotnetDirectory`: `commands.test` chỉ có khi `hasTests`.
- `detectWorkspaces`: mỗi thư mục chứa `.sln` là một package; thư mục project mà solution tham chiếu (khác thư mục solution) bị loại khỏi danh sách, kể cả khi `--recursive`; csproj độc lập không thuộc solution nào vẫn là package.
- `VerifyPlanOptions` thêm `path?: string`, `changed?: boolean`, `brief?: boolean`. `--path` và `--changed` chỉ lọc `packages` (giữ `hasTests`, `commands` toàn cục). `--brief` giữ package `hasTests`, mỗi package chỉ `{ path, hasTests, commands: { test? } }`. Thứ tự áp dụng: `--path` rồi `--changed` rồi `--brief`.
- Đầu ra mặc định (không cờ mới) giữ nguyên cấu trúc.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/stack/dotnet-projects.test.ts` (mới): các dạng test project, class library, solution một/nhiều project, đường dẫn Windows/POSIX, có khoảng trắng, nhiều solution, file lỗi.
- [x] [chk-focus] `verify-detection.test.ts`: class library `hasTests: false` không có `commands.test`; test project có `dotnet test`; thư mục có `.sln` dùng `dotnet test X.sln`. `workspace-detection.test.ts`: workspace nhiều service (mỗi service một `.sln` và nhiều project) chỉ ra mỗi service một package, kể cả `--recursive`; cập nhật hai ca `.sln` cũ theo hợp đồng mới. `verify-plan.test.ts` và `test/unit/commands/verify-plan.test.ts`: `--path`, `--changed` (repo Git tạm), `--brief`, và đầu ra mặc định không đổi.

### Slice 2 (GREEN)
- [x] [chk-focus] Viết `dotnet-projects.ts`; đổi nhánh .NET của `verify-detection.ts`; sửa `collectDotNetWorkspaces` và `discoverNestedManifests` trong `workspace-detection.ts` để gom theo solution.
- [x] [chk-focus] Thêm `path`, `changed`, `brief` vào `buildVerifyPlan`, `inspectVerifyPlan` và khai báo ba cờ trong `cli-workflow-commands.ts`; cập nhật `README.md` (bảng lệnh) và mô tả `verify-plan` trong `src/templates/harnix/workflow.md` rồi `pnpm selfhost:sync`.

### Slice 3: cổng hợp đồng và phát hành
- [x] [chk-gates] `pnpm run test:gates` (cli-contract, docs, instruction budget, golden); `pnpm version:sync 2.12.0-dev.4 --summary <text> --kind fixed` và changelog.
- [x] [check-suite] Toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Đầu ra mặc định của `verify-plan` giữ field và thứ tự cũ; cờ mới chỉ thu hẹp, không thêm field mới vào đầu ra.
- `--changed` chỉ đọc Git; lỗi hoặc không có Git thì không thu hẹp.
- Mỗi file trong `src/` dưới 300 dòng code, complexity dưới 20; hướng phụ thuộc `commands -> core -> utils`.
- Không chạy `dotnet` hay lệnh ngoài trong test; test dùng fixture file trong thư mục tạm cô lập.
- Không đổi `docs/IMPLEMENTATION_PLAN.md` section 4 (frozen contracts).

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-focus | `pnpm exec vitest run test/unit/core/stack test/unit/commands/verify-plan.test.ts test/integration/commands/verify-plan.test.ts` | focused |
| ac-4 | chk-gates | `pnpm run test:gates` | focused |
| ac-4 | check-suite | `pnpm run test` | full |
