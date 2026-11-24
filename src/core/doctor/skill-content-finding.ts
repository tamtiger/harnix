import { readdir } from "node:fs/promises";
import { join } from "node:path";

import { scanSkillContent } from "src/core/doctor/skill-content-rules.js";
import { finding, type DoctorFinding } from "src/core/doctor/findings.js";
import { compareCodeUnits } from "src/utils/order.js";
import { resolveSafeHarnixPath } from "src/utils/paths.js";
import { isMissingPathError } from "src/utils/errno.js";
import { readTextInside } from "src/utils/safe-read.js";

/** Project guides first, then project skills (`.harnix/spec/<name>`); Harnix's own packaged skills are never scanned. */
const SCANNED_DIRECTORIES = ["guides", "skills"] as const;
const MAX_FILES = 200;
const MAX_FINDINGS = 20;
const MAX_DEPTH = 5;

interface FileBudget {
  count: number;
  /** Set when a file or directory was left out because the budget ran out. */
  truncated: boolean;
}

/** Lists the Markdown files below `directory` in a stable order, skipping links, up to the depth and file limits. */
async function markdownFiles(directory: string, relative: string, depth: number, left: FileBudget) {
  const found: { absolute: string; relative: string }[] = [];
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error: unknown) {
    if (isMissingPathError(error)) return found;
    throw error;
  }
  for (const entry of entries.sort((a, b) => compareCodeUnits(a.name, b.name))) {
    if (left.count <= 0) {
      left.truncated = true;
      break;
    }
    if (entry.isSymbolicLink()) continue;
    const absolute = join(directory, entry.name);
    const path = `${relative}/${entry.name}`;
    if (entry.isDirectory() && depth < MAX_DEPTH) {
      found.push(...(await markdownFiles(absolute, path, depth + 1, left)));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) {
      left.count -= 1;
      found.push({ absolute, relative: path });
    }
  }
  return found;
}

/**
 * Warns when a project skill, one of its references or a project guide carries text that tries to override the
 * agent, hide an action from the user, pipe a download into a shell, read a credential store or send the environment
 * out (`scanSkillContent`). Read-only: it opens files inside the project (large or linked files are skipped), uses no
 * network, never fixes anything and reports at most 20 files, reading at most 200 Markdown files from the guides and
 * 200 from the skills. The message names the rules, never the text. When a limit cut the scan short, one `info`
 * finding says so (it does not change the exit code), so a clean result is never read as "everything was checked".
 */
export async function inspectSkillContent(root: string, findings: DoctorFinding[]): Promise<void> {
  let reported = 0;
  let truncated = false;
  for (const name of SCANNED_DIRECTORIES) {
    let directory: string;
    try {
      directory = await resolveSafeHarnixPath(root, `spec/${name}`);
    } catch {
      continue;
    }
    const left: FileBudget = { count: MAX_FILES, truncated: false };
    const files = await markdownFiles(directory, `.harnix/spec/${name}`, 0, left);
    truncated ||= left.truncated;
    for (const file of files) {
      if (reported >= MAX_FINDINGS) {
        truncated = true;
        break;
      }
      const text = await readTextInside(root, file.absolute);
      if (text === undefined) continue;
      const rules = scanSkillContent(text);
      if (rules.length === 0) continue;
      reported += 1;
      findings.push(
        finding(
          "skill-suspicious-content",
          "warning",
          file.relative,
          `Skill or guide text matches suspicious pattern(s): ${rules.join(", ")}. Review the file before an agent loads it; Harnix changed nothing.`,
          false,
        ),
      );
    }
  }
  if (truncated) {
    findings.push(
      finding(
        "skill-suspicious-content",
        "info",
        ".harnix/spec",
        `The skill and guide scan stopped at its limit (${MAX_FILES} files per folder, ${MAX_FINDINGS} findings); some files were not scanned.`,
        false,
      ),
    );
  }
}
