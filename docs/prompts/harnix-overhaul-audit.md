# Prompt — Đại tu toàn diện Harnix: đánh giá hiệu quả từng tính năng, skill, workflow, rule và quyết định Giữ / Sửa / Gộp / Bỏ / Thêm

> **Tài liệu lịch sử:** prompt này được viết trước bản 2.1.0. Số liệu (số platform, số điều luật, số lệnh) và đường dẫn trong đó phản ánh thời điểm viết; hiện Harnix hỗ trợ 6 platform (Kiro, Antigravity, Codex, Claude Code, OpenCode, Cursor). Xem `AGENTS.md` và `docs/HARNIX_PRD.md` để biết trạng thái hiện hành.


Bạn đang làm việc tại repository Harnix (thư mục gốc của repo này). Đây là một đợt **đại tu dựa trên bằng chứng**: kiểm kê mọi thứ Harnix đang có, đo xem từng thứ có thực sự giúp software engineer code **nhanh hơn, bài bản hơn, chính xác hơn, chuẩn hơn** hay không, đối chiếu với thực tế bên ngoài, rồi đưa ra quyết định rõ ràng cho từng hạng mục.

Mục tiêu sản phẩm cuối cùng: **một harness gọn, dùng được trên nhiều coding tool, hỗ trợ nhiều repo và nhiều ngôn ngữ/stack**, mà chi phí nghi thức (ceremony) luôn thấp hơn giá trị nó mang lại.

---

## 0. Nguyên tắc của đợt đại tu

1. **Không có gì là bất khả xâm phạm.** PRD, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `AGENTS.md`, `.harnix/workflow.md`, các rule/skill/guide, kể cả "frozen contracts" đều là **đối tượng được đánh giá**, không phải tiêu chí đánh giá. Được phép đề xuất nới, gộp, hoặc bỏ rule nếu bằng chứng cho thấy nó tốn chi phí mà không ngăn được lỗi thực tế.
2. **Nhưng thay đổi phải có lý do và có đường migration.** Mỗi đề xuất phá vỡ contract (schema, field, enum, path, exit code, hook protocol) phải nêu: bằng chứng, người dùng bị ảnh hưởng, cách migrate dữ liệu `.harnix/` cũ, và cách kiểm thử.
3. **Bằng chứng trước ý kiến.** Mỗi kết luận phải trích dẫn nguồn: file:line trong repo, task ID trong `.harnix/tasks/`, commit, entry `CHANGELOG.md`, journal, hoặc URL nguồn ngoài (kèm ngày truy cập). Không có bằng chứng → ghi rõ là giả thuyết.
4. **Review trước, refactor sau.** Pha 1–4 là **read-only**. Chỉ được sửa file sản phẩm sau khi người dùng duyệt Decision Register (pha 5). Không commit, không push, không tạo PR, không publish.
5. **Không đụng user-global thật.** Mọi thử nghiệm setup/hook dùng home giả, repo tạm. Không chạy install/network thật trong test.
6. **Ngôn ngữ:** báo cáo và artifact hướng người dùng viết tiếng Việt; giữ nguyên identifier, command, path, tên field.

---

## 1. Pha 1 — Kiểm kê toàn bộ bề mặt (Inventory)

Lập bảng kiểm kê đầy đủ, mỗi dòng một hạng mục, gồm: tên, vị trí (path), mục đích tuyên bố, người dùng/agent nào gọi, kích thước (LOC hoặc số token nếu là nội dung nạp vào context), test bao phủ.

Phạm vi bắt buộc:

- **CLI commands**: toàn bộ `src/commands/*` (public và hidden: `init`, `setup`, `status`, `tasks`, `roadmap`, `pause`, `resume`, `doctor`, `update`, `upgrade`, `uninstall`, `audit`, `checks`, `mem`, `skills`, `repo-map`, `context`, `workflow --preflight/--save/--transition/--evidence/--audit-ready`, `version:sync`…).
- **Core**: `src/core/*` (tasks, verification/inputDigest, context selection & freshness, repo-map, journal, roadmaps/epic, research, status, workflow state machine).
- **Configurators**: Kiro, Antigravity, Codex, Claude Code (`src/configurators/*`) — file nào được ghi, hook nào được cài, marker block, sidecar manifest.
- **Skills**: 7 skill trong `src/skills/harnix-*` — đo độ dài, số bước, số điều kiện rẽ nhánh, mức trùng lặp giữa các skill và với `AGENTS.md`/`workflow.md`.
- **Rules & templates**: `src/rules/`, `src/templates/`, nội dung marker block đưa vào `CLAUDE.md`/`AGENTS.md`/steering.
- **Guides**: `src/guides/` (common, 12 languages, technologies: database/framework/library/runtime) và cơ chế chọn guide vào `.harnix/spec/guides/`.
- **Thư mục `.harnix/` của chính repo này**: `config.yaml`, `workflow.md`, `spec/guides/`, `tasks/` (~69 task), `roadmaps/`, `workspace/*/journal`, `cache/repo-map-v1.json`, `verification-inputs.json`, `review.md`.
- **Tài liệu**: toàn bộ `docs/` (PRD, WORKFLOW, IMPLEMENTATION_PLAN, HARNESS_RESEARCH, UPSTREAM_*, GLOBAL_SETUP_REFACTOR_PLAN, REVIEW_REFACTOR_PLAN, provenance JSON, `docs/prompts/*`), `README.md`, `AGENTS.md`, `CHANGELOG.md`.
- **Package scripts & gates**: toàn bộ script trong `package.json` và acceptance sequence ở `docs/IMPLEMENTATION_PLAN.md` section 11 — thời gian chạy, tần suất phát hiện lỗi thật.

Đầu ra pha 1: `inventory.md` (bảng) + sơ đồ phụ thuộc giữa các hạng mục.

---

## 2. Pha 2 — Khai thác lịch sử sử dụng Harnix (dogfooding evidence)

Repo này đã tự dùng Harnix để phát triển chính nó. Hãy coi đó là dữ liệu thực nghiệm:

1. **Duyệt toàn bộ `.harnix/tasks/*`** (task.json, prd.md, plan.md, review.md, verification-inputs.json) và journal trong `.harnix/workspace/*/journal`. Với mỗi task ghi lại:
   - loại công việc (feature / fix / docs / research / refactor / release), Lite hay Full;
   - số lần transition, số lần `replan`, số `contractRevision`, số check fail/rerun, có kích hoạt breaker không;
   - tỉ lệ artifact "nghi thức" (số dòng prd/plan/review) so với diff code thực tế;
   - task có bị bỏ dở, cancel, hay phải tạo task nối tiếp để sửa hậu quả không.
2. **Đối chiếu `git log` và `CHANGELOG.md`**: bao nhiêu commit/version là để sửa chính cơ chế workflow của Harnix (preflight, digest, freshness, routing, guard order, bypass…) so với tính năng mang lại giá trị cho người dùng cuối? Đây là chỉ báo quan trọng về **chi phí tự thân (self-overhead)**.
3. **Tìm mẫu lặp**: loại lỗi nào tái diễn (ví dụ: agent route sai, guard order, drift giữa skill và AGENTS.md, v1/v2 migration, evidence stale)? Rule nào được thêm để vá một sự cố đơn lẻ rồi không bao giờ được kích hoạt lại?
4. **Đo trải nghiệm agent**: tổng lượng chỉ dẫn mà một agent phải nạp trước khi làm một thay đổi nhỏ (CLAUDE.md global + AGENTS.md + workflow.md + 1 skill + guide) — tính theo token. So với một task Lite điển hình thì tỉ lệ đó có hợp lý không?

Đầu ra pha 2: `usage-evidence.md` với số liệu định lượng, bảng các mẫu lỗi lặp, và danh sách rule/feature "chưa từng được dùng" hoặc "chỉ tồn tại để vá chính Harnix".

---

## 3. Pha 3 — Research thực tế bên ngoài

Nghiên cứu hiện trạng (ghi rõ ngày truy cập, ưu tiên tài liệu chính thức và repo gốc):

1. **Coding tool mục tiêu và ứng viên mở rộng**: Claude Code, Codex CLI, Kiro, Antigravity (hiện có); đánh giá thêm Cursor, GitHub Copilot (agent mode / coding agent), Windsurf, Cline/Roo, Gemini CLI, OpenCode, Aider, Zed… Với mỗi tool: cơ chế instruction (`AGENTS.md` chuẩn chung, `CLAUDE.md`, rules dir), skills/commands, hooks, subagent, MCP, mức độ ổn định của API cấu hình. Kết luận: **mở rộng platform bằng configurator riêng, hay bằng một lớp chuẩn chung (`AGENTS.md` + `harnix skill <name>` + CLI JSON) mà mọi tool đều đọc được?**
2. **Harness/orchestrator cùng loại**: Spec Kit, BMAD, Trellis, ECC, Claude Task Master, Kiro specs, các "skills" ecosystem… — cái gì họ làm tốt mà Harnix thiếu, cái gì họ đã bỏ (và vì sao), mức ceremony so với Harnix.
3. **Bằng chứng về hiệu quả**: các nghiên cứu/bài viết/benchmark về việc spec-driven, TDD-by-agent, context engineering, repo map, verification gate, subagent review… thực sự cải thiện độ chính xác hay chỉ tăng chi phí token/thời gian. Phân biệt rõ bằng chứng đo lường với ý kiến.
4. **Đa ngôn ngữ, đa repo**: cách các tool phát hiện stack, chạy lệnh test/lint/typecheck của từng hệ sinh thái (npm/pnpm/yarn, pip/uv/poetry, cargo, go, gradle/maven, dotnet, composer, swift/xcode, flutter…), monorepo/polyglot, repo không có test.

Đầu ra pha 3: `external-research.md` với bảng so sánh và danh sách "ý tưởng đáng áp dụng" kèm mức bằng chứng (cao / trung bình / thấp).

---

## 4. Pha 4 — Chấm điểm từng hạng mục

Với **mỗi** hạng mục trong inventory, chấm theo thang 0–3 cho từng tiêu chí và ghi bằng chứng:

| Tiêu chí | Câu hỏi |
| --- | --- |
| Tốc độ | Có giúp engineer/agent hoàn thành việc nhanh hơn không? |
| Bài bản | Có tạo ra quy trình/artefact mà con người thực sự đọc và dùng không? |
| Chính xác | Có ngăn được lỗi thật (có ví dụ trong lịch sử) không? |
| Chuẩn | Có đẩy code về chuẩn của ngôn ngữ/dự án không? |
| Đa tool | Có hoạt động trên nhiều coding tool, hay chỉ một? |
| Đa ngôn ngữ/repo | Có hoạt động ngoài TypeScript/Node và ngoài repo này không? |
| Chi phí | Token nạp context, số bước, độ phức tạp code/test để duy trì (điểm cao = chi phí thấp) |
| Rủi ro gỡ bỏ | Gỡ đi thì mất gì, ảnh hưởng dữ liệu/người dùng nào |

Rồi đưa ra **một quyết định** cho mỗi hạng mục: **GIỮ**, **ĐƠN GIẢN HÓA**, **GỘP** (với hạng mục nào), **BỎ**, hoặc **THÊM MỚI**. Mỗi quyết định kèm 1–3 câu lý do và bằng chứng.

Những câu hỏi bắt buộc phải trả lời thẳng:

- Phân loại Bypass / Lite / Full và guard chọn target hiện nay có quá phức tạp để agent tuân thủ ổn định không? Có thể rút gọn thành vài quy tắc dễ nhớ không?
- TaskRecord v2 + `criterionIds` + `inputDigest` + `@task-contract` + `contractRevision` + audit-ready: phần nào thực sự bắt được lỗi, phần nào chỉ là bộ máy tự bảo vệ? Có phương án nhẹ hơn cho Lite không?
- 7 skill có trùng lặp với `AGENTS.md`/`workflow.md` không? Có nên còn ít skill hơn, hoặc chia khác đi (theo việc engineer làm thay vì theo trạng thái máy)?
- Repo-map, context selection/freshness, memory/journal, roadmap/epic: có được agent dùng thật không, có đáng chi phí không?
- Guides theo ngôn ngữ/công nghệ: chất lượng, độ cập nhật, có được chọn đúng stack không, có nên thay bằng việc phát hiện và gọi đúng lệnh lint/test/format của dự án không?
- Bộ gate phát hành (17 script, acceptance sequence) có tương xứng với quy mô sản phẩm không?
- Mở rộng sang coding tool mới: tốn bao nhiêu công cho mỗi configurator, và có lớp tích hợp chung nào giảm được chi phí đó không?
- Có tính năng nào **còn thiếu** mà engineer thực sự cần? Gợi ý cần xem xét (chỉ thêm nếu có bằng chứng): phát hiện lệnh verify theo stack, onboarding repo lạ nhanh, chế độ "quick fix" không nghi thức, review diff trước commit, tóm tắt handoff giữa các tool/phiên, đo lường hiệu quả cục bộ (không telemetry).

Đầu ra pha 4: `scorecard.md` (bảng điểm) và **`decision-register.md`** — bảng tổng hợp mọi quyết định, sắp theo tác động/chi phí.

---

## 5. Pha 5 — Kiến trúc mục tiêu và roadmap (dừng để duyệt)

1. Mô tả **Harnix mục tiêu** trong ≤ 1 trang: lõi tối thiểu, các lớp tùy chọn, mô hình tích hợp đa tool, cách hỗ trợ đa ngôn ngữ, bộ rule rút gọn (liệt kê từng rule giữ lại và lý do).
2. Đề xuất bản **`AGENTS.md` / `workflow.md` / marker block mới** dạng bản nháp, so sánh độ dài (token) trước/sau.
3. Kế hoạch migration cho dữ liệu `.harnix/` hiện có (task v1/v2, roadmap, sidecar manifest, global integrations đã cài) — không làm mất dữ liệu người dùng.
4. Chia công việc thành một **Epic Roadmap** với các task nhỏ, thứ tự rõ, mỗi task có acceptance criteria đo được và cách verify; ưu tiên việc "bỏ/đơn giản hóa" có tác động cao trước việc "thêm mới".
5. Liệt kê rủi ro, những gì cố ý không làm (non-goals), và các câu hỏi cần người dùng quyết định.

**DỪNG tại đây.** Trình bày tóm tắt Decision Register và các câu hỏi mở cho người dùng. Chỉ bắt đầu refactor khi người dùng duyệt rõ ràng phạm vi (toàn bộ hoặc một phần).

---

## 6. Pha 6 — Thực thi (chỉ sau khi được duyệt)

- Thực hiện theo từng task trong epic, test-first cho thay đổi hành vi, giữ repo xanh sau mỗi task.
- Khi gỡ một tính năng: gỡ cả code, test, docs, template, skill tham chiếu, và thêm migration/cleanup tương ứng; cập nhật `CHANGELOG.md` và version theo quy ước hiện hành.
- Cập nhật PRD/WORKFLOW/IMPLEMENTATION_PLAN cho khớp với quyết định mới trong cùng thay đổi — tài liệu phải phản ánh sản phẩm thật, không phải lịch sử.
- Chạy đầy đủ gate phù hợp phạm vi, đọc từng exit code, báo cáo bằng chứng thật, check bị bỏ qua, và rủi ro còn lại.
- Không commit/push/PR; trước mọi commit phải trình bày diff và commit message để người dùng duyệt.

---

## 7. Định dạng báo cáo cuối mỗi pha

- **Kết luận chính** (≤ 5 gạch đầu dòng).
- **Số liệu** (bảng).
- **Bằng chứng** (path:line, task ID, commit, URL + ngày).
- **Giả thuyết chưa kiểm chứng** (tách riêng).
- **Việc tiếp theo / câu hỏi cho người dùng.**

Tiêu chí thành công của cả đợt đại tu: sau khi hoàn tất, một engineer mới cài Harnix vào một repo bất kỳ (Python, Go, Java, TS…) trên một coding tool bất kỳ trong danh sách hỗ trợ, có thể làm một thay đổi nhỏ với chi phí nghi thức gần bằng 0 và một thay đổi lớn với quy trình rõ ràng, có verify thật — và lượng chỉ dẫn agent phải nạp giảm rõ rệt so với hiện tại.
