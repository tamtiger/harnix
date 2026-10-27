# Design — Recovery và explainability reports

## Quyết định kiến trúc

Dependency direction vẫn là command → core → utils/pure types. Không command nào đọc state bằng shell hoặc tự serialize private task prose.

- `src/core/tasks/task-resume.ts` sở hữu bounded candidate/pointer validation và pointer decision. `src/commands/resume.ts` chỉ discovery/config guard và gọi core.
- `src/core/context/effective-context.ts` sở hữu candidate construction, guide selection, platform cap và `buildContext`. Hidden hook lấy `text`; public report chỉ lấy safe metadata từ cùng result.
- `src/core/verification/check-report.ts` sở hữu structured required-check inspection. `inspectRequiredCheckEvidence` trong status trở thành projection của structured states để audit/status không có classifier thứ hai.
- CLI chỉ parse exact enums/limits và viết một JSON object. Public errors tiếp tục qua shared redaction.

## Resume state table

| Candidate | Active pointer | Dry-run | Kết quả | Write |
|---|---|---:|---|---:|
| valid unfinished | absent/empty | true | `would-resume` | no |
| valid unfinished | absent/empty | false | `resumed` | pointer only |
| valid unfinished | same valid task | any | `already-active` | no |
| valid unfinished | different valid task | any | public error | no |
| missing/malformed/oversized/ID mismatch/terminal | any | any | public error | no |
| valid unfinished | malformed/dangling/invalid active | any | public error | no |

Candidate record read cap là 1 MiB; pointer read cap là 1 KiB. Candidate validation xảy ra trước mutation. Không update TaskRecord hoặc sidecar.

## Effective context data flow

```text
validated config + active TaskRecord + optional context manifest + applicable guides
                                  |
                         shared effective builder
                                  |
                      buildContext bounded by platform
                         /                    \
              hidden hook text           safe manifest metadata
                    |                           |
          existing platform payload        context-report
```

Reason codes được derive bằng set membership, không dùng raw manifest reason:

- guide path → `applicable-guide`;
- persisted manifest path → `persisted-selection`;
- `pinned: true` → `pinned`;
- task relevant path → `task-reference`.

Report sắp xếp reason code và giữ selected/omitted order từ effective manifest. Drift dùng canonical `taskContextDrift`, nhưng chỉ trả bounded relative changes và enum selection changes.

## Required-check classifier

Classifier trả một internal record cho mỗi required check: state, reason codes và full safe path changes. Status chỉ map record → state. Public `checks` sort ID và áp limit/truncation.

Decision order:

1. Chọn latest evidence bằng timestamp; timestamp tie chọn entry append sau.
2. Không evidence, skipped hoặc failed kết thúc ở pending/failed tương ứng.
3. Pass ngoài cửa sổ một giờ, timestamp invalid hoặc tương lai → stale/`evidence-expired`.
4. Task v1 fresh pass → passed.
5. Task v2 load sidecar một lần:
   - sidecar parse/binding lỗi → stale/`snapshot-invalid`;
   - không có matching snapshot → `snapshot-missing`;
   - check ID hoặc evidence digest mismatch → `snapshot-mismatch`.
6. Recompute current snapshot:
   - lỗi safe read/glob → `inputs-unavailable`;
   - digest match → passed;
   - digest khác → classify contract hash và entry diff; fallback `snapshot-mismatch` nếu không có structured cause.

Không parse path từ error string. Chỉ `compareVerificationInputSnapshots` tạo public changed/missing path.

## Bounded output

- CLI limit parser: integer 1..50, default 20.
- Context limit áp riêng cho selected, omitted và drift changes.
- Checks limit áp check records; mỗi check tối đa 20 change items.
- Serializer/builder bỏ nguyên tail item theo deterministic order khi JSON UTF-8 có nguy cơ vượt 262144 bytes; summary/truncation fields phản ánh full counts. Không substring task-controlled values.
- Canary tests dùng title/goal/check description/command/evidence summary/raw reason/hash/absolute path để chứng minh không xuất hiện.
- Snapshot-tree tests chứng minh reports và dry-run không write; resume success chỉ đổi `.active`.

## Error và preservation

Invalid initialized state hoặc unsafe path fail bằng standard public JSON exit 2. Public command không log raw caught error chứa project/user path. Existing dirty files ngoài exact implementation paths được giữ nguyên. Nếu shared context refactor làm platform payload hoặc selection khác ngoài contract đã khóa, task quay lại `replan` thay vì duy trì hai selector.
