# Quy tắc và nơi sở hữu

Mỗi nhóm quy tắc có đúng một nơi canonical; các nơi khác chỉ trỏ tới nó hoặc lặp lại một dòng. Khi đổi một quy tắc, sửa nơi canonical trước rồi đồng bộ các nơi còn lại. `test/workflow/rule-ownership.test.ts` kiểm mọi đường dẫn và reference trong bảng còn tồn tại.

| Nhóm quy tắc | Nơi canonical | Chi tiết và nơi lặp lại |
| --- | --- | --- |
| Cổng ready và finish | `src/templates/harnix/workflow.md` (mục Gates, một dòng mỗi cổng) | `harnix skill harnix-verify --reference gates`, mã `src/core/workflow/suite-gate.ts` và `src/core/workflow/ready.ts` |
| Thời điểm review | `AGENTS.md` (bước 9 của quy trình implement) | `harnix skill harnix-verify --reference workflow-routing`, `src/skills/harnix-implement/SKILL.md` (mục Exit), `harnix skill harnix-plan --reference epic` |
| Chính sách version | `AGENTS.md` (bước 7 của quy trình implement) | `src/templates/harnix/workflow.md` (Execute), `harnix skill harnix-verify --reference gates`, `scripts/version-sync.mjs` |
| Trạng thái task | `src/templates/harnix/workflow.md` (Route và Task state) | `harnix skill harnix-verify --reference task-state`, `harnix skill harnix-verify --reference workflow-routing`, `docs/HARNIX_WORKFLOW.md` |
| Bằng chứng và độ tươi | `harnix skill harnix-verify --reference evidence` | `src/core/verification/input-digest.ts`, `docs/HARNIX_WORKFLOW.md` |
| Epic và gom member | `harnix skill harnix-plan --reference epic` | `harnix skill harnix-plan --reference epic-git`, `AGENTS.md` |
| Secret | `src/core/workflow/secret-scan.ts` (quét file đã đổi, không bao giờ in giá trị, waiver `harnix-secret-waiver`) | `src/templates/harnix/workflow.md` (Agent transport, `secretAdvisory`), `AGENTS.md` (Project learning loại câu giống credential) |
| Commit và branch | `src/templates/harnix/activation.ts` (quy tắc Preserve) | `AGENTS.md`, `src/templates/harnix/workflow.md` (Commit discipline), `harnix skill harnix-implement --reference commit-hygiene` |
| Điều hướng mã bằng repo-map | `src/skills/harnix-implement/SKILL.md` (mục Review the plan) | `src/templates/harnix/activation.ts` (quy tắc Token economy), `src/skills/harnix-plan/SKILL.md`, `src/skills/harnix-debug/SKILL.md`, `src/core/context/effective-context.ts` (dòng Tip của hook lean) |
| Trần token | `src/templates/harnix/token-budgets.json` | `src/templates/harnix/token-budgets.ts`, `scripts/measure-tokens.mjs`, `test/workflow/instruction-budget.test.ts`, `AGENTS.md` |
