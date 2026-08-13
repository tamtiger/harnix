# Design — Workflow obligation fail closed

## Task naming và progress tracking

Task ID dùng grammar `YYYYMMDD-HHMMSS-<kebab-slug>[-<collision-number>]`, trong đó `<kebab-slug>` gồm các token lowercase alphanumeric không rỗng, phân tách bằng một dấu `-`. Cần có một canonical validator dùng chung cho TaskRecord identity, `.active` và safe task-directory resolution để tránh regex drift.

Implementation checklist nằm trong `plan.md`, không nằm trong TaskRecord để không đổi schema v1. Mỗi checkbox có stable slice ID (`S0`, `S1`, ...) và ánh xạ đúng một implementation slice. Checkbox chỉ là progress projection; acceptance criteria và persisted evidence vẫn quyết định ready/finish.

## Mô hình boundary

```text
incoming task envelope
        |
        v
validate schema và active identity
        |
        v
load previously persisted task -----------------+
        |                                        |
        v                                        v
validate legal transition             compare immutable obligations
        |                                        |
        +--------------------+-------------------+
                             v
             ready/finish-specific invariant checks
                             |
                             v
                 atomic task/artifact persistence
```

Task đã persist trước đó là obligation baseline. Incoming payload được phép thêm criterion/check, record evidence, chuyển pending criterion sang `met` hoặc `waived`, và đi qua legal status/checkpoint transition. Payload không được xoá hoặc mutate acceptance criterion ID/text hay required validation check ID/description/command/scope/required đã tồn tại; clarification phải là obligation bổ sung vì persistence không thể phân loại semantic weakening một cách xác định.

## Ready validation

Ready validation diễn ra bên trong `saveWorkflow`, sau khi load prior task và trước bất kỳ write nào:

1. Xác minh có ít nhất một acceptance criterion.
2. Xác minh có ít nhất một required validation check.
3. Xác minh prior criteria và required checks vẫn còn đầy đủ.
4. Với Full mode, resolve active task directory bằng safe project path rồi đọc `prd.md`, `plan.md` không rỗng từ disk.
5. Reject mà không mutate task file hoặc `.active` nếu bất kỳ check nào fail.

## Finish validation

Finish tiếp tục dùng latest-evidence và freshness rules nhưng phải đánh giá các obligation đã vượt qua monotonic persistence validation. Vì vậy collection rỗng không thể trở thành completion shortcut. Completion vẫn giữ atomic order hiện hành: completed task, journal, archive và exact pointer cleanup.

## Forced-mode diagnostic

`routeWorkflow` giữ explicit mode precedence. Khi `explicitMode === "lite"` và `riskSignals.length > 0`, append một stable conflict reason trong khi vẫn giữ `explicit-lite` là primary reason. Không thêm status, owner, package hoặc approval state mới.

## Context trust boundary

Context formatter reserve một header và footer nhỏ, cố định trước khi áp dụng character budget hiện có. Repository excerpt vẫn là dữ liệu thông thường nằm giữa hai delimiter. Test phải assert deterministic ordering, omission disclosure, byte budget và việc không có out-of-scope canary content. Structural mitigation này không claim khả năng kiểm soát undocumented message-role behavior của external host.

## Thứ tự self-host

Đối với task trong repository Harnix:

```text
implementation green
  -> tăng patch version
  -> cập nhật changelog
  -> project update/reconcile metadata
  -> self-host test
  -> broader acceptance/release gates
  -> completion persistence
```

Update result phải phân biệt managed-content change với metadata-only reconciliation mà không thay đổi ownership rules.
