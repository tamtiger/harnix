# Mo rong rule tieng Viet trong AGENTS.md/template sang giao tiep voi nguoi dung

- **ID:** 20260917-043217-agent-language-rule-scope
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-17T04:32:17.103Z
- **Updated:** 2026-09-17T04:48:53.732Z

## Goal

Rule 'Luon dung tieng Viet' trong canonical AGENTS.md template hien chi noi ro ve noi dung task Harnix (task.json/prd.md/plan.md/design.md/research/journal), khong noi ro ve giao tiep/tra loi truc tiep voi nguoi dung, dan toi truong hop mot agent tra loi chat tieng Viet nhung lai viet task artifact bang tieng Anh. Rule phai duoc viet lai de bao phu ro rang ca hai, ap dung dong bo cho AGENTS.md cua repo nay va template shipped cho moi consumer project.

## Non-goals

- Khong doi rule thanh dieu kien hoa qua .harnix/config.yaml (da duoc ghi nhan la mot lua chon rieng trong docs/prompts/review-refactor-claude-setup.md, khong phai yeu cau lan nay).
- Khong doi noi dung nao khac trong AGENTS.md template ngoai bullet rule ngon ngu.
- Khong doi cac prompt lich su duoi docs/prompts/ (chi la ban ghi audit tai mot thoi diem, khong phai template song).

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-1` (met): Bullet rule trong src/templates/harnix/agents.ts noi ro ca hai: (a) giao tiep truc tiep voi nguoi dung va (b) tao/cap nhat task Harnix deu dung tieng Viet, giu nguyen phan giu lai code identifier/command/path/field name.
- `ac-2` (met): test/workflow/templates.test.ts duoc cap nhat dung theo text rule moi va van xac nhan ca renderAgentsTemplate() rong va AGENTS.md that cua repo nay deu chua dung rule moi.
- `ac-3` (met): AGENTS.md that cua repo nay duoc phat hien la mot tai lieu duy tri rieng (khong sinh byte-for-byte tu renderAgentsTemplate() - phat hien trong luc thuc hien, khong phai gia dinh ban dau); doan rule tieng Viet hien co trong file nay duoc cap nhat dung wording moi, cung noi dung voi template.
- `ac-4` (met): renderAgentsTemplate({ languages: [], technologies: [], packages: [] }) van duoi 8192 byte sau khi them rule.
- `ac-5` (met): Lint/typecheck/build/full acceptance suite (tru test/unit/package-contract.test.ts da biet la pre-existing/ngoai pham vi) deu xanh.

## Required checks

- `chk-templates-unit` (focused): Chay test/workflow/templates.test.ts voi rule moi. — pass (2026-09-17T04:48:39.662Z)
- `chk-agents-selfhost` (focused): Kiem tra AGENTS.md that cua repo chua dung cau rule moi (dong bo noi dung voi template, khong phai regenerate toan bo file). — pass (2026-09-17T04:48:39.662Z)
- `chk-acceptance` (full): Chay lint, typecheck, build va full acceptance suite (loai tru file bi anh huong boi worktree ngoai pham vi da biet truoc). — pass (2026-09-17T04:48:39.662Z)

## Decisions

- **dec-1** — Phan loai Full thay vi Lite.
  - _Why:_ Doi mot canonical, self-hosted, test-enforced template duoc ship toi moi consumer project qua harnix init/update; day la frozen public contract, khong phai docs-only prose don le.
- **dec-2** — Viet lai thanh mot bullet duy nhat neu ro ca giao tiep va task artifact, thay vi tach thanh hai bullet.
  - _Why:_ AGENTS.md co test rieng giu bootstrap 'lean' (duoi 8192 byte cho ban rong); gop chung mot cau ro rang tranh phinh to ma van dong bo hai khia canh de khong bi 'miss' rieng le nhu truong hop da xay ra.
- **dec-3** — Khong dieu kien hoa rule bang .harnix/config.yaml trong lan nay.
  - _Why:_ Day la mot cau hoi thiet ke rieng da duoc ghi nhan truoc do (docs/prompts/review-refactor-claude-setup.md dong 77); yeu cau hien tai chi la mo rong pham vi rule dang co, khong phai xem xet lai toan bo chinh sach hardcode ngon ngu cho moi consumer.

## Evidence

- skipped (2026-09-17T04:37:34.080Z): Task contract revised at persisted replan: Ban dau gia dinh AGENTS.md that cua repo nay duoc self-host tu renderAgentsTemplate() nen dat ac-3 la 'khop byte-for-byte'. Thuc te kiem tra cho thay AGENTS.md that la mot tai lieu cau truc rieng, cu hon, khong duoc quan ly qua .harnix/.template-hashes.json (khong co entry agents-bootstrap), va harnix update coi no la 'modified'/preserved chu khong regenerate. Sua ac-3 va chk-agents-selfhost de phan anh dung thuc te: chi can dong bo dung cau rule, khong phai toan bo file.
- skipped (2026-09-17T04:45:08.062Z): Task contract revised at persisted replan: Command truoc cua chk-agents-selfhost bi vo shell quoting khi nhung mot chuoi tieng Viet chua backtick vao trong node -e wrapper bang dau ngoac kep long nhau (cung loai loi da tung gap o task Prompt 4 truoc do). Thay bang command dung dau nhay don bao ngoai va String.fromCharCode(96) cho backtick, da test thuc te chay dung truoc khi persist.
- `chk-templates-unit` — pass (2026-09-17T04:48:39.662Z): 7/7 test templates.test.ts pass voi rule moi (ca renderAgentsTemplate rong va AGENTS.md that cua repo deu chua dung cau rule moi).
- `chk-agents-selfhost` — pass (2026-09-17T04:48:39.662Z): AGENTS.md that cua repo da duoc hand-sync dung cau rule moi (khong phai regenerate toan bo file boi harnix update, vi AGENTS.md khong duoc self-host manifest quan ly - phat hien trong luc lam, da replan ac-3/chk-agents-selfhost cho khop thuc te).
- `chk-acceptance` — pass (2026-09-17T04:48:39.662Z): lint/typecheck/build sach; 587/588 test pass (1 skip tu truoc), 75 file, loai tru dung test/unit/package-contract.test.ts (pre-existing .kilo worktree, khong lien quan task nay).
