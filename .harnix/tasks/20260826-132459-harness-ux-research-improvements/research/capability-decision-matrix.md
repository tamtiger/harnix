# Ma trận quyết định capability

- Task: 20260826-132459-harness-ux-research-improvements
- Ngày quyết định: 2026-08-26
- Công thức 100 điểm: user outcome 25, evidence 20, product-boundary fit 20, determinism/testability 15, safety/rollback 10, delivery cost 10. Điểm cost cao nghĩa chi phí thấp.
- Ngưỡng: P0/P1 apply từ 80; experiment 65–79; defer 50–64; reject dưới 50 hoặc vi phạm non-goal.
- Rule bắt buộc: apply candidate phải có local gap/reproduction, real-usage signal, mechanism source, metric, test và rollback.

## Điểm số

| Candidate | Outcome | Evidence | Fit | Test | Safety | Cost | Tổng | Quyết định |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Bounded public task status | 24 | 19 | 20 | 15 | 10 | 9 | 97 | P0 adapt |
| Deterministic next action + attention | 23 | 19 | 20 | 15 | 10 | 8 | 95 | P0 adapt |
| External-feature provenance registry | 21 | 20 | 20 | 15 | 10 | 8 | 94 | P0 build new governance supporting adaptations |
| Source-controlled CI checks | 15 | 14 | 15 | 13 | 8 | 5 | 70 | Experiment/defer; Harnix đã có required checks |
| Public resilient task index | 23 | 18 | 20 | 15 | 9 | 7 | 92 | P1 adapt |
| Exact-path repo dependency impact | 25 | 18 | 20 | 15 | 9 | 8 | 95 | P0 adapt |
| Public deterministic task audit | 24 | 19 | 20 | 15 | 10 | 8 | 96 | P0 adapt |
| Prompt/response history search | 17 | 15 | 5 | 7 | 3 | 3 | 50 | Defer; privacy/index ownership |
| Model context auto-compaction | 18 | 16 | 3 | 5 | 3 | 2 | 47 | Reject; Harnix không sở hữu model runtime |
| Git checkpoint/restore | 19 | 15 | 0 | 7 | 2 | 2 | 45 | Reject; automatic Git integration bị cấm |
| Daemon/watch/statusline | 14 | 15 | 0 | 6 | 3 | 3 | 41 | Reject; daemon/global runtime bị cấm |
| Worker/multi-agent orchestration | 14 | 12 | 0 | 4 | 2 | 1 | 33 | Reject; mandatory subagent/worker network bị cấm |

## Batch được chọn

Tên batch: **Task observability, navigation, gate visibility và provenance minh bạch**.

### Feature HX-STATUS-01: bounded public status

- Public syntax: harnix status; không có hoặc cần --json.
- Chỉ chạy trong initialized Harnix project qua root/config guard hiện có.
- Output JSON v1:
  - generator: "harnix"
  - schemaVersion: 1
  - activeTask: null hoặc object gồm id, mode, status, checkpoint, progress, context
  - progress.acceptance gồm met, waived, pending, total
  - progress.requiredChecks gồm passed, failed, stale, pending, total
  - context gồm state, changeCount, selectionChangeCount
  - nextAction gồm code, message
  - attention là array các object code và count
- Không echo title, goal, criterion/check descriptions, blocker prose, command, prompt, secret hoặc absolute path.
- No active task là success với activeTask null, nextAction.code no-active-task, attention rỗng.
- Invalid/not-initialized dùng public error envelope/exit semantics hiện có.
- Required-check classification dùng latest evidence theo recordedAt, rồi persisted append order để đồng nhất completion/input-freshness semantics:
  - không có hoặc latest skipped: pending;
  - latest fail: failed;
  - latest pass quá một giờ: stale;
  - v2 pass trong một giờ chỉ passed khi persisted input snapshot và recomputed current digest đều khớp; missing/unreadable/mismatch là stale;
  - v1 pass trong một giờ là passed.
- Chỉ required checks được aggregate.

### Feature HX-NEXT-01: deterministic next action và attention

Precedence của nextAction.code:

1. active task blocked → resolve-blocker;
2. context drift stale → replan-context;
3. planning → complete-planning;
4. ready → begin-implementation;
5. in_progress → continue-implementation;
6. verifying còn failed/stale/pending required check → run-verification;
7. verifying đã pass hết → finish-task;
8. terminal task vẫn còn active do partial persistence → finalize-task;
9. không active task → no-active-task.

Attention chỉ gồm code bounded, theo thứ tự cố định:

1. context-stale với tổng content + selection changes;
2. required-check-failed;
3. required-check-stale.

Pending check không là attention trước verification để tránh noise. Messages là static English strings do Harnix sở hữu.

### Feature HX-PROVENANCE-01: canonical external-feature registry

- File canonical: docs/HARNESS_FEATURE_PROVENANCE.json.
- Registry JSON v1 có generator, schemaVersion, reviewedAt, và sorted features.
- Mỗi external-derived implemented capability có:
  - stable id, capability, decision adopt hoặc adapt, lifecycle implemented hoặc deprecated;
  - ít nhất một source với repository, HTTPS url, immutable ref, sourceDate, license, non-empty evidenceUrls;
  - non-empty adaptation;
  - implementation.code, implementation.tests, implementation.docs là sorted unique safe concrete repository paths và mọi path tồn tại.
- Features và sources được sort deterministic; duplicate/unknown/missing field hoặc unsafe/missing target làm regression fail.
- Registry backfill các capability external-derived đang được duy trì, không chỉ feature mới.
- Harnix-original capability không bắt buộc entry; khi một feature dùng nhiều repo làm nguồn hành vi/evidence, note toàn bộ nguồn.
- Tham khảo behavior không đồng nghĩa copy code. Batch này là clean-room implementation; NOTICE chỉ đổi nếu thực sự tái sử dụng nội dung tạo nghĩa vụ license.

### Feature HX-TASKS-01: resilient public task index

- Public syntax: harnix tasks [--limit <1..100>] [--status <TaskStatus>].
- Chỉ đọc tối đa 1.000 safe task directories, validate độc lập và không để một record lỗi làm mất history hợp lệ.
- Output chỉ chứa state metadata đã khóa trong PRD; active pin, timestamp/ID ordering và truncation flags deterministic.

### Feature HX-IMPACT-01: cache-only dependency impact

- Public syntax: harnix repo-map --impact <path> [--depth <1..3>] [--limit <1..20>].
- Reuse cache v1 và bounded graph để trả direct dependencies cùng reverse dependents; không refresh hoặc claim complete call graph.
- Limit áp dụng riêng từng direction, ordering và failure state đã khóa trong PRD.

### Feature HX-AUDIT-01: deterministic public task audit

- Public syntax: harnix audit.
- Compose ready-trace với completion freshness; output stable code/ID/count, không private prose.
- Không heuristic severity, recommendation loop, command execution, fix hoặc state transition.

## Test-first và rollback contract

- RED đã quan sát cho status/provenance: CLI/module/registry chưa tồn tại. Ba slice mở rộng phải quan sát RED riêng cho tasks, impact và audit trước product edit tương ứng.
- GREEN status/provenance đã có focused evidence; mỗi feature mới chỉ được check khi focused fake-repository tests, privacy và no-write assertions pass.
- Registry regression là read-only test, không fetch network.
- Không đổi frozen TaskRecord/config/manifest schema.
- Không thêm dependency, package, executable, network path hoặc global mutation.
- Rollback toàn batch không cần migration và không sửa consumer data.

## Decision inventory

Đã khóa: status fields/freshness/action precedence; task-index filter/order/scan/privacy; impact target/depth/limit/traversal/failure states; audit readiness/completion/privacy; provenance schema, source immutability, tests, metrics và rollback.

Không còn decision vật chất bị đẩy sang implementation. Chi tiết tên helper/type nội bộ là quyết định kỹ thuật cục bộ và không đổi behavior contract.

## Bất định còn lại

- Payload target dưới 2 KiB được kiểm bằng representative fixture, không phải mọi task size; output cố ý chỉ chứa counts nên vẫn bounded theo schema.
- message là static English để giữ public CLI convention hiện tại; localization ngoài scope.
- Task scan cap, static-import graph limitations và audit non-execution semantics được expose trong contract/docs; không suy diễn completeness vượt evidence.