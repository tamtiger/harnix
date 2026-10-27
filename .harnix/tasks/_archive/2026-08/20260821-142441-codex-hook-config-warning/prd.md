# PRD: Sửa cảnh báo hook Codex

## Outcome

Harnix không làm Codex cảnh báo mỗi lần khởi động vì một layer đồng thời có `hooks.json` và bảng `[hooks]` trong `config.toml`.

### AC `ac-codex-single-source`

Codex global setup/update dùng một managed block inline trong `$CODEX_HOME/config.toml`, tương thích với `[hooks.state]` do Codex tự quản lý, và không tạo `hooks.json` mới.

### AC `ac-codex-migration`

Hook Harnix cũ trong `$CODEX_HOME/hooks.json` chỉ bị gỡ khi manifest/hash chứng minh fragment chưa bị sửa; hook người dùng hoặc fragment đã sửa được giữ nguyên và báo rõ.

### AC `ac-codex-preservation`

Reconcile atomic bảo toàn nội dung không thuộc Harnix trong config, AGENTS, skills và manifest; không ghi secret/absolute path và giữ readiness `installed-pending-trust` cho hook chưa trust.

### AC `ac-codex-release`

Normative docs, patch version và CHANGELOG phản ánh contract mới; các gate acceptance/release với fake-home pass.