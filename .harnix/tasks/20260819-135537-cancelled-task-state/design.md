# Design — Cancellation terminal flow

```text
planning|ready|in_progress|verifying|blocked
  -- explicit bounded cancel envelope --> cancelled/cancelling
  -- persist terminal task -----------> journal(kind=cancellation)
  -- clear matching .active ----------> no active task
```

Nếu journal hoặc pointer cleanup fail sau task persistence, `.active` vẫn trỏ tới `cancelled/cancelling`. Continue route trạng thái này về `harnix-finish-work`, và `workflow --cancel` retry dùng `cancelledAt`/cancellation ID cũ để không duplicate journal qua ngày UTC.

`completed/finishing` recovery tiếp tục dùng flow hiện tại. Cancel không gọi `canCompleteTask`, không snapshot verification input và không sửa criterion/evidence.