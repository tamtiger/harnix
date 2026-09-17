# PRD — Mo rong rule tieng Viet sang giao tiep voi nguoi dung

## Outcome

Rule ngon ngu trong AGENTS.md canonical noi ro ca giao tiep chat va noi dung task Harnix deu dung tieng Viet, de mot agent khong con vo tinh 'miss' mot trong hai khia canh nhu truong hop da xay ra (chat tieng Viet nhung task artifact lai tieng Anh).

## Pham vi

- Viet lai bullet rule trong `src/templates/harnix/agents.ts`.
- Cap nhat `test/workflow/templates.test.ts` (hang so vietnameseTaskPolicy va cac assertion lien quan) theo text moi.
- Regenerate `AGENTS.md` that cua repo nay qua `harnix update` de dong bo self-host.
- Xac nhan byte budget 8192 cua ban rong (empty profile) van dat.

## Quyet dinh va ranh gioi

### AC `ac-1`

Bullet rule moi trong template noi ro: giao tiep truc tiep voi nguoi dung VA tao/cap nhat task Harnix deu dung tieng Viet; phan giu nguyen code identifier/command/path/field name khong doi.

### AC `ac-2`

`test/workflow/templates.test.ts` dung text rule moi, van xac nhan ca `renderAgentsTemplate()` rong va AGENTS.md that cua repo deu chua dung rule.

### AC `ac-3`

AGENTS.md that cua repo nay khop byte-for-byte voi output cua template sau khi chay `harnix update`.

### AC `ac-4`

`renderAgentsTemplate({ languages: [], technologies: [], packages: [] })` van duoi 8192 byte.

### AC `ac-5`

Lint/typecheck/build/full acceptance suite (tru `test/unit/package-contract.test.ts` da biet la pre-existing/ngoai pham vi) deu xanh.

## Rui ro

- Them chu co the vuot byte budget 8192 cua ban rong; mitigation: viet gon mot bullet duy nhat, do lai byte truoc khi persist ready.
- Rule nay duoc ship toi moi consumer project bat ke ngon ngu nguoi dung o do; day la thiet ke da co san truoc task nay (khong phai quyet dinh moi cua task nay), va da duoc ghi nhan rieng nhu mot cau hoi thiet ke o docs/prompts/review-refactor-claude-setup.md — khong xu ly lai trong scope nay.
