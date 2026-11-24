const LINK_HINT =
  "Run harnix doctor --global to see which platform root is affected; a relocated root is set with CLAUDE_CONFIG_DIR, CODEX_HOME, XDG_CONFIG_HOME.";

/** Symbolic-link rejections carry where to look; none of them names a machine path. */
export const ROOT_LINK_MESSAGE = `The user root escapes its verified containment boundary through a symbolic link. ${LINK_HINT}`;
export const PATH_LINK_MESSAGE = `The requested path escapes the user root through a symbolic link. ${LINK_HINT}`;
