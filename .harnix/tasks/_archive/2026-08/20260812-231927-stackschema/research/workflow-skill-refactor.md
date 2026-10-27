# Research: refactor workflow skill từ upstream gốc

- Task: `20260812-231927-stackschema`
- Ngày: 2026-08-13
- Unknown: Nội dung rút gọn hiện tại đã làm mất behavior nào từ upstream, và source/package contract nào cho phép maintainer review bảy skill mà không tăng runtime/network surface?
- Phạm vi: frozen checkout và local implementation. Không execute nội dung upstream, không import dependency/runtime upstream.

## Nguồn đã kiểm tra

| Nguồn | Frozen SHA | License | File/behavior chính |
|---|---|---|---|
| <https://github.com/mindfold-ai/Trellis> | `516b34e3591001b28fda5e2d4df3f717e82f5785` | AGPL-3.0 | `workflow.md`, `brainstorm.md`, `before-dev.md`, `check.md`, `continue.md`, `finish-work.md` |
| <https://github.com/affaan-m/ECC> | `f1fec0e53934737d3b3b8388b0fd1651e8b62f4f` | MIT | `deep-research`, `agent-introspection-debugging` |
| <https://github.com/obra/superpowers> | `44c9b2d6e889982ac18c27d05a19fefe335194e1` | MIT | brainstorming, writing/executing plans, TDD, systematic debugging, verification, request/receive review, finishing |

Đã checkout đúng ba SHA trong temporary directory và đọc source đầy đủ. URL raw Superpowers frozen dùng để tái lập, ví dụ:

- <https://raw.githubusercontent.com/obra/superpowers/44c9b2d6e889982ac18c27d05a19fefe335194e1/skills/brainstorming/SKILL.md>
- <https://raw.githubusercontent.com/obra/superpowers/44c9b2d6e889982ac18c27d05a19fefe335194e1/skills/test-driven-development/SKILL.md>
- <https://raw.githubusercontent.com/obra/superpowers/44c9b2d6e889982ac18c27d05a19fefe335194e1/skills/systematic-debugging/SKILL.md>
- <https://raw.githubusercontent.com/obra/superpowers/44c9b2d6e889982ac18c27d05a19fefe335194e1/skills/verification-before-completion/SKILL.md>

## Phát hiện

Skill Harnix hiện tại chỉ còn `Incoming state`, `Persist`, `Exit`. Nó giữ được tên stage nhưng không đủ để điều khiển hành vi dưới áp lực:

- `harnix-brainstorm` không có decision inventory, convergence/self-review, placeholder scan hoặc điều kiện fail-closed cụ thể trước `ready`.
- `harnix-implement` không yêu cầu review plan critical trước code, quan sát RED fail đúng lý do, GREEN tối thiểu, hay verify feedback trước khi áp dụng.
- `harnix-check` nói “fresh evidence” nhưng không ép map từng claim sang command/output, đọc full output/exit code, phân biệt compliance với technical feedback.
- `harnix-debug` thiếu failure capture, evidence boundary, root-cause tracing và contained recovery.
- `harnix-continue` thiếu routing matrix và artifact validation cụ thể.
- `harnix-research` thiếu source authority/recency, fact/inference separation và stop rule.
- Source prose bị nhúng trong TypeScript và activation guard được render ba lần, nên maintainer không thấy skill unit thật và platform có thể drift.

Superpowers có discipline mạnh nhưng chứa behavior Harnix đã chủ động loại: hard approval cho mọi task, mandatory worktree/subagent/commit và branch/PR finishing. Trellis có persistence/resume tốt nhưng bắt buộc approval lần hai, commit/archive flow và nhiều platform/subagent ceremony. ECC research giả định MCP cụ thể và debug có integration ngoài scope. Các phần này không được port.

## Quyết định

1. Source of truth là bảy `src/skills/harnix-*/SKILL.md` thực.
2. Build dùng esbuild/tsup text loader để nhúng Markdown vào `dist`; package vẫn chỉ publish `dist`, không runtime filesystem lookup và không network.
3. Catalog runtime parse/validate frontmatter từ content canonical và fail fast khi malformed/duplicate/missing.
4. Cả ba platform cài byte-identical canonical `SKILL.md`. Activation guard nằm trong source.
5. Mỗi skill giữ một stage owner và routing rõ; không tạo thêm skill generic nếu behavior thuộc bảy skill hiện có.
6. Test gồm structural validation, behavior invariants, platform parity và forward-test pressure scenario. Không coi substring-only test là đủ cho discipline.
7. Không tạo `agents/openai.yaml` ở slice này vì nó không được Kiro/Antigravity dùng và sẽ mở rộng managed global surface; chỉ xem xét khi có contract cross-platform rõ.

## Bất định còn lại

- LLM forward-test có variance; kết quả là evidence bổ sung, không thay deterministic structural/parity tests.
- Bản cài thật dưới user home chỉ được update sau khi package code/test xanh và có authorization rõ cho thao tác user-global; fixture fake-home là gate bắt buộc trước.

## Trả lại planning

S-1 đã decision-complete: source layout, behavior mapping, rejected behavior, package mechanism và validation đều được khóa. Có thể chuyển task từ `replan` về `ready`, sau đó `in_progress/implementing` trước RED test/product edit.
