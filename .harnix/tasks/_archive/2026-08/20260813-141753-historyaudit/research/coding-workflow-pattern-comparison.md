# Research: so sánh pattern workflow cho coding agent

## Phạm vi

- Task: `20260813-141753-historyaudit`
- Ngày truy cập: 2026-08-13
- Material unknown: `Evidence → Requirements → Execution` có đủ làm canonical workflow cho Harnix không; RIPER, EPCC và các pattern khác bổ sung điều gì; Harnix nên chọn workflow nào mà không tạo nhiều state machine chồng lấn?
- Giới hạn: đây là research cho quyết định kiến trúc và plan. Không sửa production code, không benchmark model và không coi tên viết tắt cộng đồng là standard chính thức.

## Repository evidence

Harnix hiện có một persisted lifecycle `planning → ready → in_progress → verifying → completed`, với `blocked` để tạm dừng và các checkpoint `triage`, `planning`, `ready`, `implementing`, `debugging`, `replan`, `verifying`, `finishing`. Bảy skill hiện tại chia procedure theo stage; Lite/Full chỉ khác ceremony. Vì vậy một pattern mới chỉ đáng thêm khi nó biểu diễn state, transition, artifact hoặc completion semantic mà contract hiện tại không chứa được.

`Evidence → Requirements → Execution` đã giúp task này phân vai artifact tốt hơn: audit/research giữ dữ kiện, PRD giữ WHY/WHAT, plan giữ HOW/WHEN, source/test/docs diff là implementation. Tuy nhiên ba nhãn này không tự biểu diễn ready gate, thiết kế/plan, verification độc lập, debug/replan, continuation sau interruption, blocked state hoặc finish/journal.

## Nguồn và revision

| Nguồn | Revision/version quan sát được | Dùng để kiểm tra |
|---|---|---|
| [RIPER-5 for Claude Code](https://github.com/tony/claude-code-riper-5) | nhánh `main`, repository sống, truy cập 2026-08-13 | Research → Innovate → Plan → Execute → Review, phase boundary và phạm vi dùng |
| [AWS EPCC workflow plugin](https://github.com/aws-solutions-library-samples/guidance-for-claude-code-with-amazon-bedrock/tree/main/assets/claude-code-plugins/plugins/epcc-workflow) | Explore `3.2.0`; Plan/Code/Commit `3.1.0`; nhánh `main`, truy cập 2026-08-13 | Explore → Plan → Code → Commit, resume artifact, QA và Git behavior |
| [GitHub Spec Kit](https://github.com/github/spec-kit/blob/main/docs/index.md/) | tài liệu nhánh `main`, cập nhật 2026-07-16, truy cập 2026-08-13 | Spec → Plan → Tasks → Implement và artifact traceability |
| [Kiro Specs CLI](https://kiro.dev/docs/cli/v3/specs/) | trang cập nhật 2026-07-28, truy cập 2026-08-13 | Requirements → Design → Tasks → Execution, verification giữa task và Quick Spec |
| [ReAct paper](https://arxiv.org/abs/2210.03629) | arXiv `2210.03629`, 2022 | Interleave reasoning với action trong một execution loop |
| [Reflexion paper](https://arxiv.org/abs/2303.11366) | arXiv `2303.11366`, 2023 | Feedback → verbal reflection → episodic memory → retry |

Các trang GitHub/Kiro là tài liệu sống; version command của EPCC và ngày cập nhật được ghi để giảm ambiguity nhưng chưa phải content-addressed snapshot. Nếu behavior implementation phụ thuộc chi tiết command, cần freeze commit SHA trước khi code.

## Sự thật từ nguồn

### RIPER

- RIPER-5 chia công việc thành Research, Innovate, Plan, Execute và Review; Research/Innovate là read-only, Execute mới sửa code và Review kiểm tra implementation với plan.
- `Innovate` bắt buộc xem nhiều phương án trước khi khóa plan, hữu ích cho architectural unknown.
- Repository tự mô tả pattern phù hợp task phức tạp và có thể bỏ qua với fix/docs đơn giản. Nó là một implementation cộng đồng, có ghi credit nguồn Cursor Forum ẩn danh, không phải standard có normative specification.
- Memory bank, branch workflow và strict phase ceremony là giả định riêng của implementation, không phải requirement phổ quát cho coding agent.

### EPCC

- EPCC công khai bốn command Explore, Plan, Code và Commit. Explore cấm implementation và có resume detection; Plan tạo task breakdown để review; Code triển khai từng feature, chạy test/validation và hỗ trợ TDD/debug loop.
- `Commit` chạy quality validation rồi stage/commit, có thể tạo PR; command nói tự thực hiện standard commit operation mà không hỏi lại.
- Resume artifact và việc tách exploration khỏi coding có giá trị cho session dài. Tuy nhiên Git operation là một phase bắt buộc của EPCC, trái với boundary “không auto-commit” của Harnix và không áp dụng cho mọi task completion.

### Spec-driven workflow

- GitHub Spec Kit dùng Spec → Plan → Tasks → Implement; mỗi phase tạo Markdown artifact. Điểm mạnh là traceability từ requirement tới ordered work.
- Kiro Specs dùng Requirements → Design → Tasks → Execution và verify giữa các task; có Feature, Bug và Quick Spec để điều chỉnh ceremony.
- Hai pattern này làm rõ khoảng trống `Plan/Design` trong chuỗi ba bước hiện tại. Core sequence vẫn không foreground persistence recovery, blocked semantics hoặc independent finish/journal như Harnix cần.

### Inner-loop pattern

- ReAct interleave reasoning và action để quan sát môi trường rồi cập nhật bước kế tiếp. Đây là cách agent vận hành bên trong một stage, không phải persisted project lifecycle.
- Reflexion dùng feedback và reflection được giữ trong episodic memory để cải thiện trial sau. Harnix có thể áp dụng ý tưởng này vào debugging evidence và regression fixture, nhưng không nên lưu raw private reasoning hoặc transcript.
- RED → GREEN → REFACTOR và hypothesis-driven debug hiện có của Harnix cũng là inner loop. Chúng bổ sung cho outer lifecycle, không cạnh tranh với nó.

## So sánh

| Pattern | Loại | Điểm mạnh có thể nhận | Khoảng trống hoặc xung đột với Harnix | Quyết định |
|---|---|---|---|---|
| Evidence → Requirements → Execution | Artifact/data flow | Evidence-first, tách fact khỏi decision, PRD khỏi implementation | Không có Plan, Verify, Persist/Resume và feedback loop rõ | Giữ làm artifact backbone, không gọi là full workflow |
| RIPER | Outer lifecycle | Research, alternatives, explicit plan và review | Ceremony nặng cho task nhỏ; assumptions về memory/branch; thiếu durable blocked/finish semantics | Adapt Research/alternatives/review, không adopt nguyên khối |
| EPCC | Outer lifecycle | Explore, collaborative plan, code QA, resume artifact | Commit/PR là phase và có auto-Git; verification bị gộp trong Code/Commit | Adapt Explore/Plan/Code discipline; reject Commit phase |
| Spec Kit/Kiro Specs | Outer lifecycle | Requirement/design/task traceability; ceremony level | Chưa đủ operational persistence/finish contract | Adapt Requirements/Plan/Tasks; Lite có thể collapse artifact |
| ReAct | Inner execution loop | Observe rồi điều chỉnh action | Không định nghĩa project state hoặc acceptance gate | Dùng bên trong research/implement/debug khi phù hợp |
| Reflexion | Inner feedback loop | Học từ feedback và retry | Raw reflection/memory có privacy và provenance risk | Persist bounded evidence/lesson/fixture, không lưu private reasoning |
| RED → GREEN → REFACTOR | Inner implementation loop | Regression protection và change nhỏ | Không thay requirements/ready/finish lifecycle | Giữ trong Execute cho behavior change |

## Suy luận cho Harnix

1. Vấn đề không phải thiếu thêm một acronym; vấn đề là chuỗi artifact ba bước đang bị dùng như tên của toàn lifecycle.
2. Harnix nên dùng một **Evidence-Gated Lifecycle** có sáu semantic phase: **Evidence → Requirements → Plan → Execute → Verify → Persist**. `Restore/Triage` là entry concern trước chuỗi; `Debug/Replan` là feedback loop; `Blocked/Continue` là recovery concern.
3. Các semantic phase này map vào frozen status/checkpoint hiện tại, không thêm enum hoặc workflow song song:
   - Restore/Triage, Evidence, Requirements, Plan: `planning|ready` qua Continue/Brainstorm/Research.
   - Execute: `in_progress` qua Implement hoặc Debug.
   - Verify: `verifying` qua Check, compliance trước quality/security.
   - Persist/Finish: `verifying/finishing → completed` qua Finish.
4. Lite và Full chỉ điều chỉnh độ sâu artifact. Lite có thể gộp Evidence + Requirements + Plan vào compact TaskRecord; Full giữ audit/research/PRD/plan khi mỗi artifact mang quyết định riêng.
5. Không thêm skill RIPER/EPCC/Spec riêng. Bảy skill hiện có đã là stage owners; cần sửa description, router, legality matrix và eval để phase ownership quan sát được.

## Kết luận và tác động tới PRD/plan

`Evidence → Requirements → Execution` **chưa đủ nếu được gọi là workflow**, nhưng **đúng hướng nếu được giữ là artifact backbone**. Khuyến nghị canonical là:

```text
Restore/Triage
  → Evidence
  → Requirements
  → Plan / Ready gate
  → Execute
  → Verify
  → Persist / Finish

Execute hoặc Verify thất bại → Debug → Replan hoặc Execute
Thiếu authority/dependency → Blocked → Continue về recorded stage
```

PRD cần thêm requirement khóa lifecycle semantics, phase-to-state mapping và ceremony rule. Plan cần bổ sung mapping phase → state/checkpoint → artifact → skill → gate, cùng regression case chứng minh agent không bỏ qua Plan, Verify hoặc Persist. Không thay TaskRecord v1, không thêm public command và không tự động hóa Git.

## Xung đột và giới hạn

- RIPER và EPCC đều là implementation/package cụ thể; tên phase không đủ chứng minh chất lượng trên Harnix nếu chưa có representative eval.
- Kiro/Spec Kit có thể thay đổi sau ngày truy cập. Research này dùng chúng để so sánh semantics, không copy contract hoặc implementation.
- ReAct/Reflexion là paper về agent reasoning; áp trực tiếp thành persisted workflow sẽ trộn private reasoning với auditable evidence.
- Chưa có benchmark định lượng giữa các pattern trên cùng bộ Harnix task. Quyết định hiện tại dựa trên fit với frozen contract, safety boundary và failure history của repository.

## Bất định còn lại và trigger follow-up

- Trước S3/S5, xây representative fixture cho Lite fix, Full refactor, interruption, failed verification và blocked authority; nếu Evidence-Gated mapping tạo ambiguity owner hoặc tăng correction rate, replan trước khi rút gọn instruction.
- Nếu một platform không thể route semantic phase bằng bảy skill hiện có sau description/eval hardening, research platform-specific constraint đó trước khi cân nhắc skill mới.
- Nếu future schema cần persist decision history hoặc learning summary, tạo research/schema proposal riêng; không nhét raw reflection vào TaskRecord v1.
