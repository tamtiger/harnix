# Plan: Sửa lỗi từ đợt review sau v2.22.0

## Execution Slices

- [x] [chk-retry] ac-1: thu hẹp retry về phần đọc-sửa-lưu; `workflow-command` đọc input một lần trước vòng retry; `run-check` chỉ retry phần ghi evidence; không retry khi lần thử đã ghi task
- [x] [chk-isolation] ac-2: `learning-capture-failure` tiêm hàm capture thay cho `vi.mock`; sửa comment trong `vitest.config.ts` và mục Speed của `test/README.md`
- [x] [chk-adopt] ac-3: bỏ `adopt` khỏi `decideWholeFile`, reconcile global và `project-files`; khôi phục test "never adopts"
- [x] [chk-gates] ac-4: cập nhật `docs/IMPLEMENTATION_PLAN.md` mục 4.25 và spec `status --criteria`, `docs/HARNIX_PRD.md` dòng 159
- [x] [chk-redos] ac-5: giới hạn scheme `{0,31}` trong `CREDENTIAL`; heuristic dấu hỏi chỉ khớp đúng ba dấu; test thời gian với chuỗi 64 KiB
- [x] [chk-suggest] ac-6: `closestMatch` không gợi ý khi id rỗng, chỉ khác số cuối hoặc hòa
- [x] [chk-gates] ac-7: đồng bộ mô tả breaker ở AGENTS.md, `multi-repo.md`, schema `--run-check`, `run-checks.ts`
- [x] [chk-epic] ac-8: `total` chỉ đếm epic đọc được; ghi thứ tự theo id ở `docs/HARNIX_WORKFLOW.md` và README
- [x] [chk-concurrency] ac-9: backoff ngắn có jitter trong `retryOnTaskConflict`
- [x] [chk-concurrency] ac-10: các lỗi P3 (cli-hints, `isClean`, test pass bị stale, `sessionLite`, comment version-sync, harnix-plan, override bỏ dấu)
- [x] [chk-footprint] ac-11: rút gọn phần trùng hoặc dài dòng của sáu reference `harnix-verify` (workflow-routing, task-state, gates, agent-transport, cookbook-notes, cookbook-commands), `harnix-plan/references/epic.md` và `harnix-arch-review/references/domain-briefs.md` đủ để footprint giảm tối thiểu 50% (người dùng chọn mở rộng phạm vi khi sáu reference chỉ đạt 48,75%)
- [x] [chk-gates] ac-12: đồng bộ tài liệu: `docs/HARNIX_PRD.md` dòng 159 (số action `--brief`, danh sách action), cả hai bản mục 4.11 và mục `measure:tokens`, mô tả `harnix epic` trong `docs/IMPLEMENTATION_PLAN.md`; AGENTS.md (`--remove-risk`, `--init` với `--with-check`, `--set-criterion` cho Lite); `harnix-plan/SKILL.md`, `references/replan.md`, `references/epic.md` (`git.clean`)
- [x] [check-suite] lint, typecheck, toàn bộ test và gate phát hành; `pnpm version:sync 2.22.1 --kind fixed`; `pnpm selfhost:sync` nếu template đổi

## Guardrails & Invariants

- Test hồi quy viết trước, thấy đỏ rồi mới sửa.
- Không hạ ngưỡng footprint, coverage hay ngân sách token.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1 | chk-retry |
| ac-2 | chk-isolation |
| ac-3 | chk-adopt |
| ac-4, ac-7 | chk-gates |
| ac-5 | chk-redos |
| ac-6 | chk-suggest |
| ac-8 | chk-epic, chk-gates |
| ac-9 | chk-concurrency |
| ac-10 | chk-concurrency, chk-suggest, chk-gates |
| ac-11 | chk-footprint |
| ac-12 | chk-gates |
| tất cả | check-suite |
