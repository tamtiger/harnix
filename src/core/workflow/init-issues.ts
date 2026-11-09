const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const SLUG_MAX = 60;

/** Lowercase kebab-case without accents (the Vietnamese đ included): a starting point for an English slug. */
export function asciiFold(title: string): string {
  return title
    .toLowerCase()
    .replace(/đ/gu, "d")
    .normalize("NFD")
    .replace(/[̀-ͯ]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "");
}

function toSlug(title: string): string {
  return asciiFold(title).slice(0, 40).replace(/-+$/u, "") || "task";
}

/**
 * An explicit English slug, or one derived from a plain-ASCII title; a title with accents never becomes an ID, and
 * the issue then carries the ASCII-folded title as the start of a slug to translate.
 */
export function slugOrIssue(title: string, slug: string | undefined): { slug?: string; issue?: string } {
  if (slug !== undefined) {
    if (!SLUG_PATTERN.test(slug) || slug.length > SLUG_MAX)
      return {
        issue: `workflow --init --slug must be english-kebab-case (a-z, 0-9, single hyphens, at most ${SLUG_MAX} characters).`,
      };
    return { slug };
  }
  // eslint-disable-next-line no-control-regex
  if (/[^\u0000-\u007f]/u.test(title)) {
    const folded = toSlug(title);
    return {
      issue: `the title is not plain ASCII, so pass --slug <english-kebab-case> for the task ID (the title without accents is ${folded}; translate it to English).`,
    };
  }
  return { slug: toSlug(title) };
}
