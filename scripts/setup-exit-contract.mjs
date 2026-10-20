// Platforms report their own healthy readiness (src/core/platform/records.ts), so a setup that installed Codex
// (`installed-pending-trust`) or Antigravity (`precedence-unknown`) writes its informational notice to stderr and
// still exits 0. The contract therefore is: exit 1 implies a non-empty stderr, never the reverse, and a readiness
// outside the healthy set must exit 1.
const HEALTHY_READINESS = new Set(["installed", "installed-pending-trust", "precedence-unknown"]);

export function assertSetupExitContract({ status, stderr, stdout }) {
  let result;
  try {
    result = JSON.parse(stdout);
  } catch {
    throw new Error(`setup did not return valid JSON: ${stdout}`);
  }
  if (result?.scope !== "user" || !Array.isArray(result.platforms))
    throw new Error(`setup returned an unexpected global result: ${stdout}`);
  if (status !== 0 && status !== 1) throw new Error(`setup returned exit ${status}; expected 0 or 1.`);
  const unhealthy = result.platforms.some(
    (platform) => !HEALTHY_READINESS.has(platform?.readiness) || !Array.isArray(platform?.warnings),
  );
  if (unhealthy && status !== 1)
    throw new Error(`setup returned exit ${status}; expected 1 for a readiness that needs action.`);
  if (status === 1 && stderr.trim().length === 0) throw new Error("setup exited 1 without explaining it on stderr.");
}
