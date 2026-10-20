const SENSITIVE_EXTENSIONS = new Set([
  ".sh",
  ".bash",
  ".zsh",
  ".ksh",
  ".fish",
  ".bat",
  ".cmd",
  ".ps1",
  ".psm1",
  ".vbs",
  ".reg",
  ".snap",
  ".mk",
]);
const SENSITIVE_NAMES = new Set(["makefile", "gnumakefile", "dockerfile"]);

/**
 * True for files whose behavior depends on their line endings (a CRLF shebang or recipe line breaks), which must be
 * hashed byte for byte instead of having CRLF read as LF.
 */
export function isLineEndingSensitive(path: string): boolean {
  const name = (path.split("/").pop() ?? path).toLowerCase();
  const dot = name.lastIndexOf(".");
  return SENSITIVE_NAMES.has(name) || (dot >= 0 && SENSITIVE_EXTENSIONS.has(name.slice(dot)));
}

/** True when the content has no NUL byte, the heuristic Git uses to tell text from binary. */
export function isTextContent(content: Uint8Array): boolean {
  return !content.includes(0);
}

/**
 * The content with CRLF turned into LF when it is text; binary content, a lone CR and every other byte stay as they
 * are, so the same text checked out with different line endings has one digest.
 */
export function normalizeLineEndings(content: Uint8Array): Uint8Array {
  if (!isTextContent(content) || !content.includes(13)) return content;
  const output = new Uint8Array(content.length);
  let length = 0;
  for (let index = 0; index < content.length; index += 1) {
    const byte = content[index] as number;
    if (byte === 13 && content[index + 1] === 10) continue;
    output[length] = byte;
    length += 1;
  }
  return output.subarray(0, length);
}
