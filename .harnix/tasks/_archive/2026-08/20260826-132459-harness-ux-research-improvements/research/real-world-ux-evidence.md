# Bằng chứng trải nghiệm thực tế

- Task: 20260826-132459-harness-ux-research-improvements
- Ngày đo: 2026-08-26
- Câu hỏi vật chất: Harnix đang buộc người dùng/agent tốn bao nhiêu công sức để biết task hiện tại/lịch sử, vùng code liên quan và gate còn thiếu, và bằng chứng bên ngoài có xác nhận các pain này không?
- Ngưỡng dừng: tái hiện local, ít nhất hai nguồn độc lập cho capability áp dụng, một nguồn là real-usage signal, metric trước/sau và rollback cụ thể.

## Reproduction Harnix trước thay đổi

Chạy trên active Full task hiện tại:

1. node dist/cli.js --help không có public status; chỉ có init, setup, update, upgrade, uninstall, mem, doctor, repo-map.
2. node dist/cli.js workflow --inspect trả 6.890 byte UTF-8 trên một JSON line, gồm toàn bộ goal, non-goals, criteria, checks, inputs và evidence.
3. node dist/cli.js doctor exit 1 với 34 warning trong repository hiện tại; output trộn project/global/historical health thay vì trả active-task progress ngắn.
4. State cần thiết đã tồn tại: task status/checkpoint, acceptance status, required checks/evidence, context drift và blocker.

Kết luận fact: vấn đề không phải thiếu persisted state; vấn đề là không có public bounded projection.

## Real-usage signals

### Resume và checkpoint không rõ hoặc không hoạt động

- Cline #9948: resume crash khi history chứa một loại failure event.
- Cline #12388: checkpoint restore thất bại sau internal continuation.
- Cline discussion #12396: task đứng ở “Thinking” và Resume Task không tác dụng.
- Cline #13239: headless JSON resume từ chối prompt.
- Goose #5164: session không recover sau context compaction.
- Goose #8642: context-limit/compaction false positive.
- Trellis #549: nested session có thể nhận nhầm active task.
- Trellis #470: unbounded referenced context làm payload phình lớn.
- ECC #2694: skill discovery quá rộng làm vượt context budget.

Nguồn:
- https://github.com/cline/cline/issues/9948
- https://github.com/cline/cline/issues/12388
- https://github.com/cline/cline/discussions/12396
- https://github.com/cline/cline/issues/13239
- https://github.com/aaif-goose/goose/issues/5164
- https://github.com/aaif-goose/goose/issues/8642
- https://github.com/mindfold-ai/Trellis/issues/549
- https://github.com/mindfold-ai/Trellis/issues/470
- https://github.com/affaan-m/ECC/issues/2694

Các issue không chứng minh prevalence, nhưng là báo cáo người dùng độc lập về cùng failure family: không biết session/task có thể tiếp tục ra sao hoặc context đang ở trạng thái nào.

### Mechanism evidence

- ECC current source tổng hợp readiness, attention và top actions từ persisted state.
- Spec Kit workflow engine persist state sau mỗi step và có status/resume command.
- BMAD bmad-help và sprint status đưa ra bước kế tiếp từ workflow state.
- Trellis continue route từ status/artifact, không dựa vào trí nhớ của người dùng.

Nguồn:
- https://github.com/affaan-m/ECC/tree/d8409a4b0813771235555e32e3d8046a73988bfa
- https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/workflows/README.md
- https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.8.0/docs/reference/workflow-map.md
- https://github.com/bmad-code-org/BMAD-METHOD/blob/v6.8.0/docs/reference/build-auto.md
- https://github.com/mindfold-ai/Trellis/tree/64e663694201005bc87766ef22de89b8da3d4d79

## Direct user requirement về provenance

Người dùng yêu cầu rõ trong task này: mọi feature lấy từ repo harness phải được note trong docs để sau này dễ nhận biết. Local inspection cho thấy HARNESS_RESEARCH.md và UPSTREAM_MAPPING.md có nhiều bảng prose tốt nhưng chưa có một registry machine-checkable buộc source/ref/date/license/evidence/code/test tồn tại.

Đây là first-party user signal. Mechanism evidence là frozen upstream baseline và current mapping đã chứng minh Harnix có đủ dữ liệu để chuẩn hóa mà không thêm runtime surface.

## Metric và target

| Metric | Trước | Target sau |
|---|---|---|
| Public discoverability | Không có harnix status trong help | Có đúng một public status, không cần --json |
| Payload active-task mặc định | Hidden inspect 6.890 byte trong reproduction | Public status dưới 2 KiB cho cùng fixture, không echo goal/criteria/check descriptions |
| Bước tiếp theo | Người đọc phải diễn giải raw TaskRecord | Đúng một stable nextAction.code theo precedence đã khóa |
| Progress | Không có aggregate | Counts acceptance và required-check state cộng đúng tổng |
| Drift/attention | Nằm trong raw nested data hoặc Doctor noise | Bounded state/count và deterministic attention codes |
| Provenance enforcement | Prose phân tán; missing target không fail test | Canonical JSON registry + regression fail trên field/path/ref thiếu |
| Side effects | Hidden inspect read-only | Status no-write/no-network; before/after tree snapshot bằng nhau |

Không đặt latency SLA dễ flaky; static dependency inspection và integration no-write test bảo vệ no-network/no-mutation.

## Reproduction mở rộng sau feedback

- Có 36 task directories nhưng không có public task index; manual traversal có thể đọc nhầm private task prose.
- Repo-map cache đã có adjacency/reverseAdjacency nhưng public query chỉ trả lexical ranking, không exact impact relationship.
- Ready audit là hidden transport và không tổng hợp completion blockers; raw inspect vẫn cần diễn giải thủ công.
- Target mới: default task list tối đa 20, impact mỗi direction tối đa 20 ở depth 1..3, audit chỉ stable code/ID/count; cả ba no-write/no-network.

## Rollback

- status là additive public command; rollback bằng xóa registration, command/core module và focused tests, không migrate task schema/data.
- Registry là docs + test; rollback không chạm runtime/user state.
- tasks/audit là additive public commands; impact là additive repo-map action. Xóa registration/modules/tests là đủ, không migrate task hoặc cache.
- Không đổi TaskRecord, config, manifest, hook, exit semantics chung hoặc global integration.

## Kết luận

Bằng chứng đủ cho một batch P0/P1 gồm bounded status, resilient task index, exact cached dependency impact, deterministic public task audit và external-feature provenance registry. Không đủ authority/fit để thêm model compaction, Git checkpoints, session replay, watcher, daemon hoặc statusline.