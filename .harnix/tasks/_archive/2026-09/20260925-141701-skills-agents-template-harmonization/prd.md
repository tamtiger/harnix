# Product Requirements Document: Harmonization of Skills, AGENTS Template and Root AGENTS.md

## Overview

Đồng bộ toàn diện các quy chuẩn cross-cutting của Harnix vào cả 7 file SKILL.md, template renderAgentsTemplate và root AGENTS.md.

## Acceptance Criteria

### AC `ac-agents-template-budget`
Template agents.ts được tối ưu hóa câu chữ, bảo đảm byte length < 8,192 bytes và pass test/workflow/templates.test.ts.

### AC `ac-root-agents-harmonization`
Root AGENTS.md của repo Harnix được bổ sung đầy đủ chỉ dẫn repo-map và spec/guides.

### AC `ac-skills-cross-cutting-gaps`
Tất cả 7 skills được bổ sung đầy đủ chỉ dẫn hành động về repo-map, spec/guides, Epic Roadmap, checklist [x], commit approval và tiếng Việt.

### AC `ac-skills-version-sync`
Cả 7 file SKILL.md được đồng bộ version metadata lên 1.1.18.

### AC `ac-verification-suite`
Toàn bộ test suite unit, integration và templates pass 100%.
