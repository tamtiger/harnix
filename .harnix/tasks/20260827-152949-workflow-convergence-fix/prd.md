# PRD — Workflow convergence fix

## Outcome

Harnix phải kết thúc hữu hạn thay vì tự tạo chuỗi verify → bookkeeping update → stale → verify, đồng thời giữ nguyên safety boundary, dữ liệu task v1 và ba platform hiện có.

## Scope

- Route ý định read-only mới nhất trước active-task continuation; thêm hidden preflight metadata-only cho project-scoped work.
- Freeze obligation tại ready, không tại lần save planning đầu tiên; hỗ trợ supersede có audit ở persisted replan mà không cho pass evidence cũ chứng minh check mới.
- Ghi snapshot v2 cho evidence mới với planning canonicalization hẹp; dual-read raw snapshot v1.
- Bỏ age expiry chỉ cho TaskRecord v2 đã bind content digest; future timestamp vẫn fail closed, v1 giữ one-hour age policy.
- Reuse required evidence còn current; dừng sau hai failure cùng fingerprint và route sang debug/replan/blocker.
- Tinh gọn project/global template và bảy stage skill; phân loại Low nonblocking, chặn debug scope expansion, đưa release prep trước verifying, để finish product-read-only.
- Docs-only low-risk dùng Lite và focused validation; sửa workflow sourceId, normative docs và duplicate Section 11 suite.

## Compatibility và preservation

- TaskRecord schema v1/v2, sidecar top-level v1, public command JSON và platform paths không bị rewrite ngầm.
- Historical snapshot v1 luôn dùng raw bytes. Snapshot mới dùng discriminated snapshot schema v2; malformed canonical markers hoặc sidecar fail closed.
- Hidden save envelope có thể nhận bounded contract revision reason; persisted audit dùng evidence hiện hữu thay vì thêm field TaskRecord.
- Không chạm real global profile, user-owned task history, unrelated content hoặc Git history.

### AC `ac-contract-replan`

Planning contract được sửa trước ready; contract đã freeze chỉ supersede từ persisted replan với lý do audit, và evidence cũ không được tái sử dụng sai contract.

### AC `ac-docs-release-policy`

Docs-only và release/finish order loại bỏ ceremony không tạo tín hiệu mà vẫn giữ verification tương xứng rủi ro.

### AC `ac-input-freshness`

Canonicalization chỉ bỏ bookkeeping đã định nghĩa; semantic content và malformed marker vẫn invalidate hoặc fail closed, v1 giữ raw behavior.

### AC `ac-intent-routing`

Latest read-only intent bypasses active work; mutation tiếp tục đúng stage và preflight không ghi state hay gọi network/process.

### AC `ac-managed-parity`

Canonical sources, generated templates và bảy skill nhất quán trên Kiro, Antigravity, Codex; workflow source ownership có một ID ổn định.

### AC `ac-release-readiness`

Version, changelog, docs, skills, managed hashes và acceptance evidence cùng phản ánh một release candidate fresh.

### AC `ac-stage-guidance`

Stage owners reuse evidence current, phân biệt blocking/nonblocking review, dừng repeated failure và không tự mở rộng goal/path authority.

### AC `ac-verification-convergence`

V2 freshness dựa content digest, save/finish/check dùng chung semantics và không còn vòng lặp do clock hoặc artifact write order.