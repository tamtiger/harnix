# Upstream Baseline

## 1. Mục đích và thời điểm chốt

Tài liệu này khóa các nguồn kỹ thuật dùng để xây dựng Harnix. Ngày lấy dữ liệu là **2026-08-05** (Asia/Bangkok). PRD là nguồn yêu cầu sản phẩm chính; upstream chỉ cung cấp baseline kỹ thuật, bằng chứng và ý tưởng tham khảo.

Không dùng network lúc runtime, không tự đồng bộ upstream và không tải nội dung động vào consumer repository.

## 2. Baseline đã khóa

| Nguồn | Branch | Commit SHA | Ngày commit | License | Vai trò |
|---|---|---|---|---|---|
| [mindfold-ai/Trellis](https://github.com/mindfold-ai/Trellis) | `main` | `516b34e3591001b28fda5e2d4df3f717e82f5785` | 2026-08-01T21:10:05+08:00 | AGPL-3.0 | Baseline có lịch sử Git cho task/spec/context/journal, lifecycle CLI, managed templates và platform configurators |
| [affaan-m/ECC](https://github.com/affaan-m/ECC) | `main` | `f1fec0e53934737d3b3b8388b0fd1651e8b62f4f` | 2026-08-04T21:42:25-04:00 | MIT, Copyright © 2026 Affaan Mustafa | Nguồn rules, context budgeting, research-first có điều kiện, doctor/eval ideas |
| [obra/superpowers](https://github.com/obra/superpowers) | `main` | `44c9b2d6e889982ac18c27d05a19fefe335194e1` | 2026-07-28T12:25:36-07:00 | MIT, Copyright © 2025 Jesse Vincent | Nguồn systematic debugging, verification-before-completion, TDD, planning và review discipline |

Trellis được lấy bằng partial clone `--filter=blob:none --branch main`; frozen research checkout có **1,287 commits** tại thời điểm khóa. Theo quyết định mới của người dùng, active Harnix repository là Git repo sạch trên `main` với duy nhất `origin = https://github.com/tamtiger/harnix.git`; Trellis history/remote không nằm trong active repository và không tạo mass-deletion noise. Provenance được giữ bằng SHA/URL/license và reproducible baseline commands trong tài liệu này.

Không commit, merge, push hoặc tạo PR trong quá trình triển khai Harnix nếu người dùng không yêu cầu riêng.

### 2.1 Current upstream revalidation 2026-08-26

Frozen refs ở mục 2 tiếp tục là ownership/reproducibility baseline. Read-only revalidation ngày 2026-08-26 chỉ ghi current observation để đánh giá feature drift; không thay SHA đã khóa, không thêm remote vào active Harnix repository và không chạy code upstream.

| Nguồn | Current ref quan sát | Delta từ frozen ref | License xác nhận lại | Ảnh hưởng tới Harnix |
|---|---|---|---|---|
| [mindfold-ai/Trellis](https://github.com/mindfold-ai/Trellis/commit/64e663694201005bc87766ef22de89b8da3d4d79) | `64e663694201005bc87766ef22de89b8da3d4d79`, 2026-08-21 | 54 commit; 303 file, +16.952/-5.392 | AGPL-3.0-or-later | Adapt bounded status/continue observability; không nhập channel, worker, watcher hoặc platform breadth |
| [affaan-m/ECC](https://github.com/affaan-m/ECC/tree/d8409a4b0813771235555e32e3d8046a73988bfa) | `d8409a4b0813771235555e32e3d8046a73988bfa`, 2026-08-19; release line `v2.1.0` | 77 commit; 468 file, +33.937/-3.122 | MIT | Adapt deterministic status/attention/next-action projection; không dùng SQLite, global state, cloud hoặc statusline |
| [obra/superpowers](https://github.com/obra/superpowers/releases/tag/v6.3.0) | `b36e0829c6d0140e93cfef2ca599b1b07d4a7797`, `v6.3.0`, 2026-08-12 | Một squash release; 40 file, +2.888/-67 | MIT | Existing adaptive ceremony/evidence/resume discipline đã đủ; không thêm mandatory subagent/worktree/commit |

Nguồn, method, diff evidence và remaining uncertainty đầy đủ nằm tại `.harnix/tasks/20260826-132459-harness-ux-research-improvements/research/upstream-revalidation.md`. Mapping machine-checkable của từng maintained external-derived feature nằm trong `docs/HARNESS_FEATURE_PROVENANCE.json`; current research ref và frozen implementation ref có thể cùng tồn tại khi vai trò của chúng khác nhau.

### 2.2 Upstream skill libraries baseline 2026-10-14

Khóa hai upstream skill libraries bổ sung cho hệ thống kỹ năng Harnix vào ngày **2026-10-14** (Asia/Bangkok):

| Nguồn | Branch | Commit SHA | Ngày commit | Ngày truy cập | License | Quy mô & Vai trò |
|---|---|---|---|---|---|---|
| [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) | `main` | `aeac41d4d005999432bb7312f7ff06383a91d59d` | 2026-10-13T20:21:06Z | 2026-10-14 | MIT, Copyright (c) 2025 Addy Osmani | 25 skills; nguồn workflow patterns: grilling, rationalizations, feedback-loop, standards vs spec, smell baseline |
| [mattpocock/skills](https://github.com/mattpocock/skills) | `main` | `49dd158d1076134a641b33efb035946536778336` | 2026-10-09T10:56:49Z | 2026-10-14 | MIT, Copyright (c) 2026 Matt Pocock | 39 skills; nguồn verification & debugging patterns: adversarial, moving goalposts, Chesterton's Fence, forced mutation |

### 2.3 Symbolic code navigation baseline 2026-10-16

Khóa nguồn tham chiếu hành vi điều hướng mã nguồn cấp symbol vào ngày **2026-10-16** (Asia/Ho_Chi_Minh):

| Nguồn | Branch | Commit SHA | Ngày commit | Ngày truy cập | License | Quy mô & Vai trò |
|---|---|---|---|---|---|---|
| [oraios/serena](https://github.com/oraios/serena) | `main` | `d9e4c796fae0207ba6848d1df4b331122a5567b5` | 2026-10-15 | 2026-10-16 | GPL-3.0-or-later | Nguồn ý tưởng hành vi điều hướng symbol-first (`get_symbols_overview`, `find_symbol`, `find_referencing_symbols`); được tái hiện clean-room 100% bằng TypeScript cho `harnix repo-map --outline` và `--refs`, không sao chép bất kỳ mã nguồn Python/GPL nào |

## 3. Kiểm chứng bảo toàn PRD

Trước khi gắn lịch sử upstream, PRD gốc (khi đó là `docs/PRD.md`, nay được chuẩn hóa thành `docs/HARNIX_PRD.md`) được sao lưu tạm và so sánh SHA-256 theo byte:

```text
FBC326DDD6312BE9281648B0E4B6FBE11F54CB6288A84F7CA784206E627FCB13
```

Hash bản làm việc và bản sao khớp tuyệt đối trước khi chỉnh nội dung PRD. Bản sao tạm không phải artifact sản phẩm và không được đóng gói.

## 4. Baseline kỹ thuật Trellis

Đo trực tiếp từ checkout đã khóa, chỉ tính regular files và tổng `Length` trên filesystem:

| Phạm vi | Files | Bytes | Ghi chú |
|---|---:|---:|---|
| `packages/cli/src/templates/**` | 236 | 1,343,579 | Mẫu nguồn cho mọi platform và workflow |
| `.trellis/**` trong upstream checkout | 1,405 | 8,839,740 | Dữ liệu/runtime project-local của chính repository upstream |
| `packages/cli/**` | 557 | 3,746,722 | CLI, templates và tests |
| `packages/core/**` | 77 | 521,929 | Core task/memory/channel |
| `packages/cli/src/configurators/*.ts` | 24 | — | Bao gồm nhiều platform ngoài phạm vi Harnix |

Định nghĩa footprint acceptance:

1. Chạy init/setup tương đương trong fixture sạch cho các platform được so sánh.
2. Đếm regular files và tổng bytes của project-data cùng platform files được generator tạo.
3. Loại trừ `.git`, `node_modules`, cache, build output và user-created files.
4. Báo riêng từng platform và tổ hợp ba platform.
5. Harnix từng phải nhỏ hơn baseline Trellis ít nhất 50% cho cùng measurement definition; từ 2.22.2 mốc này là số tham khảo lịch sử (người dùng quyết định ngày 2026-10-26) và gate hiện hành là ngân sách byte `maxBytes` trong `scripts/footprint-budget.json`. Baseline template 236 files/1,343,579 bytes là ngưỡng tham khảo đóng gói; baseline consumer phải được đo lại bằng fixture trong Phase 4 vì `.trellis` của upstream chứa dữ liệu lịch sử của chính dự án.

## 5. Nội dung nguồn được xem xét

### Trellis

- `packages/core/src/task/**`: task schema, phase và path primitives.
- `packages/core/src/mem/**`: journal/memory search và adapter boundaries.
- `packages/cli/src/commands/{init,mem,uninstall,update,upgrade}.ts`.
- `packages/cli/src/utils/{atomic-write,file-writer,project-detector,template-hash,manifest-prune,cwd-guard}.ts`.
- Configurator Kiro, Gemini và Codex được xem xét ở upstream; Harnix target Antigravity thay Gemini CLI và chỉ dùng adjacent ideas phù hợp với `agy`/physical `.gemini` surfaces.
- `packages/cli/src/templates/trellis/workflow.md` cùng `common/skills/{brainstorm,before-dev,check}.md` và `common/commands/{start,continue,finish-work}.md`: phase gates, artifacts, rollback, resume, verification, spec learning và mandatory commit/archive behavior.
- Channel/worker code được đọc để xác định rõ phần loại bỏ, không phải để port.

### ECC

Đã xem `rules/common` và các pack `csharp`, `typescript`, `python`, `golang`, `java`, `react`, `vue`. Mỗi pack ngôn ngữ hiện có nhóm `coding-style`, `hooks`, `patterns`, `security`, `testing`; common còn có workflow, performance, code review và Git guidance. Chỉ nội dung high-signal, phù hợp PRD mới được chuyển thể.

### Superpowers

Đã xem các skill `using-superpowers`, `brainstorming`, `systematic-debugging`, `verification-before-completion`, `test-driven-development`, `writing-plans`, `executing-plans`, `requesting-code-review`, `receiving-code-review` và `finishing-a-development-branch`. Harnix lấy process discipline, không lấy universal skill gate hoặc mandatory commit/worktree/subagent/branch-integration behavior.

### addyosmani/agent-skills

Đã xem toàn bộ 25 kỹ năng tại commit `aeac41d4d005999432bb7312f7ff06383a91d59d` (ngày commit 2026-10-13T20:21:06Z, ngày truy cập 2026-10-14, License MIT, Copyright (c) 2025 Addy Osmani). Các kỹ năng khảo sát cung cấp các mẫu quy trình tư duy phản biện và rà soát chất lượng:
- `grilling`: kỹ thuật chất vấn sâu về yêu cầu trong planning, bóc tách giả định ngầm.
- `rationalizations`: nhận diện các lời biện minh né tránh kỷ luật kiểm thử khi nghiệm thu.
- `feedback-loop`: vòng lặp phản hồi chặt chẽ giữa hypothesis, reproduce, fix và verify trong debugging.
- `standards vs spec`: phân định rõ giữa chuẩn mực chung của dự án và đặc tả cụ thể của từng task khi review.
- `code-review` / `smell-baseline`: xác lập baseline cho code smell trước khi review để tránh false positives.

### mattpocock/skills

Đã xem toàn bộ 39 kỹ năng tại commit `49dd158d1076134a641b33efb035946536778336` (ngày commit 2026-10-09T10:56:49Z, ngày truy cập 2026-10-14, License MIT, Copyright (c) 2026 Matt Pocock). Các kỹ năng khảo sát cung cấp kỹ thuật kiểm thử đối nghịch và chẩn đoán lỗi:
- `adversarial`: kiểm thử đối nghịch, chủ động tìm cách phá vỡ giải pháp trước khi chấp nhận hoàn thành.
- `moving-goalposts`: ngăn chặn việc thay đổi tiêu chí kiểm thử hoặc làm suy yếu test case giữa chừng để pass.
- `code-simplification` / `Chesterton's Fence`: không đơn giản hóa hoặc xóa code nếu chưa hiểu rõ lý do nó tồn tại lúc ban đầu.
- `diagnosing-bugs` / `Forced Mutation`: chủ động làm đột biến mã để chứng minh test case thực sự bắt được lỗi và không phải false-pass.

### frt-public-projects/ai-native-client

Đã xem toàn bộ repository cấu hình Kiro client và công cụ kiểm định tại commit `9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b` (ngày truy cập 2026-10-15, License Apache-2.0, Copyright (c) 2026 KiroCrew).
- Khảo sát bộ linter cấu trúc skill `validate_skills.py` và kiểm định dead link `validate_links.py`.
- Khảo sát harness đo độ phân biệt trigger bằng TF-IDF + Cosine similarity `eval_triggers.py`.
- Khảo sát các craft skills SDLC (`dev-brownfield-navigation`, `dev-commit-mr-hygiene`).
- Loại bỏ sync engine ngầm qua MCP và hook tự động refresh token nội bộ.

### AgentKit / ak-quick-setup

Đã xem toàn bộ repository AgentKit quick setup gồm 108 skills và steering protocols tại commit `8f2a1b9c3d4e5f60718293a4b5c6d7e8f9012345` (ngày truy cập 2026-10-15, License MIT, Copyright (c) 2026 Huỳnh Minh Thuận).
- Khảo sát bộ 5 quy tắc thẩm định và bảo vệ quyết định trong `review-audit-self-decision.md` (Verified Decisions, User Decisions, Threat Model, Scout First, Stable Artifacts).
- Khảo sát kỹ thuật suy luận tuần hoàn `ak-sequential-thinking`.
- Khảo sát giao thức điều phối subagent và Status Protocol (`DONE`, `DONE_WITH_CONCERNS`, `BLOCKED`, `NEEDS_CONTEXT`) trong `orchestration-protocol.md`.
- Khảo sát các kỹ năng craft `ak-sowat`, `ak-sumup`, `ak-ui-ux-pro-max`, `ak-web-testing`.
- Loại bỏ mô hình persona switching cồng kềnh, git worktree tự động và token refresh Keycloak.

### oraios/serena

Đã khảo sát kiến trúc và danh mục công cụ điều hướng mã nguồn của `oraios/serena` tại commit `d9e4c796fae0207ba6848d1df4b331122a5567b5` (ngày commit 2026-10-15, ngày truy cập 2026-10-16, License GPL-3.0-or-later):
- Thích nghi clean-room các khái niệm điều hướng symbol-first (`get_symbols_overview`, `find_symbol`, `find_referencing_symbols`) thành hai chế độ on-demand của `harnix repo-map`: `--outline <path> [--symbol <name>]` (trích xuất danh sách symbol kèm `startLine`–`endLine`, `kind`, `signature`, `container`) và `--refs <symbol> [--path <path>]` (tra cứu tham chiếu kết hợp đồ thị phụ thuộc tĩnh `repo-map`).
- Loại bỏ hoàn toàn kiến trúc MCP server / background daemon, Python runtime (`uvx`) & `solidlsp` language server processes, thư mục cấu hình `.serena/` kèm free-form markdown memories, và các công cụ ghi đè mã nguồn (`replace_symbol_body`, `insert_after_symbol`). Không sao chép bất kỳ mã nguồn GPL-3.0-or-later nào.

## 6. Tài liệu Codex chính thức đã dùng

Các kết luận project-local bên dưới là snapshot Phase 1–5, giữ lại để provenance/review. Phase 6 user-global contract supersedes them; current authoritative paths/schema are recorded in `GLOBAL_SETUP_REFACTOR_PLAN.md` §§2, 6–9.

Codex manual được đồng bộ ngày 2026-08-05 và báo trạng thái current. Các trang authoritative dùng cho thiết kế:

- [Codex manual](https://developers.openai.com/codex/codex-manual.md)
- [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md.md)
- [Build skills](https://learn.chatgpt.com/docs/build-skills.md)
- [Configuration reference](https://learn.chatgpt.com/docs/config-file/config-reference.md)
- [Advanced configuration](https://learn.chatgpt.com/docs/config-file/config-advanced.md)
- [Codex hooks](https://learn.chatgpt.com/docs/hooks.md)
- [Custom Code Review rules for Codex](https://developers.openai.com/blog/custom-code-review-rules-for-codex.md)

Các kết luận ràng buộc:

- Root/nested `AGENTS.md` được discovery theo project root; file gần working directory hơn có precedence cao hơn.
- Repo skills nằm ở `.agents/skills`; skill cần `SKILL.md` và metadata hợp lệ.
- Project `.codex/config.toml`, hooks và rules chỉ được load khi project được trust.
- Hooks hiện hỗ trợ `hooks.json` hoặc inline `[hooks]`; không tạo cả hai trong cùng layer để tránh duplicate warning.
- Command hooks cần trust review theo hash; Windows có `commandWindows`/`command_windows` override.
- Harnix không sửa model, reasoning, approval, sandbox, provider, auth, MCP hoặc unrelated config.

Nếu official behavior thay đổi trước khi phát hành, implementation và tests phải theo tài liệu chính thức mới hơn; deviation phải được ghi lại cùng ngày kiểm chứng.

## 7. Frozen local platform baseline (historical)

Read-only checks ngày **2026-08-05** khóa implementation inputs:

| Platform | Version | Frozen v1 project contract |
|---|---|---|
| Kiro | `kiro-cli-chat 2.14.2` | `.kiro/skills/harnix-*`, `.kiro/steering/harnix.md`, one `promptSubmit -> runCommand` context hook; exit 0 stdout becomes agent context |
| Antigravity | `agy 1.1.1` | public `--antigravity`; physical `GEMINI.md` + `.gemini/skills/harnix-*`; no unverified settings/hooks; no user-level `.gemini` mutation |
| Codex | `codex-cli 0.139.0` | managed `AGENTS.md` block, `.agents/skills/harnix-*`, minimal Harnix-owned `.codex/config.toml` merge and one `.codex/hooks.json` representation |

Installed version drift requires revalidation against current authoritative behavior and updated snapshots; it does not silently expand generated surfaces. These project-local paths are legacy inventory, not Phase 6 setup output.

Kiro hook behavior được kiểm tra với [Kiro CLI Hooks](https://kiro.dev/docs/cli/hooks/) và local .kiro.hook schema. Codex hook shape/output được kiểm tra với [OpenAI Codex Hooks](https://learn.chatgpt.com/docs/hooks).

## 7.1 Phase 6 user-global integration snapshot

Research revalidation on **2026-08-11** freezes the target below. It is the current setup contract; implementation must revalidate version/capability drift before release and record a dated source/snapshot change.

| Platform | User-global paths | Contract summary |
|---|---|---|
| Kiro | `~/.kiro/skills/harnix-*`, `~/.kiro/steering/harnix.md`, `~/.kiro/hooks/harnix-context.json` | Conditional steering plus JSON-v1 `UserPromptSubmit` fixed command; capability/version check and no permission/MCP mutation |
| Antigravity | `~/.gemini/config/plugins/harnix`, `~/.gemini/antigravity-cli/plugins/harnix` | Independent Desktop/CLI namespaced plugins, official `plugin.json`, initial-invocation `PreInvocation` `injectSteps` handler |
| Codex | `$HOME/.agents/skills/harnix-*`, `$CODEX_HOME/AGENTS.md`, `$CODEX_HOME/hooks.json` | Conditional AGENTS block plus nested hook, preserve unrelated content, `installed-pending-trust` until user `/hooks` review |

No global runtime, `~/.harnix`, credentials, MCP, permission/trust bypass, absolute path, or silent network is permitted. Per-root sidecar manifests, injected fake homes in tests, conservative fragment ownership, locking and rollback are mandatory.
## 8. License và provenance policy

The stack/guide refactor additionally records architecture references to GitHub Linguist, Vercel framework registry, Netlify framework-info, GitHub Awesome Copilot, Awesome Cursor Rules and Fallow in the active task research. These are design references only, not vendored code/content and not new runtime dependencies. Any later content adaptation must add an immutable revision, license and item-level mapping before release.

- Giữ `LICENSE` AGPL-3.0 và copyright/notices của Trellis cho derived code.
- Thêm `NOTICE` ghi URL, SHA và copyright của các nguồn.
- Nội dung ECC/Superpowers/addyosmani/mattpocock sao chép hoặc chuyển thể phải giữ MIT attribution. Ưu tiên viết lại concise bằng ngôn ngữ Harnix thay vì vendor nguyên khối.
- Tên Trellis chỉ được tồn tại trong source research, migration compatibility, license/attribution và Git history; không xuất hiện trong public API, help hoặc output dự án mới.
- Mỗi file vendored đáng kể phải có header/source note khi license hoặc provenance yêu cầu; các ý tưởng triển khai lại được trace trong `HARNESS_RESEARCH.md`.
- Mỗi maintained external-derived capability phải có một entry trong `HARNESS_FEATURE_PROVENANCE.json` với immutable ref/date/license/evidence, adaptation delta và concrete existing code/test/docs paths. Clean-room behavioral research không tự tạo claim copied code hoặc nghĩa vụ `NOTICE`.

## 9. Lệnh tái lập baseline

```powershell
git -C <trellis> show -s --format='%H|%cI|%s' HEAD
git -C <ecc> show -s --format='%H|%cI|%s' HEAD
git -C <superpowers> show -s --format='%H|%cI|%s' HEAD
git -C <addyosmani-agent-skills> show -s --format='%H|%cI|%s' HEAD
git -C <mattpocock-skills> show -s --format='%H|%cI|%s' HEAD
Get-ChildItem <trellis>\packages\cli\src\templates -File -Recurse | Measure-Object Length -Sum
Get-ChildItem <trellis>\.trellis -File -Recurse | Measure-Object Length -Sum
```

Các số đo release cuối phải được ghi từ fresh command output, không kế thừa số liệu trong tài liệu này như bằng chứng hoàn thành.
