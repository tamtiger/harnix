# Review: Instruction Layer Sufficiency sau Task 11 (slim-instructions)

> **Tài liệu lịch sử:** prompt này được viết trước bản 2.1.0. Số liệu (số platform, số điều luật, số lệnh) và đường dẫn trong đó phản ánh thời điểm viết; hiện Harnix hỗ trợ 6 platform (Kiro, Antigravity, Codex, Claude Code, OpenCode, Cursor). Xem `AGENTS.md` và `docs/HARNIX_PRD.md` để biết trạng thái hiện hành.


## Bối cảnh

Task 11 (`20260928-205809-slim-instructions`) đã tinh gọn triệt để lớp chỉ dẫn của Harnix:

- **Gộp 7 skill → 6 skill:** Xóa `harnix-brainstorm`, `harnix-check`, `harnix-finish-work`, `harnix-continue`; thay bằng `harnix-plan` và `harnix-verify`; tách `harnix-review` khỏi `harnix-research`.
- **Tách nội dung chuyên sâu → Reference:** 7 file reference được nạp theo yêu cầu qua `harnix skill <name> --reference <topic>`, không nằm trong SKILL.md chính.
- **Khối luật luôn nạp (always-loaded):** 9 điều luật `HARNIX_RULES` trong `src/templates/harnix/activation.ts`, chia sẻ nguyên vẹn trên 4 platform surface (Kiro steering, Antigravity rule, Claude CLAUDE.md, Codex AGENTS.md).
- **Ngân sách token nghiêm ngặt:** always-loaded ≤ 1.500 token, mỗi SKILL.md ≤ 2.000, đường Bypass ≤ 4.000, đường Full ≤ 15.000 (ước lượng ký tự/4, có test tự động kiểm tra).

## Mục tiêu review

Đánh giá xem sau khi tinh gọn, **tổ hợp chỉ dẫn mà các coding agent thực sự nhận được** có đủ thông tin để chạy trọn vẹn workflow Harnix hay không, trên cả 4 nền tảng (Kiro, Antigravity, Codex, Claude Code).

## Phạm vi file cần đọc

### Lớp luôn nạp (Always-loaded — agent LUÔN thấy)

1. `src/templates/harnix/activation.ts` — 9 điều luật HARNIX_RULES (~998 tokens)
2. `src/templates/harnix/agents.ts` — template AGENTS.md bootstrap (~557 tokens)
3. `src/templates/harnix/global-surface.ts` — steering/hook surface cho 4 platform (~269 tokens)

### Workflow document (Agent đọc khi được hướng dẫn bởi Rule #2)

4. `src/templates/harnix/workflow.md` — tài liệu chuẩn tắc route, lifecycle, gates, transport, cookbook (~3.332 tokens)

### Skill files (Agent nạp DUY NHẤT skill tương ứng với `nextStage`)

5. `src/skills/harnix-plan/SKILL.md` — planning, ready, replan, migration, epic (~1.006 tokens)
6. `src/skills/harnix-implement/SKILL.md` — TDD, evidence, release prep (~990 tokens)
7. `src/skills/harnix-verify/SKILL.md` — compliance, quality, finish, cancel (~908 tokens)
8. `src/skills/harnix-debug/SKILL.md` — scope gate, hypotheses, regression (~939 tokens)
9. `src/skills/harnix-review/SKILL.md` — code review chỉ đọc, Bypass (~672 tokens)
10. `src/skills/harnix-research/SKILL.md` — standalone hoặc task-scoped research (~855 tokens)

### Reference files (Agent cần GỌI LỆNH `harnix skill <name> --reference <topic>` để đọc)

11. `src/skills/harnix-plan/references/replan.md` — điều chỉnh nghĩa vụ sau ready (~441 tokens)
12. `src/skills/harnix-plan/references/migration.md` — nâng task v1/v2 lên v3 (~289 tokens)
13. `src/skills/harnix-plan/references/epic.md` — khởi tạo/quản lý epic (~282 tokens)
14. `src/skills/harnix-plan/references/ready-review.md` — checklist tự kiểm tra ready (~421 tokens)
15. `src/skills/harnix-implement/references/feedback.md` — xử lý phản hồi reviewer (~197 tokens)
16. `src/skills/harnix-verify/references/evidence.md` — quy chuẩn evidence, freshness, digest (~527 tokens)
17. `src/skills/harnix-verify/references/finish-cancel.md` — quy trình finish/cancel/learning (~523 tokens)

### Logic routing & preflight (Code xử lý, không hiển thị trực tiếp cho agent)

18. `src/skills/catalog.ts` — alias resolution, validation (~1.317 tokens)
19. `src/core/workflow/routing.ts` — `stageOwnerFor` mapping, Bypass detection (~1.777 tokens)
20. `src/core/workflow/preflight.ts` — `nextStage` computation, clock, learning (~1.431 tokens)

### Tests kiểm soát chất lượng chỉ dẫn

21. `test/workflow/instruction-budget.test.ts` — ngân sách token, capability preservation
22. `test/workflow/skill-sources.test.ts` — source integrity
23. `test/workflow/activation-instructions.test.ts` — HARNIX_RULES consistency

## Câu hỏi review cần trả lời

### A. Tính đầy đủ của thông tin (Completeness)

Với mỗi kịch bản dưới đây, đi qua từng bước agent sẽ thực hiện và xác minh liệu thông tin cần thiết có nằm trong các file mà agent thực sự nhận được hay không:

1. **Happy path — Full task từ đầu đến cuối:** Agent nhận yêu cầu implement feature mới → `preflight` → `plan` → build task v3 → `ready` → `await` → user authorize → `implement` → TDD → evidence → `verify` → compliance → quality → `finish`. Agent có đủ thông tin ở mỗi bước chuyển tiếp không? Có chỗ nào agent phải "đoán" vì SKILL.md không nói rõ?
2. **Lite task:** Agent nhận yêu cầu sửa lỗi nhỏ → Lite flow (không prd.md/plan.md). Skill `harnix-plan` có phân biệt đủ rõ giữa Lite và Full không?
3. **Replan sau ready:** Task đã ready nhưng phát hiện thiếu tiêu chí. Thông tin replan nằm hoàn toàn ở reference `replan.md`. Agent có được hướng dẫn gọi `harnix skill harnix-plan --reference replan` hay sẽ tự xoay xở?
4. **Migration task v1/v2:** Agent gặp task cũ. Hướng dẫn migration nằm ở reference `migration.md`. Agent có biết gọi reference không?
5. **Epic management:** Agent cần tạo epic cho chuỗi task. Hướng dẫn nằm ở reference `epic.md`. Agent có biết?
6. **Debug loop:** Agent gặp test fail → `debug` → 3 giả thuyết thất bại → replan. Skill `harnix-debug` có đủ rõ luật dừng và chuyển tiếp không?
7. **Standalone review/research:** Agent nhận yêu cầu review PR hoặc nghiên cứu thư viện. Flow Bypass không đọc workflow.md. Skill review/research có tự đủ (self-contained) không?
8. **Cancel task:** User yêu cầu hủy task giữa chừng. Hướng dẫn cancel nằm ở reference `finish-cancel.md`. Agent verify có biết gọi reference không?

### B. Rủi ro Reference không được đọc (Reference Adoption Risk)

Đây là mối lo chính: agent có khả năng cao sẽ KHÔNG chủ động gọi `harnix skill <name> --reference <topic>` vì:
- Phải chạy thêm một lệnh CLI (thêm bước, tốn token).
- Agent có xu hướng "bắt tay vào làm" thay vì đọc thêm tài liệu.
- Các platform khác nhau xử lý skill khác nhau (Kiro load skill tự động, Claude Code cần agent tự gọi).

Với mỗi file reference, đánh giá:

| Reference | Câu hỏi | Mức rủi ro |
|-----------|---------|------------|
| `replan.md` | Nếu agent không đọc, có tự biết cách gọi `--set-check ... --reason` để replan không? | ? |
| `migration.md` | Nếu agent không đọc, có tự biết chạy `--migrate --brief` không? | ? |
| `epic.md` | Nếu agent không đọc, có tự biết khai báo `epicMembers` khi tạo epic không? | ? |
| `ready-review.md` | Nếu agent không đọc, có tự kiểm tra 12 tiêu chí ready không? | ? |
| `feedback.md` | Nếu agent không đọc, có tự biết coi phản hồi là giả thuyết không? | ? |
| `evidence.md` | Nếu agent không đọc, có tự biết cơ chế digest/freshness/breaker không? | ? |
| `finish-cancel.md` | Nếu agent không đọc, có tự biết chạy `--finish --brief` đúng 1 lần không? | ? |

Cho mỗi reference, phân loại mức rủi ro:
- **Critical (Đỏ):** Agent sẽ làm sai hoặc kẹt nếu không đọc → cần đưa thông tin thiết yếu vào SKILL.md chính.
- **High (Cam):** Agent sẽ làm thiếu bước quan trọng nhưng không kẹt → cần thêm lời nhắc rõ hơn trong SKILL.md.
- **Medium (Vàng):** Agent sẽ làm thô nhưng vẫn hoạt động → chấp nhận được nhưng nên cải thiện.
- **Low (Xanh):** Agent không cần đọc vẫn ổn → reference chỉ là tài liệu tham khảo.

### C. Tính nhất quán giữa các tầng (Consistency)

1. **HARNIX_RULES vs SKILL.md:** Có chỗ nào SKILL.md mâu thuẫn hoặc lặp lại không cần thiết nội dung của 9 điều luật?
2. **workflow.md vs SKILL.md:** Có chỗ nào SKILL.md hướng dẫn khác với workflow.md (route table, gates, transport syntax)?
3. **SKILL.md vs SKILL.md:** Có chỗ nào 2 skill hướng dẫn cùng một hành động nhưng khác cách (ví dụ: cách ghi evidence)?
4. **Routing code vs tài liệu:** `stageOwnerFor` trong `routing.ts` có khớp chính xác với bảng route trong `workflow.md` không?
5. **Preflight code vs tài liệu:** Các giá trị `nextStage` trong `preflight.ts` có khớp với tài liệu không?

### D. Tính rõ ràng của điểm chuyển tiếp (Transition Clarity)

Với mỗi skill, kiểm tra:
1. **Entry:** Agent có biết chính xác khi nào mình được kích hoạt không?
2. **Exit → Skill kế tiếp:** Agent có biết chính xác phải chuyển sang skill nào và bằng lệnh gì không?
3. **Exit → Dừng:** Agent có biết khi nào phải dừng lại chờ user không?

### E. Khả năng tự phục hồi (Self-Recovery)

1. Nếu agent quên chạy `--preflight` trước, có bị lạc không?
2. Nếu agent gõ sai lệnh transport (ví dụ thiếu `--brief`), có cơ chế phát hiện/sửa không?
3. Nếu agent gặp lỗi CLI (exit code ≠ 0), skill có hướng dẫn xử lý cụ thể không?
4. Nếu context bị stale (`contextDrift: stale`), agent có biết replan trước khi tiếp tục không?

### F. Cookbook và Platform-specific Concerns

1. **PowerShell encoding:** Cookbook trong `workflow.md` có đủ cảnh báo về UTF-8/BOM/ANSI trên PowerShell 5.1 không? Agent trên Windows (Kiro, Antigravity) có bị lỗi encoding khi pipe JSON không?
2. **Bash vs PowerShell:** Các ví dụ lệnh trong SKILL.md có platform-neutral không hay chỉ cho 1 shell?
3. **Hook context:** `harnix context` chạy trước prompt. Output của nó có bổ sung đủ thông tin ngữ cảnh (active task, clock, learning) để agent không cần gọi `--preflight` lần nữa, hay agent vẫn phải gọi `--preflight` riêng?

## Kết quả mong đợi

Một báo cáo review có cấu trúc, gồm:

1. **Ma trận rủi ro Reference** (7 reference × 4 mức rủi ro) kèm giải thích.
2. **Danh sách lỗ hổng thông tin** (nếu có): chỗ nào agent sẽ kẹt/sai vì thiếu hướng dẫn.
3. **Danh sách mâu thuẫn** (nếu có): chỗ nào 2 nguồn nói khác nhau.
4. **Đề xuất cải thiện** (nếu cần): thay đổi cụ thể nào cần làm, ưu tiên theo mức rủi ro.
5. **Verdict tổng thể:** Lớp chỉ dẫn hiện tại đủ/chưa đủ cho agent chạy full workflow.
