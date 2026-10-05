# Epic: Hardening do tin cay thuc thi check va cong thai hoc workflow Harnix

Giai quyet triet de 6 van de lon gap phai trong thuc te: loi Windows spawn EINVAL khi chay .cmd, thieu validate input globs, thieu baseline check truoc khi freeze contract, thieu atomic replacement cho failed check, thieu multi-repo discovery trong verify-plan, va rao can thao tac PowerShell CLI.

- **Cập nhật:** 2026-10-05 13:46:54 +07:00

## Non-goals

- Khong thay doi kien truc luu tru local cua .harnix
- Khong bo sung network telemetry hoac daemon nen

## Next task

Không còn task nào chưa hoàn tất.

## Members (4 tasks)

| # | Task ID | Title | Status |
|---|---------|-------|--------|
| 1 | `20261005-134655-windows-runner-glob-validation` | Khac phuc Windows spawn runner cho .cmd/.bat va tang cuong chan doan input globs | `completed` |
| 2 | `20261005-134656-atomic-replace-check` | Bo sung transport thay the atomic cho required check da fail | `completed` |
| 3 | `20261005-134657-baseline-checks-and-dryrun` | Co che baseline check truoc freeze contract va dry-run transition | `completed` |
| 4 | `20261005-134658-multirepo-discovery-and-task-cli` | Ho tro multi-repository discovery trong verify-plan va CLI tao task tien dung | `completed` |

## Task Overview & Scope

### 1. `20261005-134655-windows-runner-glob-validation` — Khac phuc Windows spawn runner cho .cmd/.bat va tang cuong chan doan input globs

- **Trạng thái:** `completed`
- **Mục tiêu:** Sua loi spawn EINVAL khi chay cac lenh .cmd/.bat tren Windows qua check-runner va cai thien do ro rang cua thong bao loi khi input globs khong match file nao.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 2. `20261005-134656-atomic-replace-check` — Bo sung transport thay the atomic cho required check da fail

- **Trạng thái:** `completed`
- **Mục tiêu:** Bo sung co lenh workflow --replace-check de thay the nguyen tu mot check da fail bang mot check moi ma van dam bao tinh bat bien cua hop dong va tieu chuan kiem thu.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 3. `20261005-134657-baseline-checks-and-dryrun` — Co che baseline check truoc freeze contract va dry-run transition

- **Trạng thái:** `completed`
- **Mục tiêu:** Them kiem tra baseline cho cac required checks truoc khi dong bang contract tai ready va ho tro transition dry-run de phat hien som loi cau hinh.
- **Tiêu chí nghiệm thu:** 3 tiêu chí

### 4. `20261005-134658-multirepo-discovery-and-task-cli` — Ho tro multi-repository discovery trong verify-plan va CLI tao task tien dung

- **Trạng thái:** `completed`
- **Mục tiêu:** Bo sung kha nang phat hien da repository/solution long nhau trong verify-plan va CLI tien dung de khoi tao task ma khong can dung hash literal phuc tap trong shell.
- **Tiêu chí nghiệm thu:** 3 tiêu chí
