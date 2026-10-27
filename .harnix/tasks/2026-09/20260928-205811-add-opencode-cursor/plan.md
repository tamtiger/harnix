# Plan — [13] Thêm OpenCode và Cursor qua platform registry

## Slices (RED → GREEN, theo thứ tự)

- [x] S1. Facts: thêm `OPENCODE_FACTS`, `CURSOR_FACTS` vào `src/core/platform/facts.ts` (source + verifiedOn 2026-10-01 + ghi giới hạn). RED: `test/unit/core/platform/facts.test.ts` đã iterate records nên pass khi records có facts; thêm assert tên source chứa opencode.ai / cursor.com.
- [x] S2. Registry: nới `PlatformId` thành `… | "opencode" | "cursor"`; nới `GlobalPlatformId` thêm `"opencode" | "cursor"`; sửa `PLATFORM_MESSAGE` thành "… kiro, antigravity, codex, claude, opencode, or cursor."; thêm 2 record vào `PLATFORM_RECORDS` + import facts. RED trước: cập nhật `test/unit/core/platform/registry.test.ts` (list 6 nền tảng, title, message) → đỏ; GREEN: thêm record.
  - OpenCode record: root `config` = `.config/opencode` logical `~/.config/opencode` envOverride null; skillDirectories `["config:skills"]`; instructionFile `AGENTS.md`; contextHook null; contextOutput "plain"; contextFirstInvocationOnly false; contextRenderCap null; targets `[{rootKey:"config", globalPlatform:"opencode", manifestPath:"harnix/managed.json", lockPath:"harnix/managed.lock", preserveUnownedRoot:true, planKey:"opencode"}]`; healthyReadiness "installed"; setupNotice ghi rủi ro fallback `~/.claude/CLAUDE.md`; ambiguousRootEnv null; shadowingFiles []; facts OPENCODE_FACTS.
  - Cursor record: root `config` = `.cursor` logical `~/.cursor` envOverride null; skillDirectories `["config:skills"]`; instructionFile null; contextHook null; contextOutput "plain"; contextFirstInvocationOnly false; contextRenderCap null; targets `[{rootKey:"config", globalPlatform:"cursor", manifestPath:"harnix/managed.json", lockPath:"harnix/managed.lock", preserveUnownedRoot:true, planKey:"cursor"}]`; healthyReadiness "installed"; setupNotice ghi hookless (sessionStart injection chưa xác minh); ambiguousRootEnv null; shadowingFiles []; facts CURSOR_FACTS.
- [x] S3. user-paths: thêm named field `opencode`, `cursor` vào `UserPlatformRoots` + `SelectedUserPlatformRoots`; cập nhật `shapeRoots` (get `opencode:config`, `cursor:config`), `ROOT_ACCESSORS` (2 entry), và assertion + return trong `resolveUserPlatformRoots`. envOverride null nên `isSafeLogicalPath` không cần `$VAR` mới (logical `~/...`).
- [x] S4. Configurators: `src/configurators/opencode.ts` → `opencodeGlobalDesiredFiles()` = skills `globalSkillDesiredFiles("opencode-skill")` + managed-block trong `AGENTS.md` (selector markers, content `## Harnix\n…renderHarnixRules()`). `src/configurators/cursor.ts` → `cursorGlobalDesiredFiles()` = chỉ skills `globalSkillDesiredFiles("cursor-skill")` (không instruction file, không hook).
- [x] S5. Wiring: `src/commands/setup.ts` `configuratorPlans()` thêm `opencode: opencodeGlobalDesiredFiles()`, `cursor: cursorGlobalDesiredFiles()` vào `desired`. Không matcher mới (không json-member). CLI flag tự có qua `addPlatformFlags`/`selectedPlatforms` (không sửa cli-program).
- [x] S6. Tests platform: `test/platform/opencode-global.test.ts`, `test/platform/cursor-global.test.ts`, `test/platform/skill-dedup.test.ts` theo mẫu `test/platform/setup-lifecycle.test.ts` (useTemporaryUserHomes + homeResolver/commandLookup/environment inject). Cập nhật `test/unit/core/doctor/doctor.test.ts` length 4 → 6.
- [x] S7. Docs: `docs/HARNIX_PRD.md` (dòng 34, 58, 347, 475 và mọi chỗ liệt kê 4 nền tảng), `AGENTS.md` (Supported platforms boundary + per-platform contract OpenCode/Cursor), `README.md`, `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`. Thêm `test/unit/docs/supported-platforms.test.ts`.
- [x] S8. Verify: `pnpm format` → `pnpm lint` → `pnpm typecheck` → `pnpm test`; sửa đỏ; ghi evidence; finish.

## Checks → chứng minh gì
- `check-registry` (`pnpm vitest run test/unit/core/platform/registry.test.ts test/unit/core/platform/facts.test.ts`): ac-registry-only, ac-verified-facts — 6 nền tảng là dữ liệu, facts có nguồn.
- `check-platform` (`pnpm vitest run test/platform/opencode-global.test.ts test/platform/cursor-global.test.ts test/platform/skill-dedup.test.ts`): ac-opencode-setup, ac-cursor-setup, ac-no-duplicate-skills — lifecycle qua fake home + dedup.
- `check-docs` (`pnpm vitest run test/unit/docs/supported-platforms.test.ts`): ac-docs-sync.
- `check-suite` (`pnpm lint && pnpm typecheck && pnpm test`): project-level suite gate phủ `src/**` + `test/**` + `docs/**`, chặn hồi quy toàn repo.

## Rủi ro / rollback
- Nới `PlatformId` union lan ra nhiều consumer; `shapeRoots`/`ROOT_ACCESSORS`/assertion phải đồng bộ nếu không `selectedUserRoot` trả undefined → `globalTargets()` throw. Mitigation: typecheck + check-platform.
- `preserveUnownedRoot: true` cho OpenCode/Cursor để không coi root sẵn có của tool là của Harnix.
- Rollback: thay đổi khu trú ở registry/facts/2 configurator/user-paths/setup plan + tests + docs; `git checkout` nhóm file này nếu cần.
