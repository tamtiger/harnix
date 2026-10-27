# PRD: Khắc phục finding review toàn diện

## Outcome

Harnix thực thi đúng các boundary security, ownership, workflow và CLI đã công bố; release gate đo đúng packaged behavior thay vì che khuất regression.

### AC `ac-cli-contract`

Public CLI luôn emit một JSON document cho cả success và failure, dùng exit code theo frozen semantics; setup readiness actionable và upgrade offline lookup được biểu diễn rõ ràng.

### AC `ac-context-boundary`

Path có control character hoặc line separator bị reject; omitted metadata được serialize, bounded và nằm trong fixed untrusted repository context boundary trên cả ba platform.

### AC `ac-doctor-scope`

Doctor fix project và global theo scope loại trừ nhau, không tạo side effect ngoài flag đã được người dùng cấp quyền.

### AC `ac-docs-release`

README, normative docs, package patch version, canonical skill metadata và CHANGELOG đồng bộ với hành vi đã sửa trước completion.

### AC `ac-hook-fast-path`

Canonical `harnix context --platform <id>` là hook fast path duy nhất, legacy alias bị reject và release scanner benchmark đúng installed command.

### AC `ac-lock-ownership`

Stale-lock recovery dùng canonical lock-directory chứa unique owner token, chỉ công nhận ownership sau sole-token verification và chỉ unlink token đã quan sát trước non-recursive `rmdir`, để delayed cleanup không thể xóa replacement. Legacy single-file lock được preserve/fail closed thay vì auto-reclaim không an toàn.

### AC `ac-workflow-invariants`

New task chỉ là exact schema v2, Full mode không downgrade, nested extra field bị reject và dangling active pointer được báo invalid state.

## Boundaries

Giữ single package/bin, runtime offline mặc định, fake-home testing, conservative global ownership và toàn bộ historical TaskRecord v1 hợp lệ. Không thêm compatibility surface cho legacy hidden command.