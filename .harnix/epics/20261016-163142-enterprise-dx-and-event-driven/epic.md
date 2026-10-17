# Epic: Nâng cấp Nhận diện Kiến trúc Event-Driven, Discovery Giải pháp Phức hợp và Tối ưu Token

Hỗ trợ bóc tách Messaging topic và HTTP route, ma trận Event Matrix liên service, tự động nhận diện Solution .NET phức hợp và tối ưu token mặc định cho Harnix.

- **Cập nhật:** 2026-10-16 16:31:42 +07:00

## Non-goals

- Không xây dựng semantic static call graph toàn diện để tránh biến Harnix thành CodeQL cồng kềnh.
- Không kéo các parser AST ngoài hay runtime engine nặng nề vào package.

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261016-163143-dotnet-solution-hybrid-discovery` | Tự động phát hiện .NET Solution và hỗ trợ giải pháp hỗn hợp đa hệ sinh thái | `lite` | `completed` |
| 2 | `20261016-163144-repo-map-route-and-event-discovery` | Bóc tách metadata HTTP Route và Messaging Topic cho repo-map | `lite` | `completed` |
| 3 | `20261016-163145-repo-map-cross-service-event-matrix` | Xây dựng ma trận liên kết Publisher và Consumer chéo microservices | `lite` | `completed` |
| 4 | `20261016-163146-workflow-default-brief-and-encoding-safety` | Chuyển các lệnh ghi workflow sang mặc định brief và bảo đảm an toàn UTF-8 trên Windows | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261016-163143-dotnet-solution-hybrid-discovery` — Tự động phát hiện .NET Solution và hỗ trợ giải pháp hỗn hợp đa hệ sinh thái

- **Trạng thái:** `completed`
- **Mục tiêu:** Nhận diện trọn vẹn cả các microservices backend .NET (file .sln / .csproj) trong solution phức hợp có cả frontend web.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261016-163144-repo-map-route-and-event-discovery` — Bóc tách metadata HTTP Route và Messaging Topic cho repo-map

- **Trạng thái:** `completed`
- **Mục tiêu:** repo-map tự động bóc tách các attribute và cấu hình Event/Messaging (CAP, Kafka, RabbitMQ) và HTTP Endpoints.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 3. `20261016-163145-repo-map-cross-service-event-matrix` — Xây dựng ma trận liên kết Publisher và Consumer chéo microservices

- **Trạng thái:** `completed`
- **Mục tiêu:** Hỗ trợ lệnh harnix repo-map --events để kết nối các luồng publish và subscribe topic giữa các service.
- **Tiêu chí nghiệm thu:** 2 tiêu chí

### 4. `20261016-163146-workflow-default-brief-and-encoding-safety` — Chuyển các lệnh ghi workflow sang mặc định brief và bảo đảm an toàn UTF-8 trên Windows

- **Trạng thái:** `completed`
- **Mục tiêu:** Tiết kiệm tối đa token context cho AI bằng cách mặc định hóa brief output và hoàn thiện chỉ dẫn chống lỗi font Windows.
- **Tiêu chí nghiệm thu:** 2 tiêu chí
