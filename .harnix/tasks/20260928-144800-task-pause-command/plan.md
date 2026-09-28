# Implementation Plan — Bổ sung lệnh harnix pause

## Danh sách công việc (Checklist)

- [x] `S1` — Xây dựng module core src/core/tasks/task-pause.ts và unit test
- [x] `S2` — Thêm command src/commands/pause.ts, đăng ký vào src/cli-program.ts và integration test
- [x] `S3` — Cập nhật documentation và agent skills
- [x] `S4` — Bump version, sync package và chạy toàn bộ verification suite

## Chi tiết các lát cắt triển khai (Slices)

### Slice `S1`
Criteria: `ac-pause-core-logic`
Checks: `check-unit-tests`
Paths: `src/core/tasks/task-pause.ts`, `test/unit/task-pause.test.ts`

Xây dựng logic tạm dừng task trong core, hỗ trợ dry-run và atomic pointer clear.

### Slice `S2`
Criteria: `ac-cli-pause-command`
Checks: `check-integration-tests`
Paths: `src/commands/pause.ts`, `src/cli-program.ts`, `test/integration/pause.test.ts`

Xây dựng command CLI harnix pause [--dry-run] và viết integration tests tương ứng.

### Slice `S3`
Criteria: `ac-skills-and-docs`
Checks: `check-skills-and-docs`
Paths: `docs/HARNIX_WORKFLOW.md`, `docs/HARNIX_PRD.md`, `src/skills/harnix-brainstorm/SKILL.md`, `src/skills/harnix-continue/SKILL.md`

Cập nhật docs và skills để hướng dẫn agent sử dụng harnix pause khi người dùng muốn tạm hoãn task.

### Slice `S4`
Criteria: `ac-tests-and-verification`
Checks: `check-full-verification`
Paths: `package.json`, `CHANGELOG.md`, `src/version.ts`

Xác thực toàn bộ hệ thống, đồng bộ phiên bản và hoàn tất nghiệm thu.
