# Inventory version — trước và sau remediation

Package release tại baseline là `1.0.0`. Không dùng global search-and-replace; inventory phân loại theo ý nghĩa.

| Path/occurrence | Value trước | Class | mustMatchPackage | Status trước | Action/evidence |
|---|---:|---|---:|---|---|
| `package.json#version` | `1.0.0` | Package release hiện hành | yes | source of truth | Bump patch một lần sau remediation vì task tạo thay đổi release-worthy. |
| `src/version.ts` + tsup define | dynamic | Runtime/CLI | yes | pass | Không literal cạnh tranh; build baseline và CLI trả `1.0.0`. Build lại sau bump. |
| `pnpm-lock.yaml#importers[.]` | không lưu package version | Dependency/toolchain | no | n/a | Không sửa chỉ vì package bump; chỉ đổi nếu frozen install thực sự cập nhật lock importer. |
| 7 × `src/skills/harnix-*/SKILL.md#metadata.version` | `1.0.0` | Canonical skill current content | yes | 7/7 match | Bump đồng bộ với package và kiểm byte parity ba platform. |
| `.harnix/.template-hashes.json` 2 × `generatorVersion` | `1.0.0` | Generated/self-host metadata | yes | match | Bump metadata; giữ generatedHash nếu content template không đổi. |
| `.harnix/cache/repo-map-v1.json#schemaVersion/extractorVersion` | `1`/`1` | Schema/generated cache | no | cache invalid | Giữ schema/extractor; regenerate records/fingerprint bằng current writer. |
| `README.md` current release claims | `1.0.0` | Current-state docs | yes | match baseline | Update sang final patch và evidence status fresh. |
| `CHANGELOG.md` latest heading | `1.0.0` | Changelog current release | yes | match baseline | Thêm heading mới; không rewrite entry cũ. |
| `docs/REVIEW_REFACTOR_PLAN.md` dated continuation statement | `1.0.0` | Historical review evidence | no | correct history | Preserve. |
| `.harnix/tasks/20260814-150553-release-version-1-0-0/**` và journal | `1.0.0` | Completed task/history | no | immutable | Preserve byte-for-byte. |
| Older CHANGELOG headings/tasks/fixtures (`0.x`, `1.0.0` literals) | mixed | Historical/fixture/evidence | no | intentional | Preserve; regression literal `unrelated@1.0.0` không phải current release. |
| `schemaVersion`, Doctor v2, manifest/repo-map/task/hook v1/v2 | `1`/`2`/`v1` | Schema/protocol/data format | no | independent contract | Không đổi. |
| package/lock dependency SemVer | nhiều | Dependency/toolchain | no | manifest-lock synchronized | Không ép bằng package release; frozen install/audit gate quyết định. |
| Kiro/Antigravity/Codex snapshots và upstream SHA/version | dated/mixed | Platform/upstream baseline | no | historical evidence | Không revalidate/overwrite trong task local này. |

## Trạng thái dự kiến sau remediation

- Final package patch đã áp dụng: `1.0.1`.
- Static surface đã match `1.0.1`: package, 7 canonical skills, 2 self-host `generatorVersion`, README current claims và latest CHANGELOG heading. Built CLI/runtime được xác nhận trong required verification sau final build.
- Cố ý không match: schema/protocol, dependency/toolchain, dated baselines, historical changelog/tasks/journal và fixtures.
