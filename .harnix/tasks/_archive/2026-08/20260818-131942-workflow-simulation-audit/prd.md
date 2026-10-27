# PRD — Mô phỏng và kiểm toán toàn bộ workflow đa nền tảng

## Outcome

Harnix có bằng chứng tự động và runtime cho toàn bộ lifecycle, đồng thời Kiro, Antigravity và Codex tự kích hoạt workflow trong initialized project ngay cả khi ordinary user prompt không nhắc Harnix.

## Phạm vi

- Audit deterministic fixtures cho Bypass/Lite/Full, Ready, implementation, debug/replan, verification freshness, blocked/continue, migration và finish.
- Audit global adapters và implicit activation trên từng surface: Kiro IDE/CLI, Antigravity Desktop/`agy`, Codex CLI/IDE.
- Chạy cold session với prompt không nhắc Harnix khi surface khả dụng trong disposable profile.
- Reproduce và sửa defect có bằng chứng; bổ sung regression protection.
- Chạy exact acceptance gate và đồng bộ patch release trước completion.

## Quyết định và ranh giới

- File integration tồn tại không chứng minh runtime active; cần external session evidence hoặc trạng thái conservative.
- Runtime probe chỉ dùng disposable profile. Nếu tool không thể chạy tách khỏi profile thật thì ghi `not-run` và không claim active.
- Initialized project phải tự kích hoạt guard; non-Harnix project phải no-op và không tự init.
- Không bypass trust/permission, không cài application, không commit/publish.

## Rủi ro

- Tool GUI có thể không hỗ trợ disposable home; mitigation là tách automated protocol evidence khỏi runtime session và báo not-run trung thực.
- Plugin cache hoặc workspace precedence có thể tạo false positive; mitigation là cold session và explicit/implicit/negative controls.
- Broad audit có thể phát hiện defect độc lập; chỉ sửa defect thuộc lifecycle/activation, còn scope khác được ghi residual finding.
## Kết luận research và replan 2026-08-18

- Kiro current docs xác nhận global steering tự load và skill tự activate theo description; CLI hooks hiện được định nghĩa trong agent configuration, nên không được claim Kiro CLI hook active từ JSON-v1 IDE file.
- Antigravity official/built-in docs và runtime `agy 1.1.1` xác nhận plugin rule always-on nên dùng `rules/AGENTS.md` không frontmatter. `rules/harnix.md` hiện sinh log invalid trigger.
- Harnix phải ghi rõ implicit activation trong Kiro steering, Antigravity rule và Codex global AGENTS block: initialized project tự route mọi ordinary request mà không cần người dùng nhắc Harnix.
- Thay đổi Antigravity rule path là contract/migration change; cập nhật đồng bộ docs, ownership reconcile và tests. Không claim hook CLI active nếu runtime vẫn thiếu external evidence.