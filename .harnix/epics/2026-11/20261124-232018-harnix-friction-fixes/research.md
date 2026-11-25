# Nghiên cứu: giảm ma sát dùng Harnix

Ngày 2026-11-24. Nền cho epic `20261124-232018-harnix-friction-fixes`. Hai nguồn: (A) phản hồi của một người dùng sau một epic thực tế (7 điểm), (B) phân tích mức nạp skill và reference qua transcript phiên. Mọi nhận định của (A) được đối chiếu với mã bằng ba lượt đọc độc lập (chỉ đọc); phần tái hiện bằng CLI thật chỉ có ở điểm 6.

## 1. Đo mức nạp skill và reference (nguồn B)

Quét nguyên văn transcript Claude Code, 88 phiên có dùng harnix từ 2026-10-23 đến 2026-11-24 (loại phiên đang làm việc này), 64 phiên có dùng `harnix workflow`. Đếm lệnh `harnix skill ...` và lời gọi công cụ `Skill`.

| Đối tượng | Kết quả |
| --- | --- |
| `harnix-plan` / `implement` / `verify` / `review` / `research` | nạp ở 48 / 36 / 20 / 15 / 2 phiên |
| 8 technique skill và `harnix-debug` | 0 lần nạp (cả qua `harnix skill` lẫn công cụ `Skill`) |
| `suggestedTechniques` trong preflight | xuất hiện ở 16 phiên, 15 lần là `harnix-sequential-thinking`; không phiên nào nạp skill được gợi ý |
| Reference | 11 trong 49 từng được nạp; nhiều nhất `plan:epic` (11), `plan:replan` (7), `verify:cookbook-commands` (7), `plan:ready-review` (5) |
| Dòng nhắc "trước khi freeze obligations, nạp `harnix-verification-gap`" | có trong `harnix-plan` từ 2026-10-01, trước mọi phiên đã quét; vẫn 0 lần nạp |

Nguyên nhân (đã xác minh bằng mã): `suggestedTechniques` chỉ là mảng tên (`src/core/workflow/preflight.ts` `suggestTechniques`), không `.md` hay template nào dặn hành động khi có gợi ý, và `mode === "full"` luôn thêm `sequential-thinking`.

Giới hạn: chưa quét transcript của subagent và của nền tảng khác (Codex, Cursor...); chưa đo "nạp rồi có làm theo không"; "không nạp" chưa chắc là vô ích vì quy tắc cốt lõi đã nằm trong skill chính. Phương pháp để chạy lại: duyệt các JSONL phiên, đếm lệnh Bash/PowerShell khớp `harnix skill <tên> [--reference <chủ đề>]` và lời gọi `Skill` tên `harnix-*`, rồi đối chiếu với `suggestedTechniques` trong kết quả preflight cùng phiên. So sánh lại sau vài tuần sẽ cho biết thay đổi của member 3 có tác dụng không.

## 2. Bảy điểm phản hồi và kết luận sau đối chiếu

| # | Nhận định | Hiện trạng thật | Quyết định |
| --- | --- | --- | --- |
| 1 | Cổng quy trình không chặn sửa code sớm | Đúng: quy tắc chỉ là chữ (`workflow.md:38`). Hook `PreToolUse` chỉ có matcher `Grep\|Bash\|PowerShell`, in context tĩnh, chỉ Claude; Kiro, Antigravity, Codex, OpenCode, Cursor không có nhánh này | Không làm hook Edit/Write. Làm advisory CLI so `git status` trong `relevantPaths` (member 2) |
| 2 | Quá nhiều lệnh để hoàn tất task | Đúng một phần: batch `--criterion --met --transition verifying/finishing --finish` đã có (`workflow.md:61`, `workflow-flags.ts:90`); chuỗi tối thiểu khoảng 5 lệnh. `ready/ready`, ủy quyền triển khai và review là điểm dừng bắt buộc | Không thêm `--complete`; cho `--run-checks` vào batch và đưa lệnh gợi ý vào `nextAction` (member 1) |
| 3 | `--run-check` đòi lệnh trùng từng ký tự; đuôi lỗi bị cắt | Đúng. `assertDeclaredCommand` (`run-check.ts:63`); `--run-checks` đã chạy lệnh khai báo không cần argv; fail chỉ giữ tối đa 10 dòng `FAIL` kiểu vitest hoặc 600 ký tự cuối, không lưu ở đâu (comment `run-check.ts:80` ghi quyết định "never persisted") | `--run-check <id>` không cần `--`; log lỗi ở `.harnix/tmp/check-logs` (member 1, cần người dùng xác nhận) |
| 4 | Tiêu chí nháp ở member lệch code thực tế | Đúng một phần: chưa có cảnh báo theo thời gian hay commit dù `createdAt` đã có; bước đối chiếu đã có trong `harnix-plan` (replan) | Advisory ở `ready --dry-run` từ `git log` (member 2); gợi ý check theo loại tiêu chí đặt ở reference, không vào CLI |
| 5 | Rác trong git (cache, journal, LF/CRLF) | Đúng: `init` và `update` không ghi `.gitignore` hay `.gitattributes`. Repo harnix có `.harnix/cache/` trong `.gitignore` nhưng `repo-map-v1.json` bị theo dõi từ commit cũ nên doctor báo `cache-tracked`; `.gitattributes` của repo này đã có `* text=auto eol=lf` nên cảnh báo CRLF là của repo người dùng | `.harnix/.gitignore` và `.harnix/.gitattributes` do init/update ghi (member 5); journal vẫn theo dõi |
| 6 | Chi phí context mỗi lượt | Phần lớn sai: hook đã ẩn khi payload không đổi (đo: lượt 1 746 ký tự, lượt 2 cùng session 0 byte), lean là mặc định. Đúng một phần: header `Status: x/y` nằm trong phần băm nên đổi trạng thái là chèn lại; note học chưa cấu hình được giới hạn và chưa gom note gần trùng | Bỏ Status khỏi băm, `context.learningMax`, gom note Jaccard (member 4) |
| 7 | Soạn prd.md và plan.md thủ công | Đúng một phần: `--init --mode full` đã sinh khung; thiếu là sinh lại hoặc nạp file cho task đã tồn tại | `--scaffold-docs` cho task Full đang planning (member 6) |

Thêm từ phân tích nạp skill: dòng premortem vào `READY_REVIEW_CHECKLIST` (member 2), advisory khi evidence chỉ `code-only` hoặc `partial` mà chưa có risk (member 2), `techniqueHint` và thu hẹp quy tắc Full luôn gợi ý (member 3).

## 3. Không làm và lý do

- Hook Edit/Write: chỉ phủ một nền tảng, phải đọc `task.json` mỗi lần Edit, ranh giới "hook không giữ state" mờ.
- Action `--complete`: batch sẵn có đã đủ; gộp thêm sẽ làm mờ điểm dừng bắt buộc.
- Lưu digest lúc vào planning: cần trường mới trong TaskRecord đóng băng.
- Bộ đếm mức dùng skill trong harnix: `harnix skill` hiện là lệnh đọc, thêm ghi làm nó mất tính chỉ đọc, và gần quy tắc không telemetry; phân tích transcript ngoài harnix là đủ.
- Member epic dạng Full: thay đổi riêng của `init-epic`.

## 4. Ràng buộc chung

- Template `workflow.md` ~2300/2500 token: chỉ member 1 và member 6 được chạm, các member khác viết vào docs, PRD hoặc reference; không nâng `token-budgets.json`.
- Mọi cờ hoặc action mới theo checklist "Thêm cờ hoặc action workflow" của AGENTS.md (bảng `WORKFLOW_ACTIONS`, `--schema`, golden chỉ cho chuỗi mới, docs, `selfhost:sync`).
- Mỗi member kiểm bằng CLI thật (`scripts/exercise-*.mjs`), vì unit test từng bỏ sót lỗi đăng ký reference ở 2.38.2 và `test:gates` thiếu dấu cách ở epic trước.
- Epic review: một lượt reviewer độc lập trên toàn diff trước finish member cuối, và nếu có bản sửa thì cần lượt kiểm lại.

## 5. Điều cần người dùng xác nhận khi duyệt

1. Lưu output lệnh ra đĩa khi check fail (`.harnix/tmp/check-logs`, tối đa 64 KB, đã che): chấp nhận hay chỉ nới đuôi tóm tắt?
2. `techniqueHint` mở rộng hợp đồng preflight một dòng: chấp nhận không?
3. Journal vẫn được theo dõi mặc định, chấp nhận không?
4. Advisory sửa code sớm chỉ so với HEAD (heuristic, có thể dương tính giả), chấp nhận không?
5. Ngưỡng tiêu chí nháp cũ (đề xuất 3 ngày hoặc có commit chạm `relevantPaths`) và ngưỡng `sequential-thinking`.

## 6. Số đo cơ sở và cách đo lại (member 3, 2026-11-25)

Số đo cơ sở là bảng ở mục 1: 88 phiên từ 2026-10-23 đến 2026-11-24, 64 phiên dùng `harnix workflow`; `plan` nạp 48, `implement` 36, `verify` 20, `review` 15, `research` 2; 8 technique skill và `harnix-debug` nạp 0; `suggestedTechniques` xuất hiện ở 16 phiên (15 lần là `harnix-sequential-thinking` vì mọi task Full); 11 trong 49 reference từng được nạp.

Cách đo lại, hoàn toàn ngoài harnix:
1. Lấy các file JSONL của phiên Claude Code (mỗi phiên một file dưới thư mục dự án của Claude), chỉ giữ phiên có chuỗi `harnix` và loại phiên đang chạy.
2. Với mỗi lời gọi công cụ Bash hoặc PowerShell, đếm lệnh khớp `harnix skill <tên> [--reference <chủ đề>] [--raw]`, và đếm lời gọi công cụ `Skill` có tên bắt đầu bằng `harnix-`.
3. Với mỗi kết quả công cụ có `"suggestedTechniques":[...]` (và `"techniqueHint"` sau member 3), ghi tên được gợi ý rồi đối chiếu xem cùng phiên có nạp đúng skill đó sau lần gợi ý hay không.
4. So sánh tỉ lệ "được gợi ý rồi nạp" và số reference từng nạp với bảng ở mục 1. Mốc đề nghị: đo lại sau ít nhất 4 tuần dùng bản `2.40.0` trở lên.

Harnix không thêm bộ đếm, telemetry hay ghi nhật ký mức dùng skill: `harnix skill` vẫn là lệnh chỉ đọc, và phân tích trên là việc của người đọc transcript của chính họ. Giới hạn cũ vẫn đúng: chưa quét transcript của subagent hay nền tảng khác, và chưa đo "nạp rồi có làm theo không".
