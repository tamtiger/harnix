# Redacted run ledger

## Trace vocabulary

Artifacts không lưu body của user/model/tool. Mỗi run dùng ordered action classes:

- `G`: activation guard/target routing
- `S`: inspect active task/state
- `C`: context/research selection
- `D`: delegate hoặc guardian orchestration
- `A`: authorized action/implementation
- `V`: verification/review
- `P`: persist task/journal/handoff
- `K`: compaction/resume
- `X`: abort/interruption

Read/write class là `project`, `harnix-state`, `fake-global`, `host-metadata`, `none` hoặc `unknown`. Alias được cấp theo deterministic discovery order tại cutoff; raw prompt, title và output bị loại.

## Main runs M01–M15

| Alias | Stable source ref | Version era | Redacted trace | State/result | Read/write class | Retry/efficiency signal |
|---|---|---|---|---|---|---|
| M01 | `019fd0f7-243e-7b80-8e2a-edfe9df41e3f` | `0.1.0`→`0.5.0` | `G→A→X/replan→S→C→A→V→P` | nhiều task; 28 closed, 2 abort | project + harnix-state | implementation-before-plan corrected; 3 compactions |
| M02 | `019fdb22-3a15-7f83-a0c8-e5706692ce7f` | pre-`0.5.0` | `G→S→A→V→P` lặp nhỏ | 44 closed, 1 abort | project + harnix-state | 35 auto-goal micro-turns |
| M03 | `019fe945-e106-7573-9532-294efa35b704` | `0.5.0`→`0.6.0` | `G→S→C→D→A→V→D/V→P→K` | 29/29 closed | project + harnix-state | 27 workers, guardian fan-out, 1.296 tools, 10 compactions |
| M04 | `019fefc6-80f7-75a2-b2da-0c1b7ecf1360` | `0.5.x` | `G(ambient)→S→X` | 0 closed, 1 abort | ambient project read; no confirmed write | explicit external target lost to cwd |
| M05 | `019ff017-0006-7e33-961d-12641e490cd9` | `0.5.x` | `G→S→V→P` | 7/7 closed | project + harnix-state | concise diagnostic flow |
| M06 | `019ff3f4-009a-7241-bf8b-e758e0db7ac4` | `0.5.x`→`0.6.x` | `G→S→C→A→V→P→K` | 9 closed, 3 abort | project + harnix-state | repeated syntax/review loop |
| M07 | `019ff8db-ffaa-7971-8629-4a509c9506a0` | `0.6.x` | `G→S→C→A→V→P→K` | 36 closed, 4 abort, remainder open/unmapped | project + harnix-state | 861 tools, 8 compactions, 6 auto starts |
| M08 | `019ffdd5-5fff-7952-8508-3e66c078f5d0` | `0.6.14`→`1.0.0` | `G→S→C/research→A→V→P→K` | 15 closed, 1 abort | project + harnix-state | one 166-tool auto turn |
| M09 | `019ffef8-8d10-73b3-a552-d0cf06121255` | `1.0.0` | `G→S→C→A→V→P→K` | 7 closed, 1 abort | project + harnix-state | full-repo review/refactor cycle |
| M10 | `01a0127c-189c-7f42-8601-44a0b213f2b4` | `1.0.1`→`1.0.5` | `G→S→V/diagnose→A→V→P→K` | 13/13 closed | project + fake-global + harnix-state | doctor-focused retries |
| M11 | `01a0137e-4cb4-77b0-b06a-49de0cde46cc` | `1.0.5`→`1.0.8` | `G→S→C→A/simulate→V→P→K` | 10 closed, 1 abort | temp project + fake-global + harnix-state | workflow simulation hardening |
| M12 | `01a018c9-7807-7331-9584-e31142309f2e` | `1.0.8` | `G→S→debug/replan→A→V→P` | 2/2 closed | project + harnix-state | blocked-task recovery |
| M13 | `01a01cbb-ba61-7af2-8253-6506af300176` | `1.0.9`→`1.0.10` | `G→S→C→A→V→P→K` | 7/7 closed | project + harnix-state | self-improvement review |
| M14 | `01a02330-d16b-7851-a891-c89600ff2228` | `1.0.11` | `G→S→debug→A→V→P→K` | 5/5 closed | project + authorized profile boundary + harnix-state | hook migration fix; real-profile step required explicit authority |
| M15 | `01a03c0f-4fc3-7e93-bac8-d60458e8c973` | `1.0.11`→`1.0.14` | `G→S→C/research→A→V→P→K` | 18 closed, 1 abort, 1 open at cutoff | project + fake-global + harnix-state | 1.236 tools, 18 compactions; current audit excluded |

`unknown` được giữ ở nơi log không cho một state transition duy nhất vì một main session chứa nhiều user request/task. Exact task state được đối chiếu bằng local TaskRecord thay vì suy từ tên session.

## Named worker runs W01–W27

Tất cả trừ W19 là child trực tiếp của M03; W19 là depth-2. Role name là orchestration metadata, không phải raw prompt.

| Alias | Role | Trace | Access/result class |
|---|---|---|---|
| W01 | `research_kiro_global` | `D→C→V→P` | read/research; returned |
| W02 | `research_antigravity_global` | `D→C→V→P` | read/research; returned |
| W03 | `audit_global_architecture` | `D→S→V→P` | read/audit; returned |
| W04 | `phase5_audit` | `D→S→V→P` | read/audit; returned |
| W05 | `phase5_tests` | `D→S→A/V→P` | test paths; returned |
| W06 | `scan_release_phase5` | `D→S→V→P` | release scan; returned |
| W07 | `doctor_phase5` | `D→S→A/V→P` | doctor scope; returned |
| W08 | `workflow_safety_phase5` | `D→S→V→P` | workflow/safety; returned |
| W09 | `test_taxonomy_audit` | `D→S→V→P` | test audit; returned |
| W10 | `test_reference_audit` | `D→S→V→P` | test audit; returned |
| W11 | `split_unit_tests` | `D→S→A→V→P` | disjoint test edit intent; returned |
| W12 | `split_integration_tests` | `D→S→A→V→P` | disjoint test edit intent; returned |
| W13 | `refactor_workflow_tests` | `D→S→A→V→P` | workflow test edit intent; returned |
| W14 | `version_reference_audit` | `D→S→V→P` | docs/version audit; returned |
| W15 | `phase6_requirements` | `D→C→V→P` | requirements; returned |
| W16 | `phase6_code_audit` | `D→S→V→P` | code audit; returned |
| W17 | `phase6_platform_docs` | `D→S→A/V→P` | platform docs; returned |
| W18 | `phase6_global_manifest` | `D→S→A/V→P` | manifest scope; returned |
| W19 | `global_doctor_audit` | `D→D→S→V→P` | nested read/audit; returned |
| W20 | `phase6_scripts` | `D→S→A/V→P` | scripts scope; returned |
| W21 | `phase6_global_doctor_hardening` | `D→S→A→V→P` | overlaps W19; returned |
| W22 | `phase6_final_audit` | `D→S→V→P` | broad final audit; returned |
| W23 | `phase6_collision_lifecycle` | `D→S→A/V→P` | lifecycle scope; returned |
| W24 | `phase6_docs_finalize` | `D→S→A/V→P` | docs scope; returned |
| W25 | `phase6_hook_perf` | `D→S→A/V→P` | hook/performance; returned |
| W26 | `phase6_final_code_review` | `D→S→V→P` | overlaps W22; returned |
| W27 | `phase6_lifecycle_reaudit` | `D→S→V→P` | overlaps W23; returned |

Worker aggregate: 81.530.059 bytes, 39.313 lines, 1.353 tool calls và 143 compactions. Elapsed từng worker không được cộng vì chạy overlap; persisted field là `unknown` thay vì dựng một wall-time giả.

## Guardian runs G01–G40

Mỗi alias sau là một rollout riêng theo discovery order:

```text
G01 G02 G03 G04 G05 G06 G07 G08 G09 G10
G11 G12 G13 G14 G15 G16 G17 G18 G19 G20
G21 G22 G23 G24 G25 G26 G27 G28 G29 G30
G31 G32 G33 G34 G35 G36 G37 G38 G39 G40
```

Trace class cho từng run là `D→monitor→complete/compact`; access class `host-metadata`, write class `none/unknown`. Cả 40 file có 50.124.023 bytes, 12.620 lines, 12 compactions và chỉ hai logged tool calls. Một lifecycle abort nằm trong worker/guardian aggregate nhưng persisted redaction không đủ để gán chắc chắn cho alias; field per-run được ghi `unknown`, tổng population vẫn là 16 abort.

## Step-level conclusions

- Mọi 89.840 line trước cutoff đã parse; không có malformed JSON.
- Main traces cho thấy nơi tốn kém nhất là broad audit/delegation/compaction, không phải Harnix CLI execution time.
- W16/W22/W26 và W19/W21/W23/W27 có scope gần nhau; đây là historical orchestration overlap, không chứng minh scheduler bug trong Harnix core.
- M04 là target-routing evidence mạnh nhất: chỉ hai tool call trước abort nhưng đã dùng ambient Harnix context cho request nhắm repo khác.
- Completion journal không thể dựng lại các transition ở giữa; run ledger phải dựa vào host transcript. Đây là căn cứ cho `HX-TRACE-01`, không phải đề xuất lưu transcript.
