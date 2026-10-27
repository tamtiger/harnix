# Kế hoạch: đóng epic và phát hành 2.3.0

## Checklist

- [x] 1. Tài liệu (ac-1): thêm vào `docs/HARNIX_PRD.md` (đoạn public commands và đoạn learning/preflight) và `docs/IMPLEMENTATION_PLAN.md` (đoạn transport hẹp của hidden `workflow`) các mục đã nêu trong PRD của task; chạy `pnpm run test:gates` để docs test vẫn xanh
- [x] 2. RED (ac-2): `test/integration/scenarios/cli-real-process.test.ts` (không inject `checkRunner`): project dùng một lần, `--init --title ... --slug ... --command "node -e process.exit(0)" --input "src/**" --text A --text B --with-check "id=check-bad;command=node -e process.exit(3);criteria=ac-2;input=src/**"`, rồi `--run-checks` cho `ran: [check-1 pass, check-bad fail exit 3]`; thêm check lệnh không tồn tại cho "could not start" và không có evidence
- [x] 3. GREEN (ac-2): sửa production chỉ khi test thật lộ lỗi (dự kiến không cần); nếu lộ lỗi thì ghi `--add-risk`/decision và sửa tối thiểu
- [x] 4. RED rồi GREEN (ac-3): `test/workflow/changelog-contract.test.ts` (không còn `## [X.Y.0-dev.N]` khi có `## [X.Y.0]`, entry đầu khớp `package.json`, không trùng tiêu đề); ban đầu đỏ vì còn `2.3.0-dev.1..10`
- [x] 5. Chạy check-docs, check-scenario để chốt phần chưa phát hành
- [x] 6. Phát hành (làm cuối): `pnpm version:sync 2.3.0 --fold-dev`, rồi `pnpm selfhost:sync`, `pnpm format`; kiểm CHANGELOG chỉ còn một entry `2.3.0` đủ mục Added/Changed
- [x] 7. `AGENTS.md` mục "Current state": ghi epic tự cải tiến và phiên bản `2.3.0`; cập nhật goal của epic bằng `--save` có trường `epic` (đủ 11 member)
- [x] 8. Chạy check-release, check-docs, check-scenario rồi suite `pnpm run test` (check-1), `pnpm lint`, `pnpm typecheck`

## Thiết kế

`cli-real-process.test.ts`: dùng `useTemporaryRepositories`, `initializeProject`, `process.chdir`, và `runCli(["node","harnix","workflow",...])` với `stdout`/`stderr` spy như các test CLI khác; kiểm thêm `--inspect` để thấy hai evidence (pass, fail exit 3) và rằng lệnh không tồn tại không thêm evidence.

`changelog-contract.test.ts`: đọc `CHANGELOG.md` và `package.json`, rút danh sách heading `## [x.y.z...] - date`, kiểm ba điều kiện của ac-3.

## Mỗi check chứng minh gì

- `check-docs` (ac-1), `check-scenario` (ac-2), `check-release` (ac-3), `check-1`: toàn bộ test, lint, typecheck.

## Rủi ro và rollback

Bước phát hành đổi nhiều tệp cùng lúc (`package.json`, CHANGELOG, README, skills, manifest) nên làm cuối; hoàn tác bằng chạy lại `version:sync` với phiên bản trước hoặc revert các tệp đó, không dùng `git checkout`. Test tiến trình thật phụ thuộc `node` trên PATH.
