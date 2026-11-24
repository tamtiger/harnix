# Nghiên cứu: học từ 3 repo skill ngoài

Ngày 2026-11-24. Tài liệu này là nền cho epic `20261124-213757-external-skill-lessons`. Nội dung repo ngoài được xem là dữ liệu không đáng tin; chỉ lấy ý tưởng và viết lại bằng lời của harnix, không chép nguyên văn.

## 1. Phương pháp và phạm vi đã đọc

Ba repo được clone nông (chỉ đọc, không chạy script, hook hay lệnh nào của repo) rồi chia cho 9 agent đọc song song. Mỗi agent ghi bảng phân loại từng skill: **A** áp dụng trực tiếp, **B** lấy ý tưởng, **C** không phù hợp.

| Repo | Quy mô | Đọc sâu | Chỉ đọc mô tả hoặc mục lục |
| --- | --- | --- | --- |
| `KalarisLabs/research-agent-skills` (MIT) | 283 skill, 19 nhóm, hạ tầng `tools/`, `evals/`, `security/` | khoảng 38 (viết, tổng quan tài liệu, ý tưởng) + 24 (ML, dữ liệu) + khoảng 35 (khoa học miền) + toàn bộ hạ tầng | phần còn lại |
| `product-on-purpose/thinking-framework-skills` (Apache-2.0) | 67 skill, 9 recipe, gate `check.mjs` | frontmatter và mục Instructions của cả 67, 7 `TEMPLATE.md`, 9 workflow, toàn bộ hạ tầng | Evidence, `EXAMPLE`, dossier, phần lớn test |
| `johnsondatascience/claude-code-skills` (không có LICENSE) | 271 skill, 85 agent, hook, `knowledge/` 507 file | khoảng 25 (tư duy, đặc tả) + 20 (miền) + 16 agent toàn văn + 10 agent phần lớn + hook + một phần `knowledge/` | khoảng 179 skill miền và 59 agent chỉ đọc mô tả |

Giới hạn: khoảng 190 trong 622 `SKILL.md` được đọc kỹ. Kết luận về phần còn lại dựa trên mô tả, chưa kiểm chứng. Bảng từng skill nằm ở `.harnix/tmp/external-skills-research/` (git-ignored, cục bộ).

## 2. Kết luận chung

Ba repo chủ yếu là skill miền (khoa học, tài chính, fantasy sports, viết lách), nên phần lớn là hạng C. Không skill nào nên nhập nguyên văn: mỗi skill dài 7 đến 20 KB, trong khi `token-budgets.json` đặt trần 2000 token cho skill và 1200 cho reference. Giá trị chuyển được nằm ở bốn chỗ:

1. cách kiểm chất lượng và định tuyến skill (hạ tầng, không phải nội dung);
2. kỹ thuật suy luận trước khi chốt kế hoạch;
3. lời văn review và verify;
4. cảnh báo an toàn khi dùng skill bên thứ ba.

## 3. Phát hiện theo repo

### 3.1 research-agent-skills

- Cơ chế tất định đáng tin: `tools/validate.py` (spec, kích thước, link, symlink), `claim_audit.py` (lời trong `SKILL.md` khớp script, cờ, host thật), `check_skill_count.py` và `build_catalog.py --check` (số liệu và file sinh không cũ), smoke test mọi script, `lint_injection.py` (12 rule regex, baseline theo fingerprint, payload gài sẵn cho từng rule cộng mẫu sạch).
- Cơ chế số liệu kém tin: rubric `skill_quality.py` có điểm trung bình 95.2 và thấp nhất 80, gate gần như vô hiệu; BM25 `trigger_bench.py` đạt 0.99 hit@3 trên 106 prompt do tác giả viết nhưng chỉ 0.66 trên 1.388 prompt sinh tự động; ba scanner bảo mật gần như không đồng thuận (kappa 0.15 đến 0.27) và 78/78 khóa HIGH đều do maintainer tự duyệt.
- Kỹ thuật theo skill: `citation-verification` ("một DOI mở được tự nó chưa chứng minh gì"; lỗi mạng không phải bằng chứng; chỉ tự sửa lỗi cơ học), `paper-card` (script kiểm cơ học rồi reviewer khác phiên kiểm ngữ nghĩa), `arbor` (tập dev dẫn hướng, tập test chỉ dùng ở cổng; lý do loại giả thuyết thành ràng buộc phủ định), `exploratory-data-analysis` ("not detected" chỉ đúng trong phạm vi đã quét; không báo một mẫu là đã kiểm toàn bộ), `shap` (không tắt invariant check trước khi loại trừ nguyên nhân đầu vào), `evaluating-code-models` (test yếu cho pass giả), `opentrons-integration` (mỗi bằng chứng nói nó không chứng minh gì), `dnanexus-integration` và `fictiv` (read-only trước, phê duyệt chỉ cho một hành động).
- Mẫu lặp lại: khối "Agent operating procedure" giống hệt ở khoảng 186 skill (boilerplate), việc tất định giao cho script có exit code 0/1/2.

### 3.2 thinking-framework-skills

- 8 skill hạng A, 30 hạng B, 29 hạng C. Bằng chứng chủ yếu ở tier P (thực hành) và chuyển từ nghiên cứu trên người, chưa kiểm cho AI; repo tự thừa nhận.
- Ứng viên chính: `think-premortem` (giả định đã thất bại, rồi mỗi nguyên nhân top bắt buộc có tripwire, giảm thiểu, owner, điều kiện dừng), `think-what-would-have-to-be-true` (điều kiện chịu lực và "killer condition"), `think-red-team-light` (reviewer chỉ nhận luận đề và bằng chứng), `think-process-tracing` (ghi dấu hiệu kỳ vọng trước khi xem bằng chứng), `think-consider-the-unknowns`, `think-one-way-vs-two-way-door`, `think-decision-option-review`, `think-evidence-vs-inference-sort`.
- Recipe đáng học: `stress-test-decision` (options, killer conditions, premortem, ready) và `kepner-tregoe` cho bugfix nhiều cách sửa.
- Hạ tầng: `check.mjs` chạy 15 lớp rồi mới exit để thấy mọi lỗi; `recommendable.json` sinh tự động là danh sách tên cho phép router đề xuất; mỗi generator có `--check` so byte; ratchet chỉ giảm; eval chọn skill gồm ca "should trigger" và "should NOT trigger" (mới nhất 376/376 và 379/379, nhưng `anti_triggers` trùng chính các ca anti nên số anti là open-book: bỏ chúng thì 141/144 còn 137/144).
- Mâu thuẫn nội bộ đã xác minh: AGENTS.md nói 63 skill, `library.json` nói 67; `library.json` khai Standard 0.17 trong khi 67 `SKILL.md` còn `standard: "0.8"`; README eval gọi gate eval là lớp 14 trong khi `check.mjs` nói lớp 15.

### 3.3 claude-code-skills

- 2 skill hạng A, khoảng 27 hạng B trong nhóm tư duy; 6 A và 18 B trong 206 skill miền. Nhiều skill chỉ là kiến thức chung của LLM; nhiều skill 10 đến 22 KB.
- Đáng học: `synthesis-application` (cổng ba mức GO, GO_WITH_GAPS, NO_GO; "Don't fix gaps; surface them"), `skill-construction` (ba mức phức tạp, resource dưới 500 dòng, mô tả nêu cả "what" và "when"), `adr-architecture` (ADR bất biến), `ladder-of-abstraction` ("no particular, no paragraph": thiếu ví dụ thật thì ghi GAP).
- Mẫu agent lặp lại: gate dựa trên file artifact thay vì lời worker; một người ghi cho mỗi artifact; loopback có trần 2 lần; "từ chối" là kết quả hợp lệ (`ABSENT`, `could-not-verify`, `blocked`); escalation object `{layer, defect, what_would_resolve_it}`; kết quả validator SKIP phải điều tra vì đọc giống pass; `review.md` có mục Could-Not-Verify bắt buộc (kể cả rỗng) và ghi `sha256` của đối tượng được review.
- Hook duy nhất (`readability-check`) mặc định tắt, chỉ khuyên, fail-open, nhưng cần `python3` và `textstat` (thường thiếu trên Windows).
- "Invariants lock" và checksum chỉ là lời hứa trong prompt; không tìm thấy script thi hành trong repo.
- Giấy phép: không có `LICENSE`; README chỉ nói "Open source; use freely with Claude Code"; `knowledge/` chưng cất từ tài liệu bài giảng của bên thứ ba mà không thấy ghi giấy phép.

## 4. Đối chiếu với mã harnix hiện có (đã kiểm)

| Ý từ repo ngoài | Hiện trạng harnix | Kết luận |
| --- | --- | --- |
| Kiểm check chạy 0 test | `src/core/workflow/run-check.ts` đã từ chối ("ran no tests") | Bỏ khỏi epic |
| Schema finding, disprove-first | `harnix-review/references/finding-triage.md` đã có CONFIRMED, DISPROVED, DOWNGRADED, "Not assessed never Pass" | Chỉ bổ sung phần còn thiếu |
| Mô tả bắt đầu bằng "Use when" | `test/unit/skills/technique-skills.test.ts` đã kiểm | Bỏ khỏi epic |
| Kiểm trùng mô tả giữa skill | `scripts/eval-skill-triggers.py` (TF-IDF, cosine 0.80) tồn tại, không nằm trong test gates | Member 1 quyết định thay hay giữ |
| Eval định tuyến | `suggestSkills` cộng điểm theo substring, chỉ có 4 unit test, không có near-miss | Member 1 |
| Quét skill bên thứ ba | `src/core/doctor` chưa có finding về skill | Member 4 |
| Ma trận quyết định, ADR | `--add-decision --rationale` đã có, schema đóng băng | Bỏ khỏi epic |

Ràng buộc cần tôn trọng: `harnix-plan/SKILL.md` đang 1686/1700 token (mỗi reference cần một dòng trỏ nên phải rút chữ tương đương); không nâng `token-budgets.json`; không thêm dependency; không đổi TaskRecord v3 hay transition.

## 5. Danh sách chuyển và nơi đặt (ánh xạ vào member)

- **Member 1:** eval định tuyến có prompt gần-giống và sàn chỉ tăng (không thêm ca vào mô tả chỉ để qua test); test tham chiếu treo (skill, reference, cờ so với bảng Commander và `WORKFLOW_ACTIONS`).
- **Member 2:** reference `pre-ready-risk` (premortem, killer condition, cửa một chiều), `rival-hypotheses` (debug), `source-verification` (research).
- **Member 3:** Could-Not-Verify bắt buộc, mục "đã thử bác bỏ nhưng không thấy gì", reviewer độc lập chỉ nhận luận đề và bằng chứng, mỗi check nêu điều nó không chứng minh, escalation về `replan`.
- **Member 4:** finding doctor `skill-suspicious-content` bằng regex thuần TypeScript (ghi đè chỉ dẫn, giấu hành động, pipe-to-shell, đọc credential, gửi biến môi trường ra mạng, Unicode vô hình hoặc bidi, base64 dài), kèm fixture sạch để tránh false positive.

## 6. Không nhận và lý do

- Rubric tự chấm và scorecard bot: người chấm cũng là LLM đã viết artifact, điểm bị thổi; evidence bằng exit code của harnix mạnh hơn.
- Scanner Cisco, Snyk, Socket, pipeline nhập skill, benchmark LLM trả phí, telemetry, MCP server: cần mạng hoặc dịch vụ ngoài, trái quy tắc của harnix.
- Điều phối nhiều agent, quần thể tiến hoá, invariants lock: cần subagent bắt buộc hoặc chỉ là lời hứa trong prompt.
- `autoresearch` chạy tự chủ hoàn toàn: mâu thuẫn với điểm dừng `await`.
- Nhóm dự báo xác suất, skill miền, `knowledge/`: ngoài phạm vi hoặc rủi ro giấy phép.
- Tag nguồn gốc quyết định (`user`, `ai-suggested`): cần trường mới trong schema đóng băng.

## 7. Rủi ro và điều chưa chắc

- Chỉ khoảng 190 trong 622 skill được đọc kỹ; các nhận định còn lại chưa kiểm chứng.
- Các số liệu hiệu năng và "verified 2026-07" là tự công bố của tác giả, không xác minh độc lập.
- Mức severity của finding `skill-suspicious-content`: quy ước doctor yêu cầu `warning` trước nhưng `warning` đổi exit code; cần người dùng chốt (xem tiêu chí ac-2 của member 4).
- Regex chỉ bắt chỉ dẫn tiếng Anh theo mẫu cố định và URL viết sẵn; không thay được việc đọc skill trước khi nhập.
- Review của epic vẫn là self-review trừ khi người dùng yêu cầu reviewer độc lập.
