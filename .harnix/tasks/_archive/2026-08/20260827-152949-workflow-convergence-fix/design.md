# Design — Bounded convergence

## Route

Pure conversation hoặc explicit read-only request được quyết định trước active-task routing. Project review vẫn có thể dùng standalone `harnix-check`; mutation và task-artifact action mới đọc preflight rồi route một stage owner.

## Contract revision

Planning obligations chưa freeze. Khi đã ready, thay đổi obligation cần hai bước: persist checkpoint `replan`, rồi save cùng checkpoint với bounded `contractRevision.reason`. Core tự append deterministic skipped audit evidence. Required check đã có pass không được mutate/demote/remove; check lỗi chưa pass có thể supersede mà không làm task vĩnh viễn không hoàn thành.

## Freshness

Sidecar top-level schema v1 chứa mixed snapshot v1/v2. V1 entry raw-hash không đổi. Snapshot v2 entry có normalizer `raw-v1|planning-contract-v1`; input digest bind snapshot schema. Planning canonicalizer chuẩn hóa CRLF, trailing horizontal whitespace, checklist state và nội dung giữa exact non-nested execution-note markers; mọi text còn lại giữ nguyên, marker malformed fail closed.

TaskRecord v2 không age-expire vì required pass đã bind immutable snapshot và current digest; timestamp không hợp lệ hoặc ở tương lai vẫn stale. TaskRecord v1 tiếp tục one-hour age-only.

## Loop budget

Một required check current không chạy lại. Failure đầu route debug; failure thứ hai có cùng check, exit code, normalized summary và input fingerprint thì route replan/blocker thay vì rerun. New input digest hoặc materially different symptom mở một attempt mới. Low finding không chặn completion trừ khi vi phạm acceptance, compliance, security hoặc material correctness.

## Persistence order

Snapshot của candidate evidence được compute từ candidate artifact bytes trước write. Sidecar append trước task/artifact commit; orphan snapshot không authoritative và retry idempotent. Nếu later write fail, inspection recompute fail closed cho tới bounded retry, không tuyên bố pass.

## Release order

Version, CHANGELOG, generated skill metadata và managed hashes là implementation inputs, hoàn tất trước `verifying`. Check owner chỉ chạy missing/failed/stale gate; finish owner chỉ kiểm tra, journal và archive task, không sửa product files.