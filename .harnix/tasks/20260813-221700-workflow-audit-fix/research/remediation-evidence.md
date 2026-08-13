# Bằng chứng cho hướng khắc phục

Ngày truy cập nguồn: 2026-08-13.

## Bằng chứng trong repository

- Audit đã tái hiện việc vượt qua ready/finish gate bằng criteria/check rỗng hoặc bị xoá và bằng Full artifact bị thiếu.
- `src/commands/internal-workflow.ts` bảo toàn prior evidence nhưng không bảo toàn prior acceptance obligation hoặc required-validation obligation.
- `src/core/workflow.ts` coi criteria và validation collection rỗng là đã complete.
- Trong isolated copy, `harnix update` đã reconcile stale self-host generator metadata và làm self-host test pass.

## Hướng dẫn chính thức từ nguồn sơ cấp

- OpenAI, "Safety in building agents": https://developers.openai.com/api/docs/guides/agent-builder-safety
  - Coi untrusted text là prompt-injection risk, cô lập nội dung đó khỏi privileged instruction, giữ tool approval và dùng adversarial eval.
- OpenAI, "Evaluation best practices": https://developers.openai.com/api/docs/guides/evaluation-best-practices
  - Dùng task-specific eval được duy trì liên tục và bao gồm typical case, edge case, conflicting instruction cùng adversarial case.

Task áp dụng các cơ chế trên dưới dạng local structural boundary và disposable regression fixture. Task không nhập external code, không thêm hosted dependency và không claim deterministic formatting test chứng minh model-level immunity. Không có license impact vì chỉ tham chiếu behavioral guidance.
