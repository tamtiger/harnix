import { createHash } from "node:crypto";

function normalizeContentForHash(content: string): string {
  return content.replaceAll("\r\n", "\n").replaceAll("\r", "\n");
}

export function sha256(content: string): string {
  return createHash("sha256").update(normalizeContentForHash(content), "utf8").digest("hex");
}
