# PRD: Nhận diện test project .NET, gom theo solution và lọc phạm vi verify-plan

## Bối cảnh & Vấn đề
`detectDotnetVerify()` (`src/core/stack/verify-detection.ts`) luôn trả `hasTests: true` và `test: "dotnet test"` cho mọi thư mục có `.csproj`, `.fsproj` hoặc `.sln`. Trong một workspace nhiều service ABP (mỗi service có hàng chục project Domain, Application.Contracts, EntityFrameworkCore...), `harnix verify-plan --recursive` liệt kê từng project con như một package riêng có lệnh test, dù phần lớn là class library không có test runner. Hệ quả: `project-facts.md` phình to, agent chạy `dotnet test` trên thư viện không có test, tốn token và có thể fail oan. `collectDotNetWorkspaces` (`workspace-detection.ts`) còn mở rộng mỗi `.sln` thành từng project thay vì một đơn vị solution.

Ngoài ra `verify-plan` luôn in toàn bộ package (hàng chục mục, ~15-20 KB) dù người dùng chỉ làm việc trong một service, trái với nguyên tắc token economy của Harnix.

## Ranh giới & Ràng buộc
- Không đổi schema config và không đổi các trường hiện có của đầu ra `verify-plan`; chỉ thêm cờ lọc. Đầu ra mặc định (không cờ mới) giữ cấu trúc cũ.
- `--changed` chỉ đọc Git (`git status --porcelain`), không mutate Git; không có Git thì không lọc theo thay đổi.
- Không dùng heuristic theo tên thư mục (`*Tests`): nội dung `.csproj` là nguồn quyết định.
- Giữ `hasTests` toàn repository tính trên toàn bộ package (cổng Suite Gate không phụ thuộc cờ lọc).
- Logic xác định test project và đọc solution đặt trong một module dùng chung (`dotnet-projects.ts`) để task phát hiện package cho `config.yaml` tái sử dụng.

## Yêu cầu kỹ thuật cốt lõi
- Một `.csproj`/`.fsproj`/`.vbproj` là test project khi chứa `Microsoft.NET.Test.Sdk`, `<IsTestProject>true</IsTestProject>` hoặc `PackageReference` tới `xunit*`, `nunit*`, `mstest*`.
- Một thư mục .NET có `hasTests` khi có ít nhất một test project (qua các project của `.sln` nếu có, ngược lại qua các project trong thư mục); chỉ khi đó mới có `commands.test`: `dotnet test <tên>.sln` nếu có solution, ngược lại `dotnet test`. `format` giữ nguyên.
- Thư mục chứa `.sln` là một package; các project mà solution tham chiếu không còn là package riêng.
- `verify-plan` nhận `--path <dir>` (giữ package nằm trong hoặc bao chứa `<dir>`), `--changed` (giữ package có file thay đổi theo Git) và `--brief` (chỉ package có test, mỗi package chỉ giữ `path`, `hasTests` và lệnh `test`).

## Rủi ro & Chiến lược giảm thiểu
- Đổi hành vi nhận diện làm các test cũ kỳ vọng "mọi csproj đều có test" và "mỗi project trong sln là một package" lệch: cập nhật các test đó có chủ đích và ghi lại trong quyết định của task.
- Đọc nội dung nhiều `.csproj`: giới hạn số project và kích thước mỗi file đọc, bỏ qua file lỗi.
- Một thư mục có nhiều `.sln`: chọn solution đầu tiên theo thứ tự mã đơn vị để kết quả xác định.
