# PRD: Cổng ready kiểm tra nội dung kế hoạch và buộc xác nhận ready-review

## Vấn đề

Ready self-review (12 mục trong `harnix skill harnix-plan --reference ready-review`) chỉ là hướng dẫn cho agent. Cổng `ready` hiện chỉ kiểm tra điều kiện cơ học (có tiêu chí, có check, suite gate, `prd.md`/`plan.md` không rỗng và có checklist). Kết quả quan sát thực tế: kế hoạch Full lên `ready` với placeholder, tiêu chí không có trong `plan.md`, và tiêu chí chỉ được suite toàn dự án phủ (learning `obs-ca850dab386c4ed8` đã lặp 7 lần). Phụ thuộc vào trí nhớ của một agent thì không bền, vì Harnix dùng được trên nhiều repo và nhiều nền tảng.

## Mục tiêu

1. Cổng ready của CLI tự kiểm tra những phần kiểm chứng được bằng máy, dùng được cho mọi nền tảng.
2. Lệnh `--transition ready/ready` của task Full buộc người gọi xác nhận đã chạy ready-review (`--reviewed`) và in checklist cùng phát hiện khi thiếu xác nhận.
3. `--dry-run` cho thấy checklist và phát hiện trước khi chuyển.

## Hợp đồng chính xác

- **Khi nào áp dụng:** chỉ khi task đi vào `ready/ready`, tức bản ghi đã lưu trước đó không ở checkpoint `ready` (planning, hoặc status ready với checkpoint `replan`). Task đã ở `ready/ready` hoặc các trạng thái sau đó không bị kiểm lại; lưu quyết định, đường dẫn hay bằng chứng không bị chặn.
- **Placeholder cứng (chặn với task Full):** `TBD`, `TODO`, `FIXME` (chữ hoa, nguyên từ), `???`, `<placeholder>` (không phân biệt hoa thường). Quét `prd.md` và `plan.md` sau khi bỏ code fence (``` hoặc ~~~) và inline code (`...`). Issue: `<file>:<dòng> placeholder '<token>'`.
- **Cụm hoãn quyết định mềm (chỉ advisory):** so khớp trên văn bản đã bỏ dấu và hạ chữ thường; danh sách cố định: `to be decided`, `decide later`, `if needed later`, `handle appropriately`, `similar to above`, `se quyet dinh sau`, `tinh sau`, `xu ly phu hop`, `tuong tu nhu tren`, `tuy tinh hinh`, `neu can thi`. Advisory: `<file>:<dòng> deferred decision '<cụm>'`.
- **Tiêu chí có trong plan:** mỗi `acceptanceCriteria[].id` (kể cả đã waive thì bỏ qua) phải xuất hiện trong `plan.md`, khớp nguyên từ (không đứng cạnh `[A-Za-z0-9-]`), phân biệt hoa thường. Task Full bị chặn; Lite không có `plan.md` nên không áp dụng.
- **Check chuyên biệt:** mỗi tiêu chí chưa waive phải thuộc `criterionIds` của ít nhất một check `required: true` có `scope: "focused"`. Task Full: issue `criterion '<id>' has no focused required check`. Task Lite: advisory cùng nội dung. Check suite `scope: "full"` không tính.
- **Cờ `--reviewed`:** boolean, chỉ hợp lệ với `--transition`; chỉ bắt buộc khi `mode === "full"` và đích là `ready/ready` và không phải `--dry-run`. Thiếu cờ: ném lỗi `Full task ready requires --reviewed after the ready-review.` kèm checklist rút gọn (12 dòng) và các issues/advisories hiện tại. Cờ không được kiểm chứng (không thể), chỉ buộc người gọi thấy checklist.
- **`--dry-run`:** thêm trường `reviewChecklist: string[]` (chỉ khi đích là `ready` và mode full) vào `DryRunTransitionResult`; issues/advisories gồm các phát hiện mới.
- **`--save`:** áp dụng các kiểm tra nội dung khi vào ready/ready; không có cờ `--reviewed` nên không buộc xác nhận.
- **Lỗi đầu tiên:** `assertReadyRequirements` giữ ngữ nghĩa "ném issue đầu tiên"; thứ tự: obligation, suite gate, artifact, placeholder, tiêu chí trong plan, check chuyên biệt.

## Không làm

- Không phân tích ngôn ngữ tự nhiên ngoài các token và cụm cố định ở trên; không chặn bằng cụm mềm.
- Không đổi trạng thái hay chặn lưu của task đã ở ready/ready; không đổi `preflight` (giữ ngắn gọn theo token economy).
- Không đổi schema TaskRecord.
- Không nới cổng để fixture test cũ đạt: cập nhật fixture dùng chung.

## Rủi ro

- Test và fixture dùng task Full tới ready sẽ cần plan có id tiêu chí và check focused: cập nhật `test/support` thay vì bỏ cổng.
- Golden `behavior-snapshot` đổi do `--schema`/`--transition`: chỉ chấp nhận khi diff đúng phần dự kiến.
- Giới hạn ngân sách token của hướng dẫn (`instruction-budget.test`): tài liệu thêm phải gọn.
- Phiên bản: task này làm trước nên là `2.2.0-dev.1`; Task 2 chuyển sang `2.2.0-dev.2`.
