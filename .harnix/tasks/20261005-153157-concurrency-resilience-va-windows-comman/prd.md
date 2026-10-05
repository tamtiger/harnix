# PRD - Concurrency Resilience và Windows Command Auto-Normalization

## 1. Mục tiêu
- Nâng cao độ bền bỉ khi chạy đồng thời nhiều lệnh mutation hoặc `run-check` bằng cách nâng timeout lock từ 5 giây lên 30 giây kèm backoff có jitter, tránh lỗi `Timed out waiting for Harnix lock`.
- Tự động normalize các command phổ biến trên Windows (`npm`, `pnpm`, `npx`, `yarn`, `corepack`, hoặc lệnh tìm thấy trong PATH có đuôi `.cmd`/`.bat`) để bọc qua `cmd.exe /d /s /c` an toàn, tránh lỗi CVE-2024-27980 `spawn EINVAL`.

## 2. Tiêu chí nghiệm thu (Acceptance Criteria)
### ac-1: Concurrency Resilience và Windows Command Normalization
- File lock tăng timeout mặc định lên 30.000 ms với retry delay và jitter thích hợp.
- Runner trên Windows tự động nhận diện `npm`, `pnpm`, `npx`, `yarn` và dispatch an toàn qua `cmd.exe /d /s /c`.
- Suite gate pass 100%.
