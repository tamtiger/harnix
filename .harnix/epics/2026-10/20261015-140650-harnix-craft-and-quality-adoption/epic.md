# Epic: Áp dụng có chọn lọc công cụ kiểm định skill, tri thức craft và quy tắc thẩm định từ ai-native-client và ak-quick-setup vào Harnix

Nâng cấp độ trưởng thành công nghệ của Harnix lên v2.6.0 thông qua việc: (1) ghi nhận provenance và feature registry, (2) bổ sung craft references chuyên sâu gồm quy tắc thẩm định và giao thức subagent, (3) thêm technique skill harnix-sequential-thinking, (4) tích hợp link validation, skill contract/cruft lint và trigger eval harness, (5) bổ sung 2 Topic Guides ui-ux và web-testing, (6) xác minh toàn diện và phát hành minor 2.6.0.

- **Cập nhật:** 2026-10-15 14:06:50 +07:00

## Non-goals

- Không thêm daemon, background sync hay silent network
- Không đưa vào endpoint, PAT hay token Keycloak nội bộ
- Không tự động hóa Git branch, worktree hay commit ngầm
- Không làm thay đổi schema của TaskRecord v3
- Không biến subagent thành dependency bắt buộc của core workflow

## Next task

Không còn task nào chưa hoàn tất.

## Members (6 tasks)

| # | Task ID | Title | Mode | Status |
|---|---------|-------|------|--------|
| 1 | `20261015-140650-upstream-craft-provenance` | Ghi nhận nguồn provenance, giấy phép và đăng ký feature registry cho ai-native-client và ak-quick-setup | `lite` | `completed` |
| 2 | `20261015-140651-workflow-craft-references` | Bổ sung các craft references từ hai repo nguồn vào workflow skills của Harnix | `lite` | `completed` |
| 3 | `20261015-140652-skill-sequential-thinking` | Xây dựng technique skill thứ 6: harnix-sequential-thinking | `lite` | `completed` |
| 4 | `20261015-140653-skill-validation-tooling` | Tích hợp bộ công cụ kiểm định chất lượng: link validation, skill contract lint và trigger evaluation harness | `lite` | `completed` |
| 5 | `20261015-140654-stack-guides-ui-testing` | Bổ sung hai Topic Guides: ui-ux và web-testing tuân thủ chuẩn 3 phần và trần 600 tokens | `lite` | `completed` |
| 6 | `20261015-140655-release-2-6-0` | Xác minh toàn diện, self-host sync, bump phiên bản minor 2.6.0 và đóng Epic | `lite` | `completed` |

## Task Overview & Scope

### 1. `20261015-140650-upstream-craft-provenance` — Ghi nhận nguồn provenance, giấy phép và đăng ký feature registry cho ai-native-client và ak-quick-setup

- **Trạng thái:** `completed`
- **Mục tiêu:** Cập nhật NOTICE, UPSTREAM_BASELINE.md, UPSTREAM_MAPPING.md, đăng ký feature provenance craft-and-decision-discipline và cập nhật test kiểm chứng provenance.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 2. `20261015-140651-workflow-craft-references` — Bổ sung các craft references từ hai repo nguồn vào workflow skills của Harnix

- **Trạng thái:** `completed`
- **Mục tiêu:** Bổ sung các references: decision-discipline (5 quy tắc thẩm định), brownfield, commit-hygiene, so-what, technical-recap, scouting-isolation (Status Protocol) vào workflow skills.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261015-140652-skill-sequential-thinking` — Xây dựng technique skill thứ 6: harnix-sequential-thinking

- **Trạng thái:** `completed`
- **Mục tiêu:** Xây dựng technique skill harnix-sequential-thinking thuần markdown, frontmatter chuẩn Harnix, cập nhật catalog, PRD, workflow và tests.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261015-140653-skill-validation-tooling` — Tích hợp bộ công cụ kiểm định chất lượng: link validation, skill contract lint và trigger evaluation harness

- **Trạng thái:** `completed`
- **Mục tiêu:** Tích hợp test markdown links, lint ranh giới skill không quá 200 dòng, không chứa cruft và script đo trigger TF-IDF stdlib.
- **Tiêu chí nghiệm thu:** 4 tiêu chí

### 5. `20261015-140654-stack-guides-ui-testing` — Bổ sung hai Topic Guides: ui-ux và web-testing tuân thủ chuẩn 3 phần và trần 600 tokens

- **Trạng thái:** `completed`
- **Mục tiêu:** Soạn thảo và đăng ký 2 Topic Guides ui-ux và web-testing tuân thủ nghiêm ngặt chuẩn Verify/Constraints/Common mistakes và dưới 600 tokens.
- **Tiêu chí nghiệm thu:** 1 tiêu chí

### 6. `20261015-140655-release-2-6-0` — Xác minh toàn diện, self-host sync, bump phiên bản minor 2.6.0 và đóng Epic

- **Trạng thái:** `completed`
- **Mục tiêu:** Chạy toàn bộ 273+ test suites, sync template workflow, bump phiên bản minor 2.6.0 --fold-dev và hoàn tất Epic.
- **Tiêu chí nghiệm thu:** 1 tiêu chí
