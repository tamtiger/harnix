# PRD - Cắt các nguồn token lớn nhất theo số đo

## Vấn đề (số đo thật, ceil(ký tự/4), repo tạm với home cô lập)

| Nguồn | Chi phí đo được | Tần suất |
| --- | --- | --- |
| Hook context khi có active task | 1.307 token ở fixture JavaScript; repo Harnix có guides `typescript.md` + `common.md` = 11.565 ký tự, ước ~2,9k token | **mỗi prompt**, tích lũy trong context vì không khử trùng lặp theo phiên |
| `harnix epic <id>` (epic overhaul) | 16.533 byte, ~4,1k token, do mỗi member kèm `goal` | mỗi lần xem epic |
| `workflow --preflight` | 79-104 token ở repo trống, ~375 token ở repo này (learning chiếm ~70%) | mỗi stage |
| Lệnh `workflow` không `--brief` | transition 195-198, criterion 259, finish 270, save 196 token; có `--brief` còn 30-85 | mỗi lệnh |
| `workflow.md` | ~3,6k token (cookbook hai shell ~690, mỗi phiên chỉ dùng một khối) | mỗi lần đọc |
| `--save` envelope sai | thông báo "unknown schema field" không nêu tên field, agent phải đoán và gửi lại | mỗi lần sai |

Toàn bộ vòng đời Lite có `--brief` chỉ ~0,3k token output, nên chi phí lặp mỗi prompt của hook là nguồn lớn nhất, sau đó mới tới đọc lại tài liệu.

## Mục tiêu

Giảm các nguồn trên theo thứ tự đo được, không cắt guard và không đổi schema v3. Số trước/sau lấy từ `pnpm run measure:tokens` (task `measure-token-baseline` phải hoàn tất trước).

## Acceptance

- **ac-hook-pointer** - Hook context chỉ liệt kê guide (đường dẫn + kích thước), vẫn nhúng file nguồn/task, tổng giảm >=60% so với 1.307 token. **Verifies:** `test/unit/core/context/context.test.ts` (chunk guide là con trỏ, manifest vẫn có `contentHash` để drift hoạt động) và `chk-measure`.
- **ac-preflight-learning** - `learning` chỉ có nội dung khi `nextStage = plan`. **Verifies:** `test/unit/core/workflow/preflight.test.ts`.
- **ac-rules-docs** - Rule đọc `workflow.md`/`--schema` một lần mỗi phiên; cookbook một khối. **Verifies:** `instruction-budget.test.ts`, `persistence-guidance.test.ts`, `skill-sources.test.ts`.
- **ac-epic-brief** - `harnix epic <id> --brief` nhỏ hơn 25% output đầy đủ. **Verifies:** `test/integration/commands/epic.test.ts`.
- **ac-save-error** - Lỗi envelope nêu tên field lạ và dạng `{ task, ... }`. **Verifies:** `test/unit/core/workflow/envelope.test.ts`.
- **ac-measured** - `measure:tokens` sau thay đổi chứng minh mức giảm, ghi bằng `--add-decision`. **Verifies:** `chk-measure`.
- **ac-hook-whole-entries** - Hook không cắt giữa entry; file từ 1.500 ký tự (kể cả `relevantPaths` như `package.json`) là con trỏ. **Verifies:** `internal-context-boundary.test.ts`, `internal-context-hooks.test.ts`, `context.test.ts`.
- **ac-preflight-brief** - `--preflight --brief` hợp lệ và bỏ `learning`. **Verifies:** `preflight.test.ts`, `workflow-flags.test.ts`.
- **ac-brief-coverage** - Rule 10, cookbook và `--schema` nêu `--brief` cho mọi lệnh ghi theo một tập `BRIEF_ACTIONS` duy nhất ở `src/core/workflow/brief.ts`; lỗi `--brief` liệt kê tập này. **Verifies:** `schema.test.ts`, `persistence-guidance.test.ts`.
- **ac-schema-constraints** - `--schema` có `constraints` (enum, sorted/unique, regex id, `evidenceIds: []`, dạng envelope) khớp validator. **Verifies:** `schema.test.ts`.
- **ac-epic-order** - Member epic theo thứ tự thực thi: `--save` với `epicMembers` báo lỗi khi ID không tăng dần chặt, reference epic dặn idPrefix tăng dần, `nextTask` đúng thứ tự. **Verifies:** `envelope.test.ts`, `epic.test.ts`, `persistence-guidance.test.ts`.
- **ac-run-check-hint** - Lỗi `unsafe for cmd.exe` của `--run-check` nêu cách xử lý (`pwsh.exe` hoặc đường dẫn đầy đủ) và cookbook ghi cách chạy lệnh ghép. **Verifies:** `check-runner.test.ts`, `persistence-guidance.test.ts`.
- **ac-docs-gaps** - `workflow.md` ghi `--platform` bắt buộc cho `context`/`context-report`; reference epic nêu `harnix pause` + `harnix resume <id>` để sửa member không active. **Verifies:** `persistence-guidance.test.ts`.

## Lỗi gặp khi chạy workflow thật (nguồn của 5 criterion mới)

Đều đã xác minh bằng mã hoặc bằng chạy lại; chi tiết ở decision `d-observed-friction`.

| # | Lỗi | Nguyên nhân (mã/guide) | Tác động đo được |
| --- | --- | --- | --- |
| 1 | `--preflight --brief` bị từ chối | `workflow-flags.ts:181-182`, tập `BRIEF_ACTIONS` không có `preflight`, thông báo không nêu lệnh hỗ trợ | một lần chạy lại; preflight ~375 token ở repo này |
| 2 | `--save` task trần: "unknown schema field" | `workflow-helpers.ts:51` không nêu tên field hay dạng `{ task }` | một lần chạy lại mỗi lần sai |
| 3 | `--set-check`/`--add-criterion`/`--set-paths` in lại cả task | `--brief` được hỗ trợ nhưng rule 10, cookbook, `--schema` không nêu | ~1,3k token mỗi lần, 3 lần liên tiếp trong một phiên |
| 4 | `--schema` không có enum/ràng buộc | `schema.ts` chỉ liệt kê tên field | agent phải đọc văn xuôi 3,6k token của `workflow.md` |
| 5 | `harnix context` và `context-report` cần `--platform` | `workflow.md` Public commands không ghi cờ | một lần chạy lại mỗi lệnh |
| 6 | Hook cụt giữa file, nhúng cả `package.json` | `internal-context.ts:156` `slice(0, contentBudget)`; `relevantPaths` nhúng nguyên | trả token cho guide cụt, mỗi prompt |
| 8 | `--run-check -- pwsh ... "a && b"` bị từ chối trên Windows | `check-runner.ts:35`, tên trần đi qua `cmd.exe`, thông báo không nêu cách xử lý | một lần chạy lại và đọc mã runner (gặp khi triển khai task 1) |
| 9 | Epic liệt kê và khuyến nghị member sai thứ tự | `epic.ts:143` sắp theo tên thư mục; mọi member cùng idPrefix nên xếp theo slug; reference epic không dặn tăng dần | trang epic ghi task 2 là #1 và `nextTask` khuyến nghị nó trước task nền (gặp ở epic này) |
| 7 | Không rõ cách sửa member không active | reference epic không nói | một vòng thử sai; cách đúng: `pause` rồi `resume` |

Chưa tái hiện được: một lệnh `--save` dùng heredoc trong Bash tool của agent thất bại với "unexpected EOF"; heredoc nhỏ có dấu vẫn chạy, nên chưa đủ bằng chứng quy lỗi cho Harnix và chưa đưa vào criterion.

## Non-goals

Không thêm cờ patch/`--set-field`, không đổi hình dạng tạo task (đo cho thấy prose goal/criteria chiếm đa số nên mức giảm chỉ ~27%; chờ dữ liệu tần suất sửa task). Không gộp transition/criterion (chạm bảng transition frozen, tiết kiệm ~100 token). Không sửa `AGENTS.md` gốc. Không đổi `context.maxCharacters` mặc định của config hiện có.

## Rủi ro và quyết định cần chủ repo xác nhận

- **d-hook-pointer (đổi hành vi hook đã tài liệu hóa):** guide không còn được nhúng. Hook là no-write nên không khử trùng lặp theo phiên được; con trỏ giữ khả năng phát hiện guide, còn agent đọc guide liên quan theo `AGENTS.md`. Rủi ro: agent bỏ qua con trỏ và mất hướng dẫn kỹ thuật. Giảm thiểu: mục Omitted/con trỏ nằm trong khối untrusted có câu nhắc đọc guide khớp file đang sửa. Chủ repo đã chọn phương án A (con trỏ) ngày 2026-10-01, ghi ở decision `d-hook-pointer-approved`.
- **Nền tảng không hook** chỉ nhận learning qua preflight: giữ nguyên ở stage `plan`, nơi learning có giá trị.
- **Test ngân sách**: rule 2 sửa phải giữ khối luôn nạp <=1.500 token.
- **Frozen contract**: đổi hook, preflight và `epic --brief` đều additive hoặc nén output; cập nhật PRD, `HARNIX_WORKFLOW.md`, `HARNESS_RESEARCH.md` §3.2 và `IMPLEMENTATION_PLAN.md` §4 cùng thay đổi.
