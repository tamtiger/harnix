# Scored improvement roadmap

## Ranking

Scale 1–5; `score = impact + frequency + confidence + reliabilityGain - cost - compatibilityRisk`.

| Candidate | Impact | Frequency | Confidence | Gain | Cost | Risk | Score | Decision |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `HX-TARGET-01` | 5 | 2 | 4 | 5 | 2 | 2 | 12 | P0 selected |
| `HX-FRESHNESS-01` | 4 | 4 | 5 | 5 | 3 | 3 | 12 | P0 selected |
| `HX-PREFLIGHT-01` | 3 | 5 | 4 | 3 | 2 | 2 | 11 | P1 selected |
| `HX-TRACE-01` | 4 | 4 | 5 | 4 | 4 | 2 | 11 | P2 selected |
| `HX-DELEGATION-01` | 3 | 3 | 3 | 3 | 1 | 3 | 8 | experimental eval |
| `HX-EVIDENCE-POLICY-01` | 3 | 2 | 5 | 3 | 4 | 5 | 4 | deferred research |

Frequency của target issue thấp nhưng safety impact cao; score không thay hard gate. Preflight frequency lấy từ current “every ordinary request” contract, còn size reduction phải đo lại bằng agent eval trước claim.

## P0.1 — `HX-TARGET-01`

### RED first

- Thêm scripted agent-routing fixtures: explicit other-root, explicit uninitialized root, quoted/untrusted path, nested initialized root và multi-root mutation.
- Ambient root có canary state; assert zero ambient `.harnix` read/write khi explicit target khác.
- Snapshot tests phải fail trên generated Codex/Kiro/Antigravity text hiện tại vì thiếu precedence/no-fallback clauses.

### Implementation

- Tạo một canonical target-resolution instruction fragment trong `src/templates/harnix/activation.ts` và reuse ở `src/templates/harnix/agents.ts` cùng configurators.
- Không cố parse natural language trong Harnix CLI; đây là guard contract cho agent. CLI path resolution tiếp tục nhận exact caller root và fail closed.
- Update generated snapshots, canonical workflow docs và README nếu public behavior thay đổi.

### Gates

Focused routing/template tests → `test:workflow` → `test:platform` → `test:safety` → acceptance/pack smoke theo implementation plan.

### Acceptance

100% fixture explicit-target đúng root, zero ambient canary access, ambiguous mutation stop; no regression cho nearest ancestor khi không có explicit target.

## P0.2 — `HX-FRESHNESS-01`

### RED first

- Unit vectors cho CRLF, trailing whitespace, checklist marker, explicit evidence-note marker, semantic paragraph, AC/check/path mapping và malformed marker.
- Integration flow snapshot→pass→checkbox edit phải còn `passed`; semantic edit phải `stale` với reason chính xác.
- Mixed sidecar v1/v2, immutable evidence và corrupt sidecar fail-closed tests.

### Implementation

- Extract `canonicalizePlanningArtifactV1` pure function.
- Nâng verification sidecar thành discriminated union; task/evidence schema không đổi.
- Snapshot v2 entry ghi normalizer và digest; inputDigest canonical payload có schema mới.
- Dùng cùng compute/compare path cho snapshot, `checks`, ready/finish audit; không duplicate normalizer.
- Preserve raw v1 semantics và không migrate unfinished/completed evidence ngầm.

### Gates

Focused verification inputs/check report → integration checks/internal workflow → migration → workflow/safety → full acceptance. Dùng temp repo, không chạm current task evidence.

### Acceptance

Bookkeeping-only change không rerun; mọi contract/semantic change stale; parser ambiguity fail closed; v1 fixtures unchanged.

## P1 — `HX-PREFLIGHT-01`

### RED first

- Hidden CLI contract: exact JSON fields/enums, sorted arrays, invalid state redacted, no active response, no stdout noise.
- Filesystem manifest before/after identical; injected network/process runner không được gọi.
- Agent eval phân biệt pure conversation, project review, mutation, active continuation, stale context, failed check và ambiguous request.

### Implementation

- Compose existing inspect, context drift, check report và ready blocker logic trong một read-only service; không refresh cache.
- Expose `workflow --preflight`; giữ hidden/internal surface và bounded output.
- Update activation flow hai pha và stage skills: load một stage tại một thời điểm, xem check freshness trước rerun.
- Không thay public `status`, `checks` hoặc `audit` contract.

### Metrics/gates

So baseline scripted agent flow với candidate: số full-workflow reads, Harnix CLI calls, tool calls, context bytes và false-route count. Promote chỉ khi false-route = 0 và median ceremony giảm; sau đó chạy workflow/platform/safety/acceptance.

## P2 — `HX-TRACE-01`

### RED first

- Unit schema/event ID/sanitizer/size-cap tests.
- Integration create→ready→implement→verify→finish và cancel/resume/recovery ordering.
- Append failure, malformed line, duplicate retry, saturated 2.000 events và concurrent process lock tests.
- Safety corpus inject title/goal/path/hash/command/canary vào errors; public trace không chứa chúng.

### Implementation

- Implement strict metadata event writer dưới core task layer, serialized per project like journal operations.
- Integrate only after successful authoritative state mutation; deterministic retry/backfill emits `recovery-detected`.
- Add `harnix trace [task-id] [--limit]`, parser bounds 1–200, stable newest-first output.
- Trace remains diagnostic and may be partial; finish/transition never trusts it.
- Update command docs, examples, completions nếu có, package exports/snapshots, PRD/workflow/implementation plan/README/CHANGELOG.

### Gates

Focused trace/CLI tests → workflow/resume/finish/cancel → migration/safety/platform → performance/footprint → full acceptance, tarball smoke và release scan.

### Acceptance

Một normal transition có đúng một event; retry không duplicate; state survives trace failure; bounded output; no forbidden content; footprint/performance trong threshold hiện hành.

## Experimental — `HX-DELEGATION-01`

Chỉ sửa guidance sau khi có eval với cùng task ít nhất năm repetition/baseline và candidate. Measure worker count, overlapping path/scope, nested depth, wall time, tool calls, defect recall và merge conflicts. Promote nếu overlap/nested giảm mà defect recall không giảm; nếu host không tuân thủ ổn định, giữ research note, không thêm state/schema.

## Deferred — `HX-EVIDENCE-POLICY-01`

Research trước khi code:

- phân loại local deterministic, environment-bound, external/manual checks;
- chọn backward-compatible default;
- định nghĩa environment fingerprint và clock skew;
- đo current logs mới có bao nhiêu age-only stale event sau khi `HX-TRACE-01` tồn tại.

Không bỏ one-hour rule chỉ để tối ưu elapsed.

## Provenance và documentation rule

Các selected mechanism ở đây xuất phát từ self-audit Harnix, không claim lấy từ upstream harness. Khi implementation tham khảo hoặc adapt một feature/contract từ repo harness cụ thể, cùng change phải:

1. thêm source/version/license/URL và behavior mapping vào `docs/HARNESS_RESEARCH.md`;
2. cập nhật ownership/removal mapping trong `docs/UPSTREAM_MAPPING.md`;
3. cập nhật `docs/UPSTREAM_BASELINE.md` nếu baseline/source set thay đổi;
4. ghi rõ phần `adopted`, `adapted`, `deferred` hoặc `rejected`, cùng khác biệt Harnix;
5. thêm CHANGELOG/README/canonical docs và tests để người sau nhận ra nguồn, không dựa vào commit archaeology.

Nếu chỉ nảy sinh từ local Harnix evidence, ghi `origin: harnix-self-audit` và evidence ID; không gán nhầm cho upstream.

## Task boundaries

Mỗi selected item là một implementation task riêng. Trước khi code phải re-inspect active task/current tree, viết failing test, chạy compliance rồi quality/security, bump patch version và CHANGELOG trước completion. Không auto-commit; trước commit vẫn phải trình proposed changes và message, chờ approval riêng.
