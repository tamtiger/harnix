const auditedResolutions = [
  { packageName: "postcss", packageVersion: "8.5.25", dependencyName: "nanoid", vulnerableRange: "^3.3.16", patchedVersion: "3.3.18" },
  { packageName: "tsup", packageVersion: "8.5.1", dependencyName: "esbuild", vulnerableRange: "^0.27.0", patchedVersion: "0.28.1" },
];

function readPackage(pkg) {
  const resolution = auditedResolutions.find((candidate) =>
    pkg.name === candidate.packageName
    && pkg.version === candidate.packageVersion
    && pkg.dependencies?.[candidate.dependencyName] === candidate.vulnerableRange);
  if (!resolution) return pkg;
  return {
    ...pkg,
    dependencies: {
      ...pkg.dependencies,
      [resolution.dependencyName]: resolution.patchedVersion,
    },
  };
}

function updateConfig(config) {
  return {
    ...config,
    allowBuilds: {
      ...config.allowBuilds,
      esbuild: true,
    },
  };
}

export const hooks = { readPackage, updateConfig };
