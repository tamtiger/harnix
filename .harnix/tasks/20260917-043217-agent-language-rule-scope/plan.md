# Plan — Mo rong rule tieng Viet sang giao tiep voi nguoi dung

## Checklist trien khai

- [x] `SLICE-1` — Viet lai rule trong template + cap nhat test (RED truoc, GREEN sau), kiem tra byte budget.
- [x] `SLICE-2` — Regenerate AGENTS.md that cua repo qua harnix update, xac nhan khop template.
- [x] `SLICE-3` — Chay full acceptance suite, bump version, changelog.

### Slice `SLICE-1`

Sua bullet rule trong `src/templates/harnix/agents.ts` de noi ro ca giao tiep voi nguoi dung lan task Harnix deu dung tieng Viet. Cap nhat hang so `vietnameseTaskPolicy` va cac assertion lien quan trong `test/workflow/templates.test.ts` cho khop. Quan sat RED (test fail vi text cu khong con khop) truoc khi sua source, roi GREEN sau khi sua.

Criteria: `ac-1`, `ac-2`, `ac-4`
Checks: `chk-templates-unit`
Paths: `src/templates/harnix/agents.ts`, `test/workflow/templates.test.ts`

### Slice `SLICE-2`

Rebuild roi chay `node dist/cli.js update` tai repo goc de regenerate `AGENTS.md` tu template moi (self-host). Xac nhan file thuc te khop byte-for-byte voi `renderAgentsTemplate()` ung voi profile ngon ngu/cong nghe hien tai cua repo.

Criteria: `ac-3`
Checks: `chk-agents-selfhost`
Paths: `AGENTS.md`

### Slice `SLICE-3`

Chay lint/typecheck/build/full acceptance suite (loai tru file `.kilo` pre-existing da biet); bump version va them mot muc CHANGELOG.

Criteria: `ac-5`
Checks: `chk-acceptance`
Paths: `package.json`, `CHANGELOG.md`
