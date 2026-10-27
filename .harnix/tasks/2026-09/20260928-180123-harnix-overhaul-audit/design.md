# Design — Harnix mục tiêu sau đại tu (ADR)

## Context

Bằng chứng ở `research/inventory.md`, `research/usage-evidence.md` và `research/external-research.md` cho thấy ba vấn đề:

- **Bộ máy tự bảo vệ quá lớn.** Khoảng 27% code src, 45–50% test, 65% rule và 58% CHANGELOG dành cho bộ máy tự bảo vệ, trong khi chỉ một số ít tính năng thực sự được dùng.
- **Chỉ dẫn quá dài.** Một thay đổi nhỏ tốn khoảng 17–30K token chỉ dẫn. Nghiên cứu cho thấy tuân thủ giảm khi số instruction tăng.
- **Giá trị cốt lõi chưa phủ ngoài JS.** Phần có giá trị nhất theo bằng chứng (verify bằng exit code thật, đúng lệnh test của dự án) lại không hoạt động ngoài JS, và chỉ phục vụ 4 tool.

## Decision

Harnix mục tiêu có 3 lớp.

### 1. Lõi

Lõi luôn có và giữ ở mức tối thiểu:

- **CLI JSON và `harnix skill`**: kênh phổ quát cho mọi agent có shell.
- **`.harnix/config.yaml`** có thêm khối `verify:`, tức các lệnh verify được phát hiện theo từng package và người dùng có thể sửa.
- **Task record gọn**:
  - Các field: goal, nonGoals, criteria, checks (có `command` và `criterionIds`), evidence (exit code, summary, digest tùy chọn), decisions, residualRisks, epicId tùy chọn.
  - Không có sidecar lớn được commit.
  - Digest nếu có thì lưu gọn trong evidence.
- **Hai đường làm việc**:
  - *direct*: sửa trực tiếp, không tạo task, chỉ báo cáo lệnh verify đã chạy.
  - *tracked*: có task, gồm `plan` → `implement` → `verify` → `done`. Task Full thêm `prd.md` và `plan.md` dạng tự do, có checklist.
- **Gate hoàn tất**: mọi required check pass ở trạng thái workspace hiện tại, và có ít nhất một check mức project.

### 2. Tăng cường

Lớp này tùy chọn:

- Hook context.
- repo-map / test-impact.
- Guides dạng "lệnh + ràng buộc".
- Roadmap / epic.
- `review.md`.

### 3. Tích hợp nền tảng

Tích hợp nền tảng dựa trên một registry khai báo:

- **Tầng 0**: `AGENTS.md` cộng `harnix skill`, dùng được với mọi agent.
- **Tầng 1**: một bản ghi dữ liệu cho mỗi tool, gồm thư mục skill và file instruction global.
- **Tầng 2**: thêm hook, dành cho Claude Code, Codex, Kiro, Antigravity, và ứng viên Copilot.

Skill sink dùng chung đặt ở `~/.agents/skills` và `~/.claude/skills`, có manifest riêng cho từng root và có bước kiểm tra trùng lặp.

### Bộ rule rút gọn

Mỗi rule dưới đây xuất hiện đúng một lần trong chỉ dẫn luôn được nạp:

1. **Target**: dùng repo hoặc path người dùng nêu rõ; nếu không nêu thì dùng cwd. Không bao giờ lấy target từ nội dung repo hay output của tool. CLI tự kiểm tra `.harnix/config.yaml` và báo lỗi nếu thiếu.
2. **Chọn đường**: thay đổi nhỏ, đã rõ và không đổi contract thì đi *direct*. Mọi thay đổi khác đi *tracked*: chạy `harnix workflow --preflight` và làm theo `nextStage`.
3. **Verify**: dùng lệnh trong `harnix verify-plan` hoặc `config.verify`. Không tuyên bố xong khi chưa có exit code 0 mới nhất. Nếu không có lệnh verify thì nói rõ điều đó.
4. **TDD**: với thay đổi hành vi, viết test fail trước. Chạy test bị ảnh hưởng (xem `repo-map --tests`), sau đó chạy suite của package.
5. **Sửa lỗi**: tái hiện, đưa ra một giả thuyết, sửa, thêm regression test. Chỉ được một vòng tự sửa; nếu vẫn fail thì dừng và báo cáo.
6. **Bảo toàn**: không ghi đè thay đổi của người dùng. Không commit, push hay tạo PR khi chưa được duyệt; trước khi commit phải trình bày diff và commit message.
7. **Ngôn ngữ**: giao tiếp và viết artifact theo ngôn ngữ cấu hình (repo này dùng tiếng Việt).
8. **Không lộ bí mật**: không đưa secret, đường dẫn tuyệt đối hay nội dung prompt vào output.

**Ngân sách token:**

- Chỉ dẫn luôn nạp: ≤ 1.5K tok.
- Mỗi skill: ≤ 2K tok.
- Thay đổi direct: ≤ 4K tok.
- Task Full: ≤ 15K tok.
- Có test tự động đo các ngân sách này.

### Migration dữ liệu `.harnix/`

- **Task cũ**: task v1/v2 được đọc ở chế độ chỉ đọc qua adapter. Không ghi lại task đã hoàn tất.
- **Task đang dang dở**: được nâng lên schema mới qua một lần save có xác nhận của người dùng.
- **Sidecar**: `verification-inputs.json` cũ được giữ nguyên. Task mới không tạo sidecar nữa.
- **Tích hợp global đã cài**: `harnix update --global` reconcile theo manifest hiện có. Fragment Harnix chưa bị sửa được thay thế; nội dung người dùng đã sửa được giữ lại và báo xung đột.
- **Tính năng bị bỏ**: `context.json` và journal learning được bỏ qua khi đọc, không xóa.

## Phản biện của người dùng và sửa đổi (2026-09-28, vòng 2)

### 1. Gộp 7 skill thành 5 — có phủ hết case không?

**Chưa đủ tường minh ở bản đầu.** Bảng dưới đây map từng trách nhiệm hiện có (7 skill) sang nơi tiếp nhận trong mô hình 5 skill, để không case nào bị mồ côi:

| Trách nhiệm hiện có (7 skill) | Nơi tiếp nhận (5 skill mới) |
| --- | --- |
| Planning, ready gate, ready-self-review | `harnix-plan` |
| Replan, `contractRevision` 1 bước (rút gọn) | `harnix-plan` — phụ lục nạp theo yêu cầu, chỉ khi checkpoint = replan |
| Migration v1→v2 | `harnix-plan` — phụ lục nạp theo yêu cầu, chỉ khi phát hiện task v1 chưa xong |
| Tạo epic/roadmap (`epicId`, `roadmapMembers`) | `harnix-plan` |
| Research một unknown khi đang plan/replan | `harnix-plan` — mục tham chiếu ngắn, không còn là skill riêng |
| TDD, implement theo slice | `harnix-implement` |
| Compliance + quality/security verification (profile check) | `harnix-verify` |
| Finish (`--finish`), Cancel (`--cancel`) | `harnix-verify` |
| Learning capture/surface | `harnix-verify` gọi tự động tại finish (member #11); không còn là bước thủ công trong skill |
| Standalone review (Bypass, không đổi task) | `harnix-review` |
| Research một unknown khi đang debug | `harnix-debug` — mục tham chiếu ngắn |
| Debug checkpoint, 3-giả-thuyết-thì-replan | `harnix-debug` |
| Continue: đọc `.active`, resume, blocked routing | **Không còn là skill.** `preflight.nextStage` trả thẳng owner đúng (`plan`/`implement`/`verify`/`debug`) — bỏ một tầng gián tiếp, không phải bỏ chức năng. Bảng route đầy đủ nằm trong `.harnix/workflow.md`. |
| Pause/resume (CLI) | Không cần skill riêng — là lệnh public, được nhắc ngắn trong `harnix-plan` |
| Commit-approval reminder | Xuất hiện ở cả `harnix-implement` và `harnix-verify` (trước khi commit sau khi verify xong) |

**Case còn thiếu ở bản đầu, cần AC tường minh:** không có gì đảm bảo mapping này thực sự đầy đủ chỉ vì viết ra một lần. Member `slim-instructions` (#6) bổ sung AC `ac-coverage-matrix`: bảng trên phải được kiểm bằng cách liệt kê toàn bộ trạng thái/checkpoint hợp lệ của TaskRecord (`planning|replan`, `ready`, `in_progress/implementing`, `verifying/verifying`, `verifying/finishing`, mọi `blocked/*`, `cancelled`, `completed`) và xác nhận mỗi trạng thái có đúng một skill chủ sở hữu, không trạng thái nào vô chủ.

### 2. Sao lại tinh gọn mà không phải mở rộng?

**Đây là hiểu nhầm cần sửa ngay trong cách trình bày, không phải trong nội dung** — 6/11 (nay 12) member task đã là mở rộng thật, không phải chỉ cắt:

| Task | Loại | Mở rộng cụ thể |
| --- | --- | --- |
| `add-verify-detection` | Mở rộng | Từ 1 hệ sinh thái (JS) lên ≥ 8 |
| `add-platform-registry` | Mở rộng | Từ 4 tool lên 4 (Tầng 2) + Tầng 1 mở, thêm tool mới chỉ cần data |
| `add-test-impact-map` | Thêm mới | Chưa từng có (test-impact hint) |
| `automate-learning` | Giữ + mở rộng | Tự động hoá, không bỏ |
| `rewrite-guides` | Vừa cắt vừa mở rộng | Cắt nội dung sáo rỗng, mở rộng phần lệnh thật + spec/project-facts (mục 5 dưới) |
| `restructure-code` (mới, mục 7 dưới) | Cấu trúc | Không cắt tính năng, chỉ sắp xếp lại |

Còn lại (`fix-baseline`, `remove-unused-machinery`, `simplify-task-contract`, `slim-instructions`, `release-v2`) là cắt/gọn, đúng như tên gọi — nhưng lý do cắt luôn có bằng chứng cụ thể (0 lần dùng, code chết xác nhận, churn 69k dòng), không phải cắt để cắt. Epic goal được viết lại để nêu rõ cả hai vế thay vì chỉ nói "gọn".

### 5. `.harnix/spec/` hiện chỉ có guides — có nên bổ sung?

**Fact xác nhận:** `docs/IMPLEMENTATION_PLAN.md:151` khóa cứng "Only selected content is materialized below `.harnix/spec/guides/`" — không có category nào khác trong `spec/` theo thiết kế hiện tại. Grep `src/core` và `src/commands` xác nhận không module nào khác ghi vào `.harnix/spec/`.

**Gap thật:** dữ liệu về stack đã phát hiện (framework, lệnh verify, workspace layout — sản phẩm của `add-verify-detection`, #5/#4 tuỳ đánh số) hiện chỉ tồn tại tạm thời lúc `init`/`update` chạy detection lại, không được đóng băng thành một tài liệu project-owned mà agent có thể đọc lại nhanh mà không cần chạy lại toàn bộ detection. Bổ sung: `.harnix/spec/project-facts.md` (derived, tự sinh lại mỗi khi `init`/`update` chạy, không phải user-owned) chứa stack đã xác nhận + lệnh verify đã chọn theo package — cùng vị trí khái niệm với guides (spec = "engineering guidance selected for this project"). AC được thêm vào `rewrite-guides` (#8).

### 6. Roadmap đã chuẩn chưa?

**Chưa — có 2 lỗi thật, xác nhận bằng đọc trực tiếp `.harnix/roadmaps/20260928-180123-harnix-overhaul.md` và `src/core/roadmaps/roadmap.ts:159-161`:**

1. **Thiếu dòng trống trước heading `## Members`.** Renderer nối chuỗi `` `# Epic: ${title}${goal}${memberLines}` `` trực tiếp, `goal` không kết thúc bằng dòng trống nếu `memberLines` bắt đầu ngay bằng `\n##`. Vi phạm markdownlint MD022 — đúng loại lỗi mà môi trường đã tự flag trên `docs/prompts/harnix-overhaul-audit.md` ở đầu phiên này.
2. **`nonGoals` của epic được validate trong schema nhưng không bao giờ được render vào markdown** (`renderRoadmapMarkdown` không đọc `epic.nonGoals`) — người xem `.md` không thấy non-goals dù đã khai báo.
3. **`.md` không có "next task"** trong khi JSON CLI (`src/commands/roadmap.ts:89`, `nextTask = members.find(...)`) có — hai bề mặt đọc (file để xem không cần lệnh, CLI để agent dùng) không nhất quán, trong khi nguyên tắc của Harnix là "review qua file, không qua lệnh".

Ba lỗi này được thêm vào AC của `fix-baseline` (#2), vì đúng bản chất là "mâu thuẫn tài liệu/derived-output với contract" mà task đó đã có phạm vi để sửa.

### 7. Code cần refactor cấu trúc, không chỉ cắt tính năng

**Bằng chứng cụ thể (đọc trực tiếp):**
- `src/commands/internal-workflow.ts`: 827 dòng, **24 hàm top-level** trộn chung save/transition/evidence/schema/snapshot/audit/finish/cancel/learn/contractRevision — một "god module" thật.
- `src/core/tasks/task.ts`: 498 dòng, có dòng dài **585 ký tự** (dòng 155).
- `src/utils/global-managed-files.ts`: 1.072 dòng, một file lo toàn bộ reconcile cho mọi nền tảng.
- Tên trùng, nghĩa khác: `canonicalJson` ở `src/core/tasks/workflow-helpers.ts:22` (trả object, dùng để so sánh) và ở `src/utils/global-managed-json.ts:70` (trả string, dùng để hash) — cùng tên, hai module khác nhau, dễ nhầm khi đọc import.

**Sửa:** tách `simplify-task-contract` (bản đầu đang gộp cả schema lẫn code layout) thành hai task độc lập, theo đúng nguyên tắc "mỗi task không trộn nhiều sản phẩm độc lập":
- `simplify-task-contract` (#4): chỉ còn phạm vi schema/evidence/sidecar/contractRevision.
- `restructure-code` (task mới #12): tách `internal-workflow.ts` thành module theo action (`workflow/save.ts`, `workflow/finish.ts`, `workflow/audit.ts`…), tách `task.ts` thành schema/validate/migration, tách `global-managed-files.ts` theo mối quan tâm (discovery, reconcile, manifest, rollback), đổi tên một trong hai `canonicalJson` cho hết trùng, không đổi hành vi quan sát được (refactor thuần, có test snapshot trước/sau để chứng minh không đổi output).

### 4. Bộ artifact của task (prd/plan/design/review/task.json/verification-inputs.json) — cần thiết chưa, theo chuẩn nào, đủ chưa

Kiểm tra trực tiếp task audit này (chính task đang thực hiện) làm ví dụ đối chiếu:

| Artifact | Bắt buộc khi nào | Theo chuẩn nào | Đối chiếu với task này |
| --- | --- | --- | --- |
| `task.json` | Luôn luôn | TaskRecord schema v2, đóng băng tại `docs/IMPLEMENTATION_PLAN.md` §4 | Có đủ field, 4 AC / 2 check / 4 decision, `--audit-ready` pass |
| `prd.md` | Full only | Ready-trace grammar v1: mỗi AC có heading `### AC \`id\`` + dòng `**Verifies:**` (định nghĩa tại `harnix-brainstorm/SKILL.md`) | Đã theo đúng grammar (4/4 AC có heading + Verifies) |
| `plan.md` | Full only | Mỗi slice có block `### Slice \`id\`` + `Criteria:`/`Checks:`/`Paths:` không rỗng | Đã theo đúng grammar (2 slice, đủ 3 trường mỗi slice) |
| `design.md` | Tuỳ chọn, chỉ khi "materially clarifies boundaries/data flow" | Light ADR: Context/Decision/Consequences/Alternatives (gợi ý trong `harnix-brainstorm/SKILL.md`) | Đúng shape (file này) |
| `review.md` | Luôn luôn, derived, không hand-edit | Contract tại `docs/HARNIX_WORKFLOW.md` ("goal, non-goals, acceptance criteria, required checks với evidence mới nhất, decisions, residual risks, blocker/cancellation") | Xác nhận đúng: 52 dòng, có đủ goal/non-goals/AC/checks/decisions/evidence, verdict tự tính "PENDING — 0/4" |
| `verification-inputs.json` | Chỉ xuất hiện sau khi có evidence v2 kèm digest | Sidecar schema v1, `input-freshness.ts` | **Chưa tồn tại cho task này** (đúng — task chưa có evidence nào), xác nhận nó được tạo lười biếng, không phải lúc nào cũng có |

**Kết luận:** cả 6 loại artifact đều cần thiết **theo chuẩn hiện hành** và task audit này đang tuân thủ đúng chuẩn đó — không có lỗi format ở chính task đang thực hiện. Nhưng bản thân sidecar `verification-inputs.json` là ứng viên bị đơn giản hóa ở `simplify-task-contract` (#4, xem decision #4 trong `decision-register.md`) vì chi phí ghi (69 nghìn dòng churn trong lịch sử dogfood) không tương xứng với lợi ích — tức là "chuẩn hiện tại" và "chuẩn sau đại tu" khác nhau có chủ đích, đã ghi rõ trong roadmap.

### 8. Vì sao peer có hàng trăm skill mà Harnix chỉ còn 5 — sửa lại sau khi kiểm tra trực tiếp ECC (vòng 2)

**Bản đầu của mục này sai** — gộp hai hệ thống độc lập của ECC làm một. Đã sửa sau khi đọc trực tiếp `https://api.github.com/repos/affaan-m/ECC/contents/` và đối chiếu `docs/UPSTREAM_BASELINE.md:77`, `docs/UPSTREAM_MAPPING.md` §7 (đã có sẵn trong repo từ trước đợt audit này).

**Fact — ECC có 4 thư mục top-level độc lập, không phải một hệ thống phân tầng:** `rules/`, `skills/`, `agents/`, `commands/` (cùng `contexts/`, `workflows/`, `plugins/`...). Đây không phải "tier 1 vs tier 2" của cùng một khái niệm — là 4 hệ thống riêng biệt.

**Fact — `rules/` là thứ Harnix đã dịch đúng từ lâu, không phải thứ đang thiếu:** `docs/UPSTREAM_BASELINE.md:77` ghi nhận Harnix đã soi `ECC/rules/{common, csharp, typescript, python, golang, java, react, vue}` (mỗi pack có `coding-style`, `hooks`, `patterns`, `security`, `testing`), và `docs/UPSTREAM_MAPPING.md` §7 map trực tiếp từng pack sang `src/guides/languages/**` / `src/guides/technologies/**`. **Guides của Harnix chính là ECC `rules/` đã dịch** — việc này đã xong, đúng, không phải gap.

**Fact — `ECC/skills/` là hệ thống khác, không liên quan `rules/`, đọc trực tiếp 292 tên thư mục con xác nhận 4 nhóm rất khác nhau:**

| Nhóm | Ví dụ tên thật (từ listing trực tiếp) | Có nên Harnix tự viết không |
| --- | --- | --- |
| Kỹ thuật ngôn ngữ/framework, chia mịn hơn guide | `django-celery`, `django-security`, `django-tdd`, `django-verification` (4 skill riêng cho 1 framework), `golang-patterns`, `golang-testing`, `nextjs-patterns`, `mongodb-patterns`, `mysql-patterns` | Trùng ý với guides hiện có, chỉ khác độ mịn |
| Meta/harness tự thân | `agent-eval`, `agent-self-evaluation`, `continuous-learning`, `continuous-learning-v2`, `context-budget`, `eval-harness`, `model-selection-strategy`, `multi-agent-orchestration`, `autonomous-loops` | **Không** — đây là ECC tự triển khai lại đúng thứ Harnix đã có qua workflow/skill nội bộ |
| Domain/vertical nghiệp vụ | `healthcare-phi-compliance`, `hipaa-compliance`, `customs-trade-compliance`, `energy-procurement`, `investor-materials`, `investor-outreach`, `finance-billing-ops`, `merchant-operations`, `medical-device-qa`, `logistics-planning` | **Không** — ngoài biên sản phẩm Harnix (coding harness, không phải vertical SaaS platform) |
| Tích hợp tool/vendor cụ thể | `docker-patterns`, `kubernetes-patterns`, `kafka-patterns`, `blender-motion-state-inspection`, `cisco-ios-patterns`, `google-workspace-ops`, `homelab-*` (5 skill) | Open-ended, không nên Harnix tự viết hết — đúng vai trò của extension point |
| Thực hành chung, gần với `common.md` của Harnix nhưng chia nhỏ | `api-design`, `architecture-decision-records`, `backend-patterns`, `error-handling`, `git-workflow`, `hexagonal-architecture`, `migration-planning`, `monorepo-patterns`, `mock-testing`, `logging-patterns` | Một phần trùng `common.md`; phần còn lại là ứng viên thật cho technique-skill hẹp |

**Kết luận đã sửa:** đề xuất trước ("chuyển guides thành SKILL.md") bị rút lại — nó gộp nhầm `rules/` (đã dịch đúng thành guides) với `skills/` (chưa có tương đương trong Harnix). Câu hỏi đúng không phải "Harnix nên có 292 skill hay 5", mà là: **có nên xây một hệ thống thứ ba, song song với guides, để phủ phần "technique hẹp, tái dùng, không phải per-language, không phải per-stage" không?**

**Trả lời có điều kiện — không copy số lượng của ECC:**
- Phần lớn 292 skill của ECC (meta/harness tự thân + domain nghiệp vụ) **không thuộc phạm vi Harnix** theo đúng non-goal đã ghi trong PRD (không marketplace, không mandatory subagent, không vertical SaaS). Cố khớp số lượng là sai mục tiêu.
- Phần còn lại có giá trị thật (technique hẹp, tái dùng, cross-project) nhưng **Harnix không cần tự viết hết** — đúng vai trò của một **extension point** giống cơ chế native discovery mà mọi coding tool 2026 đã có sẵn (`~/.agents/skills`, `~/.claude/skills`, xem `external-research.md` phần A).
- Đề xuất cụ thể, thay cho "chuyển guides thành skill":
  1. **Không đổi guides.** Giữ nguyên vai trò per-language/tech reference, tiêm theo activation rule — đây đã là bản dịch đúng của `rules/`.
  2. **Thêm một tầng skill kỹ thuật nhỏ, có bằng chứng, KHÔNG cố lớn:** chỉ ship 5–10 skill thật sự cross-language, có bằng chứng từ chính `external-research.md` (verification-gap lens, bugfix "must remain working", flaky-test diagnosis, migration-safety review, security-review lens) — không viết thêm chỉ để tăng số lượng.
  3. **Mở `.harnix/spec/skills/`** làm extension point: cho phép dự án/người dùng tự thêm skill kỹ thuật riêng (Docker, Kubernetes, domain nghiệp vụ riêng của họ...) — Harnix cung cấp cơ chế discover/cài đặt, không tự viết nội dung đó. Đây chính là câu trả lời thật cho "skill mở rộng" mà bạn hỏi — mở rộng bằng cơ chế, không phải bằng số lượng skill Harnix tự viết.
  4. Non-goal tường minh: **không cố khớp 292 skill của ECC**, vì phần lớn số đó nằm ngoài biên sản phẩm hoặc trùng máy móc nội bộ Harnix đã có.

### 9. Review trước implement và các sửa đã áp (2026-09-28)

**Quyết định của người dùng:** (1) chấp nhận phá frozen contract, với điều kiện dữ liệu `.harnix/` cũ vẫn đọc được; (2) không bump patch theo từng task, bump **2.0.0 một lần** ở `release-v2`; (3) ban đầu chọn không thêm tool mới, sau đó **đổi thành thêm OpenCode và Cursor** (chỉ hai tool này), qua task riêng sau `add-platform-registry` — xem §10.

**Root cause sự cố `pause` (completed nhưng HEAD đỏ):** check `check-full-verification` của task `20260928-144800-task-pause-command` chỉ chạy `pnpm typecheck && pnpm test:unit && pnpm test:integration`, bỏ sót `test:workflow`, nơi chứa hai test đỏ (`test/workflow/cli-contract.test.ts`, `test/workflow/self-host.test.ts`); `inputs` chỉ là `src/**/*.ts`. Cơ chế digest hoạt động đúng — định nghĩa check quá hẹp. Harnix hiện không tự chạy lệnh (không có `spawn`/`execFile` trong `src/core/workflow.ts`, `src/commands/internal-workflow.ts`). Vì vậy:
- **Bỏ** `ac-finish-gate` ("finish tự chạy lại check") khỏi `simplify-task-contract`: nó thêm process runner và chạy lệnh đọc từ `task.json` (rủi ro command injection) để giải quyết một vấn đề không có thật.
- **Thay bằng** `ac-suite-gate` trong `add-verify-detection`: ready yêu cầu ít nhất một check mức project lấy từ `verify-plan` với inputs phủ toàn bộ source và test; finish từ chối khi check đó không có pass với digest hiện hành. Có regression test tái hiện đúng kịch bản `pause`.

**Thứ tự thực thi** (ID đã lưu không phản ánh thứ tự; thứ tự dưới đây là nguồn chuẩn):

| Bước | Task | Lý do vị trí |
| --- | --- | --- |
| 1 | `fix-baseline` | HEAD phải xanh trước mọi thay đổi |
| 2 | `remove-unused-machinery` | Cắt code thừa trước khi tái cấu trúc |
| 3 | `simplify-task-contract` | Cắt phần lớn máy móc schema/evidence |
| 4 | `localize-timestamps` | Đổi cách sinh thời gian một lần, ngay sau khi schema đã gọn |
| 5 | `unify-epic-naming` | Đổi tên epic/roadmap trước khi các task sau dùng tới; gồm sửa renderer |
| 6 | `enforce-code-style` | Format và lint một lần, trước khi tái cấu trúc, để diff logic về sau sạch |
| 7 | `restructure-code` | Đưa code về đúng tầng khi schema, tên, thời gian đã chốt |
| 8 | `standardize-tests` | Chuẩn hóa test theo cấu trúc code mới |
| 9 | `add-verify-detection` | Cần contract mới; cung cấp suite gate |
| 10 | `automate-learning` | Hành vi finish/context ổn định trước khi viết lại skill |
| 11 | `slim-instructions` | Viết lại skill sau khi hành vi đã chốt |
| 12 | `add-platform-registry` | Cài skill đã đổi tên; migrate bản cài cũ |
| 13 | `add-opencode-cursor` | Chứng minh registry: thêm nền tảng chỉ bằng dữ liệu |
| 14 | `rewrite-guides` | Cần `project-facts` từ bước 9 |
| 15 | `add-technique-skills` | Dùng skill sink của bước 12–13 |
| 16 | `add-test-impact-map` | Skill verify đã có chỗ để tham chiếu |
| 17 | `release-v2` | Luôn cuối: bump 2.0.0, rà nhất quán docs |

**Gỡ chồng chéo phạm vi:**
- `fix-baseline` chỉ sửa C1–C3 (lệch thật với validator); C4–C8 chuyển sang `slim-instructions` vì skill sẽ bị viết lại.
- Execution-notes grammar chuyển từ `remove-unused-machinery` sang `simplify-task-contract` (cùng chỗ sửa grammar plan).
- `remove-unused-machinery` chỉ gỡ `src/core/context/selection-freshness.ts` và phần context manifest; giữ `effective-context.ts` (hook), vì `automate-learning` cần nó.
- Tách `global-managed-files.ts` giao cho `add-platform-registry`; `restructure-code` chỉ còn `internal-workflow.ts`, `task.ts` và tên `canonicalJson` trùng.
- Gỡ public command `checks`/`audit`/`context-report` có AC riêng cho breaking CLI (cập nhật `cli-contract.test`, CHANGELOG, hướng dẫn chuyển sang `status --explain`).

**Quy tắc áp cho mọi member task:**
- Mỗi task phá contract cập nhật PRD/WORKFLOW/IMPLEMENTATION_PLAN **trong cùng task** (AC `ac-docs-sync`), theo AGENTS.md; `release-v2` chỉ rà nhất quán lần cuối.
- `check-suite` hiện là bản nháp; mỗi task phải bổ sung check tập trung cho từng AC trong planning của chính nó trước khi ready.
- Không bump version trong member task; chỉ `release-v2` bump 2.0.0 và viết một entry CHANGELOG tổng hợp.
- `add-platform-registry` không tự thêm nền tảng; nó chuyển 4 nền tảng hiện có sang registry, còn OpenCode và Cursor được thêm ở task kế tiếp `add-opencode-cursor` bằng bản ghi registry; phải xác minh các điểm research còn chưa chắc của nền tảng hiện có (tên event hook Antigravity) trước khi đóng băng contract.

**Thứ tự và ID:** các member task đã được tạo lại với ID tăng dần đúng theo thứ tự thực thi (xem §12), nên `nextTask` của roadmap khớp với bảng trên.

### 10. Thêm OpenCode và Cursor (quyết định người dùng 2026-09-28)

Người dùng yêu cầu bổ sung đúng hai tool: OpenCode và Cursor. Không thêm tool nào khác. Làm trong task riêng `add-opencode-cursor`, ngay sau `add-platform-registry`, để vừa thêm nền tảng vừa chứng minh registry thêm được nền tảng chỉ bằng dữ liệu.

Dữ kiện từ `research/external-research.md` (cần xác minh lại bằng tài liệu chính thức lúc làm task):

| | OpenCode | Cursor |
| --- | --- | --- |
| Instruction global | `~/.config/opencode/AGENTS.md`; dự phòng `~/.claude/CLAUDE.md` khi không có file đó | Không có file; User Rules chỉ chỉnh qua UI |
| Skill global | `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills` | `~/.agents/skills`, `~/.cursor/skills`, `~/.claude/skills`, `~/.codex/skills` |
| Hook chèn context | Không có hook shell; chỉ plugin JS/TS (`session.created`, `tool.execute.*`) | `~/.cursor/hooks.json`: `sessionStart` có `additional_context` (chỉ IDE); `beforeSubmitPrompt` không chèn được |

**Thiết kế:**
- **OpenCode:** marker block trong `~/.config/opencode/AGENTS.md`, giữ nội dung ngoài block. Rủi ro: tạo mới file này làm OpenCode ngừng dùng dự phòng `~/.claude/CLAUDE.md` mà người dùng có thể đang dựa vào — task phải chọn và ghi rõ hành vi (không tạo file khi chỉ có dự phòng và đã có block Harnix trong `~/.claude/CLAUDE.md`, hoặc tạo và báo rõ). Không cài plugin JS mặc định; chạy ở chế độ không hook (`slim-instructions` `ac-hookless`).
- **Cursor:** không có instruction global nên dựa vào skill + chế độ không hook. Hook `sessionStart` trong `~/.cursor/hooks.json` chỉ là tăng cường tùy chọn, và chỉ bật khi đã xác minh schema; không dùng `beforeSubmitPrompt`. Không ghi User Rules bằng cơ chế không chính thức.
- **Chống trùng skill:** cả hai tool đọc nhiều thư mục skill cùng lúc (`~/.agents/skills`, `~/.claude/skills`…). Nếu Codex hoặc Claude Code đã cài skill Harnix vào đó, không ghi thêm bản sao; doctor cảnh báo khi một tool thấy hai bản cùng tên.
- **Phạm vi:** vẫn chỉ user-global như Phase 6; flag `--opencode`, `--cursor` cho setup/update/uninstall/doctor `--global`; cập nhật ranh giới "Supported platforms" trong PRD và `AGENTS.md` trong cùng task.

### 11. Chuyển mọi thời gian sang giờ Việt Nam (task `localize-timestamps`)

**Fact:** `isIsoTimestamp` (`src/core/tasks/task.ts:479`) đã chấp nhận offset (`Z|[+-]HH:MM`), nhưng 13 chỗ trong `src` sinh thời gian bằng `new Date().toISOString()` nên luôn ra UTC (`Z`). ID task thì do agent tự đặt theo giờ máy, nên từng lệch (task `20260924-074009-review-md-verdict-and-dedupe` bị huỷ và tạo lại vì ID dùng UTC thay vì UTC+7).

**Thiết kế:**
- Thêm `timezone` (tên IANA) vào `.harnix/config.yaml`; mặc định lấy từ hệ thống lúc `init`, repo này đặt `Asia/Ho_Chi_Minh`.
- Một hàm thời gian duy nhất (clock inject được) thay cho 13 chỗ `toISOString()`: ghi ISO 8601 kèm offset của múi giờ đã cấu hình, ví dụ `2026-09-28T20:30:01.000+07:00`.
- Tiền tố ID `YYYYMMDD-HHMMSS` của task/epic, ngày phân vùng journal, và mọi chỗ hiển thị (`review.md`, trang epic, `status`) dùng cùng múi giờ.
- So sánh thời gian vẫn theo thời điểm tuyệt đối (`Date.parse`), nên dữ liệu cũ dạng `Z` vẫn đọc và sắp xếp đúng.
- **Không ghi lại** 69 task lịch sử: sửa file đã completed làm stale evidence/digest. Dữ liệu cũ chỉ được *hiển thị* theo giờ Việt Nam.
- Test dùng clock và múi giờ cố định, không phụ thuộc máy chạy.

Dữ liệu của chính epic này (epic record và các member task) được ghi lại ngay bằng offset `+07:00`. Các lần ghi tiếp theo qua CLI hiện tại vẫn ra `Z` cho tới khi task này xong.

### 12. Tên gọi thống nhất

**Vấn đề:** cùng một khái niệm đang có hai tên — dữ liệu dùng `epic` (`epicId`, `EpicRecord`, field `epic`) nhưng thư mục là `.harnix/roadmaps/`, lệnh là `harnix roadmap`, field envelope là `roadmapMembers`. Một file trong `roadmaps/` thực chất là **một** epic, không phải một roadmap.

**Đề xuất (task `unify-epic-naming`), dùng "epic" ở mọi nơi**, theo nghĩa phổ biến của Jira/Agile: epic là một sáng kiến lớn gồm nhiều task.

| Hiện tại | Đề xuất |
| --- | --- |
| `.harnix/roadmaps/<id>.json`, `.md` | `.harnix/epics/<id>.json`, `.md` |
| `harnix roadmap [--limit] [--id <id>]` | `harnix epic [--limit]` (danh sách) và `harnix epic <epic-id>` (chi tiết, positional như `harnix resume <task-id>`) |
| envelope `roadmapMembers` | `epicMembers` |
| `src/core/roadmaps/roadmap.ts`, `src/commands/roadmap.ts` | `src/core/epics/epic.ts`, `src/commands/epic.ts` |
| `epicId`, `EpicRecord`, `epic` | Giữ nguyên |

Dữ liệu cũ trong `.harnix/roadmaps/` được `harnix update`/`doctor --fix` chuyển sang `.harnix/epics/`; trong lúc chưa chuyển vẫn đọc được. Bỏ hẳn tên `roadmap` trong 2.0.0 (đã có breaking change), ghi rõ trong CHANGELOG.

**Quy ước tên task:** `<động-từ>-<đối-tượng>` kebab-case, tiếng Anh, 2–4 từ (`fix-baseline`, `simplify-task-contract`, `add-verify-detection`, `release-v2`…). ID là `YYYYMMDD-HHMMSS-<slug>` theo giờ Việt Nam, tăng dần đúng theo thứ tự thực thi. Title có tiền tố `[NN]` khớp thứ tự.

| Bước | Tên cũ | Tên mới |
| --- | --- | --- |
| 1 | baseline-green-fix | fix-baseline |
| 2 | remove-unused-machinery | remove-unused-machinery |
| 3 | task-contract-slim | simplify-task-contract |
| 4 | — (mới) | localize-timestamps |
| 5 | — (mới) | unify-epic-naming |
| 6 | — (mới) | enforce-code-style |
| 7 | internal-code-layout | restructure-code (mở rộng phạm vi) |
| 8 | — (mới) | standardize-tests |
| 9 | verify-command-detection | add-verify-detection |
| 10 | learning-auto-trigger | automate-learning |
| 11 | instruction-diet | slim-instructions |
| 12 | platform-registry | add-platform-registry |
| 13 | opencode-cursor-support | add-opencode-cursor |
| 14 | guides-rewrite | rewrite-guides |
| 15 | technique-skill-extension | add-technique-skills |
| 16 | test-impact-map | add-test-impact-map |
| 17 | release-gate-slim | release-v2 |

Harnix chưa có transport để đổi tên hay xoá task nháp, nên 13 thư mục nháp cũ (chưa có evidence, chưa được git track) được xoá trực tiếp sau khi bản mới đã lưu thành công.

### 13. Chuẩn hóa toàn bộ code và test (yêu cầu người dùng)

**Hiện trạng đo được:**

| Hạng mục | Số liệu |
| --- | --- |
| Formatter | Không có (không Prettier/Biome) |
| ESLint | Chỉ `recommended` + `consistent-type-imports`; không type-checked, không giới hạn kích thước/độ phức tạp |
| File `src` > 300 dòng | 11 file: `global-managed-files.ts` 1.072, `internal-workflow.ts` 827, `global-doctor.ts` 545, `task.ts` 498, `doctor.ts` 462, `cli-program.ts` 450, `file-lock.ts` 448, `input-freshness.ts` 359, `global-uninstall.ts` 342, `workflow.ts` 336, `setup.ts` 333 |
| Dòng > 160 ký tự | `task.ts` 47, `templates/harnix/workflow.ts` 38, `catalog.ts` 31, `doctor.ts` 30, `cli-program.ts` 22… |
| Sai tầng | Logic workflow nằm trong `src/commands/internal-workflow.ts`; 11 file trong `src/commands` import `node:fs` trực tiếp; `src/utils` chứa logic nghiệp vụ (`global-managed-files.ts`, `detection.ts`) |
| Test | 82 file / 7 suite; lớn nhất `test/workflow/internal-workflow.test.ts` 1.148 dòng; 5 file > 400 dòng; 6 module không có test trực tiếp; chưa đo coverage |

**Chia thành ba task** để diff định dạng không lẫn diff logic, và mỗi task đủ nhỏ để review:

1. `enforce-code-style` (bước 6): Prettier (printWidth 120) + `eslint-config-prettier`, format một lần toàn repo; ESLint `recommendedTypeChecked`, `max-lines` 300, `complexity`, `no-floating-promises`; script `format`/`format:check`. Các file quá dài mà task sau mới tách được đưa vào **danh sách miễn trừ tạm thời**, mỗi mục ghi task chịu trách nhiệm gỡ.
2. `restructure-code` (bước 7): đưa code về hướng phụ thuộc `commands -> core -> utils` như AGENTS.md; logic workflow chuyển vào `src/core/workflow/` tách theo action; command chỉ còn adapter mỏng; `detection` chuyển sang `src/core/stack/`; tách `task.ts`; đổi tên `canonicalJson` trùng; có test kiến trúc kiểm tra hướng import. Refactor thuần, có test snapshot trước/sau.
3. `standardize-tests` (bước 8): cây test phản chiếu `src`, tên `<module>.test.ts`, mục đích từng suite rõ ràng, gỡ suite `migration`, không file test nào > 400 dòng, builder dùng chung (TaskRecord, EpicRecord, repo/home tạm, clock và múi giờ cố định), bổ sung test cho module chưa có, bật coverage `@vitest/coverage-v8` với ngưỡng bằng mức đo hiện tại.

**Danh sách miễn trừ được gỡ dần:** `global-managed-files.ts`, `doctor.ts`, `global-doctor.ts` gỡ ở `add-platform-registry`; `src/templates/**` gỡ ở `slim-instructions`; `release-v2` kiểm danh sách miễn trừ đã trống và mọi file `src` ≤ 300 dòng.

Hai devDependency mới (`prettier`, `@vitest/coverage-v8`, cùng `eslint-config-prettier`) chỉ dùng lúc phát triển, không vào package phát hành, không vi phạm ranh giới "một package, một bin".

## Consequences

**Lợi ích:**

- Giảm mạnh token, LOC và churn.
- Thêm tool mới chủ yếu chỉ cần thêm dữ liệu.
- Hỗ trợ verify thật cho khoảng 8 hệ sinh thái trở lên.

**Chi phí và rủi ro:**

- Phá vỡ nhiều frozen contract, cần cập nhật PRD, WORKFLOW và IMPLEMENTATION_PLAN.
- Mất một số bảo đảm chặt, ví dụ hash từng input file khi finish. Bảo đảm này được thay bằng việc chạy lại suite ngay lúc finish (N8).
- Người đang dùng hidden transport phải theo contract mới.

## Alternatives considered

1. **Giữ nguyên, chỉ dedupe prose.** Rẻ, nhưng không giải quyết churn sidecar, độ phủ đa ngôn ngữ hay đa tool.
2. **Viết lại từ đầu.** Rủi ro mất các cơ chế an toàn đã kiểm chứng (atomic write, lock, reconcile global).
3. **Bỏ hẳn state machine**, chỉ giữ skill kiểu Agent OS v3. Mất gate evidence, trong khi đây là phần có bằng chứng cao nhất.

Phương án được chọn là **đại tu có lựa chọn**: giữ an toàn và gate, cắt bộ máy, mở rộng verify và nền tảng.
