# Plan - Review, refactor và bổ sung platform Claude

## Implementation checklist

- [x] `S1-CONTRACT` — RED rồi mở rộng platform set `claude` trong config schema và release scanner guard.
- [x] `S2-DEDUPE` — RED rồi rút nguồn canonical dùng chung cho skill plan và activation-guard rule của mọi configurator.
- [x] `S3-SURFACE` — RED rồi thêm configurator `claude` cùng user-global root `~/.claude`.
- [x] `S4-LIFECYCLE` — RED rồi nối `claude` vào setup/update/doctor/uninstall/context và xoá deprecated surface.
- [x] `S5-DOCS-RELEASE` — Đồng bộ normative docs, AGENTS/template, README, patch release và chạy exact acceptance sequence.

### Slice `S1-CONTRACT`

Criteria: `ac-contract-docs-sync`
Checks: `focused-claude-configurator`
Paths: `src/core/config/config.ts`, `scripts/scan-release.mjs`, `test/unit/config.test.ts`, `test/safety/release-scanner.test.ts`

Thêm assertion chứng minh `platforms` chấp nhận `claude` giữ sorted/unique và config v1/v2 cũ vẫn đọc được không đổi, cùng assertion chứng minh release scanner vẫn chặn `gemini-cli|cursor|windsurf` nhưng không còn chặn `claude`. Sau RED mới mở rộng union và regex tối thiểu.

### Slice `S2-DEDUPE`

Criteria: `ac-configurator-dedupe`
Checks: `focused-claude-configurator`, `managed-parity`
Paths: `src/templates/harnix/workflow.ts`, `src/templates/harnix/activation.ts`, `src/configurators/kiro.ts`, `src/configurators/antigravity.ts`, `src/configurators/codex.ts`, `test/platform/global-adapters.test.ts`, `test/workflow/templates.test.ts`

Thêm assertion byte-identical cho desired files của ba platform hiện hữu trước khi refactor, rồi rút helper canonical dùng chung cho skill plan và khối guard. Refactor chỉ được thực hiện khi test đang xanh và không được đổi một byte output nào.

### Slice `S3-SURFACE`

Criteria: `ac-claude-global-surface`
Checks: `focused-claude-configurator`
Paths: `src/configurators/claude.ts`, `src/utils/user-paths.ts`, `src/utils/global-managed-files.ts`, `test/platform/claude-global.test.ts`, `test/unit/user-paths.test.ts`, `test/safety/user-global-paths.test.ts`

Viết RED cho plan thuần root-relative của Claude: 7 skill, managed block `CLAUDE.md`, json-array-member hook tại `/hooks/UserPromptSubmit` với `memberId` `harnix-context`, cùng matcher nhận diện hook Harnix mà không nuốt handler khác. Thêm RED chứng minh `~/.claude` được resolve an toàn và chặn traversal cùng symlink escape. Sau đó implement configurator và root; không I/O và không absolute path trong configurator.

### Slice `S4-LIFECYCLE`

Criteria: `ac-claude-lifecycle-parity`, `ac-dead-surface-removal`
Checks: `focused-lifecycle-parity`
Paths: `src/commands/setup.ts`, `src/commands/doctor.ts`, `src/commands/global-doctor.ts`, `src/commands/global-update.ts`, `src/commands/global-uninstall.ts`, `src/commands/internal-context.ts`, `src/cli-program.ts`, `test/platform/setup.test.ts`, `test/integration/global-doctor.test.ts`, `test/integration/global-lifecycle.test.ts`, `test/unit/global-uninstall.test.ts`, `test/integration/cli.test.ts`

Viết RED cho vòng đời đầy đủ trên fake home: setup, dry-run, chạy lại idempotent, drift, `doctor --fix --global`, `update --global`, uninstall có bảo toàn nội dung người dùng sửa, và `context --platform claude` là no-op nhanh ngoài project. Sau GREEN, xoá `VersionLookup`, `versionLookup` và `root` khỏi `SetupPlatformsOptions` và chứng minh bằng typecheck cùng toàn bộ test.

### Slice `S5-DOCS-RELEASE`

Criteria: `ac-contract-docs-sync`, `ac-release-readiness`, `ac-configurator-dedupe`
Checks: `managed-parity`, `release-gate`
Paths: `AGENTS.md`, `README.md`, `CHANGELOG.md`, `docs/HARNIX_PRD.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`, `src/templates/harnix/agents.ts`, `package.json`, `.harnix/.template-hashes.json`

Cập nhật ranh giới platform trong mọi normative doc và AGENTS template, làm mới state lỗi thời trong `AGENTS.md`, bump patch version đúng một lần qua `pnpm version:sync`, rồi chạy compliance review trước quality review và exact acceptance sequence mục 11.

<!-- harnix:execution-notes:begin -->
<!-- harnix:execution-notes:end -->
