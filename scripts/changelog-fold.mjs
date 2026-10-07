/** Folds the `## [X.Y.0-dev.N]` entries of one release line into a single `## [X.Y.0]` entry. */
const sectionTitles = { added: "Added", changed: "Changed", fixed: "Fixed" };

function splitEntries(changelog) {
  const starts = [...changelog.matchAll(/^## \[/gmu)].map((match) => match.index);
  return starts.map((start, index) => ({ start, end: starts[index + 1] ?? changelog.length }));
}

function parseSections(entryText) {
  const sections = [];
  for (const line of entryText.split(/\r?\n/u).slice(1)) {
    const title = line.match(/^### (.+?)\s*$/u)?.[1];
    if (title) sections.push({ title, lines: [] });
    else if (sections.length > 0) sections.at(-1).lines.push(line);
  }
  return sections.map(({ title, lines }) => ({ title, text: lines.join("\n").trim() }));
}

export function foldDevEntries(changelog, version, date, summaries, kind) {
  const escaped = version.replaceAll(".", "\\.");
  const devHeading = new RegExp(`^## \\[${escaped}-dev\\.(0|[1-9]\\d*)\\] - \\d{4}-\\d{2}-\\d{2}\\s*$`, "u");
  const devEntries = splitEntries(changelog).flatMap((range) => {
    const text = changelog.slice(range.start, range.end);
    const number = text.split(/\r?\n/u, 1)[0].match(devHeading)?.[1];
    return number === undefined ? [] : [{ ...range, number: Number(number), text }];
  });
  if (devEntries.length === 0) throw new Error(`--fold-dev found no ${version}-dev.N entry in CHANGELOG.md.`);

  const merged = new Map();
  const add = (title, text) => {
    if (text.length === 0) return;
    merged.set(title, [...(merged.get(title) ?? []), text]);
  };
  for (const entry of [...devEntries].sort((left, right) => left.number - right.number))
    for (const section of parseSections(entry.text)) add(section.title, section.text);
  add(sectionTitles[kind] ?? "Changed", summaries.map((summary) => `- ${summary}`).join("\n"));

  const body = [...merged].map(([title, parts]) => `### ${title}\n\n${parts.join("\n")}\n\n`).join("");
  const folded = `## [${version}] - ${date}\n\n${body}`;
  const insertAt = devEntries[0].start;
  let result = "";
  let cursor = 0;
  for (const entry of devEntries) {
    result += changelog.slice(cursor, entry.start);
    if (entry.start === insertAt) result += folded;
    cursor = entry.end;
  }
  return result + changelog.slice(cursor);
}
