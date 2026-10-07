# Kế hoạch: hook context diet

## Checklist

- [x] 1. RED (ac-1): trong `test/workflow/learning-automation.test.ts` thêm test hook context của cùng một project có learning: task `planning` có khối "Project learning", task `ready`, `in_progress` và `verifying` thì không (và ngắn hơn đúng bằng khối đó)
- [x] 2. GREEN (ac-1): `buildEffectiveContext` trong `src/core/context/effective-context.ts` chỉ gọi `learningBlock` khi `input.task.status === "planning"`; sửa các test hiện có phụ thuộc learning ở trạng thái khác
- [x] 3. RED (ac-2): `test/workflow/measure-tokens.test.ts` cho helper `learningTokens(text)` (đếm token của khối learning, 0 khi không có) và `seedLearning`/báo cáo `hookContext.learningTokens` có `planning`, `inProgress`, `saved`
- [x] 4. GREEN (ac-2): `scripts/measure-tokens.mjs` gieo 5 note vào journal của fixture, đo hook ở planning và in_progress, thêm `learningTokens` vào báo cáo và ném lỗi nếu in_progress còn learning
- [x] 5. Tài liệu (ac-3): dòng "Surface tự động" trong `docs/HARNIX_PRD.md`, đoạn learning trong `docs/HARNIX_WORKFLOW.md` và template `src/templates/harnix/workflow.md` nêu quy tắc mới; `pnpm selfhost:sync`
- [x] 6. Bump `pnpm version:sync 2.3.0-dev.5 --summary ... --kind changed` và cập nhật CHANGELOG
- [x] 7. Chạy check-hook, check-gates, rồi suite `pnpm run test`, `pnpm lint`, `pnpm typecheck` (check-suite); chạy `pnpm build` rồi `pnpm measure:tokens` để xác nhận số đo thật

## Thiết kế

`effective-context.ts`: `const learning = input.task.status === "planning" ? await learningBlock(input) : "";`. `harnix context-report` dùng cùng builder nên tự theo quy tắc.

`measure-tokens.mjs`: sau `init`, ghi `.harnix/workspace/measure/journal/<ngày>.jsonl` gồm 5 dòng `kind: "learning"` (status `candidate`, `recordedAt` là bây giờ, statement khoảng 100 ký tự) theo hình của `buildLearningEntry` trong test fixture. `measureLifecycle` trả thêm `hookLearning: { planning, inProgress }` là số token của khối learning trong output hook. `buildReport` thêm `hookContext.learningTokens: { planning, inProgress, saved }`; `main` ném lỗi nếu `inProgress !== 0` hoặc `planning === 0`.

## Mỗi check chứng minh gì

- `check-hook` (ac-1, ac-2): quy tắc theo status và số đo.
- `check-gates` (ac-3): tài liệu, ngân sách instruction và golden nhất quán.
- `check-suite`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Một test khác có thể đang kỳ vọng learning ở trạng thái không phải planning; suite sẽ lộ ra và được sửa theo quy tắc mới. Hoàn tác bằng revert `effective-context.ts` và `measure-tokens.mjs`.
