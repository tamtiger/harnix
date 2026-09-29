import { describe, expect, it } from "vitest";

import { evaluateFacts, type DetectionFacts } from "src/core/stack/detection-engine.js";

describe("detection-engine", () => {
  it("evaluates empty facts returning empty matches", async () => {
    const facts: DetectionFacts = {
      files: [],
      dependencies: [],
    };
    const matches = await evaluateFacts(facts);
    expect(matches).toEqual([]);
  });

  it("detects language from file extension match", async () => {
    const facts: DetectionFacts = {
      files: [
        {
          absolute: "/repo/main.go",
          path: "main.go",
        },
      ],
      dependencies: [],
    };
    const matches = await evaluateFacts(facts);
    const goMatch = matches.find((m) => m.id === "go");
    expect(goMatch).toBeDefined();
    expect(goMatch?.facet).toBe("language");
  });

  it("detects framework from dependency fact", async () => {
    const facts: DetectionFacts = {
      files: [
        {
          absolute: "/repo/package.json",
          path: "package.json",
        },
      ],
      dependencies: [
        {
          ecosystem: "npm",
          name: "@nestjs/core",
          path: "package.json",
        },
      ],
    };
    const matches = await evaluateFacts(facts);
    const nestMatch = matches.find((m) => m.id === "nestjs");
    expect(nestMatch).toBeDefined();
  });
});
