# PRD: Bắt buộc user review trước khi chạy task Full hoặc Epic

## 1. Bối cảnh & Vấn đề

Hiện tại trong Harnix:
- Invariant 4 quy định: "Yêu cầu rõ kiểu 'build/fix/implement/change' đã cấp quyền triển khai trong phạm vi đó; không hỏi lại chỉ để chuyển từ plan sang code."
- Đối với task Lite (thay đổi nhỏ, cục bộ), quy tắc này giúp tối ưu tốc độ và không gây ma sát.
- Nhưng đối với task Full (ảnh hưởng đa tầng, thay đổi contract, migration, nhiều slice) hoặc Epic (sáng kiến lớn gồm nhiều member task), việc Agent tự động nhảy từ Planning sang Implementing trong cùng một lượt khiến người dùng mất cơ hội review bản thiết kế, PRD, checklist và lộ trình member tasks trước khi code bị thay đổi trên diện rộng.

## 2. Mục tiêu (Goals)

1. Tinh chỉnh Invariant 4 và mục 5.3 Ready gate trong `docs/HARNIX_WORKFLOW.md`:
   - Task Lite tiếp tục được phép tự động chuyển sang implement nếu yêu cầu ban đầu đã rõ ràng.
   - Task Full và Epic bắt buộc dừng lại tại checkpoint `await` tại `ready` để người dùng duyệt kế hoạch.
2. Đồng bộ hóa sang `src/templates/harnix/workflow.md` và `.harnix/workflow.md`.
3. Cập nhật kỹ năng `harnix-plan` (`SKILL.md` và `references/epic.md`):
   - Quy định rõ khi đạt `ready`, Agent phải dừng turn, xuất trình tóm tắt kế hoạch/lộ trình và các quyết định kỹ thuật cho người dùng, chờ chỉ thị xác nhận.
4. Đồng bộ hướng dẫn trong `AGENTS.md`.
5. Đảm bảo toàn bộ test suite và instruction token budget vượt qua 100%.

## 3. Tiêu chí nghiệm thu (Acceptance Criteria)

### AC-1: `ac-workflow-invariants`
HARNIX_WORKFLOW.md Invariant 4 và mục 5.3 Ready gate phân tách rõ Lite vs Full/Epic; Full và Epic bắt buộc dừng ở ready/await để user review kế hoạch trước khi code.
**Verifies:** `check-workflow-docs`

### AC-2: `ac-workflow-template`
src/templates/harnix/workflow.md và .harnix/workflow.md phản ánh quy định Full tasks và Epics dừng ở ready cho user review.
**Verifies:** `check-workflow-docs`

### AC-3: `ac-skills-guidance`
harnix-plan/SKILL.md và epic.md quy định rõ điểm dừng await tại ready cho Full task và Epic, yêu cầu xuất trình tóm tắt kế hoạch/lộ trình và chờ approval trước khi implement.
**Verifies:** `check-skills-budget`

### AC-4: `ac-agent-rules`
AGENTS.md nhất quán với quy tắc mandatory review stop cho Full tasks và Epics.
**Verifies:** `check-skills-budget`

### AC-5: `ac-test-suite`
Toàn bộ test suite và instruction token budget vượt qua 100%.
**Verifies:** `check-suite`
