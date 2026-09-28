# Pha 3 — Research bên ngoài (truy cập 2026-09-28)

## A. Coding tool: bề mặt tích hợp

### Thay đổi đáng chú ý

- Claude Code đọc `AGENTS.md` native từ v2.1.277. Mặc định chỉ đọc khi repo không có `CLAUDE.md` ([memory](https://code.claude.com/docs/en/memory)). Skills chỉ lấy từ `.claude/skills` và `~/.claude/skills` ([skills](https://code.claude.com/docs/en/skills)).
- Codex: `UserPromptSubmit` hỗ trợ `additionalContext` và cần người dùng trust ([hooks](https://learn.chatgpt.com/docs/hooks)).
- Gemini CLI chỉ còn cho enterprise từ 2026-06-18 ([google](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/)).
- Roo Code đóng cửa ngày 2026-05-15.
- Windsurf đổi thành Devin Desktop; `pre_user_prompt` không chèn được context.
- VS Code Copilot đọc hook của Claude khi bật `chat.useClaudeHooks` (đang Preview) ([vscode](https://code.visualstudio.com/docs/agent-customization/hooks)).

### Mẫu số chung

- `AGENTS.md`: 15/16 tool đọc được.
- Agent Skills (`SKILL.md`): gần như mọi tool.
- Hai thư mục `~/.agents/skills` và `~/.claude/skills` phủ khoảng 9 tool:
  - Codex, Cursor, Copilot CLI, Zed, OpenCode, Kilo đọc `~/.agents/skills`.
  - Claude Code, Cursor, OpenCode, Kilo, Amp đọc `~/.claude/skills`.
- CLI trả JSON: mọi agent có shell đều dùng được.
- Hook chèn context **không** phải mẫu số chung. Chỉ Claude, Codex, Kiro, VS Code, Cline có.

### Mô hình tầng đề xuất

| Tầng | Cách hỗ trợ | Tool |
| --- | --- | --- |
| 0 | `AGENTS.md` + `harnix skill` (không cần code riêng) | Mọi agent có shell, gồm Aider (`read:`) và Junie |
| 1 | Bảng dữ liệu: thư mục skill + file instruction global | Cursor, OpenCode, Kilo, Zed, Amp, Copilot CLI, Junie, Cline, Windsurf |
| 2 | Configurator riêng có hook | Claude Code (kiêm VS Code), Codex, Kiro, Antigravity; ứng viên thêm: Copilot `~/.copilot/hooks`, Cursor `sessionStart` |
| 3 | Plugin bundle | Tùy chọn, ưu tiên thấp |

Loại khỏi phạm vi: Roo, Gemini CLI.

**Chưa xác minh:**
- Tên event hook của Antigravity.
- Copilot `userPromptSubmitted` có chèn được context không.
- Định dạng hook "third-party" của Cursor.
- Windsurf có đọc `.agents/skills` không.

## A2. Cấu trúc thật của ECC (đọc trực tiếp GitHub, vòng 4)

Đọc trực tiếp `api.github.com/repos/affaan-m/ECC/contents/` và `.../contents/skills` xác nhận ECC có **4 thư mục top-level độc lập**: `rules/`, `skills/`, `agents/`, `commands/` (cùng `contexts/`, `workflows/`, `plugins/`...) — đây không phải một hệ thống phân tầng, mà 4 hệ thống song song.

`docs/UPSTREAM_BASELINE.md:77` (đã có sẵn trong repo Harnix) xác nhận Harnix đã soi `ECC/rules/{common, csharp, typescript, python, golang, java, react, vue}` và `docs/UPSTREAM_MAPPING.md` §7 map trực tiếp từng pack sang `src/guides/**`. **Guides của Harnix = ECC `rules/` đã dịch đúng, việc này đã xong.**

`ECC/skills/` (292 thư mục con, đọc trực tiếp 2 trang listing) là hệ thống khác, gồm 4 nhóm:

| Nhóm | Ví dụ | Ghi chú |
| --- | --- | --- |
| Kỹ thuật ngôn ngữ/framework mịn hơn guide | `django-celery`, `django-security`, `django-tdd`, `django-verification`, `golang-patterns`, `golang-testing`, `nextjs-patterns`, `mongodb-patterns`, `mysql-patterns`, `javascript-patterns`, `java-patterns`, `kotlin-patterns` | 4-5 skill riêng cho một framework (vd Django), thay vì 1 file guide |
| Meta/harness tự thân | `agent-eval`, `agent-self-evaluation`, `continuous-learning`, `continuous-learning-v2`, `context-budget`, `eval-harness`, `model-selection-strategy`, `multi-agent-orchestration`, `autonomous-loops`, `learning-orchestration`, `long-context-retrieval`, `llm-cost-optimization` | Trùng máy móc nội bộ Harnix đã có qua workflow/skill |
| Domain/vertical nghiệp vụ | `healthcare-phi-compliance`, `hipaa-compliance`, `customs-trade-compliance`, `energy-procurement`, `investor-materials`, `investor-outreach`, `finance-billing-ops`, `merchant-operations`, `medical-device-qa`, `logistics-planning` | Ngoài biên sản phẩm Harnix |
| Tích hợp tool/vendor | `docker-patterns`, `kubernetes-patterns`, `kafka-patterns`, `blender-motion-state-inspection`, `cisco-ios-patterns`, `google-workspace-ops`, `homelab-*` (5 skill) | Open-ended, không nên Harnix tự viết hết |

**Kết luận:** so sánh "5 skill Harnix vs 292 skill ECC" là so sánh lệch trục — phần lớn 292 đó nằm ngoài phạm vi Harnix hoặc trùng máy móc nội bộ đã có. Phần technique hẹp cross-language thật sự đáng học là thiểu số, nên chọn lọc theo bằng chứng (5-10 skill) thay vì cố khớp số lượng.

## B. Harness cùng loại

| Dự án | Xu hướng 2026 |
| --- | --- |
| Superpowers (292k★) | Cắt prose bằng probe có/không; "the project's suite defines green", vì 11/12 lần agent chỉ chạy một file test |
| BMAD (53,6k★) | Gộp persona; bỏ `investigate` vì "same conclusions at higher cost"; thêm verification-gap reviewer |
| Agent OS v3 | Cắt khoảng 70% code, bỏ spec/task/orchestration vì plan mode của tool đã lo |
| Spec Kit (139k★) | Chuyển sang skills; Git thành opt-in; retire integration chết |
| OpenSpec (70,5k★) | Nhẹ, "fluid not rigid", không có phase gate |
| Kiro | Thêm Quick Spec (một lượt) và Bugfix Spec ("what must remain working") |
| ECC | Vẫn phình to, nhưng thêm install profile minimal |
| Tessl | Eval skill bằng scenario có/không |

Nghiên cứu source-code trên 11 harness: policy đang chuyển từ prose sang config ([2609.00006](https://arxiv.org/abs/2609.00006)).

## C. Bằng chứng hiệu quả

| Kết quả | Mức | Nguồn |
| --- | --- | --- |
| Context file không tăng tỉ lệ thành công, chi phí tăng hơn 20%; overview do LLM sinh làm giảm ~3%; instruction cụ thể thì có được làm theo | Đo | [2602.11988](https://arxiv.org/abs/2602.11988) |
| `AGENTS.md` giảm runtime 28,6%, output token giảm 16,6% | Đo | [2601.20404](https://arxiv.org/abs/2601.20404) |
| Tuân thủ giảm ~5,6% odds cho mỗi function agent sinh thêm trong session | Đo | [2605.10039](https://arxiv.org/abs/2605.10039) |
| Instruction càng nhiều thì tuân thủ càng giảm (500 instruction → 68%) | Đo | [IFScale](https://arxiv.org/abs/2507.11538) |
| Prompt TDD chung chung làm regression tăng; cho biết test nào cần chạy làm regression giảm từ 6,08% xuống 1,82% | Đo (n nhỏ) | [TDAD 2603.17973](https://arxiv.org/abs/2603.17973) |
| Tăng số test qua prompt không đổi resolve rate | Đo | [2602.07900](https://arxiv.org/abs/2602.07900) |
| Tự đánh giá: 75,8% false success; không có "progress mirage" khi có tiêu chí kiểm chứng được | Đo | [2606.09863](https://arxiv.org/html/2606.09863), [2607.25152](https://arxiv.org/abs/2607.25152) |
| RepoMap cho context yield tốt nhất ở 8K token | Đo | [2607.24882](https://arxiv.org/abs/2607.24882) |
| Agent tự setup môi trường chỉ thành công 39–57%, nên phát hiện lệnh deterministic tốt hơn | Đo | [SetupBench](https://arxiv.org/abs/2507.09063) |
| Spec-driven nặng tạo "false sense of control"; 16 AC cho một bug nhỏ | Ý kiến chuyên gia | [Böckeler](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html) |

**Hạn chế:** nhiều kết quả là preprint có n nhỏ; kết quả về context file còn mâu thuẫn.

## D. Ý tưởng áp dụng (xếp hạng)

| # | Ý tưởng | Mức bằng chứng |
| --- | --- | --- |
| 1 | Test-impact hint (map code→test) | Cao–TB |
| 2 | "Suite defines green": check phải gồm suite / lint / typecheck mức project | Cao |
| 3 | Giữ gate dựa trên exit code thật; không có lệnh verify thì phải khai báo check thay thế | Cao |
| 4 | Phát hiện lệnh verify theo manifest, workspace-aware (nearest wins) | TB |
| 5 | Eval probe có/không làm gate khi cắt prose | TB |
| 6 | Guide chỉ chứa lệnh và ràng buộc | TB |
| 7 | Nhắc lại luật cốt lõi ở ranh giới stage; task ngắn | TB |
| 8 | Lite một lượt kiểu Quick Spec | TB |
| 9 | Bugfix có AC "must remain working" | Thấp–TB |
| 10 | Verification-gap lens | Thấp–TB |
| 11 | Review bằng fresh context (tùy chọn) | Thấp |

## E. Peer đã bỏ

- Tự orchestration spec/task.
- Skill investigate riêng.
- Nhiều persona.
- Prose thuyết phục và recap.
- Git coupling.
- Prompt TDD chung chung.
- Overview do LLM sinh.
- Self-review cùng model làm gate.
- Ceremony 5 pha cho mọi việc.
