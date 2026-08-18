# Plan — Hoàn thiện hướng dẫn agent và tài liệu workflow Harnix

## Checklist triển khai

- [x] Slice 1: thêm regression assertions và quan sát RED cho routing, transport và README.
- [x] Slice 2: sửa root `AGENTS.md`, consumer AGENTS template, generated workflow và canonical stage skills; chạy focused tests GREEN.
- [x] Slice 3: sửa README happy path/ownership/Doctor; chạy focused tests và review nội dung.
- [x] Slice 4: bump patch version, cập nhật CHANGELOG và đồng bộ skill metadata version.
- [x] Slice 5: chạy compliance review, quality/security review và completion gates với freshness snapshot.

## Slice 1 — Contract tests RED

Cập nhật `test/workflow/templates.test.ts`, `test/workflow/skill-sources.test.ts` và khi cần `test/workflow/cli-contract.test.ts`. Assertions phải yêu cầu activation/triage ở root instructions, exact `internal workflow inspect|save|snapshot|finish`, `WorkflowSaveEnvelope`/JSON stdin semantics và README happy path/ownership. RED phải thất bại vì prose hiện tại thiếu contract, không phải do environment.

## Slice 2 — Instruction và transport

Sửa `AGENTS.md` để bỏ fallback implementation vô điều kiện. Sửa `src/templates/harnix/agents.ts`, `src/templates/harnix/workflow.ts` và các stage skill `harnix-brainstorm`, `harnix-implement`, `harnix-check`, `harnix-continue`, `harnix-finish-work` để mỗi owner biết exact transport. Generated workflow giữ schema/envelope đủ để thao tác nhưng không biến hidden CLI thành public API.

## Slice 3 — README

Thêm luồng end-to-end cho một platform: `init`, setup/dry-run, trust hoặc readiness, mở coding agent trong repo, gửi yêu cầu tự nhiên, agent route skill và persist task. Làm rõ public CLI quản lý harness chứ không phải stage commands. Sửa mô tả `init`, specs/workflow managed-until-edited, task/research/journal user-owned và xóa Doctor duplicate.

## Slice 4 — Release metadata

Tăng patch version từ `1.0.1` lên `1.0.2`, đồng bộ `metadata.version` của bảy skill, cập nhật README version claim nếu có và thêm CHANGELOG entry user-visible.

## Slice 5 — Verification

Chụp snapshot ngay trước/sau từng required check. Chạy focused contract tests, lint/typecheck/build, `test:acceptance`, sau đó exact completion sequence theo `docs/IMPLEMENTATION_PLAN.md` mục 11. Review compliance trước quality/security; chỉ finish khi mọi criterion có fresh evidence và không có drift.
