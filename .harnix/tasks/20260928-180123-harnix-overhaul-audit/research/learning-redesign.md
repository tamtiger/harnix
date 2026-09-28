# Research bổ sung — Vì sao learning không kích hoạt, và cách thiết kế lại

Người dùng phản hồi: learning được xây để Harnix tự cải tiến, không nên bỏ. Nghiên cứu này thay thế quyết định "BỎ" ở bản đầu bằng "GIỮ + THIẾT KẾ LẠI".

## 1. Cơ chế hiện tại (fact)

Luồng: `LearningCandidate` (`src/core/journal/learning.ts:2-4`) → `promotionProposal()` (`promotion.ts:20-45`, bọc boundary chống injection) → ghi vào `.harnix/workspace/<dev>/journal/*.jsonl` qua `appendJournalIdempotent`. Đọc lại chỉ qua `harnix mem --learning`.

**Ngưỡng eligibility** (`learning.ts:6-7,12`, khóa tại `docs/IMPLEMENTATION_PLAN.md:407`): `sourceTaskIds.length >= 2`, `evidenceIds.length >= 2`, `confidence = min(1, 0.4 + 0.2*min(distinctTasks,2) + 0.1*min(distinctEvidence,2)) >= 0.8`. Với đúng 2 task + 2 evidence, confidence luôn bằng đúng 0.8 — biên tối thiểu, không có margin.

**Vì sao chưa từng kích hoạt (0/70 journal, 0/69 task):**

1. Trigger hoàn toàn thủ công, là bước cuối cùng — mức ưu tiên thấp nhất — trong `src/skills/harnix-finish-work/SKILL.md:78-84`, sau toàn bộ compliance/quality/evidence/journal.
2. Ngưỡng đòi ≥2 task độc lập **đã hoàn tất** trước khi candidate đầu tiên có thể tồn tại — lần đầu một pattern xuất hiện, không tạo được gì.
3. Không có auto-injection: kể cả khi candidate được tạo, chỉ nằm trong jsonl, không agent nào tự đọc lại trừ khi được nhắc lại thủ công.
4. Promote vào spec (nơi thực sự có ảnh hưởng) là bước con người thứ ba, tách khỏi capture.
5. Không stage nào khác (brainstorm/implement/check) nhắc đọc lại learning — chỉ finish.

Đây là lỗi ở **điểm kích hoạt**, không phải lỗi ở ý tưởng hay công thức: dedupe, ngưỡng confidence, redaction chống injection đều ổn về mặt kỹ thuật.

## 2. Đối chiếu bên ngoài

| Hệ thống | Cách trigger | Nguồn |
| --- | --- | --- |
| Anthropic Memory Tool | Tự động kiểm tra memory trước khi bắt đầu task; kết hợp context-editing để tự lưu trước khi context bị clear. Đạt 84% tiết kiệm token, 39% cải thiện hiệu năng (benchmark nội bộ 100-turn) | [platform.claude.com](https://platform.claude.com/docs/en/agents-and-tools/tool-use/memory-tool), [anthropic.com](https://www.anthropic.com/news/context-management) |
| mem0 / Letta (MemGPT) / MemoryOS | Auto-trigger dựa trên importance/heat score (recency+frequency+semantic), không hệ thống production nào dựa vào "agent tự nhớ gọi flag". Letta có sleep-time agents chạy consolidation nền, không chặn task chính | [zylos.ai](https://zylos.ai/research/2026-04-20-memory-consolidation-ai-agents/), [mem0.ai](https://mem0.ai/blog/benchmarked-openai-memory-vs-langmem-vs-memgpt-vs-mem0-for-long-term-memory-here-s-how-they-stacked-up) |
| Superpowers (obra) | Kích hoạt methodology qua SessionStart hook tự động, không phải opt-in — nguyên tắc: "bất cứ gì cần agent tự nhớ để bật đều có xu hướng bị bỏ qua" | [github.com/obra/superpowers](https://github.com/obra/superpowers), [blog.fsck.com](https://blog.fsck.com/2025/10/09/superpowers/) |
| Windsurf Cascade Memories | "Auto-Generate Memories" bật mặc định, không phải per-item flag | [memnexus.ai](https://memnexus.ai/blog/2026-02-20-windsurf-persistent-memory) |
| GitHub Copilot Memory | Tự động, scope theo repo, có TTL 28 ngày chống drift/poisoning | tổng hợp 2026 |
| Cursor | Cố tình không auto-learn, thuần thủ công — đối lập rõ với Windsurf/Copilot | tổng hợp 2026 |

**Root-cause pattern chung:** câu hỏi lặp lại trong thiết kế reflection loop là "opt-in hay automatic"; xu hướng thắng là automatic tại các điểm sự kiện rõ ràng khi chi phí capture thấp. Capture của Harnix chỉ ghi JSON local, chi phí thấp, nên nên rơi vào nhóm automatic.

## 3. Thiết kế lại được chọn

1. **Tự động hoá capture tại `finish`.** `workflow --finish` tự quét và tạo candidate đạt ngưỡng như một bước nội bộ, không phụ thuộc agent nhớ gọi `--learn` riêng.
2. **Tự động surface tại điểm vào task mới**, giống Anthropic memory tool: bơm tóm tắt learning đã redact (giới hạn số dòng) vào context đầu task Lite/Full, thay vì chỉ qua `harnix mem` tra cứu thủ công.
3. **Hạ ma sát ngưỡng đầu**: thêm trạng thái `draft` (task hiện tại là 1 nguồn) tự nâng cấp lên `candidate` khi task thứ hai xuất hiện, thay vì yêu cầu tra lại lịch sử thủ công trước khi candidate đầu tiên tồn tại.
4. **Giữ nguyên gate review khi ghi vào spec** (promote) — đây là bước rủi ro memory-poisoning cao nhất, không nên tự động hoá; chỉ capture/surface được tự động.
5. **Thêm decay/expiry** cho candidate chưa promote (theo mô hình TTL của Copilot), tránh tồn đọng thành noise.
6. **Giữ phạm vi project-local**, không mở rộng cross-project/global — khớp nguyên tắc "no global memory" đã có của Harnix.
7. **Giữ nguyên các kiểm soát an toàn hiện có**: `analyzeLearningStatement` risk-category redaction, JSON-string boundary chống injection — tự động hoá trigger không có nghĩa nới lỏng validate.

## Kết luận

Vấn đề gốc rễ không phải "learning vô dụng" mà là "điểm kích hoạt sai chỗ": ba hành vi chủ động liên tiếp (capture → tra cứu thủ công → promote thủ công), ngưỡng đòi 2 task độc lập trước candidate đầu tiên. Mọi prior art khảo sát đều đặt capture/surface ở event trigger tự động, chỉ giữ human-in-the-loop cho bước ghi có ảnh hưởng lâu dài (ở đây là promote vào spec).
