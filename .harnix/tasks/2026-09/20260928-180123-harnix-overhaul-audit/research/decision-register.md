# Pha 4 — Scorecard và Decision Register

## Cách chấm điểm

Mỗi hạng mục được chấm 0–3 theo tám tiêu chí, lần lượt là các cột trong bảng:

| Cột | Tiêu chí | Ghi chú |
| --- | --- | --- |
| Tốc | Tốc độ | |
| Bài | Bài bản | |
| C.xác | Chính xác | |
| Chuẩn | Chuẩn | |
| Đa tool | Chạy được trên nhiều coding tool | |
| Đa NN | Chạy được với nhiều ngôn ngữ | |
| Chi phí | Chi phí | Điểm cao nghĩa là chi phí thấp |
| RR gỡ | Rủi ro khi gỡ | Điểm cao nghĩa là gỡ an toàn |

Tổng điểm tối đa là 24. Bằng chứng tham chiếu tới ba file:

- `inventory.md`, viết tắt **I**
- `usage-evidence.md`, viết tắt **U**
- `external-research.md`, viết tắt **E**

## Scorecard

| # | Hạng mục | Tốc | Bài | C.xác | Chuẩn | Đa tool | Đa NN | Chi phí | RR gỡ | Σ | Quyết định |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | Một package + CLI JSON + `harnix skill` | 2 | 2 | 1 | 2 | 3 | 3 | 3 | 0 | 16 | **GIỮ** |
| 2 | `.harnix/` local, không telemetry | 2 | 3 | 1 | 2 | 3 | 3 | 3 | 0 | 17 | **GIỮ** |
| 3 | Gate evidence dựa trên exit code thật | 1 | 3 | 3 | 3 | 3 | 3 | 1 | 0 | 17 | **GIỮ + SIẾT** (E-D2/3) |
| 4 | `inputDigest` + sidecar `verification-inputs.json` | 0 | 2 | 2 | 2 | 3 | 3 | 0 | 1 | 13 | **ĐƠN GIẢN HÓA** (69k dòng churn, U) |
| 5 | TaskRecord v1+v2, migration v1→v2 | 0 | 2 | 1 | 2 | 3 | 3 | 0 | 2 | 13 | **ĐƠN GIẢN HÓA**: v1 chỉ đọc, bỏ đường migrate |
| 6 | `contractRevision` 5 bước | 0 | 2 | 1 | 1 | 3 | 3 | 0 | 2 | 12 | **ĐƠN GIẢN HÓA**: một lần save replan có reason (8/10 lần dùng vì chuyện vặt, U) |
| 7 | Ready-trace grammar v1 + `--audit-ready` markdown | 0 | 2 | 1 | 2 | 3 | 3 | 0 | 2 | 13 | **ĐƠN GIẢN HÓA**: chỉ giữ mapping criterion→check trong `task.json` (bản thân task audit này đang tuân thủ đúng grammar hiện hành, xem `design.md` §4) |
| 8 | Execution-notes grammar | 0 | 1 | 0 | 1 | 3 | 3 | 1 | 3 | 12 | **BỎ** |
| 9 | Context selection / `context.json` / selection-freshness | 0 | 1 | 0 | 1 | 3 | 3 | 1 | 3 | 12 | **BỎ** (0/69 dùng) |
| 10 | Learning / `--learn` / promotion | 1 | 2 | 1 | 1 | 3 | 3 | 1 | 3 | 16 | **GIỮ + THIẾT KẾ LẠI** (đã đổi quyết định, xem §10a; lý do "0 entry" là lỗi trigger, không phải lỗi ý tưởng) |
| 11 | Retry breaker fingerprint | 1 | 2 | 1 | 1 | 3 | 3 | 1 | 2 | 14 | **ĐƠN GIẢN HÓA**: rule prose "1 vòng remediation rồi dừng", không cần máy fingerprint |
| 12 | Phân loại Bypass/Lite/Full + các carve-out lồng nhau | 1 | 2 | 1 | 1 | 3 | 3 | 0 | 1 | 12 | **ĐƠN GIẢN HÓA** thành 2 đường: *direct* (không task) và *tracked* (task); Full chỉ thêm `prd`/`plan` |
| 13 | Target guard (9 điều kiện, lặp ~10 lần) | 0 | 2 | 2 | 2 | 3 | 3 | 0 | 1 | 13 | **ĐƠN GIẢN HÓA**: 3 dòng, đặt ở một nơi luôn được nạp; phần bắt buộc chuyển vào CLI |
| 14 | 7 skill | 1 | 2 | 2 | 2 | 3 | 3 | 1 | 1 | 15 | **GỘP** thành 5 skill (xem bên dưới bảng) |
| 15 | `AGENTS.md` root (~4,9K tok) + `workflow.md` (~6,8K tok) | 0 | 2 | 1 | 2 | 2 | 3 | 0 | 1 | 11 | **ĐƠN GIẢN HÓA**: ngân sách cứng, có test đo token |
| 16 | `review.md` derived | 2 | 3 | 1 | 2 | 3 | 3 | 2 | 1 | 17 | **GIỮ** (26/26 task dùng) |
| 17 | Epic roadmap | 1 | 2 | 0 | 1 | 3 | 3 | 1 | 2 | 13 | **GIỮ tính năng, BỎ rule bắt buộc** (≥2 task phải có epic; khai báo toàn bộ member ngay từ đầu) |
| 18 | `status` / `tasks` / `pause` / `resume` | 2 | 2 | 1 | 1 | 3 | 3 | 2 | 1 | 15 | **GIỮ** |
| 19 | `checks` / `audit` / `context-report` public | 0 | 1 | 1 | 1 | 3 | 3 | 1 | 3 | 13 | **GỘP** vào `status --explain` |
| 20 | Repo-map `--query` / `--impact` | 1 | 1 | 1 | 1 | 3 | 1 | 2 | 2 | 12 | **ĐƠN GIẢN HÓA + ĐỔI HƯỚNG** sang test-impact (0 lần dùng, U; TDAD, E) |
| 21 | Guides 34 file dạng bách khoa | 0 | 1 | 0 | 1 | 3 | 2 | 1 | 2 | 10 | **VIẾT LẠI** theo dạng "lệnh + ràng buộc", ≤ 600 tok mỗi file, sửa nội dung lỗi thời — **KHÔNG chuyển thành skill** (đã rút lại quyết định vòng 2, xem #33 và `design.md` §8: guides = ECC `rules/` đã dịch đúng từ lâu theo `docs/UPSTREAM_MAPPING.md` §7, không phải thứ tương đương `ECC/skills/`); **THÊM** `.harnix/spec/project-facts.md` (stack + lệnh verify đã chọn, derived) vì `spec/` hiện chỉ có guides (xác nhận `IMPLEMENTATION_PLAN.md:151`) |
| 33 | Số lượng skill so với peer (ECC 292, Superpowers hàng chục) | 1 | 1 | 0 | 1 | 2 | 2 | 1 | 2 | 10 | **KHÔNG cố khớp số lượng** — đọc trực tiếp repo ECC xác nhận `rules/` (≈ guides, đã dịch đúng) và `skills/` (292 mục) là hai hệ thống độc lập, không phải "cùng khái niệm khác tầng"; phần lớn 292 đó là meta-harness tự thân (trùng máy móc nội bộ Harnix) hoặc domain nghiệp vụ (ngoài biên PRD). **THÊM** một task nhỏ, bị giới hạn: 5–10 technique-skill có bằng chứng + extension point `.harnix/spec/skills/` để dự án tự thêm skill riêng — xem member `add-technique-skills` và `design.md` §8 |
| 22 | Stack detection | 1 | 1 | 1 | 1 | 3 | 1 | 2 | 0 | 10 | **SỬA + MỞ RỘNG**: manifest, lockfile, workspace |
| 23 | Global setup reconcile + manifest + rollback | 1 | 3 | 2 | 2 | 1 | 3 | 1 | 0 | 13 | **GIỮ an toàn; REFACTOR** sang platform registry khai báo |
| 24 | 4 configurator riêng | 2 | 2 | 1 | 2 | 1 | 3 | 1 | 0 | 12 | **REFACTOR** thành registry khai báo cho đúng 4 nền tảng hiện có; thêm **OpenCode và Cursor** bằng bản ghi registry ở task `add-opencode-cursor` (quyết định người dùng 2026-09-28) |
| 25 | Hook `harnix context` | 2 | 1 | 1 | 1 | 1 | 3 | 2 | 1 | 12 | **GIỮ như lớp tăng cường**; skill phải chạy đúng khi không có hook |
| 26 | Code chết (~280 LOC + test) | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 | 3 | **BỎ** |
| 27 | Hai hệ reconcile / doctor song song | 0 | 1 | 1 | 1 | 2 | 3 | 0 | 1 | 9 | **GỘP** khi làm registry |
| 31 | God module (`internal-workflow.ts` 827 dòng/24 hàm, `task.ts` dòng 585 ký tự, `global-managed-files.ts` 1.072 dòng, `canonicalJson` trùng tên khác nghĩa) | 0 | 1 | 1 | 1 | 2 | 3 | 0 | 1 | 9 | **REFACTOR CẤU TRÚC** (task mới `restructure-code`, tách khỏi `simplify-task-contract` vì hai sản phẩm độc lập): chia theo action/mối quan tâm, đổi tên hết trùng, không đổi hành vi quan sát được, có test snapshot trước/sau |
| 32 | Renderer `.harnix/roadmaps/<id>.md` | 1 | 1 | 0 | 1 | 3 | 3 | 2 | 2 | 13 | **SỬA LỖI** (phát hiện khi trả lời câu hỏi người dùng): thiếu dòng trống trước `## Members` (MD022), `epic.nonGoals` bị validate nhưng không render, `.md` thiếu next-task mà JSON CLI có — gộp vào `fix-baseline` |
| 28 | Gate phát hành 17 script (`test:acceptance` chạy lặp lại test) | 0 | 2 | 2 | 2 | 3 | 3 | 1 | 1 | 14 | **ĐƠN GIẢN HÓA**: bỏ phần chạy trùng |
| 29 | Rule commit approval, rule tiếng Việt | 1 | 3 | 1 | 2 | 3 | 3 | 3 | 0 | 16 | **GIỮ** (là sở thích của người dùng) |
| 30 | Skill debug + profile review của check | 2 | 3 | 3 | 3 | 3 | 3 | 2 | 0 | 19 | **GIỮ**, thêm verification-gap lens |

Gộp 7 skill thành 5 (hạng mục 14):

| Skill mới | Nguồn |
| --- | --- |
| `harnix-plan` | brainstorm |
| `harnix-implement` | implement |
| `harnix-verify` | check-verification + finish |
| `harnix-review` | check-review |
| `harnix-debug` | debug |

Nội dung research gộp vào plan/debug như một mục tham chiếu. Continue được thay bằng `preflight.nextStage`. Phần replan/migration chuyển sang tài liệu tham chiếu nạp theo yêu cầu.

## §10a. Xét lại quyết định #10 — Learning: giữ và thiết kế lại thay vì bỏ

Người dùng phản hồi rằng learning được xây ra để Harnix tự cải tiến và không nên bỏ. Sau khi research thêm (`research/learning-redesign.md`), quyết định #10 đổi từ BỎ sang **GIỮ + THIẾT KẾ LẠI**.

**Vì sao "0 entry" từng bị đọc nhầm thành "không có giá trị":** đọc code hiện tại (`src/core/journal/learning.ts`, `promotion.ts`, `src/skills/harnix-finish-work/SKILL.md:78-84`) cho thấy cơ chế kỹ thuật (dedupe, ngưỡng confidence, redaction chống injection) đều ổn; vấn đề nằm ở **điểm kích hoạt**: capture là bước tùy chọn cuối cùng trong một skill dài, đòi hỏi ≥2 task độc lập đã hoàn tất trước khi có thể tạo candidate đầu tiên, và không có gì tự động đọc lại nó ở đầu task sau. Đây là lỗi thiết kế trigger, không phải lỗi ý tưởng.

**Đối chiếu bên ngoài (research/learning-redesign.md):** Anthropic memory tool tự động kiểm tra memory trước khi bắt đầu task (84% tiết kiệm token, 39% cải thiện hiệu năng trên benchmark nội bộ 100-turn); mem0/Letta/MemGPT dùng auto-trigger tại boundary sự kiện, không có hệ thống production nào dựa vào "agent tự nhớ gọi flag"; Windsurf và Copilot Memory auto-generate mặc định (Copilot còn có TTL 28 ngày chống drift); Superpowers cố tình đưa methodology vào SessionStart hook thay vì lệnh thủ công vì "bất cứ gì cần agent tự nhớ để bật đều có xu hướng bị bỏ qua".

**Quyết định thiết kế lại (thay cho "BỎ" ở bảng trên):**

1. **Tự động hoá capture tại `finish`.** `workflow --finish` tự quét và tạo candidate đạt ngưỡng, không phụ thuộc agent nhớ gọi `--learn` như một bước riêng trong skill.
2. **Tự động surface tại điểm vào**, không chỉ qua `harnix mem` tra cứu thủ công: bơm tóm tắt learning đã redact (giới hạn dòng) vào context đầu task Lite/Full, giống memory tool.
3. **Hạ ma sát ở ngưỡng đầu**, ví dụ track "draft" một task được tự nâng cấp thành "candidate" khi task thứ hai xuất hiện, thay vì yêu cầu tra lại lịch sử thủ công trước khi candidate đầu tiên có thể tồn tại.
4. **Giữ nguyên gate review khi ghi vào spec** (promote), vì đây là bước có rủi ro memory-poisoning cao nhất — chỉ tự động hoá capture/surface, không tự động hoá promote.
5. **Thêm decay/expiry** cho candidate chưa promote, theo mô hình TTL của Copilot Memory, để tránh candidate tồn đọng thành noise.
6. **Giữ phạm vi project-local**, không mở rộng cross-project/global — khớp nguyên tắc "no global memory" của Harnix.

Việc này đổi phạm vi của roadmap: `remove-unused-machinery` (member #2) không còn gỡ learning; một member mới `automate-learning` (#10) được thêm để thực hiện thiết kế lại.

## Thêm mới (có bằng chứng)

| # | Tính năng | Bằng chứng | Ưu tiên |
| --- | --- | --- | --- |
| N1 | Phát hiện lệnh verify deterministic theo stack và package (nearest manifest wins), lưu vào `config.yaml` `verify:` để người dùng sửa | E-D4, I§7 | Cao |
| N2 | "Suite defines green": ready gate yêu cầu có ít nhất một check mức project (test/lint/typecheck). Repo không có test phải khai báo check thay thế, không được tính pass | E-D2/3 | Cao |
| N3 | Test-impact hint: `harnix repo-map --tests <path>` dựa trên cạnh import và quy ước đặt tên test | E-D1 | TB |
| N4 | Platform registry khai báo + skill sink chung (`~/.agents/skills`, `~/.claude/skills`), chống trùng catalog; chuyển 4 nền tảng hiện có sang registry, rồi thêm **OpenCode và Cursor** bằng dữ liệu (quyết định người dùng); không thêm tool nào khác | E-A | Cao |
| N5 | Chế độ không hook: skill tự gọi `harnix workflow --preflight` | E-A | Cao |
| N6 | Test ngân sách token cho instruction; eval probe khi cắt prose (có thể làm sau) | E-D5/7 | TB |
| N7 | Bugfix AC "must remain working" và verification-gap lens trong review | E-D9/10 | Thấp |
| N8 | ~~Finish tự chạy lại suite~~ **Rút lại** (review trước implement): root cause sự cố `pause` là check chỉ chạy unit+integration, bỏ sót `test:workflow`; harness không tự chạy lệnh và không nên. Thay bằng suite gate trong N2: finish từ chối khi check mức project (từ `verify-plan`, inputs phủ toàn bộ source+test) không có pass với digest hiện hành — xem `design.md` §9 | I§0 | Cao |
| N9 | Thời gian theo múi giờ cấu hình (mặc định hệ thống, repo này `Asia/Ho_Chi_Minh`): ISO 8601 kèm offset, tiền tố ID, ngày journal và hiển thị cùng một múi giờ; dữ liệu cũ không ghi lại — task `localize-timestamps` | Yêu cầu người dùng; sự cố task `20260924-074009` bị huỷ vì ID dùng UTC | Cao |
| N10 | Thống nhất tên "epic": `.harnix/epics/`, `harnix epic [<epic-id>]`, `epicMembers`; bỏ tên `roadmap` trong 2.0.0, migrate dữ liệu cũ — task `unify-epic-naming` | Yêu cầu người dùng; `design.md` §12 | TB |
| N11 | Chuẩn hóa code và test: Prettier + ESLint type-checked + max-lines 300; code đúng tầng commands -> core -> utils; test phản chiếu src, builder dùng chung, coverage floor — task `enforce-code-style`, `restructure-code`, `standardize-tests` | Yêu cầu người dùng; số liệu đo ở `design.md` §13 | Cao |

## Mục tiêu đo được sau đại tu

| Chỉ số | Hiện tại | Mục tiêu |
| --- | --- | --- |
| Token chỉ dẫn, thay đổi nhỏ (direct) | ~17–30K | ≤ 4K |
| Token chỉ dẫn, task Full | ~37K | ≤ 15K |
| LOC nhóm A (máy móc) | ~3.350 | ≤ 1.500 |
| Churn `.harnix` mỗi task | ~1–16K dòng | ≤ 200 dòng |
| Stack có lệnh verify tự phát hiện | 1 (JS) | ≥ 8 |
| Tool hỗ trợ chính thức | 4 | 6: 4 hiện có + OpenCode + Cursor; thêm nền tảng về sau chỉ cần một bản ghi registry |
| Version | 1.1.22, bump patch mỗi task | 2.0.0, bump một lần ở `release-v2` |
