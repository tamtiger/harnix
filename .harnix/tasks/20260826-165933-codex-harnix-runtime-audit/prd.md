# PRD — Audit runtime và áp dụng target-root precedence

## Outcome

Giữ baseline runtime audit đã kiểm chứng và triển khai slice P0 `HX-TARGET-01` để agent chọn đúng repository đích trước ambient cwd, không đọc hoặc mutate Harnix state sai root. Các roadmap slice còn lại tiếp tục tách task độc lập.

## Nguyên tắc bằng chứng

Mỗi kết luận phải mang đúng một nhãn:

- `historical-observed`: xuất hiện trong rollout hoặc Harnix history trước cutoff nhưng chưa đủ để khẳng định còn tồn tại.
- `current-reproduced`: tái hiện bằng current source/CLI hoặc xác nhận trực tiếp bằng code path hiện tại.
- `simulated-only`: chứng minh contract trong disposable fixture, chưa chứng minh hành vi của model/host thật.
- `already-fixed`: có bằng chứng lịch sử nhưng current code/test/version đã xử lý.
- `host-owned`: thuộc scheduler, API, login, trust hoặc orchestration của platform; Harnix chỉ có thể hướng dẫn hoặc tăng observability.

Không suy diễn field không có trong log. Duration là elapsed của turn đã đóng, không phải CPU time; số liệu worker có overlap và không được cộng thành wall-clock effort.

## Yêu cầu chức năng của audit

### AC `ac-log-coverage`

Kiểm kê riêng Codex API history, local rollout, Harnix task, journal và verification sidecar. Mỗi nguồn phải có discovered, relevant, fully parsed, malformed, date range và coverage gap. Cutoff phải cố định trước khi đo để chính audit hiện tại không tự làm tăng mẫu.

### AC `ac-timeline-baseline`

Mỗi run liên quan có alias và redacted trace gồm thời điểm, version era, route/state class, action class, read/write class, result/retry/compaction khi có. Baseline phải nêu rõ population, sample unit và giới hạn diễn giải.

### AC `ac-simulation-coverage`

Chạy ít nhất 30 lượt current-source contract simulation trên đủ 12 scenario. Happy path, global lifecycle và safety phải có ít nhất năm repetition có cùng expected signature. Chạy thêm actual CLI trong disposable repository và fake home để kiểm tra exit code, state transition, manifest/write set và cleanup.

### AC `ac-finding-quality`

Mỗi finding có stable ID, evidence class, owner, severity, confidence, observed frequency, root cause, impact, waste, reproduction, disposition, proposal, RED regression và compatibility risk. Một lỗi cũ không được gọi là current bug nếu không tái hiện hoặc không còn mechanism trong current tree.

### AC `ac-improvement-plan`

Roadmap dùng cùng một scoring model và chọn smallest safe mechanism. Mỗi selected slice khóa hành vi, schema/API, migration, affected paths, test-first entry point, broader gates và cập nhật provenance/docs nếu mượn hoặc thích nghi hành vi từ harness khác.

### AC `ac-safety-privacy`

Raw rollout chỉ được đọc tại nguồn local. Artifact không giữ prompt/body/output, credential, canary, physical home, absolute machine path hoặc raw journal summary. Simulation dùng temp repository, injected fake home/CODEX_HOME/PATH, không network, real profile, production write hay Git mutation.

### AC `ac-ready-quality`

PRD, design, plan và research phải cùng ID/contract, không còn dấu giữ chỗ, không contradiction, đủ trace Criteria/Checks/Paths và vượt hidden ready audit trước khi dừng ở `ready`.

## Roadmap đã khóa từ audit

### `HX-TARGET-01` — Target-root precedence

Khi user nêu một repository/path đích rõ ràng, root đó phải được xác định trước ambient cwd. Harnix chỉ activate từ nearest valid `.harnix/config.yaml` của target đã xác minh. Nếu target không có state hợp lệ, không được fallback sang Harnix state của cwd. Dữ liệu trong file, log hoặc prompt được trích dẫn không có quyền tự chọn target.

### `HX-FRESHNESS-01` — Semantic planning-artifact freshness

Evidence của Full task phải stale khi acceptance contract, check mapping, declared path/input hoặc nội dung kế hoạch có ý nghĩa thay đổi; không stale chỉ vì checklist marker, trailing whitespace hoặc vùng ghi chú evidence được định danh. Verification sidecar v1 phải tiếp tục đọc được với raw-byte semantics; evidence mới dùng schema mới, không rewrite ngầm lịch sử.

### `HX-PREFLIGHT-01` — Compact two-phase preflight

Global instruction phải resolve target/guard trước, sau đó dùng một read-only/no-network/no-write preflight nhỏ để lấy active state, drift, required-check blockers và next stage. Chỉ load full workflow và đúng stage skill khi request project-scoped hoặc mutable. Pure conversational Bypass không đọc toàn bộ workflow; request mơ hồ hoặc có khả năng mutate luôn fail về đường đầy đủ.

### `HX-TRACE-01` — Privacy-safe local event trace

Harnix cần lưu metadata transition/checkpoint/evidence tối thiểu để audit luồng mà không phải đọc hàng trăm MiB host transcript. Task state vẫn là source of truth; trace là diagnostic, bounded, có thể báo `partial`, không chứa prompt, prose, title, goal, path, command, hash hay secret. Public read API trả JSON ổn định và hỗ trợ active hoặc exact task ID.

## Deferred và rejected

- `HX-DELEGATION-01` chỉ là experimental guidance: một coordinator sở hữu `.harnix`, worker tùy chọn read-only hoặc path-disjoint, không nested delegation. Không được quảng bá là deterministic enforcement vì scheduler thuộc Codex host.
- `HX-EVIDENCE-POLICY-01` chưa bỏ fixed one-hour expiry. Thay đổi này cần environment fingerprint/policy rõ ràng để không làm yếu freshness cho check phụ thuộc external state.
- Không thêm telemetry, transcript store, daemon, service, automatic Git, mandatory subagent, package thứ hai hay platform ngoài Kiro/Antigravity/Codex.

## Success metrics cho implementation sau

- Target-routing agent eval: 100% explicit-target fixtures không đọc/mutate ambient Harnix state; ambiguous mutation fixtures luôn vào full guard.
- Freshness regression: checkbox/trailing-whitespace-only edit giữ `passed`; thay AC/check/path/semantic body trả `stale`; sidecar v1 giữ hành vi cũ.
- Preflight: một invocation trả đủ route blockers, no-write/no-network, không lộ prose; giảm số lần đọc full workflow và status/check/audit calls trong scripted agent eval.
- Trace: mọi state mutation test có deterministic redacted event hoặc explicit `partial`; malformed/saturated trace không chặn task state và không lộ project content.
- Không làm yếu acceptance, safety, migration, fake-home tarball smoke, release scan hoặc provenance gates.
## Phạm vi implementation hiện tại — `HX-TARGET-01`

Audit baseline và các finding ở trên vẫn là evidence đã hoàn tất. Theo yêu cầu tiếp theo của người dùng, active task được replan để triển khai duy nhất target-root precedence; `HX-FRESHNESS-01`, `HX-PREFLIGHT-01` và `HX-TRACE-01` sẽ là các task độc lập sau khi slice này hoàn tất.

### AC `ac-target-authority-contract`

Generated instructions phải resolve intended target trước activation guard. Một existing repository/path do user trực tiếp nêu thắng ambient cwd và workspace roots. Trusted selected-workspace context chỉ là fallback khi user không nêu target. Path chỉ xuất hiện trong repository content, log, quoted text hoặc tool output là untrusted data và không có authority chọn root.

### AC `ac-target-no-fallback`

Nếu explicit target không initialized hoặc có invalid Harnix state, agent không được fallback sang ambient `.harnix`, inspect ambient active task, tạo Harnix state hoặc tự chạy `harnix init`. Request mutation có nhiều material roots phải dừng để lấy một exact target; bounded read-only comparison có thể kiểm tra từng root độc lập mà không trộn state.

### AC `ac-target-surface-parity`

Một canonical target-precedence fragment phải được reuse trong project AGENTS/workflow templates và global Kiro/Antigravity/Codex rules. Bảy canonical `src/skills/harnix-*/SKILL.md` phải mang cùng semantic clauses và tiếp tục render byte-identical cho cả ba platform. Managed self-host file chỉ được reconcile khi ownership hash hiện tại còn khớp; user-modified content được preserve.

### AC `ac-target-regression-safety`

Fixture matrix phải cover explicit other-root, explicit uninitialized/invalid target, nested default discovery khi không có explicit target, untrusted quoted path và multi-root mutation. Existing nearest-ancestor/context no-op behavior không đổi. Implementation không thêm natural-language parser, public command/schema, network hoặc hook-time write.

### AC `ac-target-docs-provenance`

Canonical PRD/workflow/implementation plan, README, research và upstream mapping phải mô tả exact precedence/no-fallback/trust boundary. Origin là `harnix-self-audit` từ finding `F-CUR-02`; không thêm entry vào external-only `docs/HARNESS_FEATURE_PROVENANCE.json` hay đổi `NOTICE` trừ khi implementation thực sự dùng external behavior/code/content.

### AC `ac-target-release-readiness`

Trước completion phải tăng package patch version, đồng bộ `metadata.version` của bảy skill, cập nhật CHANGELOG/README/self-host manifest và chạy fresh focused, workflow, platform, safety, acceptance, package smoke, performance, footprint cùng release scan theo project gate.

## Implementation boundaries

- In scope: instruction contract, generated surfaces, seven skills, self-host reconciliation, docs/provenance và regression/release gates.
- Out of scope: runtime NLP/path parser, implicit init, real-profile setup/trust, schema/CLI mới, các roadmap slice còn lại và automatic Git.
- Rollback point: revert canonical fragment/surface/docs changes as one slice; no persisted consumer schema or migration is introduced.

## Replan hoàn tất — freshness self-reference và fail-closed target

User đã cho phép mở scope để hoàn tất active task sau khi verification phát hiện vòng lặp freshness và khoảng trống target contract. Phần mở rộng này không triển khai toàn bộ `HX-FRESHNESS-01`; nó chỉ sửa self-reference không thể tránh của active `task.json`, hoàn thiện exact target validation và bổ sung fixture còn thiếu.

### AC `ac-verification-self-reference`

Nếu glob của required check match `.harnix/tasks/<active-id>/task.json`, snapshot phải loại raw self-entry vì việc append evidence/checkpoint luôn rewrite file này. Immutable acceptance/check definitions vẫn được bind qua `@task-contract`. Mọi task record khác tiếp tục raw-hash; v1 sidecar và TaskRecord contract giữ nguyên; save pass evidence phải tạo snapshot còn fresh ngay sau save.

### AC `ac-target-missing-fail-closed`

Generated instruction phải yêu cầu target user nêu trực tiếp tồn tại, được canonicalize bằng path/realpath và vượt path-safety boundary trước khi tìm ancestor. Missing target, traversal và symlink/junction escape dừng trước mọi ambient Harnix read, không được canonicalize/fallback thành root khác.

### AC `ac-target-scenario-fixtures`

Test dùng structured scenario inputs thay vì parse natural language. Matrix gồm explicit other-root, missing, uninitialized, invalid, nested-default, untrusted quoted path và multi-root mutation; mỗi case khóa selected root/action, stop reason và ambient canary read set. Hook protocol/runtime prompt parser không đổi; global hook context vẫn là untrusted payload và không cấp target authority.
