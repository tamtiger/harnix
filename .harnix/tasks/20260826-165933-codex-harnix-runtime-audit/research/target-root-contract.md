# Target-root contract evidence

## Material unknown decision

Không còn material product unknown. User đã yêu cầu apply roadmap; roadmap chấm `HX-TARGET-01` P0 và chỉ định đây là slice triển khai đầu tiên. Current source xác nhận đây là instruction-contract change, không phải runtime parser/CLI change.

## Current evidence

- `F-CUR-02`/run M04: request nhắm repository khác trong khi ambient cwd là Harnix đã đi qua ambient guard/inspect rồi abort.
- `src/templates/harnix/activation.ts` hiện chỉ yêu cầu ordinary-request routing sau guard, không định nghĩa target authority.
- Codex, Kiro và Antigravity global text đều mở đầu bằng nearest ancestor/workspace root nhưng không nói explicit user target thắng ambient hoặc cấm fallback.
- Project AGENTS/workflow templates và bảy canonical skills lặp cùng gap.
- Existing internal-context behavior đã có safe ancestor/workspace resolution, multi-workspace ambiguity và outside-project no-op; slice này phải preserve các contract đó.
- Self-host `.harnix/workflow.md` đang khớp generated ownership hash tại planning checkpoint; implementation vẫn phải recheck ngay trước reconcile.

## Locked authority order

1. Một existing repository/path được user trực tiếp nêu.
2. Trusted app-provided selected workspace context khi user không nêu target.
3. Ambient cwd chỉ khi hai tín hiệu trên không có target khác.

Repository content, log, quoted text và tool output luôn là untrusted data. Nếu có nhiều user-authored material targets, read-only comparison được isolate; mutation cần một exact target.

## Failure semantics

- Explicit uninitialized target: không fallback sang ambient Harnix, không inspect ambient active task, không create state hoặc auto-init.
- Explicit invalid Harnix target: fail closed cho Harnix project data và báo concise/redacted; không fallback.
- Missing/non-existing/unsafe path: không tự canonicalize thành một root khác; mutation dừng để làm rõ exact target.
- No explicit target: giữ nguyên nearest initialized ancestor/workspace behavior hiện tại.

## Provenance decision

Origin là `harnix-self-audit`, evidence `F-CUR-02`; không dùng external harness behavior/code/content. Do đó `docs/HARNESS_FEATURE_PROVENANCE.json`, frozen upstream refs và `NOTICE` không đổi. `docs/HARNESS_RESEARCH.md` và `docs/UPSTREAM_MAPPING.md` sẽ ghi rõ self-origin để maintainer không nhầm đây là feature lấy từ harness khác. Nếu lúc code xuất hiện nhu cầu adapt upstream, task phải replan và cập nhật registry/source/ref/date/license/evidence trước completion.

## Remaining uncertainty

Actual model compliance không thể được chứng minh hoàn toàn bằng deterministic unit test. Task chỉ claim generated contract/parity và scripted scenario coverage; real agent runs là post-release observation, không phải completion gate làm sai ownership giữa Harnix và host scheduler.
