/** Matches the deliberately small Harnix glob grammar for star and globstar tokens. */
export function matchesSafeGlob(path: string, glob: string): boolean {
  let pattern = "^";
  for (let index = 0; index < glob.length; index += 1) {
    const character = glob[index]!;
    if (character === "*" && glob[index + 1] === "*") {
      if (glob[index + 2] === "/") {
        pattern += "(?:.*/)?";
        index += 2;
      } else {
        pattern += ".*";
        index += 1;
      }
    } else if (character === "*") {
      pattern += "[^/]*";
    } else {
      pattern += regexSyntax.has(character) ? "\\" + character : character;
    }
  }
  return new RegExp(`${pattern}$`, "u").test(path);
}

const regexSyntax = new Set("\\^$.*+?()[]{}|");
