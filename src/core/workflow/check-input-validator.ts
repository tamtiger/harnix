import { globby } from "globby";
import {
  buildGlobIgnores,
  createGuardedDirectoryFilter,
  targetedSegments,
} from "src/core/verification/transient-directories.js";
import { normalizeRepositoryPath } from "src/utils/paths.js";

export interface CheckInputValidationResult {
  valid: boolean;
  emptyInputs: string[];
}

/**
 * Kiểm tra các input glob của validation check xem có khớp file nào trong repository không.
 * Giúp phát hiện sớm typo trong --input hoặc --set-check trước khi đến giai đoạn verify.
 */
export async function validateCheckInputs(
  projectRoot: string,
  inputs: readonly string[],
): Promise<CheckInputValidationResult> {
  const emptyInputs: string[] = [];
  const isKept = createGuardedDirectoryFilter(projectRoot);

  for (const input of inputs) {
    const targeted = targetedSegments(input);
    const matches = await globby(input, {
      absolute: false,
      cwd: projectRoot,
      dot: true,
      followSymbolicLinks: false,
      gitignore: true,
      ignore: buildGlobIgnores(targeted),
      onlyFiles: true,
    });

    if (matches.length === 0) {
      emptyInputs.push(input);
      continue;
    }

    let kept = 0;
    for (const match of matches) {
      const normalized = normalizeRepositoryPath(match);
      if (await isKept(normalized, targeted)) {
        kept += 1;
        break;
      }
    }

    if (kept === 0) {
      emptyInputs.push(input);
    }
  }

  return {
    valid: emptyInputs.length === 0,
    emptyInputs,
  };
}

export function assertValidCheckInputs(checkId: string, emptyInputs: readonly string[]): void {
  if (emptyInputs.length > 0) {
    const formatted = emptyInputs.map((i) => `"${i}"`).join(", ");
    throw new Error(
      `Check ${checkId} declares input pattern(s) that match no files in the workspace: ${formatted}. Check for typos or create the files before declaring.`,
    );
  }
}
