const ANGLE_RUN = /[<>]{3,}/gu;
const ENTRY_HEADER_LINE = /^--- (?=[^\n]*---\r?$)/gmu;

/**
 * Repository text is wrapped in a fixed untrusted frame and split on `--- path ---` header lines. Content must not be
 * able to forge either, so runs of three or more angle brackets are spaced apart and entry-header-shaped lines are
 * prefixed; everything else, including the length class of the text, is kept as is.
 */
export function neutralizeContextMarkers(content: string): string {
  return content.replace(ANGLE_RUN, (run) => [...run].join(" ")).replace(ENTRY_HEADER_LINE, "\\--- ");
}
