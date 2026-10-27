# PRD: Tích hợp skill phân tích thiết kế kiến trúc doanh nghiệp `harnix-arch-review`

## 1. Bối cảnh và Mục tiêu
- Bổ sung technique skill thứ 7 `harnix-arch-review` vào hệ sinh thái Harnix (`src/skills/technique-skills.ts`), chuyển thể từ `GST-Skills/06. Technical & Design/architecture-design-review`.
- Cung cấp quy trình chuẩn hóa cho Solution Architect / Tech Lead khi thẩm định kiến trúc hệ thống đa kênh, phân tích WBS, thực hiện 3-way gap analysis trên 2 trục (Customer Requirements & Industry Standard Implicit Misses), thiết kế 8-Layer System Overview (One BFF per Channel), và hợp nhất effort theo công thức Core MAX-Dedup + BFF 15%.

## 2. Phạm vi & Yêu cầu chức năng
- **`ac-1`**: Tạo `src/skills/harnix-arch-review/SKILL.md` (`<= 1,200` tokens, `<= 200` dòng, có `## Evidence and Rationale` trích dẫn `external-research.md`) bao gồm quy trình:
  1. Detect & Research Domain.
  2. WBS Dynamic Extraction (phát hiện cột Backend động, forward-fill Level-1/Level-2, đối chiếu stats row).
  3. 3-Way Gap Analysis trên 2 trục (Thiếu / Thừa / Chưa hợp lý so với yêu cầu khách hàng và chuẩn ngành ngầm định).
  4. 8-Layer System Overview (Actors, Channels, Edge, API Gateway, One BFF per Channel, Core Domain Microservices, Data/Event + Observability, External/Regulatory).
  5. Effort Consolidation: $\text{Core BE} = \sum_{(m, f)} \max_{c} \text{BE}_{c, m, f}$ và $\text{BFF}_c = r_{\text{BFF}} \times \text{Orig BE}_c$ (mặc định 15%), kèm 3 trường hợp ngoại lệ KHÔNG được áp dụng (kênh offline độc lập, hợp đồng pay-per-deliverable, ràng buộc data residency tách riêng hạ tầng).
- **`ac-2`**: Tạo `src/skills/harnix-arch-review/references/domain-briefs.md` và `src/skills/harnix-arch-review/references/wbs-consolidation.md` (mỗi file `<= 2,000` tokens, định dạng `# Heading`, không chứa file ngoài `SKILL.md` và `references/` trong thư mục skill) chứa tri thức 10 ngành (`pharma`, `ecommerce`, `banking`, `insurance`, `logistics`, `healthcare_provider`, `edtech`, `saas_b2b`, `manufacturing_iot`, `supply_chain_b2b`) và hướng dẫn bóc tách WBS/BFF.
- **`ac-3`**: Đăng ký `harnix-arch-review` (kèm map `references`) vào `src/skills/technique-skills.ts`, cập nhật `docs/HARNIX_PRD.md` và `docs/UPSTREAM_MAPPING.md`.
- **`ac-4`**: Cập nhật `test/unit/skills/technique-skills.test.ts` và `test/workflow/skill-sources.test.ts`, vượt qua toàn bộ `pnpm run test:gates` và `pnpm run test`.
- **`ac-5`**: Chạy `pnpm version:sync 2.16.0 --fold-dev --summary 'Tích hợp tinh hoa Backend Harness và Architecture Review từ 04. Backend'` để gộp toàn bộ changelog dev và đóng Epic.

## 3. Non-goals
- Không thêm runtime Python hoặc thư viện sinh PPTX vào dependencies của `@tamtiger/harnix`.
- Không sửa số lượng 6 `workflowSkills` cố định trong `src/skills/catalog.ts`.
