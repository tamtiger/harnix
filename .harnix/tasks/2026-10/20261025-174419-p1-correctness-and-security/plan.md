# Plan: Sửa 8 lỗi P1

## Execution Slices

- [x] [chk-replay] ac-1: từ chối replay task completed/cancelled trong replayCommittedSave (save.ts)
- [x] [chk-lock] ac-2: đọc, sửa, ghi trong cùng một lần khóa hoặc kiểm base hash cho các lệnh ghi flag (plan-edit.ts, criterion.ts, baseline.ts, evidence-flags.ts, transition.ts)
- [x] [chk-verifyplan] ac-3: changedFiles dùng runGit an toàn (verify-plan.ts), cảnh báo khi git lỗi thay vì trả rỗng
- [x] [chk-glob] ac-4: biên dịch glob không backtrack hoặc giới hạn số * và độ dài (safe-glob.ts)
- [x] [chk-setpaths] ac-5: assertActionRequirements chấp nhận --file cho --set-paths (workflow-flags.ts)
- [x] [chk-epic] ac-6: sắp xếp giảm dần trước khi cắt, total là tổng, đếm epic không đọc được (epic.ts)
- [x] [chk-learning] ac-7: mở rộng CREDENTIAL cho userinfo và tên tham số query
- [x] [chk-learning] ac-8: chuẩn hóa khoảng trắng và ký tự Cf trước khi so khớp override
- [x] [check-suite] đồng bộ docs (README, AGENTS.md root và src/templates/AGENTS.md, docs/HARNIX_*), pnpm version:sync 2.22.0-dev.1, pnpm selfhost:sync nếu template đổi

## Guardrails & Invariants

- Test hồi quy viết trước, thấy đỏ rồi mới sửa.
- Không đổi field/enum đóng băng; không regenerate golden ngoài chuỗi mới.
- Không hạ coverage; mỗi file test ≤ 400 dòng và phản chiếu src 1:1.
- Câu hỏi mở của người dùng (A3 breaker, A5 criterion có evidence) nằm ngoài task này.

## Verification Matrix

| Criterion | Check |
| --- | --- |
| ac-1 | chk-replay |
| ac-2 | chk-lock |
| ac-3 | chk-verifyplan |
| ac-4 | chk-glob |
| ac-5 | chk-setpaths, chk-gates |
| ac-6 | chk-epic, chk-gates |
| ac-7, ac-8 | chk-learning |
| tất cả | check-suite |
