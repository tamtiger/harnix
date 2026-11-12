import {
  isInitializedProjectForHook,
  renderInternalContextForHook,
  type InternalContextPlatform,
} from "./internal-context.js";
import { isPreToolUseEvent, pretoolHintFor } from "./pretool-hint.js";

export interface RunInternalContextCommandOptions {
  readonly platform: InternalContextPlatform;
  readonly hookInput?: string | undefined;
  readonly fallbackCwd?: string | undefined;
}

/**
 * Executes the hook protocol without Commander or the regular CLI command
 * graph. This deliberately keeps the canonical global-hook invocation cheap
 * in unrelated workspaces, where it must be an output-free no-op.
 */
export async function runInternalContextCommand(options: RunInternalContextCommandOptions): Promise<void> {
  const event = parseOptionalHookInput(options.hookInput);
  const fallbackCwd = options.fallbackCwd ?? process.cwd();
  if (isPreToolUseEvent(event)) {
    // A tool-call event never receives the prompt context; only Claude Code gets the static repo-map reminder.
    const hint = options.platform === "claude" ? pretoolHintFor(event) : undefined;
    if (hint !== undefined && (await isInitializedProjectForHook({ fallbackCwd, event }))) {
      process.stdout.write(`${hint}\n`);
    }
    return;
  }
  const output = await renderInternalContextForHook({
    fallbackCwd,
    platform: options.platform,
    ...(event === undefined ? {} : { event }),
  });
  if (output) process.stdout.write(`${output}\n`);
}

export function parseOptionalHookInput(source: string | undefined): unknown {
  if (source === undefined || source.trim().length === 0) return undefined;
  try {
    return JSON.parse(source) as unknown;
  } catch {
    return undefined;
  }
}
