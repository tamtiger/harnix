# Kế hoạch: ID tiếng Anh và cột mode của epic

Nguyên tắc: RED trước, GREEN sau; chạy check focused từng slice, `check-suite` một lần ở verify.

## Checklist

- [x] Slice 1 — `--init --slug` và lỗi khi title có dấu mà thiếu slug (ac-1)
- [x] Slice 2 — `mode` trong `harnix epic <id>` và cột Mode trong epic `.md` (ac-2)
- [x] Slice 3 — Tài liệu: AGENTS.md, template workflow, skill harnix-plan, docs, test tài liệu (ac-3)
- [x] Slice 4 — Cập nhật bản ghi epic qua `--save` và test đọc bản ghi (ac-4)
- [x] Slice 5 — Phiên bản dev, đồng bộ `.harnix/workflow.md`, verify toàn bộ

## Slice 1 — `--slug` (ac-1)

Tệp: `src/core/workflow/init-task.ts`, `src/commands/workflow-command.ts`, `src/commands/workflow-flags.ts`, `src/commands/workflow-handlers.ts`; test `test/unit/core/workflow/init-task.test.ts`, `test/integration/commands/workflow-flags.test.ts`.

1. RED: title "Chuẩn hóa ID" không có slug bị từ chối với thông báo chứa `--slug <english-kebab-case>`; `slug: "normalize-id"` cho ID `<prefix>-normalize-id`; slug `Bad Slug`, `-x`, `a--b` bị từ chối; title ASCII không slug vẫn sinh slug cũ; flag `--slug` ngoài `--init` báo lỗi (`FLAG_OWNERS`).
2. GREEN: `InitTaskOptions.slug`; hàm `resolveSlug(title, slug)` kiểm `^[a-z0-9]+(?:-[a-z0-9]+)*$`, tối đa 60 ký tự; title chứa ký tự ngoài ASCII và không có slug thì lỗi; wiring flag. Giữ `src/core/workflow` ≤300 dòng.

## Slice 2 — Mode của member (ac-2)

Tệp: `src/core/epics/epic.ts` (`EpicMember.mode`, `collectEpicMembers`, bảng Members), `src/commands/epic.ts` (`detailPublicEpic`); test `test/unit/core/epics/epic.test.ts`.

1. RED: `detailPublicEpic` trả `members[i].mode`; file `.md` có header `| # | Task ID | Title | Mode | Status |` và dòng member chứa `` `lite` `` hoặc `` `full` ``; output `--brief` không đổi.
2. GREEN: thêm `mode` vào member, bảng và detail.

## Slice 3 — Tài liệu (ac-3)

Tệp: `AGENTS.md`, `src/templates/harnix/workflow.md`, `src/skills/harnix-plan/SKILL.md`, `src/skills/harnix-plan/references/epic.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`; test `test/workflow/docs-task-contract.test.ts`.

1. RED: mở rộng test để đòi quy ước ID tiếng Anh, title/goal/tiêu chí tiếng Việt có dấu và `--slug` ở các bề mặt trên.
2. GREEN: viết tài liệu (chỉ chạy prettier cho `.ts`; không format file markdown ngoài phần sửa).

## Slice 4 — Rà soát epic (ac-4)

1. Dùng `harnix workflow --inspect` lấy task active rồi `--save` với trường `epic` (cùng `id`) để thêm non-goal "Không đổi ID hay slug tiếng Việt đã tạo" và ghi quy ước ngôn ngữ vào mục tiêu nếu thiếu; không sửa tay file epic.
2. Test trong `docs-task-contract.test.ts` đọc `.harnix/epics/20261006-141317-workflow-field-feedback.json` và đòi non-goal đó.

## Slice 5 — Phát hành dev và verify

`pnpm version:sync 2.2.0-dev.5 --summary "<tóm tắt>" --kind added` một lần; đồng bộ `.harnix/workflow.md` và hash trong `.harnix/.template-hashes.json` (LF, hash của `workflowTemplate`); chạy `pnpm build`; cập nhật golden snapshot có chủ đích nếu schema đổi; `pnpm lint`, `pnpm typecheck`; `--run-check` từng check focused rồi `check-suite`; đánh dấu criterion, finish. Không commit; trước commit hiển thị thay đổi và message.

## Ràng buộc

- Mọi file `src/**` ≤300 dòng code, test ≤400 dòng; builder từ `test/support/builders.ts`.
- Không đổi task/epic đã tạo trừ bản ghi epic của chính epic này qua `--save`.
