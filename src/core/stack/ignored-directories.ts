/**
 * Directory names that never hold project sources at any depth: VCS and Harnix state, dependency and build output,
 * caches, IDE folders and the agent tools' own folders and worktrees (a `.kilo/worktrees/x` copy of a package is not a
 * second package). Stack detection and the repository-map inventory both skip exactly these, plus their own extras.
 */
export const IGNORED_DIRECTORY_NAMES: readonly string[] = [
  ".agents",
  ".cache",
  ".claude",
  ".codex",
  ".cursor",
  ".gemini",
  ".git",
  ".harnix",
  ".idea",
  ".kilo",
  ".kiro",
  ".next",
  ".pytest_cache",
  ".trellis",
  ".turbo",
  ".understand-anything",
  ".vs",
  ".worktrees",
  "__pycache__",
  "bin",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "obj",
  "vendor",
];
