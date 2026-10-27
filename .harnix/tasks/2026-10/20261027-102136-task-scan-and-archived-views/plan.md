# Kế hoạch: quét task và epic theo phần sống, kho lưu trữ và đo tốc độ

## Execution Slices

- [x] [chk-views] Slice 1 (ac-1, ac-2, ac-3): test đỏ cho `listTaskIds` giới hạn tháng, `createTaskIndex` với `archived`, `collectEpicMembers` quét từ tháng của epic và bằng quét toàn bộ, gom thành viên cho danh sách epic, doctor với bucket và `_archive`.
- [x] [chk-views] Slice 2 (ac-1, ac-2): cài `fromMonth` trong `task-location`, `archived` và tải song song trong `task-index`, `collectEpicMembers` và `collectEpicMembersByEpic` trong `epic.ts`, `harnix epic` danh sách dùng một lượt quét.
- [x] [chk-views] Slice 3 (ac-1, ac-3): cờ `--archived` ở `harnix tasks` và `harnix epic`, doctor bỏ qua `_archive`, đồng bộ PRD, README, workflow docs.
- [x] [chk-views] Slice 4 (ac-4): đo trước và sau trên bản sao 252 task xếp theo bucket tháng, ghi số đo vào decision `trace-timing`.
- [x] [chk-gates] Slice 5: `pnpm run test:gates` (hợp đồng CLI, docs, ngân sách token).
- [x] [chk-suite] Slice 6: bump `2.23.0-dev.2` kèm changelog, `pnpm run test`.

## Guardrails & Invariants

- Kết quả `harnix tasks` và `harnix epic` trên bố cục phẳng không đổi ngoài trường `filter.archived`.
- Không đổi nội dung file task hay epic.
- Quét giới hạn tháng không bỏ sót thành viên (test đối chiếu quét toàn bộ).

## Verification Matrix

| Check | Chứng minh |
| --- | --- |
| chk-views | quét sống và kho, giới hạn tháng, gom thành viên, `--archived` |
| chk-gates | hợp đồng CLI, docs, ngân sách token |
| chk-suite | toàn bộ suite xanh |
