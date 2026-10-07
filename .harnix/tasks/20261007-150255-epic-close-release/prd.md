# PRD: Đóng epic tự cải tiến và phát hành 2.3.0

## Bối cảnh

Epic `20261006-202542-harnix-self-improvement` có 11 member; 10 task đã xong (bản `2.3.0-dev.1` đến `dev.10`). Task này là member cuối theo ID nên đóng epic: đưa tài liệu gốc về khớp, kiểm chứng các lệnh mới bằng tiến trình thật và phát hành `2.3.0`.

## Mục tiêu và hành vi

- **ac-1 (tài liệu gốc):** `docs/HARNIX_PRD.md` và `docs/IMPLEMENTATION_PLAN.md` (đoạn mô tả transport hẹp của hidden `workflow` và đoạn preflight/learning) nêu: `--run-checks`; `--init` với `--text` lặp và `--with-check`; check mặc định `check-suite` scope `full`; `--set-criterion`; `--inspect --task`; `outputTail` mới của `--run-check` (tóm tắt, cả khi `--brief`, lỗi launcher là "could not start" không ghi evidence); `baselineHint` của `--preflight`; `secretAdvisory` của `--finish --brief`; advisory ready gộp và advisory id check lạ của `plan.md`; `harnix resume --epic`. Các test docs xanh.
- **ac-2 (tiến trình thật):** `test/integration/scenarios/cli-real-process.test.ts` chạy qua `runCli` không inject runner: `--init --text --text --with-check` rồi `--run-checks` với lệnh `node -e` thật (một pass, một exit 3) và một lệnh không tồn tại (báo "could not start", không ghi evidence). Kiểm output `{ ran, remaining }`, evidence đã ghi và rằng lỗi launcher không để lại evidence.
- **ac-3 (phát hành):** chạy `pnpm version:sync 2.3.0 --fold-dev`: CHANGELOG chỉ còn một entry `2.3.0` thay cho mọi `2.3.0-dev.N`, không mất dòng nào; `package.json`, README, skills và manifest self-host đồng bộ. `test/workflow/changelog-contract.test.ts` khóa hợp đồng này (không còn entry `X.Y.0-dev.N` khi `X.Y.0` đã có, entry mới nhất khớp `package.json`, không trùng tiêu đề). `AGENTS.md` mục "Current state" ghi epic mới và phiên bản `2.3.0`. Mô tả epic (goal) phản ánh đủ 11 member.

## Thứ tự làm

Docs và scenario trước, chạy các check, rồi **cuối cùng** mới bump `2.3.0 --fold-dev`, cập nhật AGENTS.md và epic, `pnpm selfhost:sync`, chạy lại check rồi verify (decision `d-release-last`).

## Ngoài phạm vi

Không commit, không dùng Git, không cài lại CLI trên PATH (cần người dùng cho phép, hỏi sau khi xong; xem rủi ro `r-cli-skew`).

## Rủi ro

Test tiến trình thật phụ thuộc `node` trên PATH và hành vi khởi chạy của hệ điều hành (Windows qua `cmd.exe`); mình chỉ khẳng định "could not start" bằng regex không phân biệt hoa thường. Việc gộp changelog đổi nhiều tệp cùng lúc nên đặt cuối cùng.
