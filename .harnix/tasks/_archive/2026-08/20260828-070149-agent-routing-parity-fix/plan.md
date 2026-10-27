# Plan - Đồng bộ contract routing của agent và README

## Implementation checklist

- [x] `S1-RED-CONTRACT` — Thêm regression assertions và ghi nhận focused RED.
- [x] `S2-GREEN-PARITY` — Đồng bộ canonical routing, template và wording đến focused GREEN.
- [x] `S3-RELEASE-VERIFY` — Đồng bộ patch metadata và chạy exact release gate.

### Slice `S1-RED-CONTRACT`

Criteria: `ac-next-stage-routing`, `ac-project-canonical-parity`, `ac-readonly-terminology`
Checks: `focused-agent-contract`
Paths: `test/unit/activation-instructions.test.ts`, `test/workflow/templates.test.ts`, `test/platform/global-adapters.test.ts`

Bổ sung assertion exact canonical clauses cho project agent, assertion root `AGENTS.md` theo `nextStage`, và assertion terminology/mutation boundary. Chạy focused check để ghi nhận RED trên implementation hiện tại.

### Slice `S2-GREEN-PARITY`

Criteria: `ac-next-stage-routing`, `ac-project-canonical-parity`, `ac-readonly-terminology`
Checks: `focused-agent-contract`
Paths: `AGENTS.md`, `README.md`, `src/templates/harnix/activation.ts`, `src/templates/harnix/agents.ts`

Đưa canonical implicit activation clauses vào project template, loại bỏ wording divergence, sửa lỗi viết hoa, và làm rõ research mutation boundary. Chạy focused check đến GREEN, chỉ refactor trong phạm vi contract này.

### Slice `S3-RELEASE-VERIFY`

Criteria: `ac-release-readiness`
Checks: `release-gate`
Paths: `package.json`, `pnpm-lock.yaml`, `CHANGELOG.md`, `README.md`, `src/skills/harnix-brainstorm/SKILL.md`, `src/skills/harnix-check/SKILL.md`, `src/skills/harnix-continue/SKILL.md`, `src/skills/harnix-debug/SKILL.md`, `src/skills/harnix-finish-work/SKILL.md`, `src/skills/harnix-implement/SKILL.md`, `src/skills/harnix-research/SKILL.md`

Đồng bộ patch release metadata đúng một lần, chạy exact acceptance sequence trong `docs/IMPLEMENTATION_PLAN.md` mục 11, rồi thực hiện compliance và quality/security review trên evidence hiện hành.

<!-- harnix:execution-notes:begin -->
check:focused-agent-contract=passed@2026-08-28T07:07:11.000Z
check:release-gate=passed@2026-08-28T07:14:58.008Z
slice:S1-RED-CONTRACT=passed@2026-08-28T07:05:36.146Z
slice:S2-GREEN-PARITY=passed@2026-08-28T07:07:11.000Z
slice:S3-RELEASE-VERIFY=passed@2026-08-28T07:14:58.008Z
<!-- harnix:execution-notes:end -->
