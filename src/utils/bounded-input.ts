export const defaultMaximumInputBytes = 65_536;

export async function readBoundedInput(
  input: AsyncIterable<unknown>,
  maximumBytes = defaultMaximumInputBytes,
): Promise<string | undefined> {
  if (!Number.isInteger(maximumBytes) || maximumBytes <= 0) {
    throw new Error("Maximum input bytes must be a positive integer.");
  }
  const chunks: Buffer[] = [];
  let length = 0;
  for await (const chunk of input) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    length += buffer.length;
    if (length > maximumBytes) return undefined;
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}
