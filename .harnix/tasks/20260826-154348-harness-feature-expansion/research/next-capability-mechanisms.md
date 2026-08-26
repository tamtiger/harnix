# Nghiên cứu mechanism cho batch feature tiếp theo

- Task: `20260826-154348-harness-feature-expansion`
- Ngày nghiên cứu: 2026-08-26
- Material unknown: Sau batch `status/tasks/audit/repo-map`, mechanism nào còn tạo giá trị trải nghiệm đủ lớn mà không biến Harnix thành daemon, session runtime, hệ multi-agent hoặc lớp sở hữu model context?
- Stopping condition: dừng khi ba candidate dẫn đầu cùng vượt hard gate, primary-source mechanism đã hội tụ, gap có local reproduction và thêm source không còn khả năng hợp lý làm đổi quyết định.

## Kết luận

Chọn ba adaptation clean-room, độc lập nhưng cùng tạo một luồng phục hồi và giải thích trạng thái:

1. `harnix resume <task-id> [--dry-run]`: phục hồi duy nhất active pointer tới một TaskRecord chưa terminal đã được validate; không phục hồi transcript hay model session.
2. `harnix context-report --platform <kiro|antigravity|codex> [--limit <1..50>]`: giải thích metadata của effective context selection mà hook Harnix sẽ dùng; không đọc ra nội dung, raw reason, hash hoặc secret.
3. `harnix checks [--limit <1..50>]`: giải thích freshness của required checks và các input path thay đổi/thiếu theo snapshot hiện có; không chạy command và không sửa state.

Ba feature giữ một package/bin, local-only, bounded JSON và reuse state/algorithm hiện có. Không chọn transcript search/export, Git checkpoint, auto-compaction/token accounting, daemon notification hoặc fuzzy task-body indexing.

## Local evidence

### Gap 1 — TaskRecord còn tồn tại nhưng không thể tái kích hoạt

- Public CLI hiện có `status`, `tasks`, `audit`, `repo-map` nhưng không có lệnh chọn lại task.
- `src/core/tasks/task.ts` đã có primitive nội bộ `setActiveTask`; `src/core/tasks/task-index.ts` đã scan/validate task độc lập và bounded.
- Fixture tạm biệt lập đã tái hiện: một planning TaskRecord hợp lệ, `.active` rỗng; `tasks --status planning` tìm thấy record trong khi `status` trả `activeTask: null` / `no-active-task`. Không public command nào nối lại pointer. Fixture đã được xóa sau kiểm tra.
- Repository thật hiện không có orphan unfinished task; đây là recovery gap có tái hiện kiểm soát, không phải tuyên bố repository hiện đang hỏng.

### Gap 2 — Context selection có cơ chế nhưng thiếu khả năng giải thích

- `src/core/context/context.ts` đã lưu selected entries và omitted reason `budget|duplicate|missing|unsafe`.
- Hidden context command đã chọn `relevantPaths`, applicable guides, budget/dedupe và platform cap, nhưng public `status` chỉ trả trạng thái drift/count.
- Task hiện tại chưa có persisted `context.json`; effective hook vẫn có fallback từ task contract và guide applicability. Vì vậy report phải dùng cùng builder thực tế, không giả định manifest tồn tại.

### Gap 3 — Freshness chỉ hiện aggregate

- `src/core/verification/input-freshness.ts` đã so sánh stored/current snapshot và biết path changed/missing cùng task-contract hash.
- Integration fixture hiện có chứng minh sửa `input.ts` làm check `gate` stale, nhưng `audit` chỉ trả `staleIds: ["gate"]`.
- Người dùng phải tự suy luận lý do stale dù Harnix đã có dữ liệu cấu trúc cần thiết.

## Source registry hiện hành

| Repository/công cụ | Immutable ref hoặc nguồn | License đã kiểm | Mechanism được dùng làm evidence | Giới hạn |
|---|---|---|---|---|
| OpenAI Codex | `a26f1806a4f4b8cfec2ea1be129963815a61e58c` — [exec CLI source](https://github.com/openai/codex/blob/a26f1806a4f4b8cfec2ea1be129963815a61e58c/codex-rs/exec/src/cli.rs) | Apache-2.0 | resume bằng exact ID/name, `--last`, `--all` | Codex resume thread; Harnix chỉ phục hồi task pointer |
| GitHub Spec Kit | `c58a8487461052b4fa65e626df167521d297b184` — [workflow reference](https://github.com/github/spec-kit/blob/c58a8487461052b4fa65e626df167521d297b184/docs/reference/workflows.md) | MIT | persisted run state, status và resume exact run ID | Không sao chép workflow runtime |
| BMAD Method | `9376e1f9e5b1214c024bb20b81adff5eb447820a` — [build-auto](https://github.com/bmad-code-org/BMAD-METHOD/blob/9376e1f9e5b1214c024bb20b81adff5eb447820a/docs/reference/build-auto.md) | MIT + trademark notice | resume theo existing story/spec; ambiguity fail closed | Chỉ dùng decision semantics |
| OpenHands | `f48eca6ab9149b3aa532e86842c85da43e370108` — [CLI resume docs](https://docs.openhands.dev/openhands/usage/cli/resume) | core MIT, enterprise excluded | list recent, exact ID, last conversation | Session store khác product boundary |
| OpenCode | `1cc53890dc0d902e6c85eca5b7e27cbf0a04541a` — [CLI](https://opencode.ai/docs/cli/) và [TUI](https://opencode.ai/docs/tui/) | MIT | continue/session ID, session list/export/import | Export/import bị reject |
| Goose | `d9d08f0e051531e921f561fcb77aa0ed589e9de9` — [session management](https://goose-docs.ai/docs/guides/sessions/session-management/) | code Apache-2.0; docs CC BY 4.0 | list/resume latest hoặc exact name/ID | SQLite/session history không phù hợp |
| Aider | `5dc9490bb35f9729ef2c95d00a19ccd30c26339c` — [options](https://aider.chat/docs/config/options.html) | Apache-2.0 | restore chat history | Identity/selection semantics yếu hơn |
| VS Code docs | `af6d23706c3a59b91767b2f69de7d97d02bef9cc` — [context source](https://github.com/microsoft/vscode-docs/blob/af6d23706c3a59b91767b2f69de7d97d02bef9cc/docs/agents/concepts/context.md) | docs CC BY 3.0 US; code MIT | context categories, implicit/explicit inputs, context control | Chỉ dùng behavioral concept; không chép prose/UI |
| Claude Code | [sessions](https://code.claude.com/docs/en/sessions), [context window](https://code.claude.com/docs/en/context-window) | proprietary terms | exact session resume; `/context` breakdown | Không dùng làm code-source provenance |
| Cline | `6ba9b9d7b47fce13d042fbb8273ef4072c23f77e` | Apache-2.0 | revalidated current baseline for task/session-oriented UX | Không chọn thêm mechanism |
| Superpowers | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797` | MIT | revalidated plan/evidence discipline | Không thay frozen ownership baseline |
| ECC | `d8409a4b0813771235555e32e3d8046a73988bfa` | MIT | revalidated research/verification discipline | Không chọn thêm runtime surface |
| Trellis | `64e663694201005bc87766ef22de89b8da3d4d79` | MIT | revalidated task-state lineage | Không thay frozen ownership baseline |

Current refs chỉ là dated research evidence; frozen ownership refs trong baseline không tự động bị thay thế.

## Real-usage signal

Issue là báo cáo người dùng, không phải authoritative contract:

- [OpenCode #29060](https://github.com/anomalyco/opencode/issues/29060): dữ liệu session còn nhưng UI/CLI không liệt kê để resume.
- [Claude Code #25130](https://github.com/anthropics/claude-code/issues/25130) và [#26123](https://github.com/anthropics/claude-code/issues/26123): picker bounded hoặc discovery lỗi làm session tồn tại nhưng khó truy cập; exact ID là recovery path quan trọng.
- [Claude Code #40180](https://github.com/anthropics/claude-code/issues/40180): nhu cầu xem thành phần context/usage.
- [Claude Code #52419](https://github.com/anthropics/claude-code/issues/52419): tín hiệu privacy cho thấy report context không được in nội dung, arbitrary reason hay secret-bearing metadata.

## Facts và inferences

### Facts

- Harnix đã có validated task records, atomic active pointer, bounded task index, context selector và immutable verification snapshot.
- Public output hiện không cung cấp task reactivation, path-level context explanation hoặc path-level freshness explanation.
- Nhiều harness hiện hành có exact resume/state discovery; Claude Code và VS Code có context breakdown.
- Harnix non-goals cấm session replay ownership, daemon/service, automatic Git integration, global memory và silent network.

### Inferences

- Reuse primitive hiện có làm ba feature có implementation cost thấp hơn xây state mới.
- Exact-ID-only resume giảm ambiguity/privacy hơn fuzzy search theo title/body.
- Metadata-only context/check report mang phần lớn giá trị debug mà không làm lộ task prose, command, evidence summary, hash hoặc file content.
- Ba lệnh tạo chuỗi trải nghiệm hợp lý: tìm task bằng `tasks` → phục hồi bằng `resume` → hiểu context/check blocker bằng report.

## Decision matrix

Công thức: gap 25% + fit 20% + correctness 15% + safety/privacy 15% + low cost 10% + testability 10% + license 5%. Mỗi tiêu chí 0–5; hard gate yêu cầu fit, safety/privacy và license không dưới 4.

| Candidate | Gap | Fit | Correctness | Safety | Cost | Test | License | Điểm | Quyết định |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---|
| Exact task resume | 5 | 5 | 4 | 4 | 4 | 5 | 5 | 4.60 | Adapt |
| Required-check freshness explanation | 4 | 5 | 5 | 4 | 4 | 5 | 5 | 4.50 | Adapt |
| Effective context explanation | 4 | 5 | 4 | 4 | 3 | 5 | 5 | 4.25 | Adapt |
| Fuzzy task-body search | 3 | 3 | 3 | 2 | 3 | 4 | 5 | 3.10 | Defer |
| Transcript import/export/search | 3 | 1 | 2 | 1 | 1 | 2 | 4 | 2.00 | Reject |
| Git rewind/checkpoint | 3 | 1 | 2 | 2 | 2 | 3 | 5 | 2.40 | Reject |
| Auto context compaction/token accounting | 3 | 2 | 2 | 3 | 1 | 2 | 5 | 2.40 | Reject |
| Background notification/monitor | 2 | 1 | 2 | 2 | 1 | 2 | 5 | 1.95 | Reject |

## Locked candidate contracts đề xuất

### `resume`

- Input: exact canonical `task-id`; optional `--dry-run`.
- Candidate phải tồn tại, directory ID khớp record, schema hợp lệ và status chưa terminal.
- Pointer absent/empty: dry-run trả planned; normal run atomic write.
- Pointer đã trỏ cùng task: trả `already-active`, không write.
- Pointer trỏ task khác, pointer invalid, candidate missing/malformed/terminal: fail closed, không overwrite.
- Output chỉ gồm bounded outcome, task ID/mode/status/checkpoint và deterministic `nextAction`; không title/goal/prose/command/hash/absolute path.
- Không transition workflow, không sửa evidence, không khôi phục transcript/Git/model state.

### `context-report`

- Input bắt buộc `--platform <kiro|antigravity|codex>`; `--limit` integer 1..50.
- Read-only, no-write, no-network; dùng chung effective selection builder với hidden hook để tránh drift.
- Trả platform budget, selected relative path với derived reason code/`pinned`/`priority`, omitted relative path với categorical reason, persisted drift changes/selection changes, summary và truncation.
- Allowed reason codes chỉ từ trusted derivation: `task-reference`, `relevant-spec`, `applicable-guide`, `pinned`, `persisted-selection`; omitted giữ enum hiện có.
- Không trả file content, raw saved reason, state payload, content hash, task prose, secret hoặc absolute path.
- Không active task trả bounded `no-active-task`; fallback động dùng `relevantPaths` + applicable guides khi chưa có context manifest.

### `checks`

- Input optional `--limit` integer 1..50; read-only, no-write, no-network, không chạy validation command.
- Trả từng required check theo code-unit order: ID, state, categorical reason codes và bounded relative changed/missing input paths; có summary/truncation.
- Allowed reason codes: `no-evidence`, `latest-skipped`, `latest-failed`, `evidence-expired`, `snapshot-missing`, `snapshot-invalid`, `snapshot-mismatch`, `task-contract-changed`, `inputs-changed`, `inputs-missing`, `inputs-unavailable`.
- v1 pass giữ age semantics; v2 recompute current input snapshot rồi compare stored `taskContractHash` và entries.
- Không trả description, command, evidence summary, hash, task prose hoặc absolute path.

## Provenance impact

Nếu triển khai, thêm registry entry machine-checkable và expected feature-ID regression:

- `task-resume-recovery`: behavioral adaptation từ BMAD, Spec Kit và Codex exact-state recovery; Harnix delta là validated unfinished TaskRecord pointer, không session replay.
- `context-selection-explanation`: behavioral adaptation từ VS Code context transparency; Harnix delta là local metadata-only effective selector report.
- `verification-freshness-explanation`: behavioral adaptation từ Spec Kit/BMAD state/status semantics trên Harnix immutable input snapshot; không chạy check.

Mỗi entry phải có immutable ref, access date, license, evidence URL, adaptation delta và concrete code/test/docs paths. Claude/OpenCode issues chỉ là usage signal, không phải code-source provenance.

## Remaining uncertainty và xử lý

- Exact public JSON shape cần được khóa trong PRD/design/tests trước ready; đây là design detail, không còn là product-selection unknown.
- Shared context builder refactor có thể phát hiện coupling giữa rendering và selection; nếu focused RED cho thấy output cannot share safely, quay lại `replan` thay vì duplicate algorithm.
- Project-wide mutation lock chưa tồn tại cho hidden workflow. `resume` không được quảng bá concurrency guarantee mới; atomic replace và fail-closed collision semantics là boundary hiện tại.
- Manual disposable-profile smoke vẫn cần ở release gate theo canonical plan; real user profile không được chạm.
