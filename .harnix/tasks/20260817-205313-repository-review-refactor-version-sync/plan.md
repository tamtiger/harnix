# Kế hoạch review, refactor và đồng bộ version

## Checklist

- [x] R1 — Khóa baseline fresh, đọc nguồn sự thật và lập coverage/version inventory.
- [x] R2 — Audit từng subsystem, ghi finding P0-P3 với root cause và disposition.
- [x] R3 — Viết RED và sửa từng finding P0-P2; refactor nhỏ nhất khi xanh.
- [x] R4 — Đồng bộ patch release, runtime/skills/self-host/current docs và CHANGELOG theo inventory.
- [x] R5 — Compliance review, quality/security review và exact acceptance sequence; persist completion.

## R1 — Baseline và inventory

Ghi `research/repository-audit.md` với Git state, package/runtime versions, dependency/architecture inventory, baseline commands và coverage matrix. Ghi `research/version-inventory.md` với `path`, `value`, `class`, `mustMatchPackage`, `status`, `action`, `evidence`; phân biệt current release khỏi schema, dependency, upstream snapshot, fixture và lịch sử.

## R2 — Findings

Review sâu theo evidence: CLI JSON/exit/redaction; init/update/doctor/uninstall/migration; global Kiro/Antigravity/Codex ownership/rollback/path safety; task freshness/context/journal/repo-map; canonical skills/templates/guides; release scripts và isolated fake-home tests. Mỗi finding có ID ổn định, severity, violated contract, vị trí hẹp, reproduction, impact, root cause, remediation, regression protection và disposition.

## R3 — Implementation

Với behavior change: observed RED fail đúng nguyên nhân, minimal GREEN, refactor while green, focused neighboring tests. Docs/generated/mechanical change ghi TDD exception và dùng deterministic inspection/build/test. Không gộp root cause độc lập hoặc mở rộng public contract.

## R4 — Version sync

Sau khi findings đóng, áp dụng release rule: bump đúng patch version nếu có thay đổi, cập nhật package/lockfile khi cần, bảy `metadata.version`, self-host generator metadata, current-state README/docs và CHANGELOG. Giữ nguyên schema/protocol versions, dependency versions, baseline snapshots, completed tasks, fixtures và changelog lịch sử. Build lại và chứng minh CLI/skills/current docs khớp.

## R5 — Verification và finish

Stage 1 đối chiếu từng acceptance criterion, negative scope và contract. Stage 2 review correctness, security, maintainability, test quality và unnecessary complexity. Mỗi required check dùng snapshot trước/sau, persist evidence ngay, sau đó chuyển `verifying/finishing`, tăng patch version trước completion theo AGENTS và chạy hidden finish để journal/active pointer được xử lý an toàn. Manual disposable-profile smoke được ghi omitted vì không có authorization mới.
