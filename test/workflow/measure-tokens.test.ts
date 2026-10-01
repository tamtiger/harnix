import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

interface Step {
  label: string;
  inputTokens: number;
  outputTokens: number;
}
interface Runner {
  (args: string[], input?: string): { status: number; stdout: string; stderr: string };
}
interface Meter {
  steps: Step[];
  step(label: string, args: string[], input?: string): string;
}
interface MeasureTokens {
  TOKEN_APPROXIMATION: number;
  estimateTokens(text: string): number;
  createMeter(run: Runner): Meter;
  pairSteps(brief: Step[], full: Step[]): { label: string; brief: Omit<Step, "label">; full: Omit<Step, "label"> }[];
  measureGuides(directory: string): Promise<{
    files: number;
    totalTokens: number;
    maxTokens: number;
    commonPlusLanguage: number;
  }>;
}

const script = (await import(new URL("../../scripts/measure-tokens.mjs", import.meta.url).href)) as MeasureTokens;

const ok = (stdout: string): ReturnType<Runner> => ({ status: 0, stdout, stderr: "" });

describe("measure-tokens helpers", () => {
  it("estimates tokens with the project approximation of four characters per token, rounded up", () => {
    expect(script.TOKEN_APPROXIMATION).toBe(4);
    expect(script.estimateTokens("")).toBe(0);
    expect(script.estimateTokens("abcd")).toBe(1);
    expect(script.estimateTokens("abcde")).toBe(2);
  });

  it("records input and output tokens per step and returns the command output", () => {
    const meter = script.createMeter((_args, input) => ok(`${input ?? ""}12345678`));

    const output = meter.step("save", ["workflow", "--save"], "abcd");

    expect(output).toBe("abcd12345678");
    expect(meter.steps).toEqual([{ label: "save", inputTokens: 1, outputTokens: 3 }]);
  });

  it("treats a missing input as zero tokens", () => {
    const meter = script.createMeter(() => ok("abcd"));

    meter.step("preflight", ["workflow", "--preflight"]);

    expect(meter.steps).toEqual([{ label: "preflight", inputTokens: 0, outputTokens: 1 }]);
  });

  it("fails loudly, naming the step and exit code, when a measured command exits non-zero", () => {
    const meter = script.createMeter(() => ({ status: 2, stdout: "", stderr: "boom" }));

    expect(() => meter.step("transition ready", ["workflow", "--transition", "ready/ready"])).toThrow(
      /transition ready.*exit 2.*boom/su,
    );
    expect(meter.steps).toEqual([]);
  });

  it("pairs brief and full runs by label and rejects runs that diverge", () => {
    const brief: Step[] = [{ label: "finish", inputTokens: 0, outputTokens: 85 }];
    const full: Step[] = [{ label: "finish", inputTokens: 0, outputTokens: 270 }];

    expect(script.pairSteps(brief, full)).toEqual([
      { label: "finish", brief: { inputTokens: 0, outputTokens: 85 }, full: { inputTokens: 0, outputTokens: 270 } },
    ]);
    expect(() => script.pairSteps(brief, [{ ...full[0]!, label: "other" }])).toThrow(/finish.*other/su);
    expect(() => script.pairSteps(brief, [])).toThrow(/1.*0/su);
  });
});

describe("measureGuides", () => {
  it("counts every guide, the largest one and the common plus language pair", async () => {
    const directory = await mkdtemp(join(tmpdir(), "harnix-measure-guides-"));
    try {
      await mkdir(join(directory, "languages"), { recursive: true });
      await mkdir(join(directory, "technologies", "framework"), { recursive: true });
      await writeFile(join(directory, "common.md"), "c".repeat(400));
      await writeFile(join(directory, "languages", "typescript.md"), "t".repeat(800));
      await writeFile(join(directory, "technologies", "framework", "nextjs.md"), "n".repeat(1201));
      await writeFile(join(directory, "technologies", "notes.txt"), "ignored");

      await expect(script.measureGuides(directory)).resolves.toEqual({
        files: 3,
        totalTokens: 100 + 200 + 301,
        maxTokens: 301,
        commonPlusLanguage: 300,
      });
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("fails loudly when the common or typescript guide is missing", async () => {
    const directory = await mkdtemp(join(tmpdir(), "harnix-measure-guides-"));
    try {
      await writeFile(join(directory, "common.md"), "c".repeat(40));

      await expect(script.measureGuides(directory)).rejects.toThrow(/typescript/u);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
