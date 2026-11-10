/**
 * True only inside the Vitest runner. `NODE_ENV=test` is deliberately not a signal: a developer shell or a CI image
 * may export it for unrelated reasons, and treating it as a test run made `harnix setup` refuse real homes.
 */
export function isTestProcess(): boolean {
  return process.env.VITEST !== undefined;
}

/**
 * A test that injects a home must also inject the environment: otherwise CODEX_HOME, CLAUDE_CONFIG_DIR or
 * XDG_CONFIG_HOME of the developer's machine would relocate the root out of the disposable home.
 */
export function requireTestEnvironment(label: string, environment: unknown): void {
  if (isTestProcess() && environment === undefined) {
    throw new Error(`${label} requires an injected environment in test mode.`);
  }
}
