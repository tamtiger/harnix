# PRD: Đồng bộ contract routing của agent và README

## Kết quả

Agent tự vận hành, project agent template và README cùng mô tả một contract routing duy nhất: phân loại latest request trước active state, chọn owner đúng theo `nextStage`, và chỉ coi research là Bypass khi hoàn toàn read-only.

## Phạm vi

- Sửa root `AGENTS.md` để owner tuân theo exact `nextStage` từ preflight.
- Render toàn bộ `HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS` trong project agent template.
- Đồng bộ thuật ngữ `standalone read-only research` và mutation boundary trong `AGENTS.md`, generated project agent và `README.md`.
- Thêm regression tests exact-parity cho project agent và self-hosted documentation.
- Cập nhật patch release metadata trước verification.

## Ngoài phạm vi

- Không đổi public CLI, TaskRecord schema, hook protocol hoặc platform storage.
- Không thêm skill hay workflow stage.
- Không thay đổi behavior của router runtime đã hoàn tất ở task trước.

### AC `ac-next-stage-routing`

Root `AGENTS.md` yêu cầu đọc exact `nextStage` từ preflight; `harnix-continue` chỉ được dùng khi `nextStage` chọn nó hoặc khi latest request yêu cầu khôi phục persisted work.

### AC `ac-project-canonical-parity`

`renderAgentsTemplate` chứa nguyên văn từng clause trong `HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS`, và test exact-parity thất bại nếu thiếu bất kỳ clause nào.

### AC `ac-readonly-terminology`

Các surface dùng thống nhất `standalone read-only research`, không còn lỗi `Classify` viết hoa giữa câu, và nêu rõ review/research có mutation repository hoặc task artifacts phải vào Lite hoặc Full.

### AC `ac-release-readiness`

Patch version/changelog/managed metadata được đồng bộ một lần; focused contract tests và exact release gate mục 11 đều pass với evidence mới.
