const dependencyFields = ["dependencies", "devDependencies", "optionalDependencies", "peerDependencies"];
const npmRegistry = "https://registry.npmjs.org";

/** A dependency must come from the npm registry by version or range: no URL, git, file or credentials. */
export function assertLockfileSources(lockfile, packageJson) {
  lockfile.split(/\r?\n/u).forEach((line, index) => {
    const where = `pnpm-lock.yaml:${index + 1}`;
    if (/^\s*deprecated:/u.test(line)) return;
    if (/\btarball:/u.test(line)) throw new Error(`Lockfile entry is a tarball (${where}).`);
    if (/\btype:\s*git\b|\brepo:|git\+|git:\/\/|github:/u.test(line))
      throw new Error(`Lockfile entry comes from git (${where}).`);
    if (/\bhttp:\/\//u.test(line)) throw new Error(`Lockfile entry uses an http URL (${where}).`);
    if (/:\/\/[^/\s@]+(?::[^/\s@]*)?@/u.test(line)) throw new Error(`Lockfile contains credentials (${where}).`);
    if (/\bresolution:/u.test(line) && !/\bintegrity:\s*sha(?:256|384|512)-/u.test(line))
      throw new Error(`Lockfile entry has no registry integrity (${where}).`);
    if (/\bregistry:/u.test(line) && !line.includes(npmRegistry))
      throw new Error(`Lockfile registry is not npmjs (${where}).`);
  });
  for (const field of dependencyFields) {
    for (const [name, spec] of Object.entries(packageJson[field] ?? {})) {
      if (typeof spec === "string" && /:\/\/|^(?:git|github|file|link|workspace):|@/u.test(spec))
        throw new Error(`Dependency ${JSON.stringify(name)} in ${field} is not a plain registry range.`);
    }
  }
  const registry = packageJson.publishConfig?.registry;
  if (typeof registry === "string" && !registry.startsWith(npmRegistry))
    throw new Error("publishConfig.registry must be the npm registry.");
}
