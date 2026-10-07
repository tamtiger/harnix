import { describe, expect, it } from "vitest";

import { parseCheckSpec } from "src/core/workflow/init-spec.js";

describe("parseCheckSpec", () => {
  it("reads every key, splits lists on a plus sign and sorts and de-duplicates them", () => {
    expect(
      parseCheckSpec(
        "id=check-a;command=pnpm exec vitest run a.test.ts;criteria=ac-2+ac-1+ac-2;input=test/**+src/**;scope=full;description=Kiểm tra A",
      ),
    ).toEqual({
      id: "check-a",
      command: "pnpm exec vitest run a.test.ts",
      criterionIds: ["ac-1", "ac-2"],
      inputs: ["src/**", "test/**"],
      scope: "full",
      description: "Kiểm tra A",
    });
  });

  it("defaults the scope to focused and leaves the description out", () => {
    const spec = parseCheckSpec("id=c;command=node -e 0;criteria=ac-1;input=src/**");

    expect(spec).toEqual({
      id: "c",
      command: "node -e 0",
      criterionIds: ["ac-1"],
      inputs: ["src/**"],
      scope: "focused",
    });
  });

  it("keeps an equals sign inside a value", () => {
    expect(parseCheckSpec("id=c;command=node -e x=1;criteria=ac-1;input=a").command).toBe("node -e x=1");
  });

  it.each(["id", "command", "criteria", "input"])("names the missing key %s", (key) => {
    const parts = ["id=c", "command=node -e 0", "criteria=ac-1", "input=src/**"].filter(
      (part) => !part.startsWith(`${key}=`),
    );

    expect(() => parseCheckSpec(parts.join(";"))).toThrow(new RegExp(`missing key ${key}`, "u"));
  });

  it("rejects an empty spec, an unknown key, a repeated key, a bad scope and a part without a value", () => {
    expect(() => parseCheckSpec("  ")).toThrow(/--with-check/u);
    expect(() => parseCheckSpec("id=c;command=x;criteria=ac-1;input=a;color=red")).toThrow(/unknown key color/u);
    expect(() => parseCheckSpec("id=c;id=d;command=x;criteria=ac-1;input=a")).toThrow(/repeated key id/u);
    expect(() => parseCheckSpec("id=c;command=x;criteria=ac-1;input=a;scope=project")).toThrow(/scope/u);
    expect(() => parseCheckSpec("id=c;command;criteria=ac-1;input=a")).toThrow(/key=value/u);
    expect(() => parseCheckSpec("id=c;command=;criteria=ac-1;input=a")).toThrow(/missing key command/u);
  });
});
