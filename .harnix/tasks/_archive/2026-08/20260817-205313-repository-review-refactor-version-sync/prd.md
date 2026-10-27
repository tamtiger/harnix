# PRD task: Review, refactor và đồng bộ version toàn repository

## Kết quả mong muốn

Review toàn repository Harnix dựa trên bằng chứng hiện tại, sửa tối thiểu các defect và khoản nợ có tác động thật, rồi đồng bộ current release surfaces mà không sửa nhầm schema, dependency, baseline, fixture hay lịch sử. Kết quả cuối phải giữ đúng public contract, data preservation, ba platform được hỗ trợ và có fresh verification đầy đủ.

## Trong phạm vi

- Đối chiếu implementation với PRD, canonical workflow, frozen contracts, architecture rules và completion gate.
- Audit package/build/dependencies, CLI, project/global lifecycle, workflow/task evidence, repo-map, migration, managed files, templates/rules/guides/skills, release scripts và test isolation.
- Lập finding matrix P0-P3; chỉ sửa finding có reproduction hoặc deterministic inspection evidence và tác động thực tế.
- Lập inventory version theo nhóm current package, runtime, generated metadata, skill content, current docs, changelog, schema/protocol, dependency/toolchain, baseline và historical evidence.
- Tăng đúng một patch version trước completion nếu task tạo thay đổi release-worthy, đồng bộ lockfile, bảy canonical skill versions, self-host metadata, current docs và CHANGELOG.
- Chạy exact acceptance sequence bằng fake/disposable homes; không dùng real user profile.

## Ngoài phạm vi

- Không thêm platform, package, workspace, service, daemon, telemetry, marketplace, default MCP hoặc compatibility surface mới.
- Không đổi frozen schema/protocol/path/exit semantics nếu không cập nhật đầy đủ PRD, workflow, migration và tests.
- Không sửa historical version, dated baseline, fixture hoặc dependency version chỉ để grep sạch.
- Không chạy manual real-profile smoke khi chưa có authorization mới.
- Không commit, branch, push, publish hoặc tạo PR.

## Quy tắc quyết định

Correctness và data preservation ưu tiên trước security, compatibility, diagnostics, maintainability và performance. Finding thuần style, abstraction chưa cần, coverage percentage đơn thuần hoặc major upgrade trái Node.js >=18 không phải remediation. Request và repository contracts đã quyết định phạm vi; hiện không có product decision hoặc authority blocker cần hỏi thêm.