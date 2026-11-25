// harnix-secret-waiver: every token, password and key below is a made-up value for the redaction test.
import { describe, expect, it } from "vitest";

import { redactCheckOutput } from "src/core/workflow/output-redaction.js";
import { redactSecrets } from "src/core/workflow/secret-scan.js";

describe("redactCheckOutput", () => {
  it.each([
    ["an Authorization header", "Authorization: Bearer abcdef1234567890abcdef", "abcdef1234567890abcdef"],
    ["a bare bearer token", "sent Bearer abcdef1234567890abcdef to the api", "abcdef1234567890abcdef"],
    ["a Basic authorization header", "Authorization: Basic dXNlcjpwYXNzd29yZDEyMw==", "dXNlcjpwYXNzd29yZDEyMw"],
    ["an unquoted token assignment", "token=abcd1234efgh5678", "abcd1234efgh5678"],
    ["an unquoted api key in the environment", "API_KEY=sk-live-abcdef", "sk-live-abcdef"],
    ["a colon assignment", "secret: abcdefghijk123", "abcdefghijk123"],
    ["a password with a prefix", "DB_PASSWORD=hunter22secret", "hunter22secret"],
    ["a connection string password", "DATABASE_URL=postgres://u:pw123456@host/db", "pw123456"],
    ["a JWT", "jwt eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop done", "eyJhbGciOiJIUzI1NiJ9"],
  ])("hides the value of %s", (_name, line, secret) => {
    const text = redactCheckOutput(`before\n${line}\nafter\n`);

    expect(text).not.toContain(secret);
    expect(text).toContain("<redacted>");
    expect(text).toContain("before");
    expect(text).toContain("after");
  });

  it("keeps the name of the variable so the error stays readable", () => {
    expect(redactCheckOutput("API_KEY=sk-live-abcdef")).toBe("API_KEY=<redacted>");
    expect(redactCheckOutput("Authorization: Bearer abcdef1234567890abcdef")).toBe("Authorization: Bearer <redacted>");
  });

  it("leaves ordinary test output alone", () => {
    const lines = [
      " FAIL  test/a.test.ts > token count > adds up",
      "AssertionError: expected 3 to equal 4",
      "Tests: 12 passed, 1 failed",
      "error TS2322: Type 'string' is not assignable to type 'number'.",
      "max_tokens=4096 password: <redacted> token: ${TOKEN}",
      "Basic configuration loaded",
      "the secret of a good test is a small test",
    ].join("\n");

    expect(redactCheckOutput(lines)).toBe(lines);
  });
});

describe("redactSecrets", () => {
  it("masks the value, not the first place the same word appears", () => {
    expect(redactSecrets('password: "password"')).toBe('password: "<redacted>"');
    expect(redactSecrets("password=hunter22secret")).toBe("password=<redacted>");
    expect(redactSecrets("postgres://a:a1b2c3@host/db")).toBe("postgres://a:<redacted>@host/db");
  });
});
