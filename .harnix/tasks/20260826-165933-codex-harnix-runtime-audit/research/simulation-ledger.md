# Simulation ledger

## Hai lớp evidence

1. `contract simulation`: mỗi invocation chạy focused Vitest/current source với isolated fixture. Lớp này chứng minh contract, assertions và determinism của test fixture.
2. `actual CLI simulation`: gọi built `harnix` qua process riêng trong disposable repository và injected fake home/CODEX_HOME/PATH. Lớp này chứng minh exit/state/filesystem behavior của CLI, không chứng minh model routing hay host scheduler.

Sandbox ban đầu chặn child-process bằng `EPERM`; cùng lệnh được rerun ngoài sandbox sau approval. Đây là execution-environment restriction, không tính là Harnix failure. Temp harness bị xóa sau khi xác minh cleanup.

## Contract simulation: 48/48 pass

| Scenario | Base variants | Extra repeats | Total invocations | Assertions/result |
|---|---:|---:|---:|---|
| routing | 3 | 0 | 3 | pass |
| init | 3 | 0 | 3 | pass |
| happy-path | 3 | 2 | 5 | pass |
| continue-interruption | 3 | 0 | 3 | pass |
| resume | 3 | 0 | 3 | pass |
| context | 3 | 0 | 3 | pass |
| checks | 3 | 0 | 3 | pass |
| debug-replan | 3 | 0 | 3 | pass |
| global-lifecycle | 3 | 2 | 5 | pass |
| privacy-safety | 3 | 2 | 5 | pass |
| commit-approval proxy | 3 | 0 | 3 | pass |
| efficiency | 3 | 0 | 3 | pass |
| **Total** | **36** | **12** | **48** | **376 assertions, 0 skipped** |

Elapsed tổng 100.704 ms; median 2.011 ms, p95 3.316 ms, max 4.018 ms mỗi invocation.

Critical deterministic signatures:

| Scenario | Signature | Mean | Range | CV |
|---|---|---:|---:|---:|
| happy-path | `0|1|24|0` | 3.449 ms | 3.151–4.018 ms | 0,089 |
| global-lifecycle | `0|1|10|0` | 2.208 ms | 2.105–2.402 ms | 0,050 |
| privacy-safety | `0|1|1|0` | 1.250 ms | 1.132–1.427 ms | 0,095 |

Năm repetition của mỗi critical fixture cho cùng exit/assertion/write signature. Không so duration như invariant.

## Actual CLI simulation: 36/36 pass

| Scenario | Runs | CLI child processes | Elapsed | Ordered result |
|---|---:|---:|---:|---|
| routing | 3 | 5 | 1.401 ms | uninitialized fail-closed `2`; nested initialized ancestor `0`; invalid state redacted/fail-closed `2` |
| init | 3 | 4 | 1.309 ms | dry-run no write; initialize; idempotent rerun |
| happy-path | 3 | 15 | 4.714 ms | planning→ready→audit/inspect; signature `cc00f58b2b14` cả ba lượt |
| continue-interruption | 3 | 12 | 3.847 ms | persisted planning/ready/in_progress survives process boundaries |
| resume | 3 | 9 | 2.876 ms | dry-run; active pointer update; active collision exit `2` |
| context | 3 | 3 | 454 ms | outside project, ba platform no stdout/stderr/write |
| checks | 3 | 22 | 7.356 ms | pending→passed→stale sau input mutation |
| debug-replan | 3 | 17 | 5.634 ms | illegal jump exit `2`; legal replan→ready hai lần |
| global-lifecycle | 3 | 12 | 3.826 ms | Kiro setup/update/uninstall; Antigravity/Codex conservative readiness; prompt gate exit `2` |
| privacy-safety | 3 | 7 | 2.281 ms | traversal/malformed fail `2`; không lộ canary/path; status không có title/goal |
| commit-approval proxy | 3 | 3 | 1.007 ms | generated contract có approval rule; không phải Git interception |
| efficiency | 3 | 30 | 4.155 ms | 10 outside-project context calls/platform, stable no-write behavior |
| **Total** | **36** | **139** | **39.124 ms** | **36 pass, 0 unexpected write** |

## Efficiency sample

Hidden context ngoài project, 10 process invocations cho mỗi platform:

| Platform | Median | p95 | Output/write signature |
|---|---:|---:|---|
| Kiro | 139 ms | 156 ms | empty/empty/no-write |
| Antigravity | 134 ms | 136 ms | empty/empty/no-write |
| Codex | 142 ms | 156 ms | empty/empty/no-write |

Current initialized Codex context trả exit `0`, 2.701 output bytes trong 227 ms. Nội dung context không persist.

## Scenario-to-risk coverage

- Routing: ancestor resolution, invalid state, fail-closed; chưa chứng minh explicit external target precedence của model.
- Init/global: dry-run, idempotence, manifest ownership, prompt confirmation, fake homes.
- Workflow: legal/illegal transition, ready audit, process interruption và resume collision.
- Verification: required check lifecycle và input mutation staleness.
- Context: outside-project no-op, platform parity và no-write.
- Privacy: traversal, malformed state, canary/path/title/goal redaction.
- Commit: policy text only; enforcement thuộc host/user workflow.
- Efficiency: CLI startup/context baseline; không dùng để quy kết compaction của Codex.

## Containment

Mỗi actual run tạo root mới dưới temp boundary đã realpath-check, inject fake profile variables và fake executable PATH, snapshot write set rồi cleanup. Không network, không real user home, không repository production write, không package install và không Git command. Production worktree chỉ thay active planning task/artifacts qua Harnix workflow.
