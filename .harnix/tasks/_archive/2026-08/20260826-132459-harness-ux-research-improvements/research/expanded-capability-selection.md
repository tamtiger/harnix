# Research mở rộng capability có tác động thực tế

- Task: 20260826-132459-harness-ux-research-improvements
- Ngày truy cập: 2026-08-26
- Material unknown: Trong các hướng task/history visibility, dependency-impact navigation và public readiness audit, capability nào có đủ bằng chứng sử dụng thực tế, gap local tái hiện được và cơ chế nhỏ gọn để Harnix triển khai thêm trong batch này?
- Stopping condition: đủ bằng chứng để chấm cả ba candidate, chọn ít nhất hai capability vượt ngưỡng apply nếu có, và khóa metric, safety, test, rollback.

## Repository evidence

1. Repository hiện có 36 task directories nhưng harnix --help chỉ công khai init, setup, update, upgrade, uninstall, mem, status, doctor và repo-map. Muốn xem lịch sử phải tự duyệt .harnix/tasks và đọc task.json.
2. harnix repo-map chỉ có --query và hidden --refresh. Cache v1 đã chứa importTargets; buildRepoMapGraph đã dựng adjacency và reverseAdjacency có giới hạn 10.000 node, 100.000 edge, nhưng public API chưa trả lời quan hệ của một path cụ thể.
3. harnix workflow --audit-ready hiện trả deterministic ready-trace, nhưng là hidden agent transport và không kiểm tra completion obligations. Public user không có một command read-only để biết criterion/check nào đang chặn ready hoặc finish.
4. Task records tách riêng theo directory, TaskRecord validator, safe path resolver và evidence freshness evaluator đã tồn tại. Ba feature có thể tái dùng chúng mà không đổi TaskRecord, repo-map cache, config hay manifest schema.

## Primary sources và real-usage signals

### Task history và resilient listing

Facts:

- Cline official task-management docs mô tả mọi task được lưu local, có history/search và có thể mở lại để resume qua phiên.
- Cline issue #4359 tổng hợp nhiều failure thực tế: task history mất hoặc không resume được khi một record bị hỏng, quá lớn, ghi dở hoặc chứa encoding bất thường; đề xuất validation và graceful degradation.
- Cline discussion #10480 mô tả việc truy cập history qua nhiều bước là friction đối với người thường xuyên đổi task và đề xuất quick access.

Nguồn:

- https://github.com/cline/cline/blob/6fc40127a6f464c202bc086773ee2f430a0f7b72/docs/core-workflows/task-management.mdx
- https://github.com/cline/cline/issues/4359
- https://github.com/cline/cline/discussions/10480
- https://github.com/cline/cline/blob/6fc40127a6f464c202bc086773ee2f430a0f7b72/LICENSE

Inference Harnix:

Một public index chỉ đọc là phù hợp, nhưng không nên nhập conversation store, fuzzy search hay checkpoint restore của Cline. Mỗi Harnix task record được validate độc lập; record lỗi được đếm và bỏ qua để một file hỏng không làm biến mất toàn bộ lịch sử. Output chỉ gồm identity/state/timestamp, không gồm title, goal, prompt, evidence summary hay artifact body.

### Dependency impact navigation

Facts:

- Aider repository-map docs và source tại ref quan sát dùng graph nơi file là node và dependency/reference tạo edge, rồi rank phần liên quan để giữ context bounded.
- Aider issue #4239 cho thấy user muốn hiểu codebase mà không phải đưa cả file vào context; issue #3603 đề xuất navigation on-demand khi dependency context bị thiếu.
- Harnix đã clean-room implement import graph bounded cho ranking nhưng chưa expose exact dependency/dependent traversal.

Nguồn:

- https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/website/docs/repomap.md
- https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/aider/repomap.py
- https://github.com/Aider-AI/aider/issues/4239
- https://github.com/Aider-AI/aider/issues/3603
- https://github.com/Aider-AI/aider/blob/5dc9490bb35f9729ef2c95d00a19ccd30c26339c/LICENSE.txt

Inference Harnix:

Expose traversal từ cache hiện hữu thay vì thêm embeddings, RAG, scanner mới hoặc source snippets. Exact target path trả direct dependencies và reverse dependents tới depth bounded; kết quả chỉ là POSIX path + distance. Cơ chế không claim call graph, dynamic import hay package dependency completeness.

### Public deterministic task audit

Facts:

- Spec Kit quickstart đặt speckit.analyze sau tasks và trước implement; analyze là read-only cross-artifact consistency/coverage report.
- Spec Kit discussion #1917 cho thấy user thực sự chạy analyze lặp lại để xử lý findings trước implementation.
- BMAD workflow map có check-implementation-readiness; BMAD issue #2079 báo vòng lặp khi gate heuristic coi lower-priority concern là blocker.
- Harnix ready-trace hiện đã deterministic, bounded và không dùng LLM judge.

Nguồn:

- https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/docs/quickstart.md
- https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/templates/commands/analyze.md
- https://github.com/github/spec-kit/discussions/1917
- https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/LICENSE
- https://github.com/bmad-code-org/BMAD-METHOD/blob/9376e1f9e5b1214c024bb20b81adff5eb447820a/docs/reference/workflow-map.md
- https://github.com/bmad-code-org/BMAD-METHOD/issues/2079
- https://github.com/bmad-code-org/BMAD-METHOD/blob/9376e1f9e5b1214c024bb20b81adff5eb447820a/LICENSE

Inference Harnix:

Public audit nên reuse exact ready-trace và input-freshness contracts, trả stable codes/IDs/counts, không sinh recommendation heuristic, không chạy command, không sửa artifact và không advance workflow. Tách readiness khỏi completion để tránh một verdict mơ hồ và tránh loop do finding không thuộc frozen gate.

## Chấm điểm mở rộng

Công thức giữ nguyên: outcome 25, evidence 20, fit 20, determinism/testability 15, safety/rollback 10, delivery cost 10.

| Candidate | Outcome | Evidence | Fit | Test | Safety | Cost | Tổng | Quyết định |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Public task index resilient | 23 | 18 | 20 | 15 | 9 | 7 | 92 | P1 adapt |
| Repo-map dependency impact | 25 | 18 | 20 | 15 | 9 | 8 | 95 | P0 adapt |
| Public deterministic task audit | 24 | 19 | 20 | 15 | 10 | 8 | 96 | P0 adapt |
| Fuzzy search trong prompt/response history | 17 | 15 | 5 | 7 | 3 | 3 | 50 | Defer; privacy/index ownership |
| Transitive call graph hoặc dynamic dependency inference | 20 | 13 | 10 | 7 | 6 | 3 | 59 | Defer; cache v1 không đủ signal |
| Automatic remediation từ audit | 18 | 12 | 0 | 6 | 2 | 4 | 42 | Reject; mutation/loop risk |

## Decision và contract direction

Chọn một batch coherent tên Task navigation and gate visibility gồm ba capability:

1. Public harnix tasks: default limit 20, hard limit 100; optional exact status filter; active record đứng trước rồi updatedAt giảm dần, tie bằng ID; đọc tối đa 1.000 safe task directories, trả scanned/invalid/truncated; malformed record không làm mất các record hợp lệ.
2. harnix repo-map --impact <path>: mutually exclusive với query/refresh; default depth 2, range 1..3; limit dùng bound public hiện có 1..20 cho mỗi direction; trả target, direct dependencies và dependents kèm distance, sort distance rồi path; missing/invalid cache và target-not-found có stable status.
3. Public harnix audit: no option; no-active là success; Full readiness reuse ready-trace, Lite là not-applicable; completion trả pending criterion IDs và required-check IDs theo passed/failed/stale/pending; top-level không echo prose/command/path tuyệt đối và không tự chạy/fix/transition.

## Before/after metrics

| Capability | Trước | Target sau |
|---|---|---|
| Task history | 36 directories, không public index | Một command trả tối đa 20 mặc định, record hỏng không làm hỏng toàn response |
| Impact navigation | Lexical ranked results, quan hệ exact path không thể phân biệt | Một command trả direct dependencies và reverse dependents depth 1..3, tối đa 20 |
| Gate visibility | Hidden ready-only audit; completion phải đọc raw TaskRecord | Một public response tách readiness/completion và liệt kê stable blocker IDs/codes |
| Privacy | Manual reads có thể lộ prose/evidence | Không trả title, goal, descriptions, commands, summaries, artifact bodies hay absolute paths |
| Side effects | Manual inspection tùy người dùng | Cả ba path chỉ đọc cache/state local, không network/ghi file |

## Risks, limits và rollback

- Task index không phải conversation history và không resume task; scan cap có thể làm truncated ở repository trên 1.000 task directories.
- Impact chỉ phản ánh relative static import đã extract vào cache v1; output phải nói bằng contract qua depth/status, không được quảng bá là complete call graph.
- Audit chỉ phản ánh frozen deterministic contracts; pass không thay thế việc chạy verification và không chứng minh code đúng.
- Rollback xóa hai public command registrations/modules và impact option/helper; không migration, không đổi persisted schema, cache version, project files hoặc global setup.
- Không copy source/prose upstream; implementation clean-room. Provenance registry sẽ ghi rõ source, ref, license, evidence, adaptation và Harnix code/test/docs cho từng feature.

## Kết luận và impact lên plan

Cả ba candidate vượt ngưỡng apply, tận dụng hạ tầng hiện có và cùng giải quyết một hành trình thực tế: tìm task trước đây, xác định vùng code bị ảnh hưởng, rồi kiểm tra gate trước khi implement/finish. Planning phải thêm ba acceptance criteria và ba required focused checks bất biến, cập nhật public CLI/docs/provenance, triển khai từng feature bằng observed RED → GREEN.

## Remaining uncertainty và follow-up trigger

Không còn decision vật chất cản planning. Nếu test cho thấy scan 1.000 task hoặc impact traversal vượt budget thực tế, điều chỉnh implementation bên trong bound đã khóa nhưng không nới output. Chỉ mở lại research nếu cache schema phải đổi, public output cần prose/history search, hoặc audit cần mutation/heuristic; cả ba hiện bị loại khỏi scope.
