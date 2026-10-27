# Plan — An toàn văn bản và transport chỉnh kế hoạch

## Checklist

- [x] S1 — Bỏ BOM đầu stdin trong `src/commands/workflow-command.ts`.
- [x] S2 — Kiểm tra hỏng mã hóa: `src/core/workflow/text-integrity.ts` và gọi trong `saveWorkflow`.
- [x] S3 — Transport chỉnh kế hoạch: `src/core/workflow/plan-edit.ts` (`--set-check`, `--add-criterion`, `--set-paths`) và wiring trong `workflow-command.ts`.
- [x] S4 — Cookbook, `Persistence rules` của 6 skill, khối activation, `workflow --schema`, golden snapshot, test đối chiếu flag tài liệu.
- [x] S5 — PRD, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md` §4, `AGENTS.md`; `harnix update`; `pnpm version:sync` một lần; `pnpm format`.

## Cách làm và cách kiểm

Mỗi slice RED (test fail đúng lý do) rồi GREEN tối thiểu. Test đặt theo `test/README.md`, mỗi file ≤ 400 dòng, import dùng alias.

- S1: `workflow-command.test.ts` gửi body có BOM qua `workflowInput` cho `--save`/`--migrate` và kỳ vọng thành công.
- S2: `test/unit/core/workflow/text-integrity.test.ts`: chuỗi mojibake cp1252 và cp1258 của tiếng Việt bị từ chối; `U+FFFD` bị từ chối; tiếng Việt, Latin có dấu, emoji và ASCII hợp lệ được chấp nhận; chuỗi lồng sâu trong artifacts/epicMembers cũng bị bắt; `saveWorkflow` từ chối kể cả qua đường replan.
- S3: `test/unit/core/workflow/plan-edit.test.ts`: upsert check, thiếu field bắt buộc, post-ready cần `--reason` và tạo đúng một save `replan`, đang `replan` thì save thường, criterion trùng id bị từ chối, paths thay toàn bộ; tiếng Việt trong `--text` đi nguyên vẹn. Integration test trong `workflow-command.test.ts` cho validation flag.
- S4/S5: `persistence-guidance.test.ts` mở rộng; `pnpm vitest run test/workflow`.

## Bảo toàn

Thay đổi chưa commit của các lượt trước (1.1.26) được giữ nguyên và mở rộng trong cùng mục CHANGELOG. `behavior-snapshot.golden.json` chỉ sửa tay phần transports của `--schema`. Không commit.
