# Changelog

Mọi thay đổi đáng chú ý của Harnix được ghi tại đây.

Định dạng dựa trên [Keep a Changelog](https://keepachangelog.com/vi/1.1.0/). Harnix chưa có bản phát hành npm; mỗi mục dưới đây ghi thay đổi của một phiên bản package đã được kiểm chứng.

## [1.0.21] - 2026-09-04

### Fixed

- Sửa lỗi task không bao giờ finish được khi một evidence có timestamp không hợp lệ hoặc ở tương lai (`recordedAt > now`) che khuất một pass hợp lệ ghi sau đó, khiến required check kẹt vĩnh viễn ở `stale`/`evidence-expired`. Việc chọn latest evidence giờ ưu tiên evidence hợp lệ thời gian hơn evidence future-dated/invalid ở `check-report`, `canCompleteTask`, `criterionHasFreshSupport` và `assertVerificationInputsFresh`, đồng thời giữ fail-closed khi chỉ có future evidence và bảo toàn tie-break theo thứ tự append.

## [1.0.20] - 2026-08-28

### Changed

- Đồng bộ canonical agent routing theo nextStage và làm rõ standalone read-only research boundary.

## [1.0.19] - 2026-08-28

### Changed

- Bổ sung standalone read-only research Bypass qua `harnix-research` mà không đọc hoặc mutate active task, đồng thời giữ nguyên task-scoped research trong planning/replan/debugging.

## [1.0.18] - 2026-08-27

### Changed

- Ngăn vòng lặp workflow bằng latest-intent routing, preflight hữu hạn, evidence reuse và retry breaker.
- Thêm planning freshness semantic, save transaction serialized, replay fail-closed và regression cho self-referential evidence.
- Retry hữu hạn transient `EPERM|EACCES|EBUSY` khi atomic rename trên Windows để full-suite/global reconciliation không fail ngẫu nhiên dưới tải.

## [1.0.17] - 2026-08-27

### Changed

- Đưa target-authority guard lên đầu project AGENTS template và ràng buộc profile/workflow vào selected Harnix root đã resolve.
- Thêm regression tests khóa ordering cho rendered và init-generated AGENTS output.

## [1.0.16] - 2026-08-27

### Changed

- Ngăn input glob của active TaskRecord tự làm stale evidence, vẫn raw-hash task lịch sử và giữ sidecar v1.
- Xác thực explicit target trước ancestor lookup, giữ hook-injected context không có target authority và bổ sung structured ambient-canary coverage.

## [1.0.15] - 2026-08-26

### Changed

- Resolve explicit user repository targets before ambient cwd/workspace across generated Harnix instructions and canonical skills, with invalid-target no-fallback safeguards.
- Document HX-TARGET-01 as Harnix self-audit ownership while preserving the external feature-provenance registry and NOTICE.

## [1.0.14] - 2026-08-26

### Changed

- Thêm public harnix resume để phục hồi exact unfinished-task pointer với dry-run, bounded validation và collision fail-close.
- Thêm metadata-only harnix context-report và harnix checks để giải thích effective hook context cùng required-check freshness mà không lộ private content hoặc chạy validation.
- Đồng bộ shared context/check classifiers, README, canonical contracts, consumer templates và machine-checkable provenance cho ba capability mới.

## [1.0.13] - 2026-08-26

### Changed

- Thêm public harnix status read-only với progress, freshness, attention và deterministic next action mà không lộ task prose hoặc ghi state.
- Thêm public harnix tasks resilient với scan/file cap, per-record validation, status filter, active pin và malformed isolation mà không đọc private artifact/history body.
- Thêm cache-only harnix repo-map --impact để xem direct dependencies và reverse dependents theo exact path, depth/limit bounded và deterministic ordering.
- Thêm public harnix audit để tách readiness khỏi completion blockers bằng exact ready-trace/input-freshness semantics mà không chạy check, sửa state hoặc tự chuyển workflow.
- Thêm registry provenance machine-checkable cho mọi capability harness-derived, kèm revalidation ba upstream, landscape evidence và canonical docs mapping.
- Sửa guarded replan re-entry để task ready/in-progress/verifying có thể quay lại audited ready state sau persisted replan mà không mở generic backward transition.
- Cho phép version-sync nhận pnpm argument separator đúng như acceptance command đã tài liệu hóa.

## [1.0.12] - 2026-08-26

### Changed

- Hardening context boundary, canonical unique-token lock-directory ownership (gồm post-read replacement race và legacy file fail-closed), doctor scope và exact workflow state invariants từ review toàn diện.
- Chuẩn hóa canonical context fast path, PublicCliErrorV1, actionable setup exit và offline upgrade availability contract.
- Đồng bộ regression coverage, tarball/footprint/release scanner với actionable setup exit và phân loại source-map TypeScript type reference không làm yếu secret detection; đồng bộ self-host manifest qua `version:sync`, README và normative docs với package cùng bảy canonical workflow skills.

## [1.0.11] - 2026-08-21

### Changed

- Chuyển Codex Harnix hook sang managed inline config.toml và migrate hooks.json cũ an toàn để loại bỏ cảnh báo mixed hook source.

## [1.0.10] - 2026-08-20

### Changed

- Bổ sung vòng review memory project-local: finish-stage có thể ghi learning candidate đủ provenance qua hidden workflow transport idempotent, fail closed và không tự promotion.
- Thêm harnix mem --learning để lọc candidate newest-first, compose với query, user và limit mà không đổi default JSON contract.
- Đồng bộ canonical finish guidance, workflow template và tài liệu safety cho Kiro, Antigravity và Codex.

## [1.0.9] - 2026-08-19

### Changed

- Bổ sung terminal state cancelled với explicit user authority, cancellation journal và idempotent active-pointer recovery mà không bỏ completion gate.
- Route agent tới một current stage-owner skill và đọc riêng đến EOF để tránh batch output truncation, giữ canonical skill byte-identical trên ba platform.

## [1.0.8] - 2026-08-18

### Changed

- Bổ sung context selection-basis sidecar và selectionChanges để resume phát hiện stale candidate inventory, selector và task/config/guide signals mà không chạy repo-map trong hook.
- Thêm deterministic Full ready-trace audit, hidden workflow action và readiness enforcement với bounded diagnostics.
- Bọc persistent learning trong JSON untrusted boundary, thêm redacted no-fix Doctor risk findings và dependency-aware repo-map ranker v2 với lexical v1 rollback.

## [1.0.7] - 2026-08-18

### Changed

- Chuẩn hóa CLI để mỗi invocation chỉ có một command token; repo-map và workflow chọn action bằng mutually-exclusive flags.
- Đổi platform hooks sang harnix context --platform, migrate fragment cũ chưa sửa và bảo toàn hook người dùng đã chỉnh.

## [1.0.6] - 2026-08-18

### Changed

- Bổ sung implicit Harnix routing cho ordinary prompt trên Kiro, Antigravity và Codex mà không yêu cầu người dùng nhắc Harnix, vẫn giữ activation guard no-op ngoài initialized project.
- Chuyển Antigravity sang always-on rules/AGENTS.md không frontmatter; global update xóa legacy rule chưa sửa, preserve legacy rule đã sửa và có regression coverage.
- Revalidate bằng disposable agy cold session, ghi conservative not-run cho surface thiếu login/trust/profile và không suy hook activation từ file presence hoặc validator.

## [1.0.5] - 2026-08-18

### Changed

- Thêm version:sync để đồng bộ package metadata, bảy canonical skill và CHANGELOG an toàn, idempotent.

## [1.0.4] - 2026-08-18

### Fixed

- `AGENTS.md` do `harnix init` sinh ra nay nêu rõ và liên kết trực tiếp tới `.harnix/workflow.md` như nguồn workflow chính trước khi agent phân loại, persist hoặc hoàn tất task.

## [1.0.3] - 2026-08-18

### Changed

- Rút gọn hidden agent persistence transport từ `harnix internal workflow ...` thành `harnix workflow ...`; bốn operation `inspect`, `save`, `snapshot` và `finish` giữ nguyên JSON, validation và freshness semantics, nhưng command cũ không còn compatibility alias.
- Đồng bộ CLI registration, canonical workflow docs, README, consumer templates, bảy stage skills và workflow contract tests với namespace mới; `harnix internal context` vẫn là protocol riêng cho platform hook.

## [1.0.2] - 2026-08-18

### Fixed

- Root `AGENTS.md` nay luôn triage Bypass/Lite/Full trước khi chọn việc, chỉ tiếp tục implementation plan khi người dùng thực sự yêu cầu thay đổi và route rõ từng stage owner.
- Consumer AGENTS/workflow cùng bảy canonical skills nay mô tả đầy đủ hidden `inspect|save|snapshot|finish` transport, JSON stdin envelope, TaskRecord v2 fields và completion ownership để agent không ghi trực tiếp workflow state.
- README nay có happy path từ `init`/global setup/trust tới yêu cầu tự nhiên trong coding agent, diễn giải Doctor, ownership đúng cho bootstrap/spec/workflow/task/research/journal và không còn ví dụ Doctor lặp.

### Changed

- Đồng bộ package, README và `metadata.version` của bảy canonical workflow skills ở source release `1.0.2`; public CLI, TaskRecord schema, transition và platform integration contract không đổi.

## [1.0.1] - 2026-08-17

### Fixed

- Dùng code-unit comparator và locale-independent case normalization cho production output deterministic, sửa config Unicode có thể tự tạo thứ tự rồi tự reject và loại locale drift khỏi manifest, lifecycle, diagnostic, context cùng repo-map search.
- Package contract không còn xem pnpm store, task history hoặc test fixture là package publishable; self-host verification áp dụng cùng normalized line-ending semantics với managed ownership.
- Self-host test nay validate committed repo-map bằng canonical reader, cache được regenerate để public query không còn trả `invalid`, và inventory loại hard-excluded tree trước khi enumerate/output.

### Changed

- Đồng bộ package, CLI, bảy canonical workflow skill, self-host generator metadata và current-state documentation ở release `1.0.1`; schema, dependency, baseline, fixture và version lịch sử được giữ nguyên.
- Hoàn tất audit repository ngày 2026-08-17 với năm finding F1–F5 có reproduction, root cause, remediation và regression evidence; thay đổi này không tuyên bố package đã được publish lên npm.

## [1.0.0] - 2026-08-14

### Changed

- Nâng repository lên release `1.0.0` sau khi hoàn tất review/refactor toàn diện và đồng bộ package, CLI, self-host generator metadata cùng tài liệu trạng thái.
- Đồng bộ `metadata.version` của cả bảy canonical workflow skills với package version và thêm regression contract để ngăn version drift trong các release sau.
- Giữ nguyên toàn bộ version lịch sử trong changelog, migration fixtures và Harnix task evidence; thay đổi này không phải tuyên bố package đã được publish lên npm.

## [0.6.17] - 2026-08-14

### Fixed

- Global managed fragments nay fail closed trước khi ghi nếu content tự chứa marker boundary hoặc JSON member không match stable selector; JSON pointer/key như `__proto__` được xử lý bằng own properties trên object không prototype để tránh prototype mutation và data loss.
- Repo-map không còn loại nhầm file hợp lệ bắt đầu bằng `..`, validate mọi scan limit là positive integer và dùng code-unit ordering xuyên inventory, outline, cache và search tie-break.
- Public diagnostics và release scanner che/phát hiện thêm UNC, Windows forward-slash, macOS user paths cùng unquoted high-signal secrets; scanner có negative controls để không tự match escaped code/HTTPS URLs, còn init/rule seeding không nuốt permission/I/O errors hay ghi đè directory collision.

### Changed

- Hợp nhất bounded stdin, safe glob và filesystem existence probes thành các pure utilities có boundary regressions dùng chung.
- Tách pure marker, RFC 6901/JSON tree và manifest error khỏi global reconciliation transaction; module hotspot giảm 190 dòng trong khi giữ public API và rollback semantics.
- Hoàn tất continuation audit toàn repository với coverage matrix, severity/root cause/disposition/verification cho F1–F9; phần skill content version từ `0.6.16` được giữ như một slice nhỏ trong baseline tổng thể.

## [0.6.16] - 2026-08-14

### Added

- Bảy canonical workflow skills nay công bố content version độc lập qua `metadata.version: "1.0.0"`; catalog validate SemVer và expose version trong `SkillTemplate` trong khi ba platform vẫn cài byte-identical `SKILL.md`.

### Fixed

- Workflow finish có thể recover an toàn từ `completed/finishing` còn active sau journal/archive failure, không ghi duplicate completion journal và chỉ clear matching active pointer.
- Global managed manifest fail closed khi marker begin/end của một hoặc nhiều managed blocks trùng hay chứa chéo, tránh fragment dùng chung boundary rồi hỏng khi reconcile/remove.
- Khóa transitive dev-tool dependencies về `nanoid@3.3.18` và `esbuild@0.28.1` để loại các advisory hiện hành trong khi giữ Node.js `>=18` và toolchain `tsup`/Vitest hiện có.

### Changed

- Đồng bộ PRD, workflow, implementation plan, README và agent guide với skill-version contract cùng evidence status hiện tại của Phase 6.

## [0.6.15] - 2026-08-14

### Changed

- `harnix-brainstorm` nay luôn trình bày context checkpoint trước ready gate, gồm outcome, constraint, repository-derived decision, giả định và material choice còn mở để người dùng có thể sửa hiểu nhầm trước implementation.
- Brainstorm vẫn evidence-first: chỉ hỏi từng blocking question khi câu trả lời có thể đổi outcome; nếu không còn blocker thì nói rõ lý do và tiếp tục mà không thêm approval lần hai.
- Canonical workflow, project template và regression tests được đồng bộ với contract context checkpoint.

## [0.6.14] - 2026-08-14

### Added

- Hidden workflow inspect/continue nay project `contextDrift` xác định từ context manifest, gồm `changed`, `missing`, `unreadable` và `unverified`, để continuation bắt buộc replan trước context reselection khi state cũ.
- TaskRecord schema v2 bổ sung `criterionIds`, `inputs`/`@task-contract`, criterion-check evidence intersection, canonical `inputDigest`, hidden snapshot command và immutable task-owned verification-input sidecar.

### Changed

- New tasks use schema v2; exact v1 reading remains compatible, completed v1 is preserved, unfinished v1 can migrate only through explicit `replan` evidence, and Doctor reports `legacy-task-schema` without rewriting task data.
- Workflow save recomputes input snapshots to reject stale verification races, while finish recomputes latest required snapshots and reports only check IDs with safe relative changed/missing paths.
- PRD, canonical workflow, implementation contracts, harness research, upstream mapping, seven workflow skills, project agent template and focused safety/migration fixtures now describe and enforce the same C1–C3 contract.

## [0.6.13] - 2026-08-14

### Changed

- Việt hóa toàn bộ văn xuôi hướng người đọc trong hồ sơ task nghiên cứu năng lực harness, gồm `task.json`, PRD, kế hoạch và ba tài liệu nghiên cứu, đồng thời bảo toàn schema, ID, lệnh, đường dẫn, URL, revision, hash, timestamp và code literal.

## [0.6.12] - 2026-08-14

### Changed

- Root `AGENTS.md` và template `AGENTS.md` được đóng gói nay yêu cầu agent luôn dùng tiếng Việt khi tạo hoặc cập nhật nội dung task Harnix, đồng thời giữ nguyên identifier, command, path, schema field và trích dẫn nguồn khi cần cho độ chính xác kỹ thuật.
- Bổ sung regression test bảo đảm policy ngôn ngữ task xuất hiện đồng nhất trên cả repository và project mới được khởi tạo.

## [0.6.11] - 2026-08-13

### Changed

- Workflow persistence now fails closed when ready gates are empty, preserves persisted criterion text and required-check definitions as monotonic obligations, and revalidates non-empty Full artifacts on every ready transition.
- Task IDs use readable lowercase kebab-case slugs, Full plans expose evidence-backed implementation checklists, and forced Lite routing reports deterministic risk conflicts without changing precedence.
- Repository-derived context is explicitly delimited as bounded untrusted data across Kiro, Antigravity, and Codex, with adversarial fixtures for malicious README, comments, generated data, duplicates, oversized input, unsafe paths, and nested-root noise.
- Project update now reports metadata-only manifest reconciliation through `metadataUpdated` without claiming that managed file content was updated.

## [0.6.10] - 2026-08-13

### Added

- Added two reusable, independent review prompts: one exercises Harnix workflow scenarios in disposable fixtures and researches evidence-backed remediations; the other benchmarks current coding-agent harness mechanisms and produces a guardrail-aware capability backlog.

## [0.6.9] - 2026-08-13

### Changed

- `harnix-check` now activates for standalone code review and review-feedback evaluation, uses bounded read-only scope, and reports evidence-backed findings with calibrated severity, precise locations, fix direction, verdict, omitted checks, and residual risk.
- Generated project instructions now route standalone code review explicitly to `harnix-check` while preserving one seven-skill workflow and requiring a normal task before any review-driven fix.
- Workflow routing now gives blocked tasks precedence over replanning, assigns debugging exclusively to `harnix-debug`, and requires the explicit `verifying/finishing` handoff before completion persistence.
- Added a self-host regression that keeps this repository's managed workflow, manifest, config, common guide, and repository-map cache aligned with the packaged lifecycle.
- Antigravity's packaged global rule now includes valid rule frontmatter, preventing the current Desktop/CLI plugin loader from rejecting the rule and skipping its Harnix activation surface.

## [0.6.8] - 2026-08-13

### Changed

- Workflow routing now explicitly distinguishes requested action, work kind, mutation scope, risk, active state, and stage owner; standalone code review stays read-only while review-and-fix enters the normal task lifecycle.
- Added hidden JSON-only workflow inspect/save/finish operations with legal transition, evidence-preservation, Full-artifact, completion-journal, and active-pointer safeguards.
- Task and Doctor integrity checks now validate status/checkpoint and evidence relationships, report historical task/journal drift without rewriting it, and retain completed records whose transient artifact paths are no longer safe.
- Generated consumer instructions use the repository's own release instruction instead of imposing Harnix package-version or changelog rules.

## [0.6.7] - 2026-08-13

### Fixed

- Fixed `harnix init` failing on valid mixed-case or locale-sensitive repository paths when creating the repository-map cache.

## [0.6.6] - 2026-08-13

### Changed

- Generated project `AGENTS.md` now explains safe cache-only `repo-map` discovery, Doctor repair, and the prohibition on invoking repository-map operations from platform hooks.

## [0.6.5] - 2026-08-13

### Added

- Fresh `harnix init` now creates the safe repository-map cache, and `harnix repo-map --query <text> [--limit <count>]` provides a short cache-only query command.

### Changed

- Public commands now always emit JSON and no longer require or expose a redundant `--json` flag.

## [0.6.4] - 2026-08-13

### Changed

- Commit requests now require a displayed change summary and proposed commit message followed by explicit user approval before staging or committing.

## [0.6.3] - 2026-08-13

### Changed

- README and generated project `AGENTS.md` now document the required patch-version and changelog update before every task completion.

## [0.6.2] - 2026-08-13

### Changed

- Every completed Harnix task now increments the package patch version and updates this changelog before its task record is persisted as completed.
- Added a disposable, deterministic repository-map cache with safe inventory, structural-only lexical retrieval, hidden refresh/query operations, and project Doctor repair; platform hook fast paths remain read-only and unchanged.

## [0.6.1] - 2026-08-13

### Changed

- Generated project `AGENTS.md` bootstrap no longer includes Harnix begin/end markers; the independent marker-based Codex user-global reconciliation contract is unchanged.
- Stack profiling is moving to config v2 with independent source-language and typed technology IDs, explicit no-rescan v1 migration, bounded explainable detector evidence, and a metadata-driven guide catalog. The frozen contract prevents framework/runtime markers from overclaiming source languages and preserves compatible unknown configuration fields.
- Detection also ignores agent/tooling namespaces, preventing their hooks and helper scripts from being persisted as consumer-project language evidence.

## [0.6.0] - 2026-08-12

### Changed

- Seven Harnix workflow skills now have canonical `src/skills/harnix-*/SKILL.md` sources adapted from the frozen Trellis, ECC, and Superpowers baselines. They restore decision-complete ready review, critical plan review, observed RED–GREEN–REFACTOR, root-cause debugging, claim-to-evidence verification, safe resume/finish behavior, and byte-identical Kiro/Antigravity/Codex installation without mandatory worktrees, subagents, commits, branches, pushes, or pull requests.
- `harnix init` now detects Composer and PHP source projects, records the `php` profile language, and seeds PHP-specific engineering guidance.
- `harnix init` is now zero-option and non-interactive by default, inferring the developer journal ID from the OS user and auto-detecting the stack; `--user` and `--languages` remain optional overrides while the old `--yes` flag is a hidden no-op compatibility alias.
- Init output now reports project status, selected developer/languages, and sorted per-path `created`, `updated`, `unchanged`, `preserved`, and warning arrays.
- New projects no longer contain the redundant `.developer` file or empty `tasks/` and `workspace/<developer>/` placeholders; task and journal writers create their namespaces lazily.
- Generated common and C#/.NET/ABP guides now contain actionable architecture, security, persistence, cancellation, testing, and verification rules; the project workflow template now includes routing, ready-gate, implementation, and two-stage verification guidance.
- Generated workflow and AGENTS bootstrap instructions now resolve the nearest initialized project ancestor or workspace root, so nested working directories follow the same activation guard as global integrations.
- Generated `AGENTS.md` now places Harnix version and project-local workflow/task/guidance/diagnostic scope above the workflow, and adds a concise `Project profile` with configured languages and package paths; it does not use a “Detected repository” heading.
- Self-hosted workflow instructions and global skills now declare incoming state, persistence boundaries, and exit handoffs; project profiles are discovery seeds rather than complete repository truth, and research artifacts retain remaining uncertainty.

## [0.5.0] - 2026-08-11

### Added

- User-global setup refactor plan with current official Kiro, Antigravity, and Codex paths, hook schemas, ownership isolation, migration, security, and acceptance gates.
- User-global Harnix integrations for Kiro, Antigravity Desktop/CLI and Codex, with namespaced skills, rules/instructions, current hook schemas and independently owned manifests per platform root.
- Explicit global lifecycle: `setup`, `update --global`, Doctor JSON v2/global repair, scoped global uninstall, and manifest-backed cleanup for only safe standalone legacy project surfaces.
- Isolated-home tarball/release fixtures, Windows `.cmd` launcher coverage, collision/rollback/lock regressions, and a cold non-Harnix hook performance gate.
- Phase 5 regression coverage for legacy-data migration, managed setup/uninstall ownership, workflow completion, CLI exit/redaction behavior, doctor findings, path containment, and concurrent journal writes.
- Repository review and remediation roadmap in `docs/REVIEW_REFACTOR_PLAN.md`.
- README usage guide covering installation, quick start, CLI flags, platform setup, workflow, CI and troubleshooting-oriented lifecycle commands.
- `harnix init` now seeds a root `AGENTS.md` bootstrap that explains CLI versus skill responsibilities, Bypass/Lite/Full routing, skill order, persisted states, recovery, safety rules, and verification expectations.

### Changed

- Package metadata, build-time CLI metadata và generated manifests nay cùng lấy version `0.5.0` từ một nguồn `package.json`.
- `setup` now runs from any directory and installs only explicit user-global platform integrations; `init` remains project-local and creates only `.harnix` data.
- Package metadata and CLI help now distinguish project-local workflow data from user-global platform integrations.
- Global reconciliation preserves unrelated, untracked and user-modified content; it preflights all selected roots, uses stable locks and reports safe drift instead of overwriting collisions.
- The packaged CLI uses a lean canonical `internal context` fast path, keeping a non-Harnix Antigravity hook no-op output-free while meeting the cold-start release threshold.
- Test coverage is organized by behavior and boundary (`workflow`, `support`, focused core/lifecycle files) instead of historical Phase-labelled files.
- Phase 5 now refuses staged legacy-content mismatches before activation or cleanup, preserves modified obsolete-template ownership deterministically, preflights destructive uninstall paths, protects `.harnix` and task-state paths from symlink/junction escapes, and keeps customized Harnix instruction blocks intact on first platform setup.
- `harnix init` now always creates the `.harnix/` namespace regardless of existing Trellis folders or skills; it no longer exposes legacy migration through the init flow.
- CLI entry-point detection now resolves symlinked pnpm global installs before comparing module paths, so `harnix` executes normally after `pnpm add -g .` on Windows.
- README now documents pnpm 11 global CLI registration from source, `PNPM_HOME`/`PATH` recovery on PowerShell, project-local execution, and the unpublished npm-package limitation.
- README now documents the fail-safe legacy Trellis migration flow, what `--migrate` transfers, and why old Trellis skills remain until explicit cleanup.
- Setup, update, and uninstall now preserve user-modified platform files and injected blocks, reconcile obsolete ownership safely, retain unrelated Codex hook keys, and prevent removed platforms from being recreated.
- Migration now inventories and hash-verifies legacy specs, tasks, and journals in staging before activation; explicit cleanup removes only discovered verified legacy roots.
- Workflow/task validation now persists completion before archive, honors the latest required evidence, clears resumed blockers, and rejects incomplete completed records.
- CLI automation now preserves language detection, avoids non-TTY prompts, supports stable doctor JSON/exit semantics, consumes validated hook-event `cwd`, and redacts project paths from errors.
- Context and journal processing now normalize/deduplicate inputs, disclose unsafe or omitted sources, bound retained search results, and serialize concurrent in-process appends.
- Doctor and release scanning now cover deterministic lifecycle drift, hooks, injections, sensitive values, attribution, packaged output, and isolated generated fixtures.
- Detection ignores additional generated/cache trees, excludes React Native-only projects, and uses bounded directory traversal; init performance measurement now uses a representative Vue/Nest monorepo fixture.
- Platform rendering is separated into Kiro, Antigravity, and Codex configurators, and package version metadata has one build/runtime source.

### Security

- Project writes and destructive lifecycle operations now preflight repository containment and reject traversal plus symlink/junction escapes.
- User-global writes are anchored to verified user roots, never use a real profile in automated tests, and preserve concurrent editor changes during managed transactions.
- Runtime dependency audit remains clean. The single Low development-only esbuild advisory is explicitly risk-accepted until tsup publishes a compatible patched range; Harnix never invokes esbuild's affected development server, and adding a pnpm workspace solely for an override would violate the one-package/no-workspace product contract.

## [0.4.0] - 2026-08-07

### Added

- Phase 4 lifecycle commands: managed `update` with explicit restore, offline-by-default upgrade planning, safe uninstall/purge confirmation, journal `mem`, and deterministic `doctor --fix` reporting.
- Staged legacy migration with preview, conflict detection, atomic activation, verification, and opt-in legacy cleanup.
- Managed ownership now preserves user-modified/deleted files without re-baselining them; setup records Harnix-owned platform templates for safe later lifecycle operations.
- Packaging/release gates now inspect tarball contents, smoke install the tarball for every supported platform combination, measure init/footprint, and scan release output for secrets, machine paths, one-package, and one-bin invariants.

## [0.3.0] - 2026-08-07

### Added

- Phase 3 workflow and platform parity: managed workflow/skills, research/debug/verification guards, bounded internal context hooks, Codex adapter parity, and Kiro/Antigravity project-local setup.

## [0.2.0] - 2026-08-07

### Added

- Phase 2 completed: managed manifest rollback, full TaskRecord v1 validation, context ranking/persistence, learning promotion proposals, rule attribution, and 53-test acceptance verification.
- Phase 2 foundation: managed-file hashing/ownership, versioned task validation and transitions, bounded ranked context, journal search, and learning-candidate scoring.
- Phase 2 task artifacts: active-task persistence, validated context manifests, Lite/Full task artifact rules, and managed ownership reconciliation.
- Detection cục bộ, deterministic cho C#/.NET/ABP, NestJS, Python, Java/Spring, Go, React, Vue và monorepo.
- Discovery package manager và verification script chỉ đọc; bỏ qua dependency/generator tree và không thực thi script dự án.
- Config YAML Harnix v1: validation schema, canonical sorting, safe package path, reject future schema và preserve compatible unknown keys.
- Init core idempotent tạo `.harnix` project data; legacy `.trellis`/`.trellis-pro` được preview no-write khi chưa yêu cầu migrate.
- Public CLI `init`/`setup`; Kiro và Codex project-local setup idempotent, Antigravity được nhận diện nhưng chưa sinh hook/settings v1.
- Init test coverage cho config preservation, dry-run và performance; Kiro steering chỉ nạp ngôn ngữ đã detect.
- `pack:check` tạo và kiểm tra đúng một tarball Harnix trong `.artifacts`.
- `init` hỗ trợ prompt interactive có test injection, đồng thời giữ automation flags cho CI.
- Codex setup merge giữ lại `UserPromptSubmit` do người dùng sở hữu và thay thế duy nhất Harnix hook.
- Phase 1 hoàn tất: fresh `pnpm install --frozen-lockfile --ignore-scripts`, build, lint, typecheck, 44 test, `test:acceptance`, `pack:check`, branding scan và `git diff --check` đều pass.

## [0.1.0] - 2026-08-05

### Added

- Documentation baseline: PRD, workflow chuẩn, implementation plan, upstream baseline, research và mapping.
- Hướng dẫn cho coding agent và README tiếng Việt.
- Package TypeScript ESM `@tamtiger/harnix`, binary `harnix`, toolchain pnpm/tsup/Vitest/ESLint và lockfile.
- CLI help/usage tối thiểu, license AGPL-3.0, NOTICE và các script gate đã được khóa.
- Primitive an toàn cho normalized project path, Git-root discovery, containment qua symlink/junction và atomic write.
- Unit tests cho packaging invariant, path safety và rollback khi atomic replacement lỗi.
- Changelog theo Keep a Changelog, link từ README và quy tắc bắt buộc cập nhật `Unreleased` trước mỗi commit implement.

### Security

- Không tạo `pnpm-workspace.yaml`; chỉ một publishable package được kiểm thử.
- `.gitignore` loại trừ dependency, build output, artefact và pnpm store cục bộ.

## [Documentation baseline] - 2026-08-05

### Added

- Quyết định sản phẩm Harnix, contract v1, workflow và provenance upstream được chốt tại commit `d01239f`.

[0.6.7]: https://github.com/tamtiger/harnix/compare/v0.6.6...v0.6.7
[0.6.6]: https://github.com/tamtiger/harnix/compare/v0.6.5...v0.6.6
[0.6.5]: https://github.com/tamtiger/harnix/compare/v0.6.4...v0.6.5
[0.6.4]: https://github.com/tamtiger/harnix/compare/v0.6.3...v0.6.4
[0.6.3]: https://github.com/tamtiger/harnix/compare/v0.6.2...v0.6.3
[0.6.2]: https://github.com/tamtiger/harnix/compare/v0.6.1...v0.6.2
[0.6.1]: https://github.com/tamtiger/harnix/compare/v0.6.0...v0.6.1
[0.6.0]: https://github.com/tamtiger/harnix/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/tamtiger/harnix/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/tamtiger/harnix/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/tamtiger/harnix/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/tamtiger/harnix/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/tamtiger/harnix/commits/main
[Documentation baseline]: https://github.com/tamtiger/harnix/commit/d01239f
