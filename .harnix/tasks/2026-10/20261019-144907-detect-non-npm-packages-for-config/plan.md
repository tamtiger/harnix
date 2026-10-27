# Implementation Plan: Phát hiện package không có package.json khi ghi config.yaml

## Hiện trạng đã đối chiếu với mã
- `src/core/stack/detection.ts` `detectPackages(facts, packageManager)`: `packageFiles = facts.files.filter(basename === "package.json")`; mỗi thư mục được đánh giá bằng `evaluateFacts` trên các file và dependency nằm dưới nó; giữ khi có language hoặc technology; `verificationCommands` từ scripts của `package.json`.
- `detectProject` dùng `packages.length > 0 ? packages : fallbackPackage(...)`.
- `src/core/stack/dotnet-projects.ts` (task trước) có `solutionProjectPaths(text)`; `detection.ts` có `readBoundedText` riêng (256 KiB).
- `test/unit/core/stack/detection.test.ts` (314 dòng) có các ca `.cs`/`.sln`/fallback `.`.

## Hợp đồng (contract)
- `src/core/stack/package-roots.ts`: `findPackageRoots(files: readonly { path: string }[], readText: (path: string) => Promise<string | undefined>): Promise<string[]>`; đường dẫn đầu vào và đầu ra là POSIX tương đối gốc; kết quả sắp theo `compareCodeUnits`, không trùng; `.` cho gốc.
- Marker: `package.json`, `composer.json`, `pom.xml`, `build.gradle`, `build.gradle.kts`, `go.mod`, `Cargo.toml`, `pyproject.toml`; `.sln` (thư mục chứa nó); `.csproj|.fsproj|.vbproj` (thư mục chứa nó, trừ khi bị solution tham chiếu).
- Project của solution: `posix.normalize(posix.join(thư mục sln, posix.dirname(đường dẫn project)))`; bỏ nếu thoát khỏi gốc (`..`) hoặc trùng thư mục solution.
- `detectPackages` nhận thêm hàm đọc text; `verificationCommands` như cũ nếu thư mục có `package.json`, ngược lại `[]`; `packageManager` chỉ gán cho package có `package.json`.

## Execution Slices

### Slice 1 (RED)
- [x] [chk-focus] `test/unit/core/stack/package-roots.test.ts` (mới): từng marker, thư mục `.sln` ở gốc và lồng, project do solution tham chiếu bị gom, csproj độc lập, đường dẫn Windows trong `.sln`, project thoát gốc bị bỏ, không trùng và có thứ tự.
- [x] [chk-focus] `detection.test.ts`: workspace kiểu payment-hub (frontend npm cộng hai service C# mỗi service một `.sln` nhiều project) cho đúng ba package với `csharp`, `dotnet`, `abp` đúng cho service; repo chỉ có `pom.xml`/`go.mod`/`composer.json`; `package.json` cùng `.sln` ở gốc chỉ một package `.`; repo không marker nào vẫn dùng `fallbackPackage`.

### Slice 2 (GREEN)
- [x] [chk-focus] Viết `package-roots.ts`; đổi `detectPackages` dùng nó; chạy toàn bộ `test/unit/core/stack` và test init; chỉ sửa test cũ khi hành vi cũ là hệ quả của lỗi và ghi vào quyết định.

### Slice 3: phát hành và đóng epic
- [x] [check-suite] `pnpm version:sync 2.12.0 --summary <text> --kind fixed --fold-dev` (task cuối của epic, gộp các mục dev), rồi toàn bộ `pnpm run test` một lần ở bước verify.

## Guardrails & Invariants
- Package có `package.json` giữ nguyên kết quả cũ; thứ tự package theo đường dẫn.
- Mỗi file trong `src/` dưới 300 dòng code; test mới dưới 400 dòng; chỉ format file mình sửa.
- Không thêm file hay cấu hình mới trong dự án người dùng; đọc `.sln` bị giới hạn kích thước.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1, ac-2, ac-3 | chk-focus | `pnpm exec vitest run test/unit/core/stack test/integration/commands/init.test.ts` | focused |
| ac-1, ac-2, ac-3 | check-suite | `pnpm run test` | full |
