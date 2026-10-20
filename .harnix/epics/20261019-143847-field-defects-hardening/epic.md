# Epic: Khắc phục lỗi thực địa của Harnix trên repo đa dịch vụ .NET/ABP và Windows

Sửa các lỗi Harnix đã được xác nhận bằng mã nguồn từ báo cáo thực địa của hai agent: dò gốc dự án theo .harnix gần nhất thay vì git root, thông báo đúng cho cổng baseline của --criterion, chạy được lệnh .exe có ký tự | trên Windows và phân loại lỗi hạ tầng, nhận diện đúng test project .NET cùng lọc verify-plan, chuẩn hóa EOL khi băm inputDigest (tương thích digest cũ), bổ sung các cờ CLI còn thiếu và làm sạch đầu ra/ghi file ở lệnh read-only.

- **Cập nhật:** 2026-10-19 15:26:03 +07:00

## Non-goals

- Không đổi schema TaskRecord v3 hay EpicRecord v1.
- Không nới cổng --criterion --met: tiêu chí chỉ met khi có bằng chứng xanh thật.
- Không làm baseline cấp dự án theo tên test (đề xuất #12) trong epic này; cần thiết kế riêng.
- Không thêm daemon, mạng im lặng hay package thứ hai.

## Next task

Không còn task nào chưa hoàn tất.

## Members (8 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261019-143848-resolve-nearest-harnix-ancestor` | Dò gốc dự án theo .harnix gần nhất và báo lỗi rõ khi thiếu | `full` | `completed` |
| 2 | `20261019-143849-criterion-baseline-guidance` | Thông báo rõ cho cổng baseline của --criterion --met | `lite` | `completed` |
| 3 | `20261019-143850-check-runner-exe-and-infra-failure` | Chạy trực tiếp .exe và phân loại lỗi hạ tầng của check | `full` | `completed` |
| 4 | `20261019-143851-dotnet-test-detection-and-verify-plan-scope` | Nhận diện test project .NET và lọc phạm vi verify-plan | `full` | `completed` |
| 5 | `20261019-143852-input-digest-eol-normalization` | Chuẩn hóa EOL khi băm inputDigest và giữ tương thích digest cũ | `full` | `completed` |
| 6 | `20261019-143853-cli-ergonomics-risk-mitigation-init-cwd` | Bổ sung cờ CLI còn thiếu: --mitigation, --init --cwd, cwd cho --with-check, --task cho --set-criterion và cờ bỏ decision/criterion | `full` | `completed` |
| 7 | `20261019-143854-readonly-no-write-and-output-hygiene` | Lệnh read-only không ghi .harnix và làm sạch đầu ra tự sinh | `full` | `completed` |
| 8 | `20261019-144907-detect-non-npm-packages-for-config` | Phát hiện package không có package.json (C#, PHP, Java, Go...) khi ghi config.yaml | `full` | `completed` |

## Task Overview & Scope

### 1. `20261019-143848-resolve-nearest-harnix-ancestor` — Dò gốc dự án theo .harnix gần nhất và báo lỗi rõ khi thiếu

- **Trạng thái:** `completed`
- **Mục tiêu:** Thay việc dừng ở git root bằng việc tìm ancestor gần nhất có .harnix/config.yaml hợp lệ; khi không có thì báo lỗi rõ ràng thay vì ENOENT realpath với đường dẫn bị che.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 2. `20261019-143849-criterion-baseline-guidance` — Thông báo rõ cho cổng baseline của --criterion --met

- **Trạng thái:** `completed`
- **Mục tiêu:** Giữ nguyên điều kiện met của --criterion nhưng khi bị từ chối thì thông báo nêu từng check, lý do (chưa chạy, fail, stale, baseline chưa có hiệu lực) và cách xử lý.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261019-143850-check-runner-exe-and-infra-failure` — Chạy trực tiếp .exe và phân loại lỗi hạ tầng của check

- **Trạng thái:** `completed`
- **Mục tiêu:** Tra PATH/PATHEXT để spawn thẳng .exe (dotnet test --filter "A|B" chạy được), chỉ dùng cmd.exe cho .cmd/.bat, và không tính lỗi hạ tầng build vào bộ đếm retry.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261019-143851-dotnet-test-detection-and-verify-plan-scope` — Nhận diện test project .NET và lọc phạm vi verify-plan

- **Trạng thái:** `completed`
- **Mục tiêu:** Chỉ coi project .NET là có test khi thực sự có test runner, gom theo solution, và cho verify-plan lọc theo đường dẫn, thay đổi Git hoặc đầu ra gọn.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 5. `20261019-143852-input-digest-eol-normalization` — Chuẩn hóa EOL khi băm inputDigest và giữ tương thích digest cũ

- **Trạng thái:** `completed`
- **Mục tiêu:** Băm file văn bản sau khi đổi CRLF thành LF để autocrlf và git stash không làm digest lệch, đồng thời vẫn nhận evidence ghi theo công thức byte thô để không check nào bị stale.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 6. `20261019-143853-cli-ergonomics-risk-mitigation-init-cwd` — Bổ sung cờ CLI còn thiếu: --mitigation, --init --cwd, cwd cho --with-check, --task cho --set-criterion và cờ bỏ decision/criterion

- **Trạng thái:** `completed`
- **Mục tiêu:** Điền các khoảng trống của CLI workflow: --add-risk nhận --mitigation, --init chạy được ở thư mục gốc đa repo qua --cwd, --with-check nhận cwd, --set-criterion dùng được với --task, và có cờ bỏ decision hoặc criterion khi còn planning.
- **Tiêu chí nghiệm thu:** 6 tiêu chí

### 7. `20261019-143854-readonly-no-write-and-output-hygiene` — Lệnh read-only không ghi .harnix và làm sạch đầu ra tự sinh

- **Trạng thái:** `completed`
- **Mục tiêu:** Tái hiện và chặn việc sinh thư mục .harnix rác ở repo chưa init, làm secretAdvisory tôn trọng .gitignore, dùng mẫu prd/plan trung tính và gọn đầu ra preflight.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 8. `20261019-144907-detect-non-npm-packages-for-config` — Phát hiện package không có package.json (C#, PHP, Java, Go...) khi ghi config.yaml

- **Trạng thái:** `completed`
- **Mục tiêu:** Làm detectPackages nhận diện package theo mọi loại manifest (.sln/.csproj, composer.json, pom.xml, go.mod, Cargo.toml, pyproject.toml), gom .NET theo solution, để packages trong config.yaml phản ánh đủ các service backend thay vì chỉ các thư mục có package.json.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
