# PRD: Nghiên cứu harness và cải tiến trải nghiệm Harnix theo bằng chứng

## Kết quả mong muốn

Revalidate ba upstream gốc và landscape harness hiện tại, sau đó triển khai một batch trải nghiệm Harnix có thể dùng xuyên suốt: xem active status, tìm task local, điều hướng dependency impact, audit gate và truy nguyên nguồn feature bằng bằng chứng đo được.

## Phạm vi

- So sánh frozen SHA với current upstream của Trellis, ECC và Superpowers.
- Discovery 8–12 repository harness hiện tại và deep-dive tối thiểu 5 nguồn phù hợp nhất.
- Chấm điểm, phân loại `adopt|adapt|experiment|defer|reject` và chọn một batch P0/P1 coherent.
- Mỗi feature được áp dụng phải có source/version/date/license/evidence/adaptation/code/test mapping trong docs.
- Triển khai RED–GREEN–REFACTOR, fake-home safety, patch version, CHANGELOG và full release verification.
- Bổ sung public bounded task index, cache-only dependency impact và deterministic public task audit theo contract v1 bên dưới.

## Ngoài phạm vi

- Không thêm package, executable, platform hoặc compatibility alias.
- Không thêm telemetry, daemon, hosted service, marketplace, default MCP, global memory, silent runtime network hoặc worker network.
- Không bắt buộc subagent, commit, branch, worktree, push, publish hoặc PR.
- Không dùng popularity hoặc README marketing làm bằng chứng đủ để triển khai.
- Không sao chép trực tiếp code/prose upstream khi chưa có license/provenance path phù hợp.

### AC `ac-upstream-revalidation`

Ba upstream gốc được đối chiếu ở frozen SHA và current ref với URL, SHA/tag, ngày, license, feature delta, issue/release evidence và mapping tới quyết định Harnix hiện tại; active repository không nhận upstream remote.

### AC `ac-landscape-evidence`

Research dùng tiêu chí top minh bạch để shortlist 8–12 repository, deep-dive ít nhất 5 và ghi evidence matrix; mỗi candidate `apply` có tối thiểu hai bằng chứng độc lập gồm một tín hiệu sử dụng thực tế và một nguồn implementation/docs/reproduction.

### AC `ac-capability-selection`

Một batch P0/P1 coherent chỉ được chọn khi khoảng trống Harnix được tái hiện, user outcome và metric trước/sau rõ ràng, complexity/rollback chấp nhận được; mọi candidate còn lại có quyết định `experiment|defer|reject` với lý do.

### AC `ac-provenance-completeness`

Mỗi feature triển khai có stable ID, repository URL, source ref/date/license, evidence, `adopt|adapt`, delta so với nguồn, Harnix code/tests và lifecycle status trong canonical docs; required provenance check fail nếu mapping thiếu hoặc trỏ tới artifact không tồn tại.

### AC `ac-product-boundaries`

Batch được chọn giữ một package/bin, đúng ba platform, local/offline deterministic behavior, fake-home isolation và toàn bộ non-goals Harnix; không thêm mutation vào profile thật hoặc runtime network.

### AC `ac-implementation-quality`

Mọi behavior change được bảo vệ bằng observed RED rồi GREEN, có focused regression, compliance review và quality/security/maintainability review; không còn finding actionable trước completion.

### AC `ac-docs-release`

Research artifacts, HARNESS_RESEARCH, UPSTREAM_MAPPING, baseline/NOTICE khi cần, README/PRD/plan và CHANGELOG nhất quán; package patch version được tăng trước completion và exact acceptance/release sequence pass fresh.
### AC `ac-status-observability`

Public `harnix status` trả đúng một JSON document schema v1. Khi có task, document chỉ chứa `id/mode/status/checkpoint`, aggregate acceptance và required-check progress, context state/counts, một `nextAction` deterministic và bounded ordered `attention`. Khi không có active task, command thành công với `activeTask:null`, `nextAction.code:"no-active-task"` và attention rỗng.

### AC `ac-status-safety`

Status chỉ đọc initialized project, không network hoặc mutation, dùng root/error boundary hiện có, không echo title/goal/criteria/check/blocker prose, command, prompt, secret hay absolute path. Representative active-task result dưới 2 KiB và public help không thêm `--json`.

## Contract batch đã khóa

### Status result v1

Top-level fields theo thứ tự logical là `generator`, `schemaVersion`, `activeTask`, `nextAction`, `attention`. Active task gồm identity không nhạy cảm; `progress.acceptance` có `met/waived/pending/total`; `progress.requiredChecks` có `passed/failed/stale/pending/total`; `context` có `state/changeCount/selectionChangeCount`.

Latest required-check evidence được chọn theo `recordedAt`, rồi persisted append order để đồng nhất completion/input-freshness semantics. Missing hoặc latest skipped là pending; latest fail là failed; pass quá một giờ là stale. Với TaskRecord v2, pass trong một giờ chỉ current khi immutable sidecar và recomputed input digest cùng khớp; lỗi đọc, thiếu hoặc mismatch là stale. TaskRecord v1 giữ age-only semantics.

`nextAction.code` precedence là blocked, stale context, planning, ready, in-progress, verifying chưa green, verifying green, terminal-pointer recovery, no active. Stable codes lần lượt là `resolve-blocker`, `replan-context`, `complete-planning`, `begin-implementation`, `continue-implementation`, `run-verification`, `finish-task`, `finalize-task`, `no-active-task`. Attention order cố định: `context-stale`, `required-check-failed`, `required-check-stale`; pending không tạo attention trước verification.

### External feature provenance v1

`docs/HARNESS_FEATURE_PROVENANCE.json` là registry canonical, machine-checkable cho các capability external-derived đang được duy trì. Mỗi entry có stable feature ID, capability, `adopt|adapt`, lifecycle, source repository/HTTPS URL/immutable ref/source date/license/evidence URLs, adaptation delta và sorted concrete existing code/test/docs paths. Registry backfill capability hiện hữu và buộc feature tương lai được note trước completion. Tham khảo hành vi không được claim là copied code; NOTICE chỉ đổi khi có nội dung tái sử dụng tạo nghĩa vụ license.

### AC `ac-task-index`

Public `harnix tasks` trả JSON v1 bounded cho task records local, hỗ trợ `--limit` từ 1 đến 100 và exact `--status` trong TaskStatus. Command pin active record trước, sau đó sort `updatedAt` giảm dần rồi ID giảm dần; scan tối đa 1.000 safe task directories, validate từng record độc lập và trả invalid/truncation counts thay vì để một record lỗi làm hỏng toàn response. Không trả title, goal, prompt, criterion/check prose, evidence summary, command, secret hoặc absolute path.

### AC `ac-repo-impact`

Public `harnix repo-map --impact <path> [--depth <1..3>] [--limit <1..20>]` mutually exclusive với `--query` và hidden `--refresh`. Kết quả chỉ đọc cache v1, trả direct dependencies và reverse dependents kèm distance, deterministic theo distance rồi POSIX path, cùng stable `missing|invalid|not-found|ready` states. Command không refresh cache, đọc source body, suy diễn dynamic dependency hay đổi cache schema.

### AC `ac-task-audit`

Public `harnix audit` trả JSON v1 read-only. Không có active task là success. Full readiness tái dùng exact deterministic ready-trace và strip message prose; Lite readiness là `not-applicable`. Completion aggregate criteria và required checks, đồng thời trả stable pending/failed/stale IDs theo exact input-freshness contract. Audit không chạy command, sửa artifact, chuyển workflow, gọi network hoặc echo private prose/absolute path.

## Contract batch mở rộng đã khóa

### Task index result v1

Top-level fields là `generator`, `schemaVersion`, `scope`, `status`, `filter`, `summary`, `activeTaskId`, `attention`, `tasks`. `filter` giữ effective status hoặc null và limit. `summary` gồm `scanned`, `valid`, `invalid`, `matched`, `returned`, `scanTruncated`, `resultTruncated`. Mỗi task chỉ có `id/mode/status/checkpoint/active/updatedAt`. Attention chỉ có stable code `active-task-unavailable` khi pointer không thể resolve; malformed non-active records chỉ tăng invalid. Directory candidate sort ID giảm dần, lấy tối đa 1.000 và luôn giữ valid active task trong scan budget; output pin active rồi sort timestamp giảm dần, tie bằng ID giảm dần. `scope` luôn là `project`; `status` là `ready` khi mọi record đã scan hợp lệ và active pointer rỗng hoặc resolve được, ngược lại là `partial` khi `invalid > 0` hoặc có attention. Truncation theo scan/result limit không tự làm status thành partial. `activeTaskId` là ID của active record hợp lệ hoặc null; status filter không ép active record vượt qua filter. `valid`/`invalid` tính trước filter, `matched` tính sau filter và trước result limit.

### Repo impact result v1

Top-level fields là `generator`, `schemaVersion`, `scope`, `status`, `target`, `depth`, `limit`, `dependencies`, `dependents`, `truncated`. `dependencies` là direct outgoing POSIX paths sorted code-unit; `dependents` là reverse BFS unique objects `{path,distance}` sorted distance rồi path. Limit áp dụng độc lập cho mỗi list; `truncated` có hai boolean tương ứng. Default depth 2, limit 20; target phải là normalized non-root repository-relative POSIX path có exact record trong cache.

### Task audit result v1

Top-level fields là `generator`, `schemaVersion`, `activeTask`; no-active dùng `activeTask:null`. Active task gồm `id`, `mode`, `status`, `checkpoint`, `readiness`, `completion`. `readiness` có exact fields `status` và `diagnostics`; status là `pass|fail|not-applicable|unavailable`, còn mỗi diagnostic chỉ có `code`, `artifact`, optional `id`, optional `line`. Artifact read failure dùng code `artifact-unavailable` thay vì leak filesystem error. `completion` có exact fields `status`, `criteria`, `requiredChecks`. `criteria` gồm `met`, `waived`, `pending`, `total`, `pendingIds`; đây là completion-ready partition, nên criterion chỉ tính met khi persisted met và có fresh supporting evidence theo finish semantics, waived giữ nguyên, còn lại là pending. `requiredChecks` gồm `passed`, `failed`, `stale`, `pending`, `total`, `failedIds`, `staleIds`, `pendingIds`; mọi ID list sort code-unit. `completion.status=pass` chỉ khi exact finish prerequisites về non-empty criteria/checks, criterion support và mọi required check freshness đều pass. Latest evidence/freshness dùng cùng semantics với status/finish; audit pass không chạy hoặc thay thế verification.


### AC `ac-replan-reentry`

Hidden `workflow --save` cho phép task chưa terminal ở `ready|in_progress|verifying` với previous checkpoint đúng `replan` tái nhập `ready/ready`; transition này phải chạy lại Full ready-trace gate và giữ nguyên mọi frozen criterion, required check cùng evidence. Backward transition không qua `replan`, terminal task, invalid ready artifacts hoặc mutation obligation/evidence vẫn fail closed. Không đổi public TaskRecord status/checkpoint enum và không tự động replan.

### Guarded replan re-entry

Đây là Harnix-original defect fix cho state machine đã document: `replan` là feedback checkpoint nhưng forward-only transition table trước đó không có đường quay lại execution. Fix nằm ở hidden workflow transport, không nới generic `transitionTask`; chỉ exact `previous.checkpoint === replan` và `next === ready/ready` được phép sau ready gate.
