# Plan — Mô phỏng và kiểm toán toàn bộ workflow đa nền tảng

## Checklist triển khai

- [x] Slice 1: khóa scenario matrix, baseline coverage và trạng thái tool surface.
- [x] Slice 2: thêm RED cho implicit activation wording và Antigravity `rules/AGENTS.md` always-on contract.
- [x] Slice 3: sửa adapter/templates/docs/ownership migration nhỏ nhất, giữ guard no-op ngoài initialized project.
- [x] Slice 4: thêm RED/GREEN cho implicit activation và platform/global safety.
- [x] Slice 5: chạy cold-session probes trên từng tool surface khả dụng với ordinary prompt.
- [x] Slice 6: compliance review, quality/security review và exact acceptance sequence.
- [x] Slice 7: đồng bộ patch version/CHANGELOG, fresh snapshots và finish.

## Scenario matrix

| Nhóm | Initial state | Action | Expected | Negative side effect |
|---|---|---|---|---|
| Routing | Initialized, no active | Bypass/Lite/Full/plan-only/review-and-fix | Đúng mode và minimum artifacts | Không tạo task cho Bypass |
| Ready | Planning thiếu obligation/artifact | Save ready | Fail closed | Không mutate frozen obligation |
| Implement/debug | Ready/in_progress | RED–GREEN, failure hypotheses | Persist trước edit; replan sau ba hypothesis | Không blind-apply feedback |
| Verification | Verifying v2 | Snapshot/check/save/finish | Stable digest mới pass | Drift/race không được completion |
| Continue | Active hoặc blocked/stale | New session continue | Resume đúng state; stale đi replan | Không tạo duplicate task |
| Migration | v1 fixture | Explicit replan migration | Preserve prior evidence | Completed v1 không rewrite |
| Hooks | Initialized/non-Harnix/corrupt | Platform context event | Inject/no-op/redacted warning | Không write/network/leak |
| Activation | Cold tool session | Ordinary prompt không nhắc Harnix | Initialized tự route; non-Harnix no-op | Không dùng file presence làm active evidence |
| Global lifecycle | Fake home | setup/update/doctor/uninstall | Idempotent/preserve/rollback | Không chạm real profile |
| Release | Current tree | Exact gate | Fresh pass | Không claim từ partial output |

## Trình tự RED–GREEN

1. Chạy baseline focused suites và lập coverage map từ test names tới scenario.
2. Chỉ thêm RED khi current suite chưa chứng minh behavior hoặc runtime probe tái hiện defect.
3. Sửa root cause ở core/adapter/template nhỏ nhất; không mở thêm platform/product surface.
4. Chạy focused snapshot trước/sau, sau đó broader platform/workflow suites.
5. Runtime probe trên disposable sessions, dùng implicit, explicit diagnostic và non-Harnix negative controls.
6. Chạy compliance trước quality/security, sau đó exact acceptance.

## Runtime probe contract

- Kiro IDE và CLI độc lập; không đoán executable/capability.
- Antigravity Desktop và `agy` độc lập; invocation đầu inject, invocation sau empty protocol.
- Codex cần exact hook trust trước claim active; không bypass trust.
- Surface unavailable hoặc không cô lập được profile thật được báo `not-run` có bằng chứng.
## Replan từ runtime evidence 2026-08-18

Thứ tự mới: RED platform snapshot → đổi canonical implicit-activation instruction → đổi Antigravity rule từ `rules/harnix.md` có frontmatter sang `rules/AGENTS.md` không frontmatter → cập nhật normative docs và obsolete-fragment migration → focused GREEN → cold-session probe lại. Hook CLI chưa có external activation evidence sẽ giữ trạng thái conservative thay vì bị suy thành pass.