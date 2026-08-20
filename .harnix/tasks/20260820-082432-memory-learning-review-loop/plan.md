# Plan — Vòng review memory thành learning candidate

## Checklist triển khai

- [x] `S1-CONTRACT-RED` — Khóa transport/filter/safety contract và quan sát focused RED tests.
- [x] `S2-CAPTURE-GREEN` — Implement eligible learning capture, provenance validation và append idempotent tối thiểu.
- [x] `S3-MEM-WORKFLOW` — Expose learning filter và đồng bộ finish guidance/canonical templates.
- [x] `S4-VERIFY-RELEASE` — Review hai stage, chạy fresh gates, bump patch version và cập nhật changelog.

## Thứ tự thực hiện

Behavior thay đổi dùng RED → GREEN → REFACTOR. Docs contract cập nhật trong cùng slice sở hữu behavior. Worktree hiện có thay đổi chưa commit từ task hoàn tất trước đó; implementation phải giữ nguyên, không claim hoặc overwrite ngoài phần overlap được kiểm tra rõ.

### Slice `S1-CONTRACT-RED`

Criteria: `ac-learning-capture` `ac-learning-mem` `ac-learning-safety`
Checks: `learning-capture-focused` `learning-safety-focused` `mem-learning-focused`
Paths: `docs/HARNIX_PRD.md` `docs/HARNIX_WORKFLOW.md` `docs/IMPLEMENTATION_PLAN.md` `test/integration/cli.test.ts` `test/integration/doctor.test.ts` `test/integration/memory.test.ts` `test/unit/journal.test.ts` `test/unit/learning-safety.test.ts` `test/workflow/internal-workflow.test.ts`

Thêm regression tests trước cho bounded `--learn` envelope, legal finishing state, source/evidence provenance, threshold/derived fields, duplicate/conflict, 64 KiB, redacted risk categories, `mem --learning` composition và default compatibility. Chạy focused commands để xác nhận fail đúng vì behavior chưa tồn tại.

### Slice `S2-CAPTURE-GREEN`

Criteria: `ac-learning-capture` `ac-learning-safety`
Checks: `learning-capture-focused` `learning-safety-focused`
Paths: `src/cli-program.ts` `src/commands/internal-workflow.ts` `src/core/journal/journal.ts` `src/core/journal/learning-safety.ts` `src/core/journal/learning.ts` `src/core/workflow.ts`

Implement pure validation/normalization trước, tái dùng completion freshness thay vì tạo gate yếu hơn, rồi thêm hidden CLI action. Append dùng verified project-local developer path và deterministic entry ID; identical retry là no-op có kết quả, conflict hoặc invalid provenance fail closed. Không sửa TaskRecord/active/spec.

### Slice `S3-MEM-WORKFLOW`

Criteria: `ac-learning-mem` `ac-learning-safety` `ac-learning-workflow`
Checks: `mem-learning-focused` `skill-learning-loop`
Paths: `README.md` `src/cli-program.ts` `src/commands/mem.ts` `src/skills/harnix-finish-work/SKILL.md` `src/templates/harnix/workflow.ts` `test/integration/cli.test.ts` `test/integration/memory.test.ts` `test/platform/global-adapters.test.ts` `test/workflow/skill-sources.test.ts` `test/workflow/templates.test.ts`

Thêm kind filter không đổi default result, document command JSON và cập nhật finish owner để review bounded memory trước finish. Skill phải phân biệt recurrence với unresolved bug, kiểm tra provenance, không ghi khi thiếu ngưỡng và không promotion. Verify rendered guidance byte-identical trên ba platform.

### Slice `S4-VERIFY-RELEASE`

Criteria: `ac-learning-capture` `ac-learning-mem` `ac-learning-safety` `ac-learning-workflow`
Checks: `acceptance-suite` `release-gates` `static-quality` `version-sync-docs`
Paths: `CHANGELOG.md` `README.md` `docs/HARNESS_RESEARCH.md` `docs/HARNIX_PRD.md` `docs/HARNIX_WORKFLOW.md` `docs/IMPLEMENTATION_PLAN.md` `package.json` `pnpm-lock.yaml` `scripts/version-sync.mjs` `src/**/*.ts` `test/**/*.ts`

Review compliance trước quality/security, đóng focused regressions rồi chạy snapshot trước/sau cho từng required check. Đồng bộ version `1.0.10`, changelog và skill metadata trước completion; sau đó chạy exact section 11 sequence, fake-home tarball smoke và release scans. Không dùng real user profile, commit, push, publish hoặc PR.
