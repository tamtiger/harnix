# Harness landscape 2026-08-26

- Task: `20260826-132459-harness-ux-research-improvements`
- Câu hỏi vật chất: Repository nào đang có cơ chế workflow/resume/context/verification phù hợp Harnix, và đâu là bằng chứng ngoài popularity?
- Tiêu chí “top”: hoạt động gần đây, primary docs/source, workflow state hoặc agent UX hữu hình, issue/release evidence, license xác định, và khả năng thích nghi trong one-package/local/offline boundary.
- Ngưỡng dừng: 8–12 candidate, deep-dive ít nhất 5, mọi apply candidate có real-usage signal + mechanism source + test/metric/rollback.
- Shortlist: 12 repo. Deep-dive: 8 repo gồm ba upstream gốc, Spec Kit, BMAD, Cline, Aider và Goose.

## Shortlist

| # | Repository | Ref quan sát 2026-08-26 | License | Lý do vào shortlist | Kết quả |
|---|---|---|---|---|---|
| 1 | mindfold-ai/Trellis | `64e663694201005bc87766ef22de89b8da3d4d79` | AGPL-3.0 | Persisted task/context/continue, upstream gốc | Deep-dive; adapt bounded observability |
| 2 | affaan-m/ECC | `d8409a4b0813771235555e32e3d8046a73988bfa` | MIT | Deterministic status/audit/attention | Deep-dive; adapt projection only |
| 3 | obra/superpowers | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` / `v6.3.0` | MIT | Resume ledger, adaptive ceremony, verification | Deep-dive; no new feature |
| 4 | github/spec-kit | `c58a8487461052b4fa65e626df167521d297b184` | MIT | Persisted workflow status/resume và cross-artifact audit | Deep-dive; adapt status và deterministic public audit semantics |
| 5 | OpenHands/OpenHands | `f48eca6ab9149b3aa532e86842c85da43e370108` | MIT | Skills, planner, sessions, active releases | Discovery; reject UI/cloud breadth |
| 6 | SWE-agent/SWE-agent | `3ea751c087f32b16e039a2233dd6eefecef325d5` | MIT | Trajectories, hooks, reproducible evals | Discovery; defer eval ideas, no UX batch fit |
| 7 | Aider-AI/aider | `5dc9490bb35f9729ef2c95d00a19ccd30c26339c` | Apache-2.0 | Bounded dependency graph và on-demand repository context | Deep-dive; adapt exact-path dependency impact |
| 8 | aaif-goose/goose | `d9d08f0e051531e921f561fcb77aa0ed589e9de9` | Apache-2.0 | Context strategy/compaction/session UX | Deep-dive; reject runtime compactor |
| 9 | continuedev/continue | `5522c6f44ca0ac3528b37244818fbfa39b5af470` | Apache-2.0 | Source-controlled checks và CI | Discovery; defer because Harnix checks already local |
| 10 | cline/cline | `6fc40127a6f464c202bc086773ee2f430a0f7b72` | Apache-2.0 | Persisted tasks, history, interruption/resume, checkpoints | Deep-dive; adapt resilient task index, reject Git checkpoints |
| 11 | RooCodeInc/Roo-Code | `b867ec9145750d0ae1ff7f02d35406e9bf2a0b16` | Apache-2.0 | Historical task/checkpoint UX | Reject: repository archived/read-only 2026-05-15 |
| 12 | bmad-code-org/BMAD-METHOD | `9376e1f9e5b1214c024bb20b81adff5eb447820a`; stable `v6.8.0` | MIT + trademark notice | Explicit next-step help, sprint status, exact resume | Deep-dive; adapt deterministic next action |

## Deep-dive facts

### Spec Kit

- Official workflow engine persists state after each step and exposes exact status/resume commands.
- Lean preset strips ceremony while retaining the core flow.
- Đây là cơ chế tham chiếu cho “compact projection + deterministic resume”, không phải nguồn code.

Nguồn:
- https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/workflows/README.md
- https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/presets/lean/README.md
- https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/LICENSE

### BMAD

- `bmad-help` trả lời “làm gì tiếp theo”; `bmad-sprint-status` theo dõi tiến độ.
- Build-auto route resume từ persisted status thay vì buộc người dùng nhớ workflow.
- Không lấy agent roster, workflow catalog hoặc auto orchestration.

Nguồn:
- https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.8.0/docs/reference/workflow-map.md
- https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.8.0/docs/reference/build-auto.md
- https://github.com/bmad-code-org/BMAD-METHOD/releases/tag/v6.8.0
- https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.8.0/LICENSE

### Cline

- Official task management mô tả task self-contained, history, metrics, interruption/resume và checkpoints.
- Các issue #9948, #12388, #13239 và discussion #12396 cho thấy resume có thể crash, mất checkpoint hoặc treo.
- Đây là real-usage evidence cho nhu cầu resume visibility. Git checkpoint/model session/cost tracking bị reject.

Nguồn:
- https://github.com/cline/cline/blob/6fc40127a6f464c202bc086773ee2f430a0f7b72/docs/core-workflows/task-management.mdx
- https://github.com/cline/cline/issues/9948
- https://github.com/cline/cline/issues/12388
- https://github.com/cline/cline/issues/13239
- https://github.com/cline/cline/discussions/12396
- https://github.com/cline/cline/blob/6fc40127a6f464c202bc086773ee2f430a0f7b72/LICENSE

### Aider

- Official repo-map docs/source dùng dependency/reference graph để chọn code context bounded.
- Issue #4239 và #3603 cho thấy nhu cầu navigation on-demand khi map hoặc dependency context chưa đủ.
- Harnix chỉ expose exact cached relationships; không lấy embeddings, source snippets, model context injection hay cache backend.

Nguồn:
- https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/website/docs/repomap.md
- https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py
- https://github.com/Aider-AI/aider/issues/4239
- https://github.com/Aider-AI/aider/issues/3603
- https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/LICENSE.txt

### Goose

- Official environment contract có context strategy, auto-compact threshold, tool-call cutoff và controls cho generated session metadata.
- Issue #8642 và #5164 ghi nhận false-positive context limit và session không recover sau compaction.
- Harnix không sở hữu model context/session runtime nên reject compactor; chỉ giữ nguyên bounded context/freshness đã có.

Nguồn:
- https://github.com/aaif-goose/goose/blob/d9d08f0e051531e921f561fcb77aa0ed589e9de9/documentation/docs/guides/environment-variables.md
- https://github.com/aaif-goose/goose/issues/8642
- https://github.com/aaif-goose/goose/issues/5164
- https://github.com/aaif-goose/goose/blob/d9d08f0e051531e921f561fcb77aa0ed589e9de9/LICENSE

## Discovery-only evidence

- OpenHands: https://github.com/OpenHands/OpenHands
- SWE-agent: https://github.com/SWE-agent/SWE-agent/releases
- Continue checks: https://github.com/continuedev/continue
- Roo Code archived repository: https://github.com/RooCodeInc/Roo-Code

## Suy luận và kết luận

- Fact: status/resume/next-step xuất hiện độc lập ở Trellis, ECC, Spec Kit và BMAD; resume failures xuất hiện trong Cline issues.
- Inference: đây là pattern UX bền hơn một implementation cụ thể và phù hợp để clean-room adapt.
- Fact: Harnix đã có persisted state, evidence và context freshness.
- Inference: thêm projection read-only có complexity thấp hơn nhập database, watcher, UI hoặc model-session management.
- Kết luận: mở rộng thành task observability + resilient index + exact dependency impact + deterministic gate audit; reject/defer context compaction, Git checkpoint, cloud checks, model cost, worker network, prompt-history indexing và UI surfaces.

## Bất định còn lại

- Issue upstream không đại diện cho toàn bộ user base; dùng chúng như tín hiệu pain, không như thống kê prevalence.
- Repository activity được quan sát tại một thời điểm; frozen refs trong provenance bảo đảm quyết định vẫn tái lập được.