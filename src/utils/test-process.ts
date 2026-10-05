/**
 * True only inside the Vitest runner. `NODE_ENV=test` is deliberately not a signal: a developer shell or a CI image
 * may export it for unrelated reasons, and treating it as a test run made `harnix setup` refuse real homes.
 */
export function isTestProcess(): boolean {
  return process.env.VITEST !== undefined;
}
