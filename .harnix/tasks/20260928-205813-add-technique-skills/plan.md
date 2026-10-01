# Kế hoạch thực hiện — [15] Thư viện technique-skill hẹp (5–10, có bằng chứng) + extension point

## Danh sách công việc theo thứ tự

- [x] Slice 1: Xây dựng 5 technique-skill chuẩn Agent Skills có trích dẫn bằng chứng từ `external-research.md`.
- [x] Slice 2: Cập nhật `src/skills/catalog.ts` hỗ trợ `techniqueSkills`, tách biệt với 6 `workflowSkills`.
- [x] Slice 3: Tích hợp `techniqueSkills` vào `globalSkillDesiredFiles` để phân phối đến 6 nền tảng.
- [x] Slice 4: Triển khai extension point `.harnix/spec/skills/` và tích hợp discovery vào `src/commands/skills.ts`.
- [x] Slice 5: Viết test cho technique skills, extension point fixture và cập nhật các test hiện hành.
- [x] Slice 6: Cập nhật tài liệu kỹ thuật (`docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`).
- [x] Slice 7: Rà soát friction và độ tiêu hao token, ghi nhận vào `.harnix/tasks/20261001-211347-harnix-friction-backlog/prd.md`.
- [x] Slice 8: Chạy kiểm thử xác minh tập trung và toàn bộ test suite.

---

### Chi tiết từng Slice

#### Slice 1: Xây dựng 5 technique-skill
- **Files**:
  - `src/skills/harnix-verification-gap/SKILL.md` (bằng chứng BMAD reviewer, external-research.md §B & §D 10)
  - `src/skills/harnix-bugfix-preserve/SKILL.md` (bằng chứng Kiro Bugfix Spec "what must remain working", TDAD 2603.17973, external-research.md §B, §C 81, §D 9)
  - `src/skills/harnix-flaky-test/SKILL.md` (bằng chứng Superpowers "the project's suite defines green", external-research.md §B 62)
  - `src/skills/harnix-migration-safety/SKILL.md` (bằng chứng IFScale 2507.11538, D1/D11 backward-compat, external-research.md §C 80)
  - `src/skills/harnix-security-lens/SKILL.md` (bằng chứng ECC security patterns, external-research.md §A2 45, 51)
- **Yêu cầu**: Frontmatter hợp lệ (`name: harnix-*`, `description: Use when ...`, `metadata.version`), có phần `## Evidence and Rationale` trích dẫn rõ từ `external-research.md`, hướng dẫn ngắn gọn súc tích (≤ 1.200 tokens).

#### Slice 2: Cập nhật `src/skills/catalog.ts`
- **Files**: `src/skills/catalog.ts`
- **Logic**: Import 5 technique skills; khai báo `techniqueSkills: readonly SkillTemplate[]`; export `canonicalSkills = [...workflowSkills, ...techniqueSkills]`; giữ nguyên `workflowSkills` là 6 stage-owners / workflow execution skills; validate cả 2 tập hợp.

#### Slice 3: Tích hợp vào global skill sink
- **Files**: `src/templates/harnix/global-surface.ts`
- **Logic**: `globalSkillDesiredFiles(sourceIdPrefix)` tạo entries cho cả `workflowSkills` và `techniqueSkills`.

#### Slice 4: Extension point `.harnix/spec/skills/`
- **Files**:
  - `src/core/spec/project-skills.ts` (mới): hàm discover custom skills từ `.harnix/spec/skills/<name>/SKILL.md`.
  - `src/commands/skills.ts`: `reportSkillCatalog` và `reportSkill` nhận diện custom project skills khi chạy trong project context.

#### Slice 5: Tests & Fixtures
- **Files**:
  - `test/unit/skills/technique-skills.test.ts` (mới): kiểm tra 5 technique-skill về số lượng, frontmatter, bằng chứng, không lọt vào preflight stage.
  - `test/integration/commands/skills-extension.test.ts` (mới): tạo fixture project có `.harnix/spec/skills/`, kiểm tra discover và report.
  - Cập nhật `test/unit/templates/harnix/global-surface.test.ts`, `test/platform/global-adapters.test.ts`, `test/workflow/instruction-budget.test.ts` nếu cần để phản ánh số lượng skill cài đặt mới.

#### Slice 6: Đồng bộ tài liệu
- Cập nhật `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` phản ánh 5 technique skills và `.harnix/spec/skills/`.

#### Slice 7: Ghi nhận friction & token vào backlog
- Cập nhật `.harnix/tasks/20261001-211347-harnix-friction-backlog/prd.md`.

#### Slice 8: Verification
- Chạy các checks: `check-technique-skills`, `check-project-skills-ext`, `check-global-surface`, `check-docs-sync`, `check-suite`.
