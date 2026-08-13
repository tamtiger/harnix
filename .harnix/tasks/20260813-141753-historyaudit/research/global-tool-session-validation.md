# Kiểm chứng tool session user-global ngày 2026-08-13

## Câu hỏi

Sau khi người dùng cấp quyền rõ ràng, các global skill/rule/hook hiện tại có được Kiro 2.16.0, Antigravity CLI 1.1.12 và Codex 26.803 discover/activate đúng trong profile thật hoặc test home riêng hay không?

## Nguồn chính thức

- Kiro CLI global hooks v3, truy cập 2026-08-13: https://kiro.dev/changelog/cli/2-13/
- Kiro CLI hook protocol, truy cập 2026-08-13: https://kiro.dev/docs/cli/hooks/
- Antigravity plugin layout/loader, truy cập 2026-08-13: https://antigravity.google/docs/cli/plugins
- Antigravity hook schema và `PreInvocation` protocol, truy cập 2026-08-13: https://antigravity.google/docs/hooks

Các trang là tài liệu sống. Version runtime quan sát trực tiếp trong smoke là Kiro CLI 2.16.0 và Antigravity CLI 1.1.12; revision HTML không được công bố nên ngày truy cập là provenance boundary.

## Sự thật quan sát được

- Fake-home setup/dry-run tạo đúng logical target cho cả ba platform; hidden context command no-op ở repo thường và inject bounded sentinel ở repo initialized cho ba protocol.
- Cả bảy canonical skill qua `quick_validate.py` ở UTF-8. Kiro session thật discover đủ bảy skill. Antigravity `plugin validate` xử lý đủ bảy skill và một hook cho cả Desktop/CLI plugin.
- Antigravity runtime log từ plugin Harnix hiện tại báo `rules/harnix.md: invalid frontmatter format`. Focused RED tái hiện canonical rule không có frontmatter; thêm `name` và `description` frontmatter làm runtime hết lỗi parse.
- Objective `PreInvocation` probe trên Antigravity CLI 1.1.12 nhận event chính thức, và với `workspacePaths` chứa repository Harnix thì packaged `harnix internal context --platform antigravity` trả bounded active-task context. `agy --print` không có `--add-dir` phát event với `workspacePaths: []`; hook process cwd là plugin root nên activation phải no-op an toàn.
- Kiro 2.16.0 session thật discover đủ bảy global skill. Objective probe không thấy global JSON-v1 hook chạy trong default hoặc `--v3` non-interactive session, dù release note 2.13.0 chỉ tuyên bố global hooks cho v3. Chưa có evidence đủ để đổi frozen Kiro schema/path hoặc claim CLI hook active.
- Codex CLI binary chạy được sau khi copy ra test directory, nhưng test home không có login. Real-profile Doctor vẫn đúng ở `installed-pending-trust`; không dùng `--dangerously-bypass-hook-trust`, và chưa có `/hooks` review/trust từ UI.
- Disposable uninstall preview/apply xóa đúng owned target, giữ ba unrelated config sentinel và Doctor sau uninstall có 0 warning/error.

## Suy luận áp dụng cho Harnix

- Antigravity rule frontmatter là product bug có regression rõ và sửa được trong frozen plugin surface; không cần thêm plugin, command hay import manifest.
- Antigravity print-mode không cung cấp workspace root trừ khi caller truyền `--add-dir`; Harnix phải tiếp tục fail closed thay vì đọc transcript hoặc đoán đường dẫn từ plugin cwd.
- Kiro CLI hook activation và Codex hook trust là external capability evidence còn thiếu. File presence, validator pass hoặc skill discovery không đủ để đánh dấu active.

## Bất định còn lại

- Kiro IDE có thể load JSON-v1 hook trong khi Kiro CLI v3 non-interactive không load; cần mở tool UI/session hỗ trợ `/hooks` hoặc authoritative capability evidence để phân biệt schema drift với limitation của non-interactive mode.
- Antigravity interactive session có thể tự điền workspace root trong khi print mode cần `--add-dir`; Doctor vẫn phải giữ `precedence-unknown` nếu không nhận explicit external evidence.
- Codex hook chỉ được claim active sau review/trust exact hash trong `/hooks` và một activation probe mới.
