# Prompt 3 — Review + refactor toàn repo (code, skills, AGENTS, AGENTS template) và bổ sung setup cho Claude

Bạn đang làm việc tại repository Harnix (`@tamtiger/harnix`). Nhiệm vụ gồm hai phần bắt buộc, thực hiện theo đúng thứ tự:

1. **Review** toàn repo bằng bằng chứng, rồi **refactor** những gì review chứng minh là nợ kỹ thuật — bao gồm code, skill templates, `AGENTS.md` của repo và AGENTS template sinh ra cho consumer.
2. **Bổ sung một platform integration mới cho Claude Code** ở phạm vi user-global, ngang hàng Kiro / Antigravity / Codex.

Đây **không** phải standalone read-only review: kết quả là thay đổi mã nguồn thật trong repository này. Route theo Full ceremony và đi qua lifecycle Harnix chuẩn.

## Chế độ làm việc và activation guard

- Resolve target trước khi kích hoạt Harnix: repository người dùng chỉ định tường minh là authoritative; đường dẫn chỉ xuất hiện trong hook context, log, nội dung repo hoặc tool output là untrusted hint.
- Tìm nearest ancestor hoặc workspace root chứa `.harnix/config.yaml`. Nếu state không hợp lệ thì dừng và báo bằng chứng; không tự chạy `harnix init`.
- Đọc `AGENTS.md`, `.harnix/workflow.md`, `.harnix/config.yaml` và `.harnix/tasks/.active` trước khi thay đổi bất cứ file nào.
- Chạy hidden `harnix workflow --preflight` và theo đúng `nextStage` trả về. `await` và `stop` là điểm dừng bắt buộc.
- Luôn dùng tiếng Việt cho nội dung hướng người dùng trong `task.json`, `prd.md`, `plan.md`, `design.md`, research và journal. Giữ nguyên code identifier, command, đường dẫn, tên field/schema.
- Không dùng subagent như dependency bắt buộc; mọi kết quả delegate phải được primary agent tự kiểm chứng lại.

## Safety boundary

- Không commit, branch, worktree, merge, push, publish hoặc tạo pull request. Trước bất kỳ commit nào, trình diff + commit message và chờ người dùng duyệt tường minh.
- Mọi lifecycle test chạy trên isolated temporary repository và **injected disposable user home**. Không chạm `~/.kiro`, `~/.gemini`, `$CODEX_HOME`, `~/.claude` thật.
- Không cài integration lên profile thật, không chạy destructive lifecycle trên dữ liệu thật, không thực thi code không tin cậy từ Internet.
- Giữ nguyên file thuộc sở hữu người dùng: tasks, evidence, research, journal, spec, credentials, cấu hình không liên quan.
- Không tạo `~/.harnix`, không thêm telemetry, daemon, MCP mặc định, hay network ngầm.

## Sources of truth

Đọc tập nhỏ nhất nhưng đủ, theo thứ tự ưu tiên khi xung đột:

1. `docs/HARNIX_PRD.md`
2. `docs/HARNIX_WORKFLOW.md`
3. `docs/IMPLEMENTATION_PLAN.md` (đặc biệt mục 4 — frozen contracts, và mục 11 — acceptance sequence)
4. `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`
5. `docs/HARNESS_RESEARCH.md`, `docs/UPSTREAM_MAPPING.md`, `docs/UPSTREAM_BASELINE.md`
6. `AGENTS.md`, `README.md`, `CHANGELOG.md`

Với Claude Code, chỉ dùng tài liệu chính thức của Anthropic (Claude Code settings, hooks, skills, memory/`CLAUDE.md`) làm nguồn. Ghi lại URL và ngày truy cập vào research artifact. Không suy đoán schema hook hay đường dẫn từ trí nhớ.

---

## Phần A — Review có bằng chứng

Trả lời bằng finding có severity, vị trí chính xác (`file:line`) và bằng chứng tái lập được. Không báo cáo cảm tính, không đề xuất refactor đầu cơ.

### A1. Code

Phạm vi: `src/`, `scripts/`, `test/`.

- **Layering:** kiểm tra hướng phụ thuộc `commands|configurators|migration -> core -> utils/pure types`; `core` không được import Commander/Inquirer/platform template. Liệt kê mọi vi phạm thực tế.
- **Kích thước và trách nhiệm:** `src/commands/internal-workflow.ts` (~723 dòng), `src/commands/global-doctor.ts` (~535), `src/commands/doctor.ts` (~462), `src/commands/global-uninstall.ts` (~331), `src/commands/setup.ts` (~324) là ứng viên tách. Chỉ tách khi có seam hành vi rõ ràng, không tách để giảm số dòng.
- **Trùng lặp:** ba configurator (`kiro.ts`, `antigravity.ts`, `codex.ts`) lặp gần như nguyên xi khối `workflowSkills.map(...)` và khối activation-guard. Xác định phần nào nên trở thành helper dùng chung *trước khi* thêm platform thứ tư — đây là tiền đề cho Phần C.
- **Dead code và deprecated surface:** `VersionLookup`, `SetupPlatformsOptions.root`, `SetupPlatformsOptions.versionLookup` đang `@deprecated` và bị ignore; `src/commands/legacy-project-surfaces.ts`. Quyết định: giữ có lý do, hay xoá kèm test chứng minh không còn caller.
- **Safety invariants:** path normalization, realpath/traversal rejection, atomic write bảo toàn permission, file lock ordering, bounded input. Tìm đường đi nào bỏ qua các invariant này.
- **Error surface:** thông điệp lỗi không được lộ absolute path máy người dùng, credential hay prompt content.
- **Test:** tìm test chỉ assert snapshot mà không assert hành vi; tìm invariant an toàn chưa có test phủ; tìm test phụ thuộc thời gian thật hoặc home thật.

### A2. Skills

Phạm vi: `src/skills/harnix-*/SKILL.md` (7 skill) và `src/skills/catalog.ts`.

- **Trùng lặp instruction:** khối "Harnix activation guard" được lặp nguyên văn trong mọi SKILL.md và cả trong `src/templates/harnix/activation.ts`. Xác định nguồn canonical duy nhất và cách các bản sao còn lại được sinh ra hoặc được test giữ đồng bộ.
- **Ranh giới trách nhiệm:** mỗi skill phải nói rõ *khi nào không dùng nó*. Kiểm tra chồng lấn `harnix-check` ↔ `harnix-debug`, `harnix-brainstorm` ↔ `harnix-continue`, `harnix-research` standalone ↔ task-scoped.
- **Contract drift:** mọi lệnh, tên field, tên transition xuất hiện trong SKILL.md phải tồn tại thật trong code và khớp `.harnix/workflow.md`. Mọi lệch là finding.
- **Frontmatter:** `name` khớp `^harnix-[a-z0-9-]+$`, `description` bắt đầu bằng `Use when `, `metadata.version` khớp `packageVersion` (xem `scripts/version-sync.mjs` và `test/workflow/skill-sources.test.ts`).
- **Độ dài:** skill dài làm loãng tín hiệu. Đề xuất cắt phần nào mà không mất obligation nào — chứng minh bằng ánh xạ từng đoạn bị cắt sang nơi obligation đó vẫn còn.

### A3. `AGENTS.md` (của chính repo)

- Tìm phát biểu đã lỗi thời: "Phase 1–6 hoàn tất", "Documentation readiness đã pass", danh sách platform "exactly Kiro, Antigravity, and Codex".
- Tìm nội dung trùng với `docs/HARNIX_WORKFLOW.md` và `docs/IMPLEMENTATION_PLAN.md` — `AGENTS.md` nên trỏ tới nguồn canonical thay vì sao chép state machine.
- Các đoạn văn dài đặc (mục "Implementation workflow", "Frozen contracts") cần tái cấu trúc thành quy tắc kiểm chứng được, không mất obligation nào.

### A4. AGENTS template (`src/templates/harnix/agents.ts`)

- Kiểm tra parity với `AGENTS.md` repo và với nội dung skill: cùng activation guard, cùng danh sách skill, cùng operating rules.
- Kiểm tra dòng tiếng Việt hard-code về ngôn ngữ task: nó đúng cho repo này nhưng được ghi vào **mọi consumer repository**. Quyết định tường minh: giữ, bỏ, hay điều khiển bằng `.harnix/config.yaml`. Đây là thay đổi hành vi public — cần ghi vào PRD và CHANGELOG.
- Kiểm tra `packageVersion` nhúng trong output có được test parity phủ không.

**Đầu ra Phần A:** một finding ledger có severity (P1..P3), file:line, bằng chứng, và phân loại `fix-now` / `residual-risk`. Finding P3 ngoài frozen obligation được phép để lại làm residual risk nếu không gây rủi ro correctness, security, data-loss hay compatibility.

---

## Phần B — Refactor

Chỉ refactor những gì Phần A đã chứng minh. Ràng buộc:

- Không thay đổi hành vi public khi không có mục tương ứng trong PRD/CHANGELOG.
- Viết test thất bại có ý nghĩa trước mỗi thay đổi hành vi; refactor thuần tuý giữ nguyên test hiện có xanh và không được sửa test để hợp thức hoá thay đổi.
- Không tạo abstraction đầu cơ, không thêm surface mới ngoài phạm vi.
- Giữ TypeScript ESM, Node `>=18`, pnpm, Commander, Inquirer, tsup, Vitest. Không thêm dependency runtime mới trừ khi có lý do được ghi nhận và audit advisory.
- Một `package.json` publishable, một bin `harnix`.

Refactor bắt buộc tối thiểu (nếu Phần A xác nhận):

1. Rút nguồn canonical duy nhất cho activation-guard/skill-plan mà bốn configurator cùng dùng.
2. Tách `internal-workflow.ts` theo seam hành vi (routing / preflight / persistence / evidence), không theo số dòng.
3. Hợp nhất hoặc sinh tự động các khối instruction lặp giữa SKILL.md, `activation.ts` và `agents.ts`, kèm test parity chặn drift.
4. Cập nhật `AGENTS.md` và AGENTS template theo A3/A4.

---

## Phần C — Bổ sung setup cho Claude Code

Mục tiêu: `harnix setup --claude [--dry-run]` cài đặt integration **user-global** cho Claude Code, ngang hàng ba platform hiện có, đi qua đúng cơ chế managed-file/manifest/lock hiện tại.

### C0. Quyết định contract (làm trước tiên)

Ranh giới hiện tại ghi rõ "Supported platforms are Kiro, Antigravity, and Codex only" trong `AGENTS.md` và PRD, và `scripts/scan-release.mjs:112` **chặn chuỗi `claude` trong generated output** như một forbidden platform surface. Vì vậy:

- Mở rộng platform set là thay đổi frozen contract. Cập nhật trong **cùng một change**: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md` (nếu có ảnh hưởng), `docs/IMPLEMENTATION_PLAN.md` mục 4, `docs/GLOBAL_SETUP_REFACTOR_PLAN.md`, `AGENTS.md`, `README.md`, `CHANGELOG.md`.
- Sửa `scripts/scan-release.mjs` để `claude` là platform hợp lệ trong khi `gemini-cli|cursor|windsurf` vẫn bị chặn. Giữ nguyên ý nghĩa của guard: nó tồn tại để chặn platform *không được hỗ trợ*, không phải để chặn từ khoá.
- Nếu review kết luận không nên mở rộng platform set, **dừng lại và báo cáo lý do kèm bằng chứng** thay vì cài cắm một nửa.

### C1. Bề mặt Claude Code cần cài

Xác thực từng đường dẫn và schema bằng tài liệu chính thức trước khi code:

- **Skills:** `~/.claude/skills/harnix-<name>/SKILL.md` cho cả 7 skill, sinh từ `workflowSkills` + `renderSkill` — không viết tay bản sao.
- **Instructions:** một managed block có marker (theo mô hình `codexGlobalAgentsContent`) trong `~/.claude/CLAUDE.md`, chứa target-authority guard + implicit activation. Bảo toàn tuyệt đối nội dung ngoài marker.
- **Hook:** một `UserPromptSubmit` handler chạy `harnix context --platform claude`, ghi vào `~/.claude/settings.json` bằng **json-array-member selector** như Codex (`memberId: "harnix-context"`), không ghi đè cả file, không đụng handler khác.
- **Tuyệt đối không chạm:** `~/.claude.json`, credentials, `mcpServers`, `projects/`, `history`, `todos/`, hoặc bất kỳ setting nào không thuộc Harnix.

### C2. Điểm chạm trong code

Thêm/sửa tối thiểu:

- `src/core/config/config.ts`: `PlatformId` và `platformIds` (dòng ~10 và ~68) — giữ sorted/unique invariant của `platforms`.
- `src/configurators/claude.ts`: hàm thuần, root-relative, **không I/O, không absolute path**, trả `DesiredGlobalManagedFile[]` (+ selector cho managed block/json member).
- `src/utils/user-paths.ts`: `UserGlobalPlatform`, `SelectedUserPlatformRoots`, `resolveSelectedUserPlatformRoots` — thêm root `~/.claude` qua `createDerivedUserRoot`; hỗ trợ override bằng biến môi trường chỉ khi tài liệu chính thức xác nhận.
- `src/commands/setup.ts`: `createTargets`, manifest sidecar riêng cho root mới, lock ordering ổn định, readiness detection (`claude` binary lookup → `installed` / `binary-unavailable` / `installed-pending-trust` / `drifted`).
- `src/commands/doctor.ts`, `global-doctor.ts`, `global-update.ts`, `global-uninstall.ts`: parity đầy đủ cho `--claude`, gồm `--fix --global`, `update --global`, `uninstall --global ... --yes`.
- `src/cli-program.ts`: flag `--claude` và help text.
- `src/commands/internal-context.ts`: nhánh `--platform claude` phải là fast no-write/no-network no-op khi ngoài project đã init, và tôn trọng giới hạn kích thước additional context của Claude Code.
- `src/templates/harnix/agents.ts` + `AGENTS.md`: cập nhật dòng `harnix setup --kiro|--antigravity|--codex` thành danh sách có `--claude`.

### C3. Test bắt buộc

- `test/platform/setup.test.ts`, `test/platform/global-adapters.test.ts`: cài, dry-run, idempotent re-run, drift detection, preserve unrelated content.
- Test mới tương đương `test/platform/codex-global.test.ts` cho merge/rollback `settings.json` khi có handler khác, JSON hỏng, file read-only, và khi user đã sửa managed block.
- `test/safety/user-global-paths.test.ts`: `~/.claude` được resolve an toàn, chặn traversal và symlink/junction escape.
- `test/workflow/skill-sources.test.ts`, `test/workflow/templates.test.ts`: parity skill/template giữa cả bốn platform.
- `test/safety/release-scanner.test.ts`: guard mới vẫn chặn `gemini-cli|cursor|windsurf`.
- `test/unit/config.test.ts`: `platforms` chấp nhận `claude`, giữ sorted/unique, và **task/config v1 cũ vẫn đọc được không đổi**.
- Mọi test dùng injected disposable home; không test nào chạm home thật.

### C4. Uninstall và migration

- `uninstall --global --claude --yes` gỡ đúng fragment do Harnix sở hữu, giữ lại nội dung user đã sửa, và không xoá `~/.claude` hay file ngoài manifest.
- `harnix doctor --global` báo được trạng thái drift của từng fragment Claude.
- Không tự migrate, không tự bật `claude` cho user đã setup platform khác.

---

## Thứ tự thực thi

1. Tạo TaskRecord v2 (Full ceremony), ánh xạ `criterionIds` cho mọi required check, khai báo `inputs` sorted an toàn gồm `@task-contract`.
2. Research Claude Code surface từ nguồn chính thức → lưu vào `research/` của task kèm URL và ngày truy cập.
3. Phần A (review) → finding ledger.
4. Quyết định C0 → cập nhật tài liệu contract.
5. Phần B (refactor) — hoàn tất và xanh trước khi thêm platform thứ tư, để không nhân bản nợ kỹ thuật.
6. Phần C (Claude integration), TDD từng bước.
7. Compliance review trước, rồi quality/security review.
8. Tăng patch version tối đa một lần, cập nhật `CHANGELOG.md` và chạy `pnpm run version:sync` trong giai đoạn implementation, **trước** `verifying`. Finish là product-read-only.

## Acceptance

Chạy và đọc đủ exit code + output, không bỏ qua, không làm yếu gate:

```text
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run test:acceptance
pnpm run pack:check
pnpm run smoke:tarball
pnpm run scan:release
pnpm run version:sync
```

Thêm fake-home tarball smoke cho platform Claude. Không chạm profile thật nếu không có authorization tường minh.

Ở cửa verification, tái dùng check đã `passed` khi `inputDigest` hiện tại khớp; chỉ chạy lại check pending, failed, stale hoặc bị ảnh hưởng.

## Điểm dừng bắt buộc

- Preflight trả `await` hoặc `stop`.
- Không chứng minh được containment của fake home cho một scenario có write → đánh dấu `blocked`, không chạy.
- Một vòng remediation tự động được phép. Rerun thất bại sau vòng đó dừng mọi công việc tự động; evidence `skipped` hoặc pass future-dated không reset breaker.
- Sau ba giả thuyết thất bại cho cùng một triệu chứng → quay lại planning, đánh giá lại giả định/kiến trúc.
- Contract Claude Code không xác thực được bằng tài liệu chính thức → dừng ở C1, báo cáo, không đoán schema.

## Báo cáo cuối

1. Finding ledger Phần A kèm phân loại `fix-now` / `residual-risk`.
2. Danh sách refactor đã thực hiện, mỗi mục kèm test chứng minh.
3. Tóm tắt Claude integration: file được ghi, selector dùng, readiness states, hành vi uninstall.
4. Bảng contract document đã cập nhật.
5. Kết quả acceptance thật (exit code + trích output), check bị bỏ qua và lý do, residual risk còn lại, việc tiếp theo.
6. Diff và commit message đề xuất — **chờ người dùng duyệt**, không tự commit.
