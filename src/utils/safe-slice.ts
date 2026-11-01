const isHighSurrogate = (unit: number): boolean => unit >= 0xd800 && unit <= 0xdbff;
const isLowSurrogate = (unit: number): boolean => unit >= 0xdc00 && unit <= 0xdfff;

/** `text.slice(0, length)` that steps back one code unit rather than cutting a surrogate pair in half. */
export function safeSlice(text: string, length: number): string {
  if (length <= 0) return "";
  if (length >= text.length) return text;
  const cut =
    isHighSurrogate(text.charCodeAt(length - 1)) && isLowSurrogate(text.charCodeAt(length)) ? length - 1 : length;
  return text.slice(0, cut);
}
