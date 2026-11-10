import { createVerifiedUserRoot, type UserPathRoot } from "src/core/platform/user-paths.js";
import { useTemporaryRepositories } from "test/support/temporary-repository.js";

/**
 * Registers cleanup and returns a factory of verified user-global roots below a disposable directory, so a test of the
 * global reconcile engine never touches a real home.
 */
export function useTemporaryGlobalRoots(
  prefix = "harnix-global-managed-",
): (logicalPath?: string) => Promise<UserPathRoot> {
  const temporaryRoot = useTemporaryRepositories(prefix);
  return async (logicalPath = "~/test-global") => createVerifiedUserRoot(await temporaryRoot(), logicalPath);
}
