# PRD: Cảnh báo lệch phiên bản CLI và phát hành 2.2.0

## Vấn đề

`harnix` trên PATH có thể cũ hơn phiên bản đã ghi trong dự án (`generatorVersion` trong `.harnix/.template-hashes.json`). Khi đó các cổng mới (ví dụ `--reviewed`, `--set-baseline`) không tồn tại hoặc không có tác dụng mà không có dấu hiệu nào; tình huống này đã xảy ra ngay trong epic này (CLI toàn cục 2.0.4 so với repo 2.2.0-dev.x).

## Thiết kế

- `src/core/versions/skew.ts`: so sánh semver (có tiền phát hành: `2.2.0-dev.N` < `2.2.0`) và `detectVersionSkew(manifest, running)` lấy `generatorVersion` lớn nhất trong manifest, trả `{ recorded, running }` khi lớn hơn phiên bản CLI đang chạy. Không gọi mạng, không chặn lệnh.
- `harnix workflow --preflight` thêm trường `versionSkew` (một chuỗi ngắn nêu cả hai phiên bản và cách cập nhật) chỉ khi lệch; khi không lệch preflight không dài thêm.
- `harnix doctor` thêm finding `cli-version-skew` (warning, không fixable) cùng nội dung.
- Tài liệu: cách xử lý khi CLI cũ hơn repo: build và cài lại bản repo, chỉ khi người dùng cho phép.
- Phát hành: `pnpm version:sync 2.2.0` đóng epic; CHANGELOG gom các bản dev thành một entry 2.2.0; đồng bộ self-host.

## Không thuộc phạm vi

Không chặn lệnh khi lệch; không kiểm tra bản mới trên mạng.

## Tiêu chí chấp nhận

### ac-1: Phát hiện skew

Preflight và doctor báo khi `generatorVersion` lớn hơn CLI, nêu cả hai phiên bản và cách cập nhật; không báo khi bằng nhau hoặc CLI mới hơn.

**Verifies:** `check-skew` cùng `check-suite`.

### ac-2: Ngắn gọn, đủ ba trường hợp

Không làm preflight dài thêm khi không lệch; test cho CLI cũ hơn, bằng nhau, mới hơn (kể cả tiền phát hành).

**Verifies:** `check-skew` cùng `check-suite`.

### ac-3: Tài liệu

Template workflow, AGENTS.md và docs nêu cách xử lý khi CLI trên PATH cũ hơn repo.

**Verifies:** `check-docs` cùng `check-suite`.

### ac-4: Phát hành 2.2.0

`package.json` là 2.2.0, CHANGELOG có một entry 2.2.0 gom các bản dev và không còn heading dev của dòng 2.2.0, file tự-host đồng bộ, toàn bộ gate pass.

**Verifies:** `check-docs` (test CHANGELOG) cùng `check-suite`.
