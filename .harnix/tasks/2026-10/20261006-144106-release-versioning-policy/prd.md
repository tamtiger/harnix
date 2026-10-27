# PRD: Chính sách phiên bản kiểm tra được

## Vấn đề

Chưa có quy tắc viết ra về việc ai bump phiên bản và khi nào: task lẻ, member của epic và lúc đóng epic cần các kiểu phiên bản khác nhau. `scripts/version-sync.mjs` chấp nhận mọi chuỗi pre-release hợp lệ của semver nên một bản `2.2.1-beta` hay `2.2.0-dev` thiếu số thứ tự vẫn lọt qua.

## Chính sách

- Task lẻ: tăng patch đúng một lần (`X.Y.Z` → `X.Y.(Z+1)`), do agent làm ở giai đoạn implement trước `verifying`.
- Member của epic: bản tiền phát hành `X.Y.0-dev.N`, N tăng dần, mỗi member một lần, cũng ở giai đoạn implement.
- Đóng epic: member cuối theo ID phát hành bản minor `X.(Y+1).0` hoặc `X.Y.0` của chuỗi dev đó (bản phát hành lớn hơn mọi dev.N của nó).
- Major chỉ khi phá vỡ frozen contract.

## Phạm vi

- `scripts/version-sync.mjs`: pre-release chỉ nhận dạng `dev.N` trên bản `X.Y.0`; vẫn từ chối bản không lớn hơn bản hiện tại (kể cả lùi về dev của bản đã phát hành).
- AGENTS.md, template `workflow.md` (và `.harnix/workflow.md`), skill `harnix-implement` mô tả chính sách.
- Bản ghi epic `20261006-141317-workflow-field-feedback` ghi quyết định phiên bản.

## Không thuộc phạm vi

- Không đổi lịch sử phiên bản đã phát hành; không tự commit, tag hay publish.

## Tiêu chí chấp nhận

### ac-1: Tài liệu chính sách

AGENTS.md, template workflow và skill harnix-implement mô tả chính sách: task lẻ patch, member epic `X.Y.0-dev.N`, đóng epic minor, major chỉ cho thay đổi phá vỡ frozen contract; ghi ai bump và bump lúc nào.

**Verifies:** `check-docs` cùng `check-suite`.

### ac-2: Quy tắc trong script

`version-sync` chấp nhận `X.Y.0-dev.N`, từ chối pre-release không phải `dev.N` hoặc trên patch khác 0, từ chối dev thấp hơn hoặc bằng bản hiện tại và lùi về dev của bản đã phát hành, và cho phép `X.Y.0` sau chuỗi dev; có test từng trường hợp.

**Verifies:** `check-version-rules` cùng `check-suite`.

### ac-3: Quyết định ở epic

Bản ghi epic ghi: Task 1 đã phát hành 2.1.2, các member còn lại dùng `2.2.0-dev.N`, và `20261006-165805-cli-version-skew-warning` (member cuối theo ID) đóng epic bằng 2.2.0.

**Verifies:** `check-docs` (test đọc bản ghi epic) cùng `check-suite`.

## Rủi ro

Siết định dạng pre-release có thể chặn một quy trình dùng `-beta`/`-rc`; repo này chưa dùng, và thông báo lỗi nêu định dạng hợp lệ.
