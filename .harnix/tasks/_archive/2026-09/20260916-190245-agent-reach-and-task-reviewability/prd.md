# PRD - Mở đường cho mọi agent và làm task review được

## Outcome

Bất kỳ coding agent nào — không chỉ bốn platform đã `harnix setup` — đều lấy được skill canonical và chạy đúng workflow Harnix; agent persist state qua transport bounded thay vì round-trip toàn bộ TaskRecord; và người dùng đọc được task cùng lý do đằng sau nó mà không phải mở JSON thô.

## Vấn đề được chứng minh

- `harnix init` chỉ ghi `AGENTS.md`, `.harnix/workflow.md` và `.harnix/spec/guides/**` (`src/commands/update.ts` `desiredFiles`). Không có skill nào trong project.
- AGENTS template lại ra lệnh đọc `SKILL.md` của bảy skill. Với Cursor, Copilot, Windsurf, Zed, hoặc bốn platform chưa chạy `setup`, những file đó không tồn tại và không có command nào in ra được.
- Không văn bản sinh ra nào nhắc tới `.harnix/spec/guides/`, nên guide chỉ tới được agent qua context hook của platform đã setup.
- `harnix workflow --save` là transport duy nhất và yêu cầu gửi lại toàn bộ TaskRecord cho mọi transition, nên mỗi bước là một cơ hội đánh rơi `evidence`.
- TaskRecord không có chỗ ghi quyết định, giả định hay residual risk; context checkpoint mà `harnix-brainstorm` bắt buộc chỉ sống trong hội thoại.
- Mọi public command chỉ emit một dòng JSON, nên người dùng muốn review phải tự đọc `task.json`.

## In scope

- Public command thứ mười lăm `harnix skill [name]` emit canonical skill catalog hoặc nội dung một skill dưới dạng JSON.
- AGENTS template và workflow template trỏ tới nguồn skill có thật, nêu `.harnix/spec/guides/`, và mô tả hành vi khi `harnix` không khả dụng.
- Hidden transport bounded `harnix workflow --transition <status>/<checkpoint>`, `--evidence`, `--schema`.
- Trường tuỳ chọn chỉ-v2 `decisions` và `residualRisks` trong TaskRecord, cùng skill guidance để ghi chúng tại ready và finish.
- Flag `--human` cho `status`, `tasks`, `checks`, `audit`; JSON vẫn là mặc định không cần flag.
- Đồng bộ normative docs, AGENTS.md, README, minor version và changelog.

## Out of scope

- Không copy bảy `SKILL.md` vào từng consumer repository: runtime và canonical asset vẫn ở trong package.
- Không thêm skill thứ tám, platform thứ năm, MCP, telemetry hay network service.
- Không đổi `canonicalTaskContract`, digest payload, hook protocol, hay transition table.
- Không tách `internal-workflow.ts`.

## Quyết định thiết kế

### D1 — Skill phân phối bằng command, không bằng file trong repo

`harnix skill <name>` in canonical content từ package đã cài. Lý do: footprint project không tăng, không có bản sao stale để reconcile, nội dung luôn khớp version đang chạy, và ranh giới "runtime nằm trong package" được giữ. Đánh đổi: agent phải chạy một command, nhưng AGENTS template vốn đã yêu cầu chạy `harnix workflow --preflight`.

### D2 — Version tăng minor lên 1.1.0

Change này thêm public CLI surface và trường schema mới nên semver yêu cầu minor. Quy tắc "increment the package patch version at most once" được đọc là "bump đúng một lần", không phải "luôn luôn patch".

### D3 — `--human` không phá contract JSON

JSON vẫn là output mặc định và không cần flag nào để lấy. `--human` chỉ thêm một chế độ đọc cho người, đúng nguyên tắc "không cần `--json`".

### D4 — Trường rationale nằm ngoài task contract

`canonicalTaskContract` chỉ hash `id`, `mode`, `acceptanceCriteria` và `validationPlan`, nên `decisions`/`residualRisks` không làm stale evidence đang pass. Chúng là dữ liệu review, không phải obligation.

### AC `ac-skill-reach`

`harnix skill` không tham số trả catalog bảy skill với `name`, `description`, `version`; `harnix skill <name>` trả đúng byte canonical của skill đó. Tên không hợp lệ fail closed bằng `PublicCliErrorV1`. Command chạy được ngoài project đã init và không ghi gì.

### AC `ac-template-reach`

AGENTS template sinh bởi `harnix init` chỉ tham chiếu tới thứ tồn tại sau init: nó nêu `harnix skill <name>` làm nguồn skill, nêu `.harnix/spec/guides/` làm nguồn engineering guidance, và nói rõ phải báo cáo thay vì bịa state khi `harnix` không khả dụng. Workflow template mô tả cùng nguồn.

### AC `ac-bounded-transport`

`harnix workflow --transition <status>/<checkpoint>` đổi đúng trạng thái từ active task đã persist mà không nhận task body, từ chối transition bất hợp lệ và giữ nguyên evidence/obligation. `harnix workflow --evidence` nhận đúng một evidence item bounded trên stdin và append mà không xoá evidence cũ. `harnix workflow --schema` trả mô tả schema của save envelope mà không ghi gì.

### AC `ac-task-rationale`

TaskRecord v2 chấp nhận `decisions` và `residualRisks` tuỳ chọn với id an toàn và text bounded; schema v1 từ chối chúng như unknown field. `taskContractHash` của cùng criteria/validationPlan không đổi khi thêm hai trường này, nên evidence đang pass vẫn fresh.

### AC `ac-human-review`

`harnix status|tasks|checks|audit --human` in bản tóm tắt cho người đọc, không chứa absolute path hay secret, và cùng lệnh không có flag vẫn trả đúng một JSON document như trước.

### AC `ac-contract-docs-sync`

PRD, IMPLEMENTATION_PLAN, README và AGENTS.md mô tả mười lăm public command, transport mới, trường TaskRecord mới và nguồn skill mới một cách nhất quán.

### AC `ac-release-readiness`

Version minor, changelog, metadata version của bảy skill và self-host manifest cập nhật đúng một lần trước `verifying`; exact acceptance sequence pass.
