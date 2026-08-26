# Research: Protocol lock-directory không xóa replacement

- Task: `20260826-041901-review-findings-remediation`
- Ngày truy cập: 2026-08-26
- Material unknown: Node.js 18+ có primitive portable nào để publish/reclaim lock mà không tạo TOCTOU compare-then-delete trên một path file?

## Quyết định có thể thay đổi

Chọn giữa tiếp tục file lock với read/compare/remove, publish prepared directory bằng `rename`, hoặc dùng `mkdir` canonical directory với unique owner token và post-write ownership verification.

## Repository evidence

- `src/utils/file-lock.ts` đọc lại exact bytes rồi gọi `rm(path)`, nên replacement có thể xuất hiện giữa hai syscall.
- Regression `never removes a replacement installed after the final stale-lock identity read` tái hiện deterministic: contender acquire thành công sai thay vì timeout.
- Setup/reconcile hiện coi `managed.lock` là một file record; các helper này phải đổi cùng protocol nếu contract đổi.

## Nguồn chính

1. Node.js v18.20.3 File System API, `fsPromises.mkdir`: khi `recursive:false`, gọi trên directory đã tồn tại bị reject (`EEXIST` được nêu ở callback API). https://nodejs.org/download/release/v18.20.3/docs/api/fs.html#fspromisesmkdirpath-options
2. Node.js v18.20.3 File System API, race guidance: check accessibility rồi mới dùng path tạo race; nên gọi primitive trực tiếp và xử lý lỗi. https://nodejs.org/download/release/v18.20.3/docs/api/fs.html#fspromisesaccesspath-mode
3. Node.js v18.20.3 File System API, `fsPromises.rename`: chỉ cam kết rename; không cung cấp option create-if-absent/no-overwrite portable. https://nodejs.org/download/release/v18.20.3/docs/api/fs.html#fspromisesrenameoldpath-newpath
4. Node.js v18.20.3 File System API, `fsPromises.rmdir`: xóa directory theo primitive riêng; recursive removal bị deprecate và `rm(..., {recursive:true})` là cơ chế khác. https://nodejs.org/download/release/v18.20.3/docs/api/fs.html#fspromisesrmdirpath-options

## Facts

- Promise filesystem calls không được Node tự đồng bộ/thread-safe; chuỗi read rồi remove không phải một thao tác atomic.
- `mkdir` với `recursive:false` là primitive trực tiếp có failure-on-existing, phù hợp làm candidate claim.
- API `rename` không cung cấp cờ exclusive/no-replace, nên không thể lấy nó làm contract portable cho publish prepared directory.
- Non-recursive directory removal tách biệt với recursive `rm`; directory mới có entry sẽ không được cleanup như một subtree.

## Inference và thiết kế chọn

Đây là suy luận Harnix, không phải bảo đảm lock cấp cao từ Node:

1. `mkdir(lockPath, {recursive:false})` tạo candidate directory.
2. Candidate ghi record schema v1 vào file token có claim UUID riêng.
3. Candidate chỉ trở thành owner sau khi readdir thấy đúng một token của mình và bytes khớp; nếu empty directory bị reclaim trong cửa sổ ghi, verification ngăn owner cũ và owner mới cùng vào critical section.
4. Reclaim/release chỉ reread rồi unlink token UUID đã quan sát, sau đó gọi `rmdir(lockPath)` không recursive. Nếu directory đã được owner mới tạo, delayed unlink nhắm token cũ không tồn tại và `rmdir` gặp directory không rỗng, nên preserve replacement.
5. Malformed Harnix token cũ có thể reclaim theo tuổi bằng cùng token-specific flow. Path file từ protocol legacy không có token an toàn để CAS-delete, nên phải preserve/fail closed thay vì tự xóa.

## Phương án loại

- Giữ read/compare/remove file: vẫn có TOCTOU giữa compare và remove.
- Prepared directory + `rename`: Node không cam kết no-overwrite/create-if-absent portable.
- Recursive remove lock directory: có thể xóa replacement vừa được tạo, lặp lại lỗi ban đầu ở cấp directory.
- Thêm dependency/advisory lock: tăng dependency/portability surface và không cần thiết khi protocol token-directory giải quyết contract hiện tại.

## Kết luận và tác động

Đổi `managed.lock` thành canonical ownership directory chứa đúng một unique-token record file. Cập nhật `file-lock`, setup root ownership helper, global reconciliation helper, unit/platform/integration tests và normative docs. Giữ record JSON schema v1; chỉ container/cleanup protocol đổi. Không auto-migrate stale legacy file lock.

## Hạn chế và trigger

Protocol bảo đảm giữa các Harnix process cùng version/protocol trên filesystem có semantics Node hỗ trợ; không thể đồng bộ an toàn với một Harnix cũ vẫn dùng single-file lock hoặc với actor ngoài protocol. Nếu phải hỗ trợ cross-version concurrent mutation, cần product decision về OS advisory lock/dependency riêng trước khi triển khai.