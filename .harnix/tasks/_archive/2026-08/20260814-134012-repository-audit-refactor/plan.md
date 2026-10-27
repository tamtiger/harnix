# Kế hoạch triển khai

## Checklist

- [x] A1 — Hoàn tất baseline audit và inventory findings có bằng chứng.
- [x] A2 — Nghiên cứu rồi khóa canonical skill-version contract.
- [x] A3 — Viết RED tests cho skill version/parser/platform parity và triển khai GREEN tối thiểu.
- [x] A4 — Viết RED test cho completed-active recovery và sửa workflow tối thiểu.
- [x] A5 — Viết RED test cho cross-token managed marker overlap và fail closed trong validator.
- [x] A6 — Đồng bộ tài liệu normative, patch version và CHANGELOG.
- [x] A7 — Chạy compliance review, quality/security review và acceptance sequence đầy đủ.

## Thứ tự và bằng chứng

### A1 — Audit

Đọc docs nguồn, source, tests, scripts và dependency graph; chạy baseline build/lint/typecheck/test. Kết quả review phải nêu file:line, contract, reproduction, root cause và fix direction.

### A2 — Skill version research

Research đã chọn `metadata.version: "1.0.0"`: Agent Skills và Kiro công bố `metadata` cho dữ liệu như version; Codex local canonical skills dùng metadata; Antigravity mô tả skills là open standard nhưng không liệt kê optional metadata trong bảng rút gọn. Version là content version độc lập, không tự bump theo mọi package patch.

### A3 — Skill version TDD

RED: cập nhật expectations để yêu cầu version hợp lệ và catalog expose version. GREEN: sửa bảy SKILL.md cùng parser/type; xác nhận output của ba adapter vẫn byte-identical.

### A4 — Workflow recovery TDD

RED: tái hiện completed task còn active sau journal/archive failure và chứng minh routing/recovery không bị coi là invalid state. GREEN: thêm đường recovery nhỏ nhất, không ghi lại completion evidence hoặc xóa pointer sai task.

### A5 — Managed marker safety

RED: sidecar có selector A.end trùng hoặc chứa B.begin đang lọt validator. GREEN: so sánh đầy đủ bốn marker token trong mỗi cặp selector và reject trước mọi write.

### A6 — Documentation/release

Cập nhật các câu normative bị supersede bởi explicit skill-version request, sửa status inconsistency được audit xác nhận, tăng patch version và ghi CHANGELOG trước completion.

### A7 — Verification

Chạy focused tests trước, sau đó compliance review rồi quality/security review. Mỗi required check dùng hidden snapshot trước/sau và persist inputDigest. Cuối cùng chạy chính xác sequence mục 11 trên fake/disposable roots.
## Findings đã xác nhận tại ready gate

- P1 workflow recovery: `completed/finishing` còn active sau journal/archive failure hiện bị route như invalid và hidden finish không thể retry; trái recovery table của `harnix-continue`.
- P1 manifest safety: `markersOverlap` chỉ so begin-begin/end-end, nên A.end trùng B.begin có thể lọt validator và làm hai owned fragments chia sẻ boundary.
- P2 skill metadata: canonical parser/tests cấm `metadata`, trái explicit request mới và portable Agent Skills representation cho version.
- P2 documentation: PRD còn ghi manual smoke hoàn toàn pending trong khi AGENTS/global plan ghi Antigravity và Codex đã có authorized session evidence, Kiro được defer.
- P1 dependency security: full audit phát hiện `nanoid@3.3.17` high và `esbuild@0.27.7` low trong dev toolchain; đã thay exception esbuild lịch sử bằng exact local pnpm resolution hook, giữ no-workspace và zero advisory.
- P3 giữ nguyên: duplicated bounded-stdin helper và kích thước `global-managed-files.ts` chưa gây contract divergence; không refactor thuần hình thức trong task này.
