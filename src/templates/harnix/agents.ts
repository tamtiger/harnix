import type { LanguageId, TechnologyId } from "../../catalog/catalog.js";
import type { PackageConfig } from "../../core/config/config.js";
import { packageVersion } from "../../version.js";
import { HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS, HARNIX_TARGET_AUTHORITY_INSTRUCTIONS } from "./activation.js";

export interface AgentsProjectProfile {
  languages: readonly LanguageId[];
  technologies: readonly TechnologyId[];
  packages: readonly Pick<PackageConfig, "path">[];
}

const languageLabels: Record<LanguageId, string> = { csharp: "C#", go: "Go", java: "Java", javascript: "JavaScript", php: "PHP", python: "Python", typescript: "TypeScript" };
const technologyLabels: Record<TechnologyId, string> = { abp: "ABP", codeigniter: "CodeIgniter", dotnet: ".NET", nestjs: "NestJS", "react-web": "React web", spring: "Spring", vue: "Vue" };
const targetAuthorityInstructions = HARNIX_TARGET_AUTHORITY_INSTRUCTIONS.map((instruction) => `- ${instruction}`).join("\n");
const implicitActivationInstructions = HARNIX_IMPLICIT_ACTIVATION_INSTRUCTIONS.join("\n\n");

export function renderAgentsTemplate(profile: AgentsProjectProfile): string {
  const languages = profile.languages.map((id) => languageLabels[id]).join(", ") || "not specified";
  const technologies = profile.technologies.map((id) => technologyLabels[id]).join(", ") || "not specified";
  const packagePaths = profile.packages.map(({ path }) => `\`${path}\``).join(", ") || "not specified";

  return `# Project agent instructions

## Harnix

Target authority and activation guard:

${targetAuthorityInstructions}

- Version: ${packageVersion}.
- Role: project-local coding-agent harness for task state, evidence, and concise engineering guidance.
- Scope: this bootstrap applies only when its repository is the selected Harnix root. Platform integrations are an explicit user-global integration and are never init output.

## Project profile

- Languages: ${languages}.
- Technologies: ${technologies}.
- Package paths: ${packagePaths}.

Use this profile only when this AGENTS root is the selected Harnix root resolved by the target-authority guard. It is an initialization-time discovery seed, not complete repository truth. Verify current manifests, source, tests, and instructions; do not bulk-load the repository.

## Route before restoring

${implicitActivationInstructions}

Apply the matching ceremony profile:

- **Bypass:** use the read-only route above without inspecting or mutating task state.
- **Lite:** localized low-risk change with a clear contract and focused validation. Docs-only prose or formatting defaults to Lite.
- **Full:** cross-layer, migration-heavy, security-sensitive, or materially uncertain work.

Read .harnix/workflow.md and .harnix/config.yaml from the selected Harnix root (canonical workflow: [\`.harnix/workflow.md\`](.harnix/workflow.md)) only after the route above requires project state. The preflight is bounded routing metadata, not proof of completion, and \`nextStage: await\` at \`ready\` requires the latest request rather than stale conversation memory to authorize implementation.

Use the exact \`nextStage\` returned by preflight for project-scoped work, and otherwise use the standalone owner named by the route above:

- \`harnix-brainstorm\` for triage, planning, replan, and the ready gate.
- \`harnix-implement\` for authorized ready or in-progress work.
- \`harnix-check\` for standalone review or active compliance/quality verification.
- \`harnix-debug\` only for a reproducible in-scope failure.
- \`harnix-research\` for standalone read-only research or one task-scoped material unknown.
- \`harnix-finish-work\` only for verified completion or explicit cancellation.
- \`harnix-continue\` only for interrupted or partial persisted state when selected by \`nextStage\`.

Read the selected \`SKILL.md\` through EOF; do not preload later skills. The canonical lifecycle, TaskRecord schema, legal transitions, hidden envelopes, freshness rules, retry breaker, and exact commands live in \`.harnix/workflow.md\`; do not duplicate or invent them here.

## Operating rules

- \`harnix init\` is project-local. \`harnix setup --kiro|--antigravity|--codex\` is user-global. Do not run setup or harnix init automatically.
- Luôn dùng tiếng Việt khi tạo và cập nhật task Harnix, gồm nội dung hướng người dùng trong \`task.json\`, \`prd.md\`, \`plan.md\`, \`design.md\`, research và journal. Giữ nguyên code identifier, command, đường dẫn, tên field/schema và trích dẫn nguồn khi cần để bảo đảm chính xác kỹ thuật.
- Preserve user-owned files, tasks, evidence, specs, research, journals, credentials, and unrelated configuration.
- Use hidden workflow transport for state changes; never edit \`task.json\` or \`.active\` directly.
- Use \`harnix repo-map --query <text>\` or \`harnix repo-map --impact <path>\` only as bounded implementation-stage navigation hints. Platform hooks must not invoke repository-map query, impact, or refresh.
- Release preparation belongs to implementation and must finish before \`verifying\`. Finish is product-read-only.
- Require explicit authority for destructive, networked, installation, upgrade, purge, or externally visible actions.
- Never commit, branch, create a worktree, merge, push, publish, or create a pull request automatically.
- Before any commit, show the proposed changes and commit message, then wait for explicit user approval.
- If Harnix state, CLI, or a required skill is unavailable or invalid, report that instead of inventing state.
`;
}
