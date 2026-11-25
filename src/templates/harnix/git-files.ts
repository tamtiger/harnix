/** Project-scope managed files that keep `.harnix` out of git noise without touching the repository's own files. */
export const HARNIX_GITIGNORE_PATH = ".harnix/.gitignore";
export const HARNIX_GITATTRIBUTES_PATH = ".harnix/.gitattributes";

const MARKER = "# Managed by Harnix: `harnix update` rewrites this file until you edit it, then it keeps your version.";

/**
 * Regenerable data (`/cache/`, `/tmp/`) and the per-person active pointer stay out of git. The first two are anchored
 * to `.harnix` on purpose: a bare `cache/` would also hide a `cache` folder of a project skill or of the journal.
 * Tasks, epics, the journal and `spec/` stay tracked: add `workspace/` here yourself to keep your journal out.
 */
export const gitignoreTemplate = `${MARKER}\n/cache/\n/tmp/\ntasks/.active\n`;

/** Project data is read by tools on every platform, so it is checked out with LF whatever `core.autocrlf` says. */
export const gitattributesTemplate = `${MARKER}\n* text eol=lf\n`;
