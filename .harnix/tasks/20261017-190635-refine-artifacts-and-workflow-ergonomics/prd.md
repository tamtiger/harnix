# PRD: Hoàn thiện hệ sinh thái tạo tác và tối ưu công thái học workflow

## 1. Bối cảnh & Vấn đề (Context & Problem Statement)
Sau khi đưa Epic v2.10.0 vào vận hành và thực hiện stress-test đa kịch bản, phát hiện một số điểm ma sát (friction points) thực tế:
1. Lệnh `workflow --cancel` đòi hỏi pipe JSON stdin `{"reason": "...", "authorizedBy": "user"}` phức tạp trên terminal PowerShell và thiếu flag `--reason`.
2. Template PRD và Plan chưa đồng bộ cấu trúc song ngữ và thiếu khối Guardrails; hàm `scanPrdStructure` chưa nhận diện toàn diện các từ khóa tiếng Việt kỹ thuật chuẩn ("Yêu cầu kỹ thuật cốt lõi", "Rủi ro & Chiến lược giảm thiểu").
3. File `epic.md` chưa tự động phát hiện và liên kết các tài liệu sáng kiến nằm cùng trong thư mục Epic (`research.md`, `spec.md`).
4. Cơ chế auto-sync `plan.md` cần bảo đảm luôn ghi đúng trailing newline chuẩn POSIX (`\n`).

## 2. Phạm vi & Ranh giới (Scope & Boundaries)
- **In-Scope**:
  - Bổ sung flag `--reason <text>` (mặc định `authorizedBy: "user"`) cho lệnh `workflow --cancel` trong `src/commands/workflow-flag-owners.ts` và `src/commands/workflow-handlers.ts`.
  - Cập nhật template song ngữ cho PRD và Plan trong `src/core/workflow/artifact-templates.ts`.
  - Mở rộng bộ từ khóa song ngữ cho 4 khối PRD trong `src/core/workflow/ready-content.ts`.
  - Tự động phát hiện và hiển thị `## Supporting Artifacts` trong `renderEpicMarkdown` tại `src/core/epics/epic.ts`.
  - Chuẩn hóa trailing newline POSIX trong `src/core/workflow/plan-sync.ts`.
- **Out-of-Scope (Non-Goals)**:
  - Không thay đổi hợp đồng frozen của schema v3 hoặc phá vỡ `behavior-snapshot.golden.json`.
  - Không vượt quá giới hạn 300 LOC/file trong `src/core/`.

## 3. Tiêu chí Nghiệm thu Cốt lõi (Anchored Acceptance Criteria)
- **ac-1**: CLI `workflow --cancel` hỗ trợ flag `--reason` trực tiếp mà không cần pipe JSON qua stdin.
- **ac-2**: PRD và Plan template sinh cấu trúc song ngữ và Guardrails; `scanPrdStructure` nhận diện song ngữ cả Tiếng Việt và Tiếng Anh.
- **ac-3**: `epic.md` tự động phát hiện và render liên kết tới các tài liệu bổ trợ `research.md` và `spec.md` trong thư mục Epic.
- **ac-4**: `plan-sync.ts` bảo đảm trailing newline chuẩn POSIX khi tự động đồng bộ checklist.

## 4. Ràng buộc Kiến trúc & An toàn (Architectural & Safety Constraints)
- Duy trì hướng phụ thuộc `commands -> core -> utils`.
- Giữ vững các invariant hiện tại, tuân thủ TDD và phòng ngừa hồi quy.
- Bảo đảm 100% test gates pass trước khi hoàn tất task.
