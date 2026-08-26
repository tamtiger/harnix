import { access } from "node:fs/promises";
import { isAbsolute, win32 } from "node:path";

import { readConfig } from "../core/config/config.js";
import { UNTRUSTED_CONTEXT_PREFIX, UNTRUSTED_CONTEXT_SUFFIX } from "../core/context/context.js";
import { buildEffectiveContext } from "../core/context/effective-context.js";
import { resolveActiveTask } from "../core/tasks/task.js";
import { findInitializedProject } from "../utils/project-discovery.js";
import { resolveSafeHarnixPath } from "../utils/paths.js";

export type InternalContextPlatform = "kiro" | "antigravity" | "codex";

export interface RenderInternalContextForHookOptions {
  readonly platform: InternalContextPlatform;
  /** The hook process working directory, used only when it is a safe absolute directory. */
  readonly fallbackCwd: string;
  /** Optional platform event input. Malformed data is intentionally ignored. */
  readonly event?: unknown;
}

export interface RenderInternalContextOptions {
  /** Hooks must never turn a project `fullContext` preference into unbounded I/O. */
  readonly forceBounded?: boolean | undefined;
}

interface NormalizedHookEvent {
  readonly cwd?: string;
  readonly invocationNum?: number;
  readonly workspacePaths: string[];
}

const REDACTED_PROJECT_STATE_WARNING = "Harnix context unavailable: initialized project state cannot be read safely. Run harnix doctor for details.";

/**
 * Renders a platform-specific bounded context for a known initialized project.
 * This is deliberately read-only; callers that receive external hook input
 * should use renderInternalContextForHook so optional malformed events cannot
 * make a global hook block an unrelated prompt.
 */
export async function renderInternalContext(
  root: string,
  platform: InternalContextPlatform,
  options: RenderInternalContextOptions = {},
): Promise<string> {
  const harnixRoot = await resolveSafeHarnixPath(root);
  if (!await exists(await resolveSafeHarnixPath(root, "config.yaml"))) return emptyPayload(platform);

  const config = await readConfig(await resolveSafeHarnixPath(root, "config.yaml"));
  const active = await resolveActiveTask(harnixRoot);
  if (!active) return emptyInitializedProjectPayload(platform);

  const output = await buildEffectiveContext({ projectRoot: root, harnixRoot, config, task: active, platform, forceBounded: options.forceBounded });
  const text = boundedContext(output.text, output.manifest.omitted.map((item) => item.path), output.budget.maxCharacters);
  return formatPlatformPayload(platform, text);
}

/**
 * Global hook entrypoint: find an initialized project without requiring Git,
 * no-op outside one, and never let optional event data turn into a prompt
 * failure. Antigravity uses a schema-valid empty payload only after the
 * activation guard proves an initialized project has a later/no-context call.
 */
export async function renderInternalContextForHook(options: RenderInternalContextForHookOptions): Promise<string> {
  const event = normalizeHookEvent(options.event);
  // Antigravity permits injection only on invocation 0. A malformed or absent
  // event must be a true global no-op: no project lookup and no protocol output
  // that could be interpreted as a context injection in an unrelated workspace.
  if (options.platform === "antigravity" && event.invocationNum === undefined) {
    return "";
  }

  let project: Awaited<ReturnType<typeof findInitializedProject>>;
  try {
    project = await findInitializedProject({
      cwd: event.cwd ?? safeAbsoluteDirectory(options.fallbackCwd),
      workspacePaths: event.workspacePaths,
    });
  } catch {
    // No safe initialized project was identified, so keep this global hook a
    // true no-op rather than exposing a filesystem detail to the host agent.
    return "";
  }
  if (project.kind === "ambiguous") return options.platform === "antigravity" && event.invocationNum === 0
    ? formatPlatformPayload(options.platform, "Harnix context unavailable: multiple initialized workspace roots; select the active root to continue.")
    : "";
  if (project.kind !== "ready") return "";
  // A known later Antigravity invocation belongs to an initialized project
  // but must not inject context. Preserve the platform's schema-valid empty
  // response only after the activation guard has proved that scope.
  if (options.platform === "antigravity" && event.invocationNum !== 0) {
    return emptyPayload(options.platform);
  }
  try {
    return await renderInternalContext(project.root, options.platform, { forceBounded: true });
  } catch {
    // Safe discovery succeeded but project data is corrupt/inaccessible. Keep
    // the agent responsive while giving only a bounded, path-free warning.
    return formatPlatformPayload(options.platform, REDACTED_PROJECT_STATE_WARNING);
  }
}

function formatPlatformPayload(platform: InternalContextPlatform, text: string): string {
  if (text.length === 0) return emptyPayload(platform);
  if (platform === "codex") {
    return JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: text } });
  }
  if (platform === "antigravity") {
    return JSON.stringify({ injectSteps: [{ ephemeralMessage: text }] });
  }
  return text;
}

function emptyPayload(platform: InternalContextPlatform): string {
  return platform === "antigravity" ? JSON.stringify({ injectSteps: [] }) : "";
}

function emptyInitializedProjectPayload(platform: InternalContextPlatform): string {
  if (platform === "codex") {
    return JSON.stringify({ hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: "" } });
  }
  return emptyPayload(platform);
}

function boundedContext(source: string, omittedPaths: string[], cap: number): string {
  const sourceContent = source.startsWith(UNTRUSTED_CONTEXT_PREFIX) && source.endsWith(UNTRUSTED_CONTEXT_SUFFIX)
    ? source.slice(UNTRUSTED_CONTEXT_PREFIX.length, -UNTRUSTED_CONTEXT_SUFFIX.length)
    : source;
  const frameBudget = cap - UNTRUSTED_CONTEXT_PREFIX.length - UNTRUSTED_CONTEXT_SUFFIX.length;
  if (frameBudget < 0) return "";

  const separator = "\n\n";
  const disclosure = boundedOmissionDisclosure(omittedPaths, frameBudget);
  const contentBudget = Math.max(0, frameBudget - disclosure.length - separator.length);
  const content = sourceContent.slice(0, contentBudget);
  const actualSeparator = content.length > 0 && disclosure.length > 0 ? separator : "";
  return `${UNTRUSTED_CONTEXT_PREFIX}${content}${actualSeparator}${disclosure}${UNTRUSTED_CONTEXT_SUFFIX}`;
}

function boundedOmissionDisclosure(paths: string[], cap: number): string {
  const disclosure = `Omitted: ${paths.length === 0 ? "none" : paths.map(serializeOmissionPath).join(", ")}`;
  if (disclosure.length <= cap) return disclosure;
  const summary = `Omitted: ${paths.length} path${paths.length === 1 ? "" : "s"} (details truncated)`;
  return summary.slice(0, cap);
}

function serializeOmissionPath(path: string): string {
  return [...JSON.stringify(path)].map((character) => {
    const codePoint = character.codePointAt(0)!;
    const mustEscape = codePoint === 0x26
      || codePoint === 0x3c
      || codePoint === 0x3e
      || codePoint >= 0x7f && codePoint <= 0x9f
      || codePoint === 0x2028
      || codePoint === 0x2029;
    return mustEscape ? `\\u${codePoint.toString(16).padStart(4, "0")}` : character;
  }).join("");
}

function normalizeHookEvent(value: unknown): NormalizedHookEvent {
  if (!isRecord(value)) return { workspacePaths: [] };
  const cwd = safeAbsoluteDirectory(value.cwd);
  const workspacePaths = Array.isArray(value.workspacePaths)
    ? value.workspacePaths.slice(0, 32).flatMap((path) => {
      const safePath = safeAbsoluteDirectory(path);
      return safePath === undefined ? [] : [safePath];
    })
    : [];
  const invocationNum = typeof value.invocationNum === "number" && Number.isSafeInteger(value.invocationNum) && value.invocationNum >= 0
    ? value.invocationNum
    : undefined;
  return { ...(cwd === undefined ? {} : { cwd }), ...(invocationNum === undefined ? {} : { invocationNum }), workspacePaths };
}

function safeAbsoluteDirectory(value: unknown): string | undefined {
  if (typeof value !== "string" || value.length === 0 || value.length > 32_768 || value.includes("\0")) return undefined;
  return isAbsolute(value) || win32.isAbsolute(value) ? value : undefined;
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
