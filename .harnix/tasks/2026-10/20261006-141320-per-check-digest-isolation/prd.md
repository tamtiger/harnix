# PRD: Cô lập digest của từng check khỏi định nghĩa các check khác

## Vấn đề

`computeInputDigest` (`src/core/verification/input-digest.ts`) băm toàn bộ hợp đồng task vào digest của mọi check: `canonicalTaskContract` gồm id và text của mọi tiêu chí và định nghĩa của mọi check. Hệ quả quan sát được trong phiên thực tế: sau `--replace-check` cho check-1 và check-3, bằng chứng pass hợp lệ của check-2 (code không đổi) bị stale vì "task.json đổi", và phải chạy lại suite chỉ vì một thao tác obligation không liên quan.

## Mục tiêu

1. Digest của check X chỉ phụ thuộc: id task, mode, định nghĩa của chính X, id và text các tiêu chí X phủ, và sha256 thô của file input của X.
2. Thao tác trên check hoặc tiêu chí không liên quan không làm stale bằng chứng của X.
3. Task chưa finish đang mang evidence ghi bằng công thức cũ không bị buộc chạy lại khi hợp đồng task chưa đổi.

## Hợp đồng chính xác

- **Hợp đồng của một check** (`checkContract`): JSON `{ schemaVersion: 3, taskId, mode, check: <canonicalCheck>, criteria: [{ id, text }...] }` với `canonicalCheck` giữ nguyên các trường hiện có (`id, description, command|null, scope, required, criterionIds` sắp xếp, `inputs`, `cwd` khi có) và `criteria` là các tiêu chí có id thuộc `check.criterionIds`, sắp xếp theo id. Id tiêu chí không tồn tại trong task bị bỏ qua (validator đã chặn trường hợp này).
- **Công thức mới:** `inputDigest = sha256(JSON.stringify({ digest: 4, taskId, checkId, taskContractHash, entries }))` với `taskContractHash = sha256(checkContract)`. Khóa `taskContractHash` của output `--snapshot` được giữ để không đổi hình dạng output công khai, nhưng nay là hash hợp đồng của riêng check.
- **Công thức cũ** (`digest: 3`, hợp đồng toàn task) được tính thêm trong `computeInputDigest` từ cùng `entries` (không thêm I/O) và nằm ở trường `legacyInputDigest` của kết quả nội bộ; `--snapshot` không in trường này.
- **Hàm so khớp duy nhất** `digestMatches(snapshot, recorded)` trong `input-digest.ts`: đúng khi `recorded` bằng `inputDigest` mới hoặc `legacyInputDigest`. Một evidence cũ khớp công thức cũ nghĩa là toàn hợp đồng task chưa đổi, nên nhận fresh là an toàn.
- **Nơi phải dùng hàm so khớp:** `check-report.ts` (status/audit), `assertNewEvidenceDigests` và `assertInputDigestsFresh` (save, finish), `criterion.ts`, `suite-gate.ts`. `run-check.ts`, `evidence-flags.ts` và `snapshot.ts` chỉ dùng digest mới.
- **Không đổi:** so sánh hai evidence với nhau (`completion.ts`, `task-audit.ts`) vì chúng không tính lại digest; ngưỡng retry-guard so digest thất bại giữa các lần chạy (chấp nhận việc công thức đổi làm lần chạy đầu sau nâng cấp không bị coi là "giống hệt" lần trước).
- **Mode:** vẫn nằm trong hợp đồng vì cổng ready/finish khác nhau theo mode.

## Không làm

- Không làm yếu việc phát hiện đổi input hay đổi định nghĩa của chính check; không viết lại hay xóa evidence cũ; không đổi schema TaskRecord.
- Không nới luật bất biến obligation (check đã pass và tiêu chí đã có evidence vẫn immutable).

## Rủi ro

- Bỏ ràng buộc chéo nghĩa là đổi tiêu chí không được check X phủ không còn làm stale X; chấp nhận vì X không chứng minh tiêu chí đó. Test khẳng định điều này.
- Test hiện có dựa trên digest cũ (golden `--snapshot`, test finish/stale) cần được rà; chỉ chấp nhận diff golden có chủ đích.
- Phiên bản: `2.2.0-dev.3`.
