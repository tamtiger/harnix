# Implementation Plan: Harmonization of Skills, AGENTS Template and Root AGENTS.md

## Checklist

- [x] `S1` — Đồng bộ metadata.version lên 1.1.18 cho toàn bộ 7 SKILL.md
- [x] `S2` — Bổ sung đầy đủ các quy chuẩn cross-cutting vào 7 SKILL.md
- [x] `S3` — Tối ưu văn phong template agents.ts giữ byte length < 8,192 bytes
- [x] `S4` — Bổ sung chỉ dẫn repo-map và spec/guides vào root AGENTS.md
- [x] `S5` — Chạy full verification suite bảo đảm mọi check xanh

### Slice `S1`

Criteria: `ac-skills-version-sync`
Checks: `check-skills-audit`
Paths: `src/skills/harnix-brainstorm/SKILL.md`, `src/skills/harnix-implement/SKILL.md`, `src/skills/harnix-check/SKILL.md`, `src/skills/harnix-debug/SKILL.md`, `src/skills/harnix-finish-work/SKILL.md`, `src/skills/harnix-continue/SKILL.md`, `src/skills/harnix-research/SKILL.md`

### Slice `S2`

Criteria: `ac-skills-cross-cutting-gaps`
Checks: `check-skills-audit`
Paths: `src/skills/harnix-brainstorm/SKILL.md`, `src/skills/harnix-implement/SKILL.md`, `src/skills/harnix-check/SKILL.md`, `src/skills/harnix-debug/SKILL.md`, `src/skills/harnix-finish-work/SKILL.md`, `src/skills/harnix-continue/SKILL.md`, `src/skills/harnix-research/SKILL.md`

### Slice `S3`

Criteria: `ac-agents-template-budget`
Checks: `check-templates-test`
Paths: `src/templates/harnix/agents.ts`, `test/workflow/templates.test.ts`

### Slice `S4`

Criteria: `ac-root-agents-harmonization`
Checks: `check-skills-audit`
Paths: `AGENTS.md`

### Slice `S5`

Criteria: `ac-verification-suite`
Checks: `check-full-build-and-test`
Paths: `src/templates/harnix/agents.ts`, `AGENTS.md`
