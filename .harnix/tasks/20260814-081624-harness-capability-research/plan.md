# Kế hoạch — Backlog năng lực Harnix dựa trên bằng chứng

Đây là backlog chỉ lập kế hoạch và đã hoàn tất quyết định. Tài liệu không cho phép triển khai production. Nếu một task sau được ủy quyền, mỗi lát cắt triển khai phải tuân theo RED–GREEN–REFACTOR và được rà soát tuân thủ trước khi rà soát chất lượng/an toàn.

## Checklist nghiên cứu/lập kế hoạch

- [x] R0 — Đóng băng baseline repository, bằng chứng khoảng trống và ranh giới bảo toàn.
- [x] R1 — Nghiên cứu các cơ chế chính thức của platform được hỗ trợ và baseline đã đóng băng.
- [x] R2 — Nghiên cứu hệ sinh thái harness/framework hiện hành từ nguồn sơ cấp.
- [x] R3 — Chuẩn hóa/loại bỏ trùng lặp các cơ chế và chứng minh khoảng trống Harnix.
- [x] R4 — Chấm điểm, áp hard-gate và chọn backlog đã hoàn tất quyết định.
- [x] R5 — Chạy tự rà soát cổng ready, lưu bằng chứng và dừng tại `ready/ready`.

Bằng chứng tập trung cho R0–R5 nằm trong `research/01-supported-platform-and-baseline-mechanisms.md`, `research/02-current-harness-mechanisms.md`, `research/03-capability-decisions.md` và `task.json`. Ô đã đánh dấu nghĩa là lát cắt nghiên cứu/lập kế hoạch đã hoàn tất; chúng không đại diện cho việc triển khai production.

## Checklist triển khai phần sửa đổi phạm vi về tiếng Việt

- [x] V1 — Viết regression test yêu cầu root `AGENTS.md` và AGENTS template đã render cùng chứa chính xác chính sách tạo task bằng tiếng Việt; quan sát RED đúng lý do.
- [x] V2 — Thêm cùng chính sách vào `AGENTS.md` và `src/templates/harnix/agents.ts`; chạy GREEN tập trung.
- [x] V3 — Tăng phiên bản vá, cập nhật `CHANGELOG.md`, chạy các cổng chất lượng/workflow và hoàn tất rà soát bằng chứng/bảo toàn.

Ba lát cắt V1–V3 là phần triển khai duy nhất được người dùng ủy quyền trong phần sửa đổi phạm vi ngày 2026-08-14. Ba năng lực nghiên cứu C1–C3 bên dưới vẫn là backlog chỉ lập kế hoạch và không được triển khai trong task này.

## Ưu tiên 1 — Chẩn đoán context drift khi tiếp tục

### Quyết định

- Năng lực: C1, `adapt`, điểm 4.35/5, vượt qua hard-gate.
- Kích thước: `S`.
- Phụ thuộc: không có. Triển khai đầu tiên.
- Nguyên tắc nguồn: cơ chế làm mới repo-map nhạy với thay đổi của Aider và cơ chế tiếp tục từ trạng thái đã lưu của OpenHands/Claude/Cline. Không tái sử dụng mã nguồn; giữ URL/revision chính thức trong `docs/HARNESS_RESEARCH.md` và ánh xạ ghi công nếu sau này có văn bản/mã được điều chỉnh để sử dụng.
- Chủ ý loại trừ: daemon/watcher, tự động thu thập source, phát lại toàn bộ session, khôi phục file và làm mới qua network.

### Vấn đề và giá trị quan sát được

`ContextEntry.contentHash` được lưu bền vững, nhưng `resumeActiveTask` chỉ trả về các đường dẫn context. Người dùng có thể tiếp tục task sau khi file đã chọn thay đổi hoặc biến mất mà không nhận được cảnh báo xác định. Sau khi có năng lực này, Continue/resume báo chính xác những đường dẫn đã đưa vào trước đó bị thay đổi, thiếu hoặc không thể xác minh trước khi agent dựa vào chúng.

### Giao diện và hành vi chính xác

Thêm các kiểu core thuần:

```ts
type ContextState = "not-recorded" | "current" | "stale";
type ContextChangeKind = "changed" | "missing" | "unreadable" | "unverified";
interface ContextChange { path: string; kind: ContextChangeKind }
interface ContextDrift { state: ContextState; changes: ContextChange[] }
```

Thêm hàm có filesystem được inject `inspectContextDrift(projectRoot, manifest): Promise<ContextDrift>`:

- chỉ kiểm tra các entry repository-relative đã chuẩn hóa và đã có trong context manifest được lưu;
- từ chối traversal/symlink escape trước khi đọc và báo `unreadable` mà không lộ đường dẫn tuyệt đối hoặc nội dung lỗi;
- so sánh SHA-256 cho các entry có `contentHash` và sắp xếp phát hiện theo path rồi kind;
- trả `not-recorded` khi manifest không tồn tại hoặc không entry nào có hash; hỗn hợp entry có/không hash trả `stale` với phát hiện `unverified`;
- không bao giờ ghi, làm mới context, quét file không liên quan, truy cập network hoặc thay đổi task.

Mở rộng phép chiếu JSON của inspect/resume trong workflow ẩn bằng:

```ts
contextDrift: { state: ContextState; changes: ContextChange[] }
```

Field này luôn hiện diện. Các field `task` và `contextPaths` hiện có cùng toàn bộ JSON/exit semantics của public command không đổi. `harnix-continue` phải lưu cùng trạng thái task với checkpoint `replan` trước khi dựa vào context cũ, rồi định tuyến qua bước chọn lại context; `not-recorded` được công bố nhưng không buộc replan cho task cũ. Không tự động sửa file hoặc trạng thái task.

### File và kiểm thử dự kiến

- Core/command: `src/core/context/context.ts`, `src/core/workflow.ts`, `src/commands/internal-workflow.ts`.
- Skill/template: `src/skills/harnix-continue/SKILL.md`, `src/skills/harnix-brainstorm/SKILL.md`, snapshot skill/template chuẩn được sinh ra.
- Đặc tả: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, `docs/IMPLEMENTATION_PLAN.md`, `docs/HARNESS_RESEARCH.md`, `docs/UPSTREAM_MAPPING.md` nếu ghi nhận việc điều chỉnh từ nguồn.
- Kiểm thử: `test/unit/context.test.ts`, `test/unit/task-state.test.ts`, `test/workflow/internal-workflow.test.ts`, `test/workflow/routing.test.ts`, `test/workflow/skill-sources.test.ts`, fixture an toàn đường dẫn.

### Migration, bảo toàn, an toàn và rollback

Không cần thay đổi schema TaskRecord hoặc context manifest vì `contentHash` đã là tùy chọn. Hash cũ/không tồn tại báo `not-recorded` hoặc `unverified`, không bao giờ báo sai là `current`. Bộ kiểm tra chỉ đọc các đường dẫn an toàn được liệt kê trong manifest và chỉ phát ra đường dẫn repository-relative. Nó không bao giờ ghi file source hoặc manifest. Rollback loại bỏ phép chiếu/định tuyến skill và giữ mọi manifest do người dùng sở hữu hợp lệ, nguyên byte.

### Các lát cắt RED–GREEN và xác minh

1. RED: fixture file thay đổi, bị thiếu, hash hỗn hợp và symlink escape cho thấy phép chiếu resume hiện tại thiếu/xử lý sai drift. GREEN: triển khai bộ kiểm tra thuần cùng đầu ra xác định đã biên tập thông tin nhạy cảm.
2. RED: context cũ không định tuyến Continue qua replan. GREEN: lưu `checkpoint:replan` mà không đổi trạng thái hoặc file, rồi yêu cầu chọn lại.
3. Refactor trong khi kiểm thử tập trung vẫn xanh; cập nhật tài liệu/template chuẩn và tính ngang bằng self-host.

Cổng tập trung: fixture context, workflow-inspect, routing, skill-source và safety. Cổng rộng: `pnpm test:workflow`, `pnpm test:safety`, `pnpm test:platform`, sau đó là các cổng acceptance/package/release đầy đủ theo yêu cầu của phase triển khai đang hoạt động.

### Bất định còn lại

Không có điểm đáng kể. Có thể tinh chỉnh câu chữ UX mà không thay đổi enum/hành vi đã đóng băng ở trên.

## Ưu tiên 2 — Độ bao phủ từ tiêu chí tới kiểm tra bắt buộc

### Quyết định

- Năng lực: C2, `adapt`, điểm 4.55/5, vượt qua hard-gate.
- Kích thước: `M` cho độ bao phủ cộng migration; phối hợp với Ưu tiên 3.
- Phụ thuộc: nên làm Ưu tiên 1 trước nhưng không bắt buộc. Ưu tiên 3 phụ thuộc hạng mục này.
- Nguyên tắc nguồn: phân tích tính nhất quán/checklist của Spec Kit và quan hệ phụ thuộc/mức sẵn sàng của artifact trong OpenSpec/BMAD. Không sao chép văn xuôi/mã; giữ URL/revision nguồn và ghi chú license.
- Chủ ý loại trừ: bằng chứng do model sinh, engine DAG artifact/workflow-template rộng và mức nghi thức bổ sung.

### Vấn đề và giá trị quan sát được

Task v1 ghi tiêu chí, kiểm tra xác minh và bằng chứng nhưng không có cạnh ngữ nghĩa từ một tiêu chí tới kiểm tra bắt buộc dự kiến chứng minh tiêu chí đó. Một lần kiểm tra đạt có thể được tiêu chí không liên quan tham chiếu trong khi mọi kiểm tra bắt buộc đều đạt độc lập. Task v2 làm cho độ bao phủ bị thiếu, trùng lặp và mồ côi trở nên xác định trước cổng ready và completion.

### Hợp đồng TaskRecord v2 chính xác

Đổi `TaskRecord.schemaVersion` từ literal `1` thành union được hỗ trợ `1 | 2`; task mới ghi `2`. Trong v2, mở rộng mỗi `ValidationCheck` bằng:

```ts
criterionIds: string[];
inputs: string[]; // finalized now for Priority 3; see its semantics below
```

Bất biến độ bao phủ cho v2:

- mọi kiểm tra bắt buộc có ít nhất một entry `criterionIds` duy nhất;
- mọi ID đều gọi tên một tiêu chí chấp nhận đang tồn tại;
- mọi tiêu chí không được miễn đều ánh xạ tới ít nhất một kiểm tra bắt buộc;
- tiêu chí được miễn có thể vẫn được ánh xạ, nhưng khi hoàn tất sẽ bỏ qua và vẫn yêu cầu lý do miễn hiện có;
- ID, description, command, scope, required flag, `criterionIds` và `inputs` của kiểm tra bắt buộc trở thành bất biến sau lần lưu đầu tiên; muốn bổ sung phải dùng ID kiểm tra mới;
- một tiêu chí chỉ được hỗ trợ để hoàn tất bởi Evidence đạt và còn mới, trong đó `checkId` gọi tên kiểm tra bắt buộc chứa ID tiêu chí đó và ID của Evidence nằm trong `evidenceIds` của tiêu chí;
- Evidence không có scope có thể ghi lại research/diagnostic nhưng không thể thỏa mãn tiêu chí hoặc kiểm tra bắt buộc v2.

`inputs` được đưa vào cùng schema v2 để Ưu tiên 3 không tạo v3. Ưu tiên 2 xác thực cú pháp an toàn và tính bất biến nhưng không được tuyên bố độ mới gắn với source cho tới khi có enforcement của Ưu tiên 3. C2 và C3 phải phát hành nguyên tử trong một phiên bản package.

### Migration và khả năng tương thích ngược

- Reader tiếp tục xác thực v1 chính xác theo ngữ nghĩa đã đóng băng; task/journal v1 đã hoàn tất vẫn nguyên byte và đọc được.
- Task mới luôn dùng v2.
- Task v1 đang hoạt động và chưa hoàn tất vẫn có thể tiếp tục theo v1 nhưng phát diagnostic xác định `legacy-task-schema`. Update và Doctor không bao giờ viết lại vì task do người dùng sở hữu.
- Replan được người dùng ủy quyền rõ ràng có thể migrate task v1 chưa hoàn tất bằng cách cung cấp đầy đủ `criterionIds` và `inputs`, giữ nguyên từng byte của ID/text/evidence và nối thêm một bản ghi Evidence về migration. Không được suy đoán ánh xạ tiêu chí.
- Version tương lai/bị hỏng vẫn fail closed như hiện tại. Không có bulk migration im lặng.

### File và kiểm thử dự kiến

- Core/command: `src/core/tasks/task.ts`, `src/core/workflow.ts`, `src/commands/internal-workflow.ts`, mã diagnostic workflow routing/Doctor.
- Đặc tả: `docs/HARNIX_PRD.md`, `docs/HARNIX_WORKFLOW.md`, phần TaskRecord đã đóng băng trong `docs/IMPLEMENTATION_PLAN.md`, hành vi migration và Doctor, `docs/HARNESS_RESEARCH.md`, ánh xạ provenance.
- Skill/template: nguồn brainstorm, implement, check, finish-work và continue cùng các bề mặt chuẩn được sinh ra.
- Kiểm thử: `test/unit/task-state.test.ts`, fixture workflow persistence/finish/routing/skill, migration và Doctor, cùng bộ acceptance và safety.

### Bảo toàn, an toàn và rollback

Từ chối ID tiêu chí không xác định, cạnh trùng lặp và mọi thay đổi/xóa/hạ cấp định nghĩa kiểm tra bắt buộc đã lưu. Không suy đoán ánh xạ từ văn xuôi hoặc tên command. Update/Doctor không viết lại task. Trước khi phát hành package, rollback là hoàn nguyên code/docs; sau khi đã có task v2, rollback phải giữ reader tương thích chỉ đọc v2 và không thể hạ cấp hoặc xóa dữ liệu task do người dùng sở hữu.

### Các lát cắt RED–GREEN và xác minh

1. RED: xác thực v2 chấp nhận tiêu chí mồ côi, kiểm tra bắt buộc mồ côi, ID không xác định và cạnh trùng lặp. GREEN: enforce graph một cách xác định.
2. RED: completion chấp nhận evidence từ kiểm tra không liên quan. GREEN: yêu cầu giao nhau giữa tiêu chí/kiểm tra/Evidence.
3. RED: ánh xạ v2 đã lưu có thể bị làm yếu và migration v1 bị suy đoán/diễn ra im lặng. GREEN: làm định nghĩa bất biến và migration rõ ràng/có bảo toàn.
4. Refactor phần dispatch theo schema version; đồng bộ PRD/workflow/implementation plan/migration/docs/template trong cùng thay đổi.

Cổng tập trung: kiểm thử task-state, internal-workflow persistence/finish, routing, migration, Doctor và skill-source. Cổng rộng: workflow, safety, migration, acceptance đầy đủ, tarball và release scan.

### Bất định còn lại

Không có điểm đáng kể trong hợp đồng dữ liệu. Khi triển khai, chọn cách tổ chức parser nhỏ nhất mà không thay đổi hành vi v1/v2 ở trên.

## Ưu tiên 3 — Độ mới xác minh gắn với input

### Quyết định

- Năng lực: C3, `adapt`, điểm 4.55/5, vượt qua hard-gate.
- Kích thước: `M/L`.
- Phụ thuộc/thứ tự: sau C2; C2 và C3 phát hành nguyên tử.
- Nguyên tắc nguồn: cơ chế làm mới nhạy với thay đổi của Aider và cấu hình/trạng thái lần chạy được lưu bền vững của SWE-agent/OpenHands. Không sao chép định dạng trajectory hoặc mã nguồn.
- Chủ ý loại trừ: prompt/reasoning thô, đường dẫn tuyệt đối, thu thập environment/credential, event sourcing, watcher nền, danh tính Git commit và tuyên bố rằng tác dụng phụ bên ngoài đã được rollback.

### Vấn đề và giá trị quan sát được

Evidence đạt mới nhất vẫn hợp lệ cho tới khi timestamp hết hạn, ngay cả khi hợp đồng chấp nhận, kế hoạch hoặc file source mà kiểm tra đã xác minh thay đổi. V2 gắn mỗi lần đạt bắt buộc với một snapshot xác định để finish fail closed sau thay đổi liên quan và báo cho người dùng kiểm tra nào phải chạy lại.

### Hợp đồng input và Evidence v2 chính xác

`ValidationCheck.inputs` là danh sách không rỗng, đã sắp xếp, duy nhất, chứa:

- token dành riêng bắt buộc `@task-contract`; và
- không hoặc nhiều mẫu file/glob repository-relative an toàn dùng dấu phân cách POSIX.

Quy tắc:

- `@task-contract` hash ID/text tiêu chí chấp nhận bất biến và định nghĩa xác minh (`id`, `description`, `command`, `scope`, `required`, `criterionIds`, `inputs`); loại trừ status, evidence, timestamp và field blocker có thể thay đổi;
- task Full còn gắn hash byte của `prd.md` và `plan.md` do task sở hữu; Lite chỉ gắn artifact task đang tồn tại được liệt kê rõ bằng mẫu an toàn;
- kiểm tra có description/command tuyên bố hành vi repository, build, test, package hoặc runtime phải khai báo ít nhất một mẫu repository; kiểm tra artifact có thể chỉ dùng `@task-contract`;
- mẫu được phân giải dưới project root thực, sắp xếp, loại bỏ trùng lặp và mở rộng mà không đi theo symlink/junction ra ngoài root; mẫu tuyệt đối/traversal, kết quả repository rỗng và entry không an toàn đều fail closed;
- digest được sinh là SHA-256 trên JSON chuẩn chứa schema version, task ID, check ID, task-contract hash và các entry `{path, sha256}` đã sắp xếp; không lưu nội dung source, literal, secret, đường dẫn tuyệt đối, giá trị environment hoặc output command.

Mở rộng `Evidence` v2:

```ts
inputDigest?: string;
```

Với `result:"pass"` có scope tới kiểm tra v2 bắt buộc, `inputDigest` là bắt buộc và phải gồm 64 ký tự hex viết thường. Evidence fail/skipped/không scope có thể bỏ qua. Khi hoàn tất, Harnix tính lại digest hiện tại cho mỗi lần đạt mới nhất; input không khớp hoặc không an toàn/không đọc được/không có kết quả làm kiểm tra trở nên cũ và completion thất bại. Diagnostic chỉ nêu ID kiểm tra và đường dẫn an toàn bị thay đổi/thiếu. Tuổi timestamp vẫn là điều kiện độ mới độc lập thứ hai.

### Migration và khả năng tương thích ngược

Dùng hành vi v1/v2 đã đóng băng trong Ưu tiên 2. Replan v1 sang v2 rõ ràng phải định nghĩa `inputs` và tạo pass evidence v2 mới; evidence đạt cũ được giữ lại nhưng không thể thỏa mãn completion v2 vì thiếu `inputDigest`. Task v1 đã hoàn tất vẫn đọc được theo ngữ nghĩa cũ. Update/Doctor báo cáo nhưng không bao giờ viết lại task evidence. Không cho phép hạ cấp.

### File và kiểm thử dự kiến

- Core/command: `src/core/tasks/task.ts`, `src/core/workflow.ts`, một module input xác minh chuẩn nhỏ và thuần dưới `src/core`, `src/commands/internal-workflow.ts`.
- Đặc tả/template: PRD, workflow, implementation plan về schema/migration/acceptance, mọi workflow skill ghi evidence, harness research/ánh xạ provenance.
- Kiểm thử: xác thực task, hash chuẩn, fixture changed/missing/no-match/symlink, độ mới khi finish, migration, tính ngang bằng đường dẫn Windows/POSIX, biên tập secret/path, scan package/acceptance.

### Bảo toàn, an toàn và rollback

Chỉ đọc input an toàn đã khai báo và lưu hash/đường dẫn tương đối, không bao giờ lưu nội dung. Giữ bất biến các bản ghi Evidence hiện có. Nếu source thay đổi đồng thời giữa lúc hoàn tất kiểm tra và lưu thì phải tạo digest mismatch hoặc yêu cầu chạy lại, không được chấp nhận lạc quan. Rollback sau khi đã có dữ liệu v2 vẫn giữ parser và diagnostic v2; không được loại bỏ field input hoặc viết lại evidence do người dùng sở hữu.

### Các lát cắt RED–GREEN và xác minh

1. RED: v2 chấp nhận input không an toàn, trùng lặp, chưa sắp xếp hoặc không có kết quả. GREEN: xác thực/mở rộng với giới hạn root và thứ tự chuẩn.
2. RED: pass Evidence có thể thiếu/dùng digest sai định dạng hoặc finish sau khi file/plan đã khai báo thay đổi. GREEN: tính/tính lại digest và báo cũ.
3. RED: diagnostic làm lộ đường dẫn tuyệt đối/source/secret và evidence v1 cũ được coi là mới theo v2. GREEN: chỉ phát thay đổi tương đối an toàn và enforce ngữ nghĩa theo version.
4. Refactor trong khi vẫn xanh; đồng bộ toàn bộ tài liệu hợp đồng đóng băng, fixture migration, skill chuẩn và ghi công phát hành trong cùng một bản phát hành nguyên tử.

Cổng tập trung: task-state, kiểm thử unit verification-input, internal-workflow finish, migration, fixture biên tập/đường dẫn an toàn. Cổng rộng: build/lint/typecheck, workflow, safety, platform, acceptance đầy đủ, pack/tarball, footprint và release scan.

### Bất định còn lại

Khai báo input là nghĩa vụ đầy đủ rõ ràng: hashing không thể phát hiện một file liên quan bị bỏ sót. Ánh xạ tiêu chí của C2, tự rà soát cổng ready và fixture kiểm thử giúp giảm thiểu điều này; triển khai không được quảng bá digest như bằng chứng về tính đầy đủ ngữ nghĩa.

## Hàng đợi hoãn và nghiên cứu thêm

- C4 learning nhận biết mâu thuẫn: hoãn tới khi thiết kế được hợp đồng xung đột/thay thế rõ ràng, xác định và fixture lỗi nhìn thấy được bởi người dùng.
- C5 checkpoint/undo file cục bộ: hoãn; Harnix không sở hữu giao dịch editor và không thể rollback tác dụng bên ngoài.
- C6 metadata Agent Skills: hoãn tới khi chứng minh được tính ngang bằng Kiro/Antigravity/Codex và ngữ nghĩa provenance.
- C7 corpus đánh giá workflow/an toàn trên host thực: nghiên cứu thêm khi có runner chính thức có thể di chuyển hoặc ma trận host dùng profile dùng một lần được ủy quyền rõ ràng.
- C8 phát lại event thô đầy đủ: loại bỏ theo guardrail hiện tại về lưu trữ có giới hạn, secret/path và footprint; chỉ giữ các phép chiếu do task sở hữu.

## Ranh giới ủy quyền triển khai

Phần nghiên cứu C1–C3 vẫn dừng ở backlog `ready` và chỉ được triển khai khi có yêu cầu riêng sau này. Phần sửa đổi phạm vi về chính sách tiếng Việt đã được người dùng ủy quyền triển khai trong task hiện tại theo V1–V3. Trước khi task hoàn tất phải tăng phiên bản vá, cập nhật `CHANGELOG.md`, chạy các cổng mới và bảo toàn mọi thay đổi do người dùng sở hữu. Không commit, tạo branch/worktree, push, publish hoặc tạo PR.
