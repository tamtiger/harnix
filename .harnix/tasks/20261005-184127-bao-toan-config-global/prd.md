# PRD — Bảo toàn cấu hình global của người dùng

Thuộc epic `20261005-184125-harnix-hardening-2-0-5` (task 3/6). Nguồn: báo cáo review 2.0.4, finding R-010, R-011, R-018, R-019, R-020, R-021, R-031, R-032. Task 1–2 đã hoàn thành.

## Vấn đề

`harnix setup|update|uninstall` ghi vào các file dùng chung của người dùng (`~/.claude/settings.json`, `$CODEX_HOME/config.toml`, `AGENTS.md`/`CLAUDE.md`) và phải giữ nguyên mọi nội dung không thuộc Harnix. Review đã tái hiện bằng home giả:

1. **Codex `config.toml` có thể thành TOML không hợp lệ (R-010).** Block hook `[[hooks.UserPromptSubmit]]` luôn được nối cuối file mà không kiểm tra. File đã có `[hooks]` với `UserPromptSubmit = []` (hoặc `hooks.UserPromptSubmit = []`, hoặc `[hooks.UserPromptSubmit]`) sẽ bị định nghĩa lại, Codex không đọc được config, nhưng setup vẫn báo `installed-pending-trust`. File CRLF còn bị trộn LF.
2. **`settings.json` của Claude bị viết lại (R-011).** `parseJsonDocument` sắp xếp key rồi `serializeJsonDocument` ghi đè cả file: đổi thứ tự key, đổi indent, và làm sai số nguyên lớn (`12345678901234567890` thành `12345678901234567000`). Uninstall cũng làm vậy.
3. **Uninstall để lại rác (R-018).** Home không có `settings.json`, setup rồi uninstall còn `{"hooks":{"UserPromptSubmit":[]}}`; các thư mục rỗng Harnix tạo (`~/.kiro/hooks`, `~/.kiro/steering`, `skills/` của Claude, Codex, Cursor, OpenCode, `plugins/` của Antigravity) không bị dọn.
4. **`setup --codex` không gỡ hook `hooks.json` cũ (R-019).** `removeObsolete` mặc định tắt trong setup nên fragment legacy chưa sửa vẫn còn trong khi hook mới được thêm: Codex chạy hook hai lần.
5. **Exit code không nhất quán (R-020).** `setupNotice` cố định bị tính là cảnh báo cần xử lý, nên `setup --cursor|--opencode` (kể cả `--dry-run`) luôn exit 1 dù readiness là `installed`; `update --global` không dùng cùng báo cáo nên exit 0 khi `drifted`.
6. **OpenCode có thể bỏ qua `XDG_CONFIG_HOME` (R-021, giả thuyết).** Root cố định `~/.config/opencode`, `envOverride: null`.
7. **Script release không cô lập đủ (R-031) và `isTestProcess` (R-032).** `createIsolatedUserEnvironment` không ghi đè `CLAUDE_CONFIG_DIR`; `smoke:tarball` và `scan:release` không phủ OpenCode, Cursor. `isTestProcess()` trùng hai nơi và phụ thuộc `NODE_ENV=test` của shell người dùng, làm `harnix setup` lỗi "requires an injected homeResolver in test mode".

## Mục tiêu

Setup, update, uninstall chỉ thay đổi đúng phần Harnix sở hữu, trả lại file người dùng đúng từng byte, báo trạng thái trung thực qua exit code, và các script release không thể chạm profile thật.

## Quyết định (mặc định đề xuất, chờ duyệt cùng kế hoạch)

1. **JSON dùng chỉnh sửa trên văn bản, không parse rồi ghi lại.** Thêm một bộ chỉnh JSON theo offset (`json-text`): đọc vị trí của mảng đích và các phần tử, chỉ chèn, thay hoặc xóa đúng một phần tử, phát hiện indent (2, 4 hoặc tab) và kiểu xuống dòng, giữ BOM. Parse chuẩn hóa vẫn dùng để so khớp member và tính hash, nhưng không bao giờ để ghi.
2. **TOML không thêm thư viện.** Một bộ quét dòng bảo thủ (`toml-guard`) theo dõi tiêu đề bảng hiện tại và nhận diện mọi định nghĩa `hooks.UserPromptSubmit` không phải `[[hooks.UserPromptSubmit]]` (key trong `[hooks]`, dotted key, bảng đơn, inline `hooks = {`). Gặp xung đột thì giữ nguyên file, ghi cảnh báo `untracked-collision` và readiness `drifted`. Khối chèn theo kiểu xuống dòng của file gốc.
3. **Dọn rác sau uninstall:** khi xóa hết phần tử mà mảng rỗng thì bỏ khóa mảng, bỏ các object cha rỗng, và nếu root còn `{}` thì xóa file; xóa các thư mục cha rỗng đi lên tới root đã xác minh (không bao giờ xóa root). Một thư mục rỗng do người dùng tự tạo trong cùng chuỗi cha cũng bị dọn; đây là chấp nhận có chủ ý vì nó không chứa gì.
4. **Legacy bị thay thế được gỡ ngay trong `setup`:** fragment cũ (cùng `sourceId`, khác dạng) chưa bị sửa thì gỡ khi dạng mới được tạo; bản đã bị người dùng sửa được giữ và báo.
5. **Exit code:** `setupNotice` là thông tin, không phải cảnh báo; `setup --dry-run` thoát 0; `update --global` dùng cùng báo cáo readiness với setup.
6. **OpenCode `XDG_CONFIG_HOME`:** xác minh với tài liệu OpenCode (`harnix-research`, chỉ đọc) trước khi quyết định. Nếu xác nhận thì `envOverride: "XDG_CONFIG_HOME"` với root `$XDG_CONFIG_HOME/opencode` và kiểm tra an toàn như `CODEX_HOME`; nếu không xác nhận được thì ghi vào `facts.ts` và doctor chỉ cảnh báo khi biến được đặt.
7. **`isTestProcess`:** chỉ dựa vào `VITEST` (không `NODE_ENV`), một định nghĩa duy nhất trong `src/utils`.

## Không thuộc phạm vi

- Không thêm platform hay file global mới; không đổi ownership model, manifest schema hay lock.
- Không chạm home thật: mọi test và script dùng home giả; chỉ `--dry-run` hoặc thư mục tạm.
- Nội dung hướng dẫn/tài liệu cho người dùng (cách khôi phục `settings.json`...) thuộc task 6.

## Tiêu chí chấp nhận

Xem `task.json` (ac-1 đến ac-8). ac-1 Codex TOML; ac-2 `settings.json` byte-identical; ac-3 dọn rác; ac-4 legacy `hooks.json`; ac-5 exit code; ac-6 OpenCode; ac-7 script release và `isTestProcess`; ac-8 cổng chất lượng.

## Rủi ro

- Bộ chỉnh JSON theo offset phức tạp (chuỗi có dấu nháy thoát, số, lồng nhau): phủ bằng table test và một test property nhỏ "chèn rồi xóa trả lại đúng chuỗi gốc" trên nhiều mẫu.
- Bộ quét TOML bảo thủ có thể từ chối file hợp lệ (báo `drifted` dù không thật sự xung đột). Chấp nhận: an toàn hơn ghi đè; thông báo nêu rõ cách xử lý thủ công.
- Dọn thư mục rỗng có thể xóa thư mục người dùng tạo sẵn nhưng rỗng. Giới hạn ở chuỗi cha của file Harnix vừa xóa và không vượt qua root.
- Thay đổi script release có thể làm `smoke:tarball` khác môi trường CI cũ: chạy lại toàn bộ chuỗi §11.
