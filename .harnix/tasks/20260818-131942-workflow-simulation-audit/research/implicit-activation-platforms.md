# Research — Implicit activation trên Kiro và Antigravity

- Task: 20260818-131942-workflow-simulation-audit
- Ngày truy cập: 2026-08-18
- Material unknown: Surface hiện tại tự load instruction/rule/hook nào để ordinary prompt kích hoạt Harnix mà không nhắc tên?

## Repository evidence

- Kiro adapter sinh global steering, skills và JSON-v1 IDE `UserPromptSubmit` hook.
- Antigravity adapter sinh hai plugin roots với `rules/harnix.md` có frontmatter và `PreInvocation` hook.
- Automated fake-home suites pass nhưng không chứng minh external runtime activation.

## Primary sources

1. https://kiro.dev/docs/cli/hooks/ — CLI hooks và `userPromptSubmit` nằm trong agent configuration; stdout exit 0 được thêm vào context. Trang cập nhật 2026-06-05.
2. https://kiro.dev/docs/cli/steering/ — global steering dưới `~/.kiro/steering/` tự áp dụng cho mọi workspace/session. Trang cập nhật 2026-01-08.
3. https://kiro.dev/docs/cli/skills/ — default agent tự load global skills và activate theo description.
4. https://www.antigravity.google/docs/plugins — global Desktop plugins dưới `~/.gemini/config/plugins/` được auto-discover.
5. https://www.antigravity.google/docs/hooks — `PreInvocation`, camelCase stdin và `injectSteps` output contract.
6. https://antigravity.google/docs/cli/plugins — official CLI plugin install/list/enable contract và staged plugin behavior.
7. Built-in `agy 1.1.1` customization docs trong disposable profile — plugin rule khuyến nghị `rules/AGENTS.md`, standalone AGENTS không frontmatter và enabled-by-default semantics.

## Runtime findings

- Kiro CLI 2.17.0 không khởi động khi chỉ redirect HOME/USERPROFILE; full disposable Windows user profile là yêu cầu còn lại, nên không dùng real profile.
- `agy 1.1.1` dùng đúng disposable app-data root. Direct Harnix handler trả bounded canary, nhưng cold session không nhận canary.
- Runtime diagnostic đã redact báo 0 named hooks từ 0 `hooks.json` và `Invalid rule trigger: CORTEX_MEMORY_TRIGGER_UNSPECIFIED`.
- Official install/enable, clean install và workspace plugin đều không làm hook load trong print mode; sau ba hypothesis không tiếp tục suy đoán.

## Facts, inference và quyết định

Facts: Kiro global steering/skills hỗ trợ implicit activation; Antigravity rule hiện tại bị runtime đánh dấu invalid; file presence/validator không chứng minh active.

Inference có confidence cao: đổi Antigravity plugin rule sang always-on `rules/AGENTS.md` không frontmatter là remediation nhỏ nhất phù hợp built-in contract và giữ activation guard.

Inference có confidence trung bình: Kiro ordinary activation nên dựa trên auto-loaded steering/skills; JSON-v1 hook chỉ được claim cho surface đã có external evidence.

Quyết định: fix-now rule path/content và explicit implicit-activation prose trên cả ba adapters; cập nhật docs/tests/migration cùng change. Giữ hook protocols hiện tại nhưng không nâng readiness thành active nếu chưa có runtime evidence.

## Remaining uncertainty

Antigravity print mode 1.1.1 vẫn chưa chứng minh plugin hook execution ngay cả sau official install; re-probe sau rule fix, và giữ `precedence-unknown`/residual risk nếu log vẫn báo 0 hooks. Kiro CLI cần full disposable Windows account hoặc explicit real-profile authorization để runtime probe.

## Re-probe sau remediation

- Disposable `agy` 1.1.1 với rule `rules/AGENTS.md` trả đúng Bypass, Lite, Full cho ordinary prompt trong initialized project và NONE ở non-Harnix control; log không còn invalid rule trigger.
- `agy --print` vẫn load 0 hook từ 0 `hooks.json`; instruction activation pass nhưng hook activation giữ conservative/unproven.
- Kiro CLI và Codex CLI trong fake profile đều không có login; Codex còn pending hook trust. GUI surfaces không được chạy vì không có isolated OS profile.
- Một help-only Codex probe thiếu fake CODEX_HOME đã thử housekeeping temp alias ở profile thật nhưng bị OS từ chối; không có write thành công, và các probe sau đều khóa ba biến home vào disposable root.
