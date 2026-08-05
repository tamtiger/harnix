import { access, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const legacyMarkers = [".trellis", ".trellis-pro"] as const;

export async function discoverLegacy(root: string): Promise<string[]> {
  const found: string[] = [];
  for (const marker of legacyMarkers) {
    try { await access(join(root, marker)); found.push(marker); } catch { /* absent is expected */ }
  }
  try {
    const entries = await readdir(join(root, ".agents", "skills"), { withFileTypes: true });
    found.push(...entries.filter((entry) => entry.isDirectory() && entry.name.startsWith("trellis-")).map((entry) => `.agents/skills/${entry.name}`));
  } catch { /* legacy skills are optional */ }
  try {
    const packageJson = JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    for (const packageName of ["@mindfoldhq/trellis", "@tamtiger/trellis-cli"]) if (packageName in dependencies) found.push(`package:${packageName}`);
  } catch { /* missing/malformed package metadata is not a migration failure */ }
  return found;
}

