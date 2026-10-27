# PRD — Mo rong Bypass cho docs-only va bounded literal-value edit

## Outcome

Sua prompt/docs thuan tuy va doi mot literal value don le (khong anh huong behavior/interface/schema) khong con bat buoc tao task Harnix; contract moi nay dong nhat o template, skill va docs nguon.

## Pham vi

- Sua bullet Bypass/Lite trong `src/templates/harnix/workflow.ts` va `src/skills/harnix-brainstorm/SKILL.md`.
- Cap nhat ngan gon trong `src/templates/harnix/agents.ts` (khong vuot byte budget 8192).
- Dong bo `.harnix/workflow.md` (qua harnix update) va `AGENTS.md` (hand-sync) cua repo nay.
- Cap nhat `docs/HARNIX_WORKFLOW.md` muc 3.1 Bypass.

## Quyet dinh va ranh gioi

### AC `ac-1`

Bullet Bypass trong template liet ke ro docs-only edit va bounded literal-value-only edit la Bypass, tru khi doi frozen contract hoac chua material decision.

### AC `ac-2`

`src/skills/harnix-brainstorm/SKILL.md` dong bo cung dinh nghia.

### AC `ac-3`

`src/templates/harnix/agents.ts` cap nhat ngan gon, khong vuot 8192 byte cho ban rong.

### AC `ac-4`

.harnix/workflow.md va AGENTS.md that cua repo nay khop wording moi.

### AC `ac-5`

docs/HARNIX_WORKFLOW.md muc 3.1 khong con documentation-drift.

### AC `ac-6`

Test lien quan pass va full acceptance suite (tru file .kilo da biet) deu xanh.

## Rui ro

- src/core/workflow.ts's routeWorkflow() reference model va test cua no KHONG duoc dong bo trong task nay (da xac nhan khong co live caller); day la residual gap co chu y, ghi ro trong bao cao thay vi am tham bo qua.
- 'Docs-only' co the bi hieu sai neu mot file vua co doi prose vua co doi logic; mitigation: giu nguyen safety valve cu (doi frozen contract/material decision van la Lite/Full), khong tao dinh nghia moi long leo hon.
