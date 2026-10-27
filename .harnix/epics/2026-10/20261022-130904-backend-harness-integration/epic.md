# Epic: Tích hợp tinh hoa Backend Harness và Kiến trúc Doanh nghiệp vào Harnix

Tích hợp các thực hành kiểm chứng từ bộ công cụ 04. Backend vào Harnix: (1) Làm giàu hướng dẫn kỹ thuật Spring Boot, .NET và Relational Database với các enterprise pattern thực chiến; (2) Nâng cấp các core skills của Harnix về an toàn migration cơ sở dữ liệu ứng dụng, nhận diện anti-pattern bảo mật và ma trận vùng quyền; (3) Tích hợp skill phân tích thiết kế kiến trúc doanh nghiệp (harnix-arch-review) hỗ trợ review WBS, gap analysis 3 chiều và bóc tách Core/BFF.

- **Cập nhật:** 2026-10-22 13:09:04 +07:00

## Non-goals

- Không thêm runtime Python hay dependency bên ngoài vào Harnix
- Không thêm platform ngoài 6 platform được hỗ trợ trong PRD
- Không tự động commit, merge, push hay deploy

## Next task

Không còn task nào chưa hoàn tất.

## Members (3 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261022-130905-enrich-backend-guides` | Làm giàu bộ hướng dẫn kỹ thuật Spring Boot, .NET và Relational Database | `lite` | `completed` |
| 2 | `20261022-130906-harness-safety-guardrails` | Nâng cấp an toàn migration DB ứng dụng, nhận diện anti-pattern bảo mật và ma trận quyền hạn | `lite` | `completed` |
| 3 | `20261022-130907-arch-review-skill` | Tích hợp skill phân tích thiết kế kiến trúc doanh nghiệp harnix-arch-review | `full` | `completed` |

## Task Overview & Scope

### 1. `20261022-130905-enrich-backend-guides` — Làm giàu bộ hướng dẫn kỹ thuật Spring Boot, .NET và Relational Database

- **Trạng thái:** `completed`
- **Mục tiêu:** Bổ sung các enterprise pattern thực chiến từ 04. Backend vào src/guides/technologies/ (spring.md, dotnet.md, relational.md, postgresql.md, sqlserver.md): Base Entity auditable, soft-delete với partial index, optimistic locking (@Version / concurrency token), N+1 prevention (JOIN FETCH, EntityGraph, AsSplitQuery, BatchSize), chuẩn mã lỗi DOMAIN_ACTION_REASON, và expand/contract migration; đảm bảo vượt qua toàn bộ test:gates và giới hạn token/section.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 2. `20261022-130906-harness-safety-guardrails` — Nâng cấp an toàn migration DB ứng dụng, nhận diện anti-pattern bảo mật và ma trận quyền hạn

- **Trạng thái:** `completed`
- **Mục tiêu:** Mở rộng harnix-migration-safety bao hàm an toàn migration database ứng dụng (bắt buộc rollback test pass, cấm thao tác DB production trực tiếp), mở rộng harnix-security-lens và harnix-review phát hiện các anti-pattern (nối chuỗi SQL, logging debug thay vì structured logger), và bổ sung ma trận 3 vùng quyền (Autonomous / Review-required / Blocked) vào harnix-plan và harnix-implement.
- **Tiêu chí nghiệm thu:** 5 tiêu chí

### 3. `20261022-130907-arch-review-skill` — Tích hợp skill phân tích thiết kế kiến trúc doanh nghiệp harnix-arch-review

- **Trạng thái:** `completed`
- **Mục tiêu:** Tạo skill mới src/skills/harnix-arch-review/ chuyển thể từ GST-Skills, bao gồm domain_briefs.json (tri thức ngành Pharma, Banking, E-commerce, Logistics), quy trình review WBS, gap analysis 3 chiều (Thừa/Thiếu/Chưa hợp lý) và chuẩn hóa bóc tách Backend Core vs BFF 15%, đóng epic với version bump 2.16.0.
- **Tiêu chí nghiệm thu:** 5 tiêu chí
