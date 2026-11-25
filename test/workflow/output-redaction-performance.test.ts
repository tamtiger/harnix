// harnix-secret-waiver: every token, password and key below is a made-up value for the redaction test.
import { describe, expect, it } from "vitest";

import { LOG_RULES, MAX_LINE_LENGTH, redactCheckOutput } from "src/core/workflow/output-redaction.js";
import { redactSecrets } from "src/core/workflow/secret-scan.js";

/** The size of a check log (OUTPUT_LIMIT of the check runner). */
const SIZE = 64 * 1024;
/** A linear pass over 64 KB takes a few milliseconds; the cubic rule needed seconds already at 4 KB. */
const LIMIT_MS = 1000;

function fill(unit: string, size = SIZE, suffix = ""): string {
  return unit.repeat(Math.ceil(size / unit.length)).slice(0, size) + suffix;
}

function elapsed(run: () => unknown): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

const POISON: readonly (readonly [string, string])[] = [
  ["tokenx. repeated", fill("tokenx.")],
  ["token- repeated", fill("token-")],
  ["my-token-name- repeated", fill("my-token-name-")],
  ["a.b. repeated then secret", fill("a.b.", SIZE, "secret")],
  ["password repeated", fill("password")],
  ["token= repeated", fill("token=")],
  ["Bearer repeated", fill("Bearer ")],
  ["API_KEY= repeated", fill("API_KEY=")],
  ["Authorization header repeated", fill("Authorization: Bearer ")],
  ["secret: repeated", fill("secret: ")],
  ["one long word", fill("x")],
  ["many short lines", fill("token=abc\nBearer abc\n")],
  ["a megabyte on one line", fill("x", 1024 * 1024)],
  ["a megabyte of token=", fill("token=", 1024 * 1024)],
  ["a megabyte of tokenx.", fill("tokenx.", 1024 * 1024)],
];

describe("redaction stays linear on hostile output", () => {
  it("finishes 8 KB of tokenx. at once (the cubic rule of the first version took 8 seconds)", () => {
    expect(elapsed(() => redactCheckOutput(fill("tokenx.", 8 * 1024)))).toBeLessThan(LIMIT_MS);
  });

  it.each(POISON)("redactCheckOutput on %s", (_name, text) => {
    expect(elapsed(() => redactCheckOutput(text))).toBeLessThan(LIMIT_MS);
  });

  it.each(POISON)("redactSecrets on %s", (_name, text) => {
    expect(elapsed(() => redactSecrets(text.slice(0, SIZE)))).toBeLessThan(LIMIT_MS);
  });

  it.each(POISON)("every log rule alone, without the line cap, on %s", (_name, text) => {
    const line = text.slice(0, SIZE);
    for (const rule of LOG_RULES) expect(elapsed(() => line.replace(rule, "$1<redacted>"))).toBeLessThan(LIMIT_MS);
  });

  it("cuts a line longer than the cap to its start and its end and counts what it dropped", () => {
    const text = `${fill("x", 2000)}token=middlesecret99${fill("y", 3000)}\nnext line\n`;
    const result = redactCheckOutput(text);

    expect(result).toContain("[line truncated, 924 more characters]");
    expect(result).not.toContain("middlesecret99");
    expect(result).toContain("next line");
  });

  it("keeps the end of a long line, where the error is, and still hides a credential there", () => {
    const text = `${fill("x", MAX_LINE_LENGTH)}token=tailsecret12345\nnext line\n`;
    const result = redactCheckOutput(text);

    expect(result).toContain("[line truncated, 21 more characters]");
    expect(result).not.toContain("tailsecret12345");
    expect(result).toContain("token=<redacted>");
  });

  it("leaves a line at the cap whole", () => {
    const line = fill("x", MAX_LINE_LENGTH);

    expect(redactCheckOutput(line)).toBe(line);
  });
});

describe("redaction keeps hiding credentials", () => {
  it.each([
    ["Authorization: Bearer abcdef1234567890abcdef", "abcdef1234567890abcdef"],
    ["sent Bearer abcdef1234567890abcdef to the api", "abcdef1234567890abcdef"],
    ["Authorization: Basic dXNlcjpwYXNzd29yZDEyMw==", "dXNlcjpwYXNzd29yZDEyMw"],
    ["token=abcd1234efgh5678", "abcd1234efgh5678"],
    ["API_KEY=sk-live-abcdef", "sk-live-abcdef"],
    ["secret: abcdefghijk123", "abcdefghijk123"],
    ["GITHUB_TOKEN=ghx1234567", "ghx1234567"],
    ["my-api-token=xyzxyz1234", "xyzxyz1234"],
    ["my.api.token: xyzxyz1234", "xyzxyz1234"],
    ["accessToken: abcdef123456", "abcdef123456"],
    ["mytoken=abcdefgh1", "abcdefgh1"],
    ["password=a:b/c+d==xyz", "a:b/c+d==xyz"],
    ["AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMIK7MDENG", "wJalrXUtnFEMIK7MDENG"],
    ["client_secret=abcdefgh12345", "abcdefgh12345"],
    ["secret_key = abcdefgh12345", "abcdefgh12345"],
    ["token=\tabcdefgh1", "abcdefgh1"],
    ["token=abcdefgh1\r", "abcdefgh1"],
    ["a token=aaaaaaa1 and secret=bbbbbbb2 here", "aaaaaaa1"],
    ["a token=aaaaaaa1 and secret=bbbbbbb2 here", "bbbbbbb2"],
  ])("hides the value in %s", (line, secret) => {
    const result = redactCheckOutput(`before\n${line}\nafter`);

    expect(result).not.toContain(secret);
    expect(result).toContain("<redacted>");
    expect(result).toContain("before");
    expect(result).toContain("after");
  });
});

describe("redaction does not touch words that only contain a keyword", () => {
  it.each([
    "secretary: abcdefghi",
    "tokenizer=fast-mode",
    "token_count=1234567",
    "keyboard: abcdefghi",
    "monkey=1234567",
    "passport: abcdefghi",
    "tokens: 5",
    "max_tokens=1024",
    "secrets: abcdefghi",
    " FAIL  test/a.test.ts > token count > adds up",
    "the secret of a good test is a small test",
  ])("leaves %s as it is", (line) => {
    expect(redactCheckOutput(line)).toBe(line);
  });
});
