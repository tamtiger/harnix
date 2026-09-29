/**
 * The filesystem primitives that command modules may use. Commands orchestrate; anything
 * beyond these one-call reads and deletions belongs in `core` or a dedicated util.
 */
export { access, lstat, readFile, readdir, rm } from "node:fs/promises";
