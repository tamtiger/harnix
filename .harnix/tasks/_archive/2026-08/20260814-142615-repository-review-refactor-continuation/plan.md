# Kế hoạch tiếp tục review và refactor toàn repository

## Checklist

- [ ] R1 — Khóa baseline hiện tại, đối chiếu task trước và lập coverage matrix cho mọi subsystem/file group.
- [ ] R2 — Audit correctness, data safety, security và public contracts; ghi finding P0–P3 bằng bằng chứng.
- [ ] R3 — Audit architecture, duplication, complexity, dead code, performance và test quality; chọn refactor có giá trị đo được.
- [ ] R4 — Viết RED regression cho từng finding P0–P2 rồi triển khai GREEN/refactor nhỏ nhất theo từng subsystem.
- [ ] R5 — Đồng bộ normative docs, package patch version, self-host metadata và CHANGELOG sau khi finding inventory đóng.
- [ ] R6 — Chạy compliance review, quality/security review và toàn bộ acceptance/release sequence trên current tree.

## R1 — Baseline và coverage

Tạo `research/repository-audit.md` với ma trận tối thiểu cho: docs/contracts; package/build/release scripts; CLI/commands; configurators/global lifecycle; core config/context/journal/research/tasks/workflow/repo-map; migration; catalog/guides/rules/skills/templates; filesystem/path/lock/atomic utilities; unit/integration/platform/workflow/safety/migration tests. Mỗi nhóm có file đã đọc, invariant, test hiện có, finding và disposition. Phần skill version được ghi dưới baseline changes, không tách thành workstream riêng.

## R2 — Correctness, safety và contracts

Review input trust boundaries, path normalization/realpath, symlink/junction escape, atomic replacement, locks, partial persistence, idempotency, concurrent journal/state writes, JSON/TOML/Markdown preservation, CLI JSON/exit behavior, global ownership reconciliation và secret/machine-path redaction. Finding chỉ hợp lệ khi có reproduction, violated contract hoặc data-flow proof.

## R3 — Maintainability và hiệu năng

Dựng module dependency graph và hotspot inventory bằng static inspection. Kiểm tra architecture direction, duplicate implementations, oversized mixed-responsibility functions, hidden coupling, unnecessary I/O/network/process work, unbounded traversal/history và weak tests. Refactor P3 chỉ khi có before/after evidence như duplicate removal, dependency edge simplification, smaller responsibility boundary hoặc focused regression.

## R4 — TDD implementation

Xử lý finding theo severity và subsystem. Mỗi behavior change có RED fail đúng nguyên nhân, GREEN nhỏ nhất, refactor khi xanh và focused test. Không gộp nhiều root cause vào một patch. Nếu ba hypothesis liên tiếp thất bại, quay lại replan/debug theo workflow.

## R5 — Documentation và release metadata

Sau khi audit inventory không còn finding P0–P2 mở, đồng bộ PRD/workflow/implementation/review mapping, tăng package patch version đúng một lần cho continuation này, cập nhật self-host template hashes và ghi CHANGELOG với toàn bộ user-visible changes.

## R6 — Verification

Stage 1 kiểm tra compliance với request, AGENTS và frozen contracts. Stage 2 kiểm tra correctness, security, maintainability và unnecessary complexity. Chạy focused regression suites, dependency audit, rồi chính xác acceptance sequence mục 11 gồm frozen install, build, lint, typecheck, full tests, acceptance subsets, pack/tarball smoke, performance, footprint, release scan và diff check. Mọi required check dùng snapshot trước/sau và evidence digest ổn định.