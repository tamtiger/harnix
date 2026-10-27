# Plan — Ghi learning bằng flag và báo capture khi finish

## Checklist

- [x] S1 — `addDecisionWorkflow` và `addRiskWorkflow` trong `src/core/workflow/plan-edit.ts`.
- [x] S2 — Flag `--add-decision`, `--add-risk`, `--rationale`, `--severity` trong `workflow-flags.ts` và `workflow-command.ts`.
- [x] S3 — `finishWorkflowReport` trong `src/core/workflow/finish.ts` và `learning` trong `--finish --brief`.
- [x] S4 — `workflow --schema`, golden snapshot, cookbook, skill `harnix-finish-work` và `harnix-brainstorm`, test hướng dẫn.
- [x] S5 — PRD, WORKFLOW, IMPLEMENTATION_PLAN, AGENTS.md; `harnix update`; `pnpm version:sync` một lần; `pnpm format`.

## Cách làm và cách kiểm

Mỗi slice RED rồi GREEN tối thiểu; mỗi file test ≤ 400 dòng.

- S1: `plan-edit.test.ts`: thêm decision/risk (mặc định severity `low`), id trùng và text rỗng bị từ chối, chạy ở `in_progress` không cần reason và không đổi checkpoint, tiếng Việt nguyên vẹn, mojibake bị từ chối.
- S2: `workflow-flags.test.ts`: `--rationale`/`--severity` chỉ đi với action của chúng, `--add-decision` thiếu `--text`/`--rationale` lỗi, `--severity` sai giá trị lỗi; test tích hợp CLI qua `runCli`.
- S3: `finish.test.ts`: task có note hợp lệ trả `captured > 0`; task không có note trả `captured: 0` kèm hint; note quá dài hoặc giống lệnh bị lọc và hint nói rõ; `--finish` không `--brief` không đổi.
- S4: `persistence-guidance.test.ts` mở rộng: cookbook và `harnix-finish-work` nhắc `--add-risk`, `--add-decision`, `learning.captured`; test đối chiếu flag tài liệu với CLI vẫn pass.

## Bảo toàn

Không đổi bộ lọc an toàn learning và không sửa dữ liệu task đã hoàn tất. Không commit.
