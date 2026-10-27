# Kế hoạch: lệnh archive task và epic sau 30 ngày

## Execution Slices

- [x] [chk-archive] Slice 1 (ac-1, ac-2): test đỏ cho `planArchive` và `applyArchive` (điều kiện trạng thái và mốc, epic nguyên cụm, thành viên epic chưa xong, task cha follow-up, task active, task không đọc được, gián đoạn giữa chừng được hoàn tất lần sau).
- [x] [chk-archive] Slice 2 (ac-1, ac-2): cài `src/core/tasks/archive.ts` (lập kế hoạch và thực hiện dưới khóa workflow, rename có thử lại dùng chung với migration).
- [x] [chk-archive] Slice 3 (ac-3): test đỏ rồi cài `restoreFromArchive` và chốt chặn ghi (`saveTask`, `saveTaskArtifacts`, `upsertEpic`, `--task`) với hint `harnix archive --restore <id>`; mem, learning, epic và `--follow-up` vẫn đọc được.
- [x] [chk-archive] Slice 4 (ac-1, ac-3): lệnh công khai `harnix archive` (`src/commands/archive.ts`, đăng ký CLI, JSON ra stdout, lỗi chuẩn) và test tích hợp.
- [x] [chk-gates] Slice 5 (ac-4): đồng bộ README, PRD, AGENTS, workflow docs, skill reference, `pnpm selfhost:sync`, `pnpm run test:gates`.
- [x] [chk-release] Slice 6 (ac-4): `pnpm version:sync 2.23.0 --fold-dev`, `pnpm measure:footprint`, `pnpm release:check`.
- [x] [chk-suite] Slice 7: `pnpm run test` đầy đủ.

## Guardrails & Invariants

- Chỉ rename; không sửa, không xóa nội dung.
- Không archive task active, chưa kết thúc, thành viên epic chưa xong, hay cha của follow-up chưa xong.
- Archive epic bị gián đoạn được hoàn tất ở lần chạy sau.

## Verification Matrix

| Check | Chứng minh |
| --- | --- |
| chk-archive | điều kiện archive, epic nguyên cụm, restore, kho chỉ đọc, lệnh công khai |
| chk-gates | hợp đồng CLI, docs, ngân sách token |
| chk-release | chuỗi nghiệm thu release |
| chk-suite | toàn bộ suite xanh |
