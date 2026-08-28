# PRD - Standalone research route

## Outcome

Harnix định tuyến một yêu cầu research chỉ đọc độc lập qua `harnix-research` ở Bypass, không đọc hoặc mutate active task, đồng thời giữ nguyên research có persistence trong planning/replan/debugging.

## In scope

- Bổ sung `research` vào routing action và `harnix-research` vào owner projection nội bộ.
- Route `mutation: none` + `action: research` trước active-task routing với reason ổn định `standalone-research`.
- Tách canonical `harnix-research` thành standalone read-only profile và active-task profile.
- Đồng bộ activation, project/global instructions, workflow template, self-hosted generated output, normative docs, tests và patch release.

## Out of scope

- Không thêm skill thứ tám, public CLI, persisted schema, hook protocol, network service hoặc MCP.
- Không thay đổi task-scoped research artifact contract, material-unknown gate hoặc stage transition.
- Không thêm external-derived behavior; `NOTICE` và feature provenance registry giữ nguyên.

### AC `ac-standalone-research-route`

Với `action: research` và `mutation: none`, router trả `entry: bypass`, `owner: harnix-research`, `reasonCodes: [standalone-research]` trước khi xét unrelated active task. Research có mutation vẫn đi qua lifecycle/task owner hiện hành.

### AC `ac-research-profile`

Canonical `harnix-research` mô tả hai profile tách biệt: standalone profile không đọc task state, không persist và chỉ trả report có source/fact/inference/conclusion/uncertainty; active-task profile chỉ nhận planning/replan/debugging và giữ workflow-save artifact contract hiện tại.

### AC `ac-managed-parity`

PRD, workflow, research/mapping, activation, AGENTS/template và byte-identical skill output trên Kiro, Antigravity, Codex cùng diễn đạt contract mới mà không tạo skill hoặc platform surface mới.

### AC `ac-release-readiness`

Package patch version và changelog được cập nhật một lần trước verifying; focused tests và exact acceptance sequence mục 11 pass với worktree không có lỗi whitespace hoặc generated drift.