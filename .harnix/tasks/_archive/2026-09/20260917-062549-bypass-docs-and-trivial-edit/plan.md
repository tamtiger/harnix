# Plan — Mo rong Bypass cho docs-only va bounded literal-value edit

## Checklist trien khai

- [x] `SLICE-1` — Sua bullet Bypass/Lite trong workflow.ts va harnix-brainstorm SKILL.md, cap nhat test tuong ung.
- [x] `SLICE-2` — Cap nhat agents.ts ngan gon, kiem tra byte budget.
- [x] `SLICE-3` — Dong bo .harnix/workflow.md (harnix update) va AGENTS.md (hand-sync) cua repo nay.
- [x] `SLICE-4` — Cap nhat docs/HARNIX_WORKFLOW.md muc 3.1, chay full acceptance, bump version.

### Slice `SLICE-1`

Sua bullet Bypass trong `workflowTemplate` (`src/templates/harnix/workflow.ts`) de liet ke docs-only edit va bounded literal-value-only edit; sua bullet tuong ung trong `src/skills/harnix-brainstorm/SKILL.md`. Cap nhat `test/workflow/skill-sources.test.ts` va `test/workflow/templates.test.ts` (phan lien quan) cho khop text moi.

Criteria: `ac-1`, `ac-2`
Checks: `chk-skill-unit`, `chk-templates-unit`
Paths: `src/templates/harnix/workflow.ts`, `src/skills/harnix-brainstorm/SKILL.md`, `test/workflow/skill-sources.test.ts`, `test/workflow/templates.test.ts`

### Slice `SLICE-2`

Sua dong Lite trong `src/templates/harnix/agents.ts` de tham chieu ngan gon toi carve-out moi (khong lap lai toan bo dinh nghia, giu bootstrap lean). Do lai byte cua ban rong sau khi sua.

Criteria: `ac-3`
Checks: `chk-templates-unit`
Paths: `src/templates/harnix/agents.ts`

### Slice `SLICE-3`

Rebuild, chay `node dist/cli.js update` de regenerate `.harnix/workflow.md` tu template moi (self-host qua manifest). Hand-sync dong tuong ung trong `AGENTS.md` (khong duoc manifest quan ly, nhu da phat hien o task truoc).

Criteria: `ac-4`
Checks: `chk-selfhost-sync`
Paths: `.harnix/workflow.md`, `AGENTS.md`

### Slice `SLICE-4`

Cap nhat `docs/HARNIX_WORKFLOW.md` muc 3.1 Bypass cho khop contract moi. Chay lint/typecheck/build/full acceptance suite (loai tru file `.kilo` pre-existing da biet); bump version va them mot muc CHANGELOG.

Criteria: `ac-5`, `ac-6`
Checks: `chk-docs-sync`, `chk-acceptance`
Paths: `docs/HARNIX_WORKFLOW.md`, `package.json`, `CHANGELOG.md`
