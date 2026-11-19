import { describe, expect, it } from "vitest";

import { extractMarkdownSymbols } from "src/core/repo-map/outline-markdown.js";

describe("outline markdown symbols", () => {
  it("lists headings with the span up to the next heading of the same or a higher level and skips fenced code", () => {
    const lines = ["# Title", "text", "## Part", "```", "# not a heading", "```", "# Next", "end"];

    const symbols = extractMarkdownSymbols(lines);

    expect(symbols.map(({ name, startLine, endLine }) => `${name} ${startLine}-${endLine}`)).toEqual([
      "Title 1-6",
      "Part 3-6",
      "Next 7-8",
    ]);
  });
});
