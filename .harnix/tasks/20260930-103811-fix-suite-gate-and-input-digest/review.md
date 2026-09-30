# Sửa suite gate và input digest cho monorepo

- **ID:** 20260930-103811-fix-suite-gate-and-input-digest
- **Mode:** full
- **Status:** completed/finishing
- **Created:** 2026-09-30 10:38:10 +07:00
- **Updated:** 2026-09-30 10:51:34 +07:00

**Verdict:** PASS — all acceptance criteria met or waived

## Goal

Suite gate chấp nhận check bao phủ source+test theo layout monorepo/.NET mà không ép inputs `**`; finish gate dùng pass mới nhất; input digest bỏ qua thư mục build tạm theo tín hiệu, không loại source thật, ổn định và nhanh.

## Non-goals

- Không thêm transport CLI mới (task 2 của epic)
- Không sửa skill/template (task 3 của epic)
- Không đổi công thức digest ngoài phạm vi loại file tạm
- Không commit hay hoàn tất diff input-digest.ts đang có bằng cách bỏ đi phần đã làm

## Artifacts

- [`prd.md`](./prd.md) — outcome, scope, acceptance criteria narrative.
- [`plan.md`](./plan.md) — implementation checklist and slices.

## Acceptance criteria

- `ac-gate-monorepo-layout` (met): `coversSourceAndTest` chấp nhận inputs `Foo.Api/**` + `Foo.Api.Tests/**` và `src/**` + `test/**` mà không cần `**`; từ chối `docs/app/**` + `test/**`, `src/**` đứng một mình, và `**/*.cs`; thông báo lỗi không còn nhắc `scope`.
- `ac-finish-gate-latest-pass` (met): Finish gate của suite check dùng evidence pass mới nhất: sau khi có pass mới với digest hiện tại thì finish thành công dù pass cũ có digest lệch; nếu pass mới nhất lệch thì bị từ chối.
- `ac-digest-signal-based-ignore` (met): Input digest luôn bỏ qua `node_modules`, `TestResults`, `.vs`, `.idea`, `.git`, `.harnix`; chỉ bỏ `bin`/`obj` khi thư mục cha có `*.csproj|*.fsproj|*.vbproj` và `build`/`dist`/`coverage`/`out` khi thư mục cha có `package.json|pom.xml|build.gradle*`; `build/Build.cs` trong repo không có marker vẫn được băm.
- `ac-digest-targeted-by-segment` (met): Một input chỉ tắt ignore của thư mục tạm khi có segment đường dẫn trùng tên (không phân biệt hoa thường, bỏ tiền tố `!`): `src/Binary/**` không tắt ignore `bin`, còn `bin/**` và `**/obj/**` thì có; input khai báo `.harnix/tasks/<id>/plan.md` được băm.
- `ac-digest-case-insensitive` (met): Ignore thư mục tạm không phân biệt hoa thường: `TestResults`, `Bin`, `Obj`, `.VS` đều bị bỏ qua khi thoả điều kiện ở trên.
- `ac-digest-deterministic-parallel` (met): Băm file song song có giới hạn (tối đa 16) cho digest giống hệt băm tuần tự; hai lần snapshot liên tiếp khi không có thay đổi cho cùng digest, kể cả khi thêm file vào thư mục bị ignore.

## Required checks

- `chk-gate-digest-focused` (focused): Test tập trung cho suite gate, ready và input digest. — pass (2026-09-30 10:49:47 +07:00)
- `chk-full-suite` (full): Typecheck, lint và toàn bộ test kèm coverage floor. — pass (2026-09-30 10:51:18 +07:00)

## Decisions

- **d-epic-order** — Thứ tự epic: (1) sửa gate/digest, (2) transport CLI, (3) viết lại skill/template sau cùng.
  - _Why:_ Skill/template mô tả CLI cuối cùng nên viết một lượt sau khi CLI xong, tránh sửa hai lần và vượt ngân sách kích thước skill; digest đang có rủi ro sai (fresh giả) nên phải sửa trước khi commit.
- **d-ignore-by-marker** — Thư mục build mơ hồ (`bin`, `obj`, `build`, `dist`, `coverage`, `out`) chỉ bị ignore khi thư mục cha có file marker của hệ build; nhóm không mơ hồ (`node_modules`, `TestResults`, `.vs`, `.idea`, `.git`, `.harnix`) luôn bị ignore.
  - _Why:_ Ignore theo tên ở mọi độ sâu làm mất source thật như `build/Build.cs` hoặc `bin/cli.js` và gây fresh giả.
- **d-gate-recognition** — Không phụ thuộc `plan.packages`. Test = segment (không phân biệt hoa thường) bằng `test|tests|spec|specs|__tests__` hoặc kết thúc bằng `.test(s)|.spec(s)|-test(s)|_test(s)`. Source = input dạng cây thư mục không có segment test, segment đầu không thuộc `docs|doc|.github|.harnix|.vscode|scripts`, hoặc có segment `src|lib|app|pkg|cmd|internal`. Wildcard `.`, `**`, `**/*`, `*` vẫn đủ.
  - _Why:_ Giữ hàm đồng bộ, không cần I/O; bao được layout .NET/Java/Go mà không đoán cấu trúc workspace.
- **d-preserve-wip** — Tiếp tục trên diff chưa commit của `input-digest.ts` và test đi kèm, không revert và không commit.
  - _Why:_ Đó là công việc đang dở của người dùng; phần cần sửa nằm chính trong phạm vi task này.

## Residual risks

- **risk-digest-git-exclude** (low) — Digest dùng globby gitignore nên .git/info/exclude và global gitignore vẫn không được tôn trọng; file nằm trong đó có thể lọt vào digest của input rộng như **.
- **risk-gate-test-heuristic** (low) — Suite gate nhận diện thư mục test bằng tên (test|tests|spec|specs|__tests__, hậu tố .tests/-spec, hậu tố camel-case UnitTests); layout đặt tên khác vẫn phải dùng inputs ** hoặc thêm cây test có tên chuẩn.
- **risk-hash-io-unmeasured** (low) — Băm song song giới hạn 16 file chưa được đo trên solution hàng chục nghìn file thật; mới kiểm chứng tính đúng và tính xác định.
- **risk-negated-input** (low) — Input dạng phủ định (!…) đứng riêng vẫn bị globby coi là không khớp file nào và làm snapshot lỗi; gate chỉ bỏ qua chúng khi xét coverage.

## Evidence

- `chk-gate-digest-focused` — pass (2026-09-30 10:49:47 +07:00): pnpm vitest run test/unit/core/workflow test/unit/core/verification — 23 file, 115 test pass — suite gate theo segment, finish dùng pass mới nhất, digest theo marker/hoa thường/song song
- `chk-full-suite` — pass (2026-09-30 10:51:18 +07:00): pnpm typecheck && pnpm lint && pnpm test — exit 0 — 154 file, 914 test pass (1 skipped), coverage lines 93.54% — không hồi quy; evidence focused trước đó ghi 23 file/115 test là số cũ, chạy thật là 24 file/118 test
