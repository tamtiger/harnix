# PRD — [15] Thư viện technique-skill hẹp (5–10, có bằng chứng) + extension point

## Bối cảnh và vấn đề

So sánh lịch sử giữa Harnix và các peer (như ECC với 292 skills) cho thấy phần lớn các skill của ECC là meta-harness tự thân (trùng lặp với workflow state machine của Harnix) hoặc domain nghiệp vụ ngoài biên. Tuy nhiên, một số kỹ thuật hẹp cross-language có bằng chứng nghiên cứu rõ rệt (như verification gap, bugfix bảo toàn hành vi hiện tại, flaky test, migration safety, security review) lại đem lại giá trị thực tiễn cao cho agent. Ngoài ra, các dự án người dùng cần một extension point chuẩn (`.harnix/spec/skills/`) để tự định nghĩa các skill kỹ thuật hoặc nghiệp vụ riêng mà không làm phình harness lõi.

## Mục tiêu

1. Ship đúng 5 technique-skill cross-language chất lượng cao, đóng gói dạng `SKILL.md` chuẩn Agent Skills, mỗi skill trích dẫn bằng chứng thực nghiệm cụ thể từ `external-research.md`.
2. Tích hợp các technique-skill vào hệ thống phân phối global skill sink của 6 nền tảng (Kiro, Antigravity, Codex, Claude Code, OpenCode, Cursor), cho phép agent tự động khám phá (native discovery) theo mô tả mà không đi qua stage routing (`preflight.nextStage`).
3. Mở extension point `.harnix/spec/skills/` để các dự án có thể tự thêm skill kỹ thuật/nghiệp vụ riêng; cung cấp cơ chế discover và đọc nội dung qua `harnix skill`.
4. Bảo đảm ranh giới rõ ràng: không trùng lặp với `guides` (quy tắc ngôn ngữ/framework) hay 6 workflow skills (stage owners).
5. Đồng bộ hóa tài liệu PRD, WORKFLOW, IMPLEMENTATION_PLAN và hướng dẫn liên quan ngay trong task.

## Tiêu chí nghiệm thu

### ac-bounded-count
Đúng 5–10 technique-skill được ship (chọn 5 skill: `harnix-verification-gap`, `harnix-bugfix-preserve`, `harnix-flaky-test`, `harnix-migration-safety`, `harnix-security-lens`), mỗi skill trích dẫn bằng chứng cụ thể từ `external-research.md`.
**Verifies:** `check-technique-skills` và `check-suite`.

### ac-native-discovery
Technique-skill có frontmatter name/description chuẩn (`name: harnix-*`, `description: Use when...`), được cài vào global skill sink qua `globalSkillDesiredFiles`, không đi qua `preflight.nextStage`; test xác nhận không lẫn với 6 workflow skills / stage-owners.
**Verifies:** `check-technique-skills`, `check-global-surface`, và `check-suite`.

### ac-project-skill-ext
`.harnix/spec/skills/` cho phép dự án tự thêm skill riêng; `harnix skill` và `harnix skill <name>` tự động khám phá và đọc nội dung skill của dự án; có fixture test kiểm chứng.
**Verifies:** `check-project-skills-ext` và `check-suite`.

### ac-no-scope-creep
Không technique-skill nào trùng phạm vi với các file guides (`.harnix/spec/guides/`) hoặc các workflow skills (`harnix-plan`, `harnix-implement`, `harnix-verify`, `harnix-debug`, `harnix-review`, `harnix-research`).
**Verifies:** `check-technique-skills` và compliance review.

### ac-docs-sync
PRD, WORKFLOW, IMPLEMENTATION_PLAN và các tài liệu liên quan được cập nhật đồng bộ trong cùng task cho mọi thay đổi về hợp đồng skill và extension point; không dồn sang `release-v2`.
**Verifies:** `check-docs-sync` và `check-suite`.

## Non-goals

- Không commit/push/PR tự động.
- Không đụng cấu hình user-global thật trong test.
- Không bump version trong task này; version 2.0.0 chỉ bump một lần ở `release-v2`.
- Không viết skill domain nghiệp vụ hay meta-harness trùng máy móc nội bộ.
- Không sửa đổi stage routing trong `src/core/workflow/preflight.ts`.
