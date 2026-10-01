import type { GlobalJsonMemberMatcher, DesiredGlobalManagedFile, GlobalPlatform } from "src/core/global/types.js";
import { getPlatform, type PlatformId } from "src/core/platform/registry.js";
import { selectedUserRoot, type SelectedUserPlatformRoots, type UserPathRoot } from "src/core/platform/user-paths.js";

/**
 * Supplies what only the configurator layer knows: the desired files and the stable JSON-member
 * matchers of one registered target. Core never imports the configurators; commands inject this.
 */
export interface GlobalPlanProvider {
  desired(planKey: string): readonly DesiredGlobalManagedFile[];
  memberMatchers(planKey: string): ReadonlyMap<string, GlobalJsonMemberMatcher> | undefined;
}

/** One sidecar-owning namespace of a selected platform, resolved against a verified user root. */
export interface GlobalTarget {
  readonly publicPlatform: PlatformId;
  readonly globalPlatform: GlobalPlatform;
  readonly root: UserPathRoot;
  readonly manifestPath: string;
  readonly lockPath: string;
  readonly preserveUnownedRoot: boolean;
  readonly planKey: string;
}

/** Every registered target of the selected platforms, in registry order. */
export function globalTargets(platforms: readonly PlatformId[], roots: SelectedUserPlatformRoots): GlobalTarget[] {
  return platforms.flatMap((publicPlatform) =>
    getPlatform(publicPlatform).targets.map((target) => {
      const root = selectedUserRoot(roots, publicPlatform, target.rootKey);
      if (root === undefined) throw new Error(`The selected ${publicPlatform} user-global root was not resolved.`);
      return {
        publicPlatform,
        globalPlatform: target.globalPlatform,
        root,
        manifestPath: target.manifestPath,
        lockPath: target.lockPath,
        preserveUnownedRoot: target.preserveUnownedRoot,
        planKey: target.planKey,
      };
    }),
  );
}
