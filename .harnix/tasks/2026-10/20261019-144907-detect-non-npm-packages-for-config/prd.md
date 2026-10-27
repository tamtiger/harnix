# PRD: Phát hiện package không có package.json khi ghi config.yaml

## Bối cảnh & Vấn đề
`harnix init` ghi mục `packages` của `.harnix/config.yaml` từ `ProjectDetection.packages` (`src/core/stack/detection.ts`). Hàm `detectPackages` chỉ duyệt các file `package.json`, nên chỉ thư mục có `package.json` mới thành package. Trong một workspace nhiều service C#/ABP (mỗi service có `.sln` và hàng chục project, không có `package.json`), `config.yaml` chỉ liệt kê frontend `react-web` và bỏ sót toàn bộ service backend. `fallbackPackage` chỉ chạy khi không có package nào nên không bù được. Hậu quả: thiếu `languages`/`technologies` theo từng package và `project-facts.md` phản ánh sai cấu trúc.

Catalog đã nhận `csharp`, `dotnet`, `abp` từ nội dung `.csproj`; lỗi nằm ở bước chọn thư mục gốc của package, không ở catalog.

## Ranh giới & Ràng buộc
- Không đổi schema `config.yaml` v2 hay `DetectedPackage`; chỉ mở rộng cách chọn thư mục package.
- Hành vi cũ của package có `package.json` giữ nguyên (cả `verificationCommands`).
- Quy tắc gom .NET dùng cùng nguồn sự thật với task trước (`solutionProjectPaths`): thư mục `.sln` là một package, project mà solution tham chiếu không là package riêng, csproj độc lập là package.
- Giữ giới hạn quét hiện có (`maxFiles`, `maxDepth`, danh sách thư mục bị bỏ qua); không đọc thêm file lớn.
- Không thêm phụ thuộc mạng; đọc `.sln` bị chặn kích thước như các file manifest khác.

## Yêu cầu kỹ thuật cốt lõi
- Module mới `src/core/stack/package-roots.ts`: `findPackageRoots(files, readText)` trả danh sách thư mục package (POSIX, `.` cho gốc) gồm: thư mục của `package.json`, `composer.json`, `pom.xml`, `build.gradle(.kts)`, `go.mod`, `Cargo.toml`, `pyproject.toml`; thư mục chứa `.sln`; thư mục của `.csproj|.fsproj|.vbproj` không thuộc solution nào; trừ các thư mục project được một `.sln` tham chiếu (khác thư mục solution).
- `detectPackages` dùng danh sách đó thay cho việc lọc `package.json`; mỗi thư mục được đánh giá với phạm vi file riêng (như hiện nay) và chỉ giữ khi có language hoặc technology; `verificationCommands` chỉ có với thư mục có `package.json`.
- `fallbackPackage` giữ nguyên cho repo không có thư mục package nào.

## Rủi ro & Chiến lược giảm thiểu
- Repo nhiều module Maven/Cargo sinh nhiều package hơn trước: chấp nhận vì mỗi module là một đơn vị thật; thứ tự và nội dung xác định (sắp theo đường dẫn).
- Test cũ kỳ vọng fallback `.` cho repo chỉ có csproj trong thư mục con có thể lệch: rà từng test, chỉ sửa khi hành vi cũ là hệ quả của lỗi này, ghi lại trong quyết định.
