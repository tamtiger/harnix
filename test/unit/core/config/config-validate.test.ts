import { describe, expect, it } from "vitest";

import { ConfigValidationError } from "src/core/config/config-schema.js";
import { validateConfig, validateConfigV1, validateDeveloperId } from "src/core/config/config-validate.js";

describe("config-validate", () => {
  const validV2 = {
    generator: "harnix",
    schemaVersion: 2,
    developer: "tam",
    languages: ["typescript"],
    technologies: ["nestjs"],
    packages: [{ path: ".", languages: ["typescript"], technologies: ["nestjs"] }],
    platforms: ["kiro"],
    timezone: "Asia/Ho_Chi_Minh",
    context: { maxCharacters: 24000, tokenApproximation: 4 },
    runtime: { research: "conditional", fullContext: false },
  };

  it("validates valid v2 config", () => {
    expect(() => validateConfig(validV2)).not.toThrow();
  });

  it("validates optional verify block in v2 config", () => {
    const withVerify = {
      ...validV2,
      verify: {
        test: "pnpm test",
        lint: "pnpm lint",
        packages: [
          {
            path: "packages/core",
            test: "pnpm --filter core test",
          },
        ],
      },
    };
    expect(() => validateConfig(withVerify)).not.toThrow();
  });

  it("rejects invalid verify block in v2 config", () => {
    expect(() =>
      validateConfig({
        ...validV2,
        verify: "invalid-string",
      }),
    ).toThrow(ConfigValidationError);

    expect(() =>
      validateConfig({
        ...validV2,
        verify: {
          packages: "not-an-array",
        },
      }),
    ).toThrow(ConfigValidationError);

    expect(() =>
      validateConfig({
        ...validV2,
        verify: {
          test: 123,
        },
      }),
    ).toThrow(ConfigValidationError);

    expect(() =>
      validateConfig({
        ...validV2,
        verify: {
          unknownKey: "value",
        },
      }),
    ).toThrow(ConfigValidationError);

    expect(() =>
      validateConfig({
        ...validV2,
        verify: {
          packages: [{ path: "../unsafe", test: "npm test" }],
        },
      }),
    ).toThrow(ConfigValidationError);

    expect(() =>
      validateConfig({
        ...validV2,
        verify: {
          packages: [{ path: "packages/core", extraKey: "bad" }],
        },
      }),
    ).toThrow(ConfigValidationError);

    expect(() =>
      validateConfig({
        ...validV2,
        verify: {
          packages: [{ test: "missing path" }],
        },
      }),
    ).toThrow(ConfigValidationError);
  });

  it("validates developer ID correctly", () => {
    expect(validateDeveloperId("valid-dev")).toBe("valid-dev");
    expect(() => validateDeveloperId("!invalid")).toThrow(ConfigValidationError);
  });

  it("validates legacy v1 config", () => {
    const validV1 = {
      generator: "harnix",
      schemaVersion: 1,
      developer: "tam",
      languages: ["typescript-nestjs"],
      packages: [{ path: ".", languages: ["typescript-nestjs"] }],
      platforms: ["kiro"],
      context: { maxCharacters: 24000, tokenApproximation: 4 },
      runtime: { research: "conditional", fullContext: false },
    };
    expect(() => validateConfigV1(validV1)).not.toThrow();
  });
});
