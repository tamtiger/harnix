# PRD: Chuẩn hóa kết thúc dòng khi băm inputDigest, giữ tương thích digest cũ

## Bối cảnh & Vấn đề
`hashEntries` trong `src/core/verification/input-digest.ts` băm byte thô của từng file input. Cùng một nội dung nhưng LF và CRLF cho hai hash khác nhau. Trên Windows với `core.autocrlf=true`, các thao tác Git như `git stash push -u` rồi `pop` có thể ghi lại file với CRLF, làm một check đã pass bị báo `digest-mismatch` dù nội dung không đổi (báo cáo thực địa: file mới chưa track bị stale, file đã track thì không). Nguyên nhân của việc stash cụ thể là giả thuyết; điều chắc chắn là digest phụ thuộc EOL.

Digest hiện có hai công thức được chấp nhận: hiện hành (`digest: 4`, hợp đồng của riêng từng check) và cũ (`digest: 3`, hợp đồng cả task) nhận qua `legacyInputDigest`. Cả hai đều dựa trên hash byte thô.

Thêm vào đó ba file nguồn bị Git coi là nhị phân: `src/core/verification/input-digest.ts` (kết thúc dòng chỉ là CR), `src/core/workflow/init-task.ts` và `test/unit/core/tasks/task-validate-contracts.test.ts` (mỗi file có một byte NUL ở ký tự escape), nên diff và dashboard `## Code impact` không hiển thị được.

## Ranh giới & Ràng buộc
- Không đổi schema TaskRecord/Evidence và không lưu thêm file snapshot; digest vẫn được tính lại, không lưu.
- Bằng chứng đã ghi dưới công thức byte thô vẫn phải được coi là fresh khi nội dung không đổi: không check nào bị stale chỉ vì đổi công thức.
- Chỉ chuẩn hóa `CRLF` thành `LF` ở file văn bản; file chứa byte NUL (nhị phân) giữ nguyên byte; CR đơn lẻ giữ nguyên.
- Bước định dạng ba file nguồn là thay đổi chỉ định dạng, tách khỏi logic; hành vi chạy không đổi.

## Yêu cầu kỹ thuật cốt lõi
- Module mới `src/core/verification/line-endings.ts`: `isTextContent(buffer)` (không có byte NUL) và `normalizeLineEndings(buffer)` (thay `\r\n` bằng `\n` cho file văn bản).
- `computeInputDigest` đọc mỗi file một lần và tính hai bộ entry: đã chuẩn hóa (`entries`, dùng cho `inputDigest` hiện hành, vẫn `digest: 4`) và byte thô. Thêm `rawInputDigest` (cùng công thức `digest: 4` trên entry byte thô). `legacyInputDigest` (`digest: 3`) giữ nguyên trên entry byte thô.
- `digestMatches` chấp nhận `inputDigest`, `rawInputDigest` hoặc `legacyInputDigest`. Repo chỉ có file LF: `inputDigest` và `rawInputDigest` trùng nhau, không digest đã lưu nào đổi.
- Các nơi ghi evidence (`--run-check`, `--evidence`) vẫn ghi `inputDigest` mới.

## Rủi ro & Chiến lược giảm thiểu
- Chấp nhận thêm một công thức làm nới điều kiện fresh: hai công thức đều gắn với cùng nội dung file nên không cho phép nội dung khác đi qua; ghi rõ bằng test.
- Evidence ghi bằng hash thô khi file đang CRLF rồi file chuyển sang LF vẫn stale (không khôi phục được); chỉ evidence mới được hưởng lợi. Ghi nhận như giới hạn đã biết.
- Đọc và chuyển đổi toàn bộ nội dung file thành chuỗi tạm: dùng chuyển đổi theo byte (`latin1`) và giữ giới hạn đồng thời `HASH_CONCURRENCY`.
