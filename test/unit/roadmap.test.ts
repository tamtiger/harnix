import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { upsertEpic, validateEpic } from "../../src/core/roadmaps/roadmap.js";
import { useTemporaryRepositories } from "../support/temporary-repository.js";

describe("EpicRecord validation", () => {
  it("accepts a valid epic record", () => {
    const valid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng lớn",
      goal: "Thêm roadmap cho epic tracking",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(validateEpic(valid)).toEqual(valid);
  });

  it("accepts a valid epic with nonGoals", () => {
    const valid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "epic-2",
      title: "Khác",
      goal: "Khác",
      nonGoals: ["Không làm gì"],
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(validateEpic(valid)).toEqual(valid);
  });

  it("rejects epic missing required field", () => {
    const invalid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(() => validateEpic(invalid)).toThrow();
  });

  it("rejects epic with unknown field", () => {
    const invalid = {
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng",
      goal: "Mục tiêu",
      extraField: "should-not-be-here",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    };
    expect(() => validateEpic(invalid)).toThrow();
  });

  const temporaryRepository = useTemporaryRepositories();

  it("persists epic record and regenerates markdown derived view", async () => {
    const root = await temporaryRepository();
    const epic = validateEpic({
      generator: "harnix",
      schemaVersion: 1,
      id: "my-epic",
      title: "Tính năng lớn",
      goal: "Thêm roadmap",
      createdAt: "2026-09-24T04:00:00Z",
      updatedAt: "2026-09-24T04:00:00Z",
    });

    await upsertEpic(root, epic);
    const jsonContent = await readFile(join(root, ".harnix", "roadmaps", "my-epic.json"), "utf8");
    expect(JSON.parse(jsonContent).id).toBe("my-epic");

    const mdContent = await readFile(join(root, ".harnix", "roadmaps", "my-epic.md"), "utf8");
    expect(mdContent).toContain("Tính năng lớn");
    expect(mdContent).toContain("Thêm roadmap");
  });
});
