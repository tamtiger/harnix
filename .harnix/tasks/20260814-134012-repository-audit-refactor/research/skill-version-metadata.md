# Research: canonical skill version metadata

- Task: 20260814-134012-repository-audit-refactor
- Ngày truy cập: 2026-08-14
- Material unknown: Đặt version ở đâu và dùng semantics nào để bảy skill vẫn portable trên Kiro, Antigravity và Codex?

## Repository evidence

- `src/skills/catalog.ts` hiện chỉ chấp nhận đúng `name` và `description`; `SkillTemplate` chưa expose version.
- `test/workflow/skill-sources.test.ts` chủ động cấm `metadata` và `version`, nên explicit user request supersede contract cũ và cần RED test.
- Ba configurator render nguyên `skill.content`, vì vậy một canonical frontmatter hợp lệ sẽ giữ byte parity.
- Installed Codex system skills trên môi trường hiện tại dùng top-level `metadata` mapping, chứng minh Codex loader chấp nhận namespace này.
- Global managed sidecar đã lưu `generatorVersion`; skill version không cần thay vai trò package/generator version.

## Nguồn chính thức

1. Agent Skills specification: https://agentskills.io/specification — truy cập 2026-08-14. Spec cho phép optional `metadata` là map string-to-string và minh họa `metadata.version: "1.0"`; không định nghĩa top-level `version`.
2. Kiro Agent Skills docs: https://kiro.dev/docs/skills/ — cập nhật 2026-02-18, truy cập 2026-08-14. Kiro công bố optional `metadata` cho dữ liệu như author hoặc version và dẫn về Agent Skills specification.
3. Google Antigravity Skills docs: https://antigravity.google/docs/skills — truy cập 2026-08-14. Tài liệu gọi Agent Skills là open standard nhưng bảng rút gọn chỉ công bố `name` và `description`; không có bằng chứng cho top-level `version`.

## Facts

- Portable standard đặt version trong `metadata`, không phải top-level field.
- `metadata` values phải là strings theo Agent Skills spec.
- Kiro xác nhận trực tiếp use case version trong `metadata`.
- Antigravity không công bố lệnh validator hoặc bảng optional metadata đầy đủ trên trang hiện tại.

## Inferences và quyết định

- Chọn `metadata.version: "1.0.0"` cho từng canonical skill. Đây là Harnix content version và parser áp dụng SemVer ba thành phần để version có thể evolve độc lập từng skill.
- Không dùng package version `0.6.x`: global manifest đã lưu generator version; buộc skill version theo mọi package patch sẽ tạo churn và update file dù nội dung skill không đổi.
- Không dùng top-level `version`: trái representation được standard minh họa và có rủi ro strict-host rejection cao hơn.
- Canonical parser chỉ cho phép keys `name`, `description`, `metadata`; trong `metadata` chỉ cho `version` để fail closed và giữ output deterministic.

## Tác động lên PRD/plan

- Cập nhật normative frontmatter contract từ “chỉ name/description” thành `name`, `description`, `metadata.version`.
- `SkillTemplate` expose `version` nhưng `renderSkill` tiếp tục trả raw canonical content.
- RED tests kiểm bảy version hợp lệ, parser reject missing/malformed/extra metadata và adapter parity.

## Remaining uncertainty

Không có manual Antigravity host-session probe mới trong scope này. Compatibility được suy ra từ tuyên bố open-standard của tài liệu chính thức và sẽ được bảo vệ bằng parser/platform fixtures; nếu host sau này reject optional `metadata`, đó là revalidation trigger và phải dùng authoritative runtime evidence trước khi đổi canonical format.