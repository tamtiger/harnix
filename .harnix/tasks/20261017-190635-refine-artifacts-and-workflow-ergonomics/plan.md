# Implementation Plan: Hoàn thiện hệ sinh thái tạo tác và tối ưu công thái học workflow

## Execution Slices

### Slice 1: Nâng cấp CLI `workflow --cancel` hỗ trợ flag `--reason` (`ac-1`)
- [x] [check-cancel] Cập nhật `src/commands/workflow-flag-owners.ts` và `src/commands/workflow-handlers.ts` cho phép dùng `--reason` và `--authorized-by` với action cancel.
- [x] [check-cancel] Bổ sung integration test trong `test/integration/commands/workflow-flags.test.ts`.

### Slice 2: Cập nhật template song ngữ PRD & Plan và nâng cấp `scanPrdStructure` (`ac-2`)
- [x] [check-prd] Cập nhật `renderPrdTemplate` và `renderPlanTemplate` trong `src/core/workflow/artifact-templates.ts`.
- [x] [check-prd] Mở rộng bộ từ khóa nhận diện song ngữ 4 khối PRD trong `src/core/workflow/ready-content.ts` kèm unit tests trong `test/unit/core/workflow/ready-content.test.ts`.

### Slice 3: Tự động liên kết Supporting Artifacts trong `epic.md` (`ac-3`)
- [x] [check-epic] Nâng cấp `renderEpicMarkdown` trong `src/core/epics/epic.ts` tự động phát hiện `research.md` và `spec.md`.
- [x] [check-epic] Bổ sung unit test trong `test/unit/core/epics/epic.test.ts`.

### Slice 4: Chuẩn hóa trailing newline POSIX trong `plan-sync.ts` (`ac-4`)
- [x] [check-sync] Cập nhật `src/core/workflow/plan-sync.ts` đảm bảo luôn kết thúc bằng một newline `\n`.
- [x] [check-sync] Bổ sung unit test kiểm chứng trailing newline trong `test/unit/core/workflow/plan-sync.test.ts`.

### Slice 5: Toàn bộ kiểm thử hệ thống & Test Gates (`ac-1`, `ac-2`, `ac-3`, `ac-4`)
- [x] [check-suite] Chạy toàn bộ test suite và gates (`pnpm test`, `pnpm run test:gates`) bảo đảm 100% PASS và không làm vỡ `behavior-snapshot.golden.json`.

## Guardrails & Invariants
- Duy trì tính tương thích ngược 100% (Backward Compatibility).
- Tuân thủ giới hạn 300 LOC/file trong src/core/.
- Không vi phạm hướng phụ thuộc kiến trúc (commands -> core -> utils).
- Không sửa file `test/workflow/behavior-snapshot.golden.json`.

## Verification Matrix
| Criterion | Check ID | Command | Scope |
|---|---|---|---|
| ac-1 | check-cancel | `pnpm vitest run test/integration/commands/workflow-flags.test.ts` | focused |
| ac-2 | check-prd | `pnpm vitest run test/unit/core/workflow/ready-content.test.ts` | focused |
| ac-3 | check-epic | `pnpm vitest run test/unit/core/epics/epic.test.ts` | focused |
| ac-4 | check-sync | `pnpm vitest run test/unit/core/workflow/plan-sync.test.ts` | focused |
| ac-1, ac-2, ac-3, ac-4 | check-suite | `pnpm test` | full |
