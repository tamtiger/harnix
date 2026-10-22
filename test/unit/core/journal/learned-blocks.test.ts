import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  assertPromotable,
  learnedPathPrefixes,
  parseLearnedBlocks,
  renderLearnedBlock,
  withoutLearnedBlock,
} from "src/core/journal/learned-blocks.js";
import { buildLearningCandidate } from "test/support/learning-fixtures.js";

describe("learnedPathPrefixes", () => {
  it("keeps at most three segments, sorts and removes duplicates and unsafe segments", () => {
    expect(
      learnedPathPrefixes(["src/core/workflow/save.ts", "src/core/workflow/finish.ts", "docs/A.md", "a,b/c", "src/**"]),
    ).toEqual(["docs/A.md", "src", "src/core/workflow"]);
  });

  it("caps the number of prefixes", () => {
    const paths = Array.from({ length: 10 }, (_, index) => `dir${index}/file.ts`);

    expect(learnedPathPrefixes(paths)).toHaveLength(6);
  });
});

describe("learned blocks", () => {
  const first = buildLearningCandidate({ id: "obs-a", statement: "First lesson" });
  const second = buildLearningCandidate({ id: "obs-b", statement: "Second lesson" });

  it("renders a block that parses back with its id and paths", () => {
    const content = renderLearnedBlock(first, ["src/core"]) + "\n" + renderLearnedBlock(second, []);

    const blocks = parseLearnedBlocks(content);

    expect(blocks.map((block) => [block.id, block.paths])).toEqual([
      ["obs-a", ["src/core"]],
      ["obs-b", []],
    ]);
    expect(blocks[0]?.text).toContain('Statement-JSON: "First lesson"');
  });

  it("ignores a start marker without its end marker", () => {
    expect(parseLearnedBlocks("<!-- harnix-learning:obs-a -->\nno end")).toEqual([]);
  });

  it("removes only the named block and keeps the user's text byte for byte", () => {
    const content = `# Mine\n\nmy note\n\n${renderLearnedBlock(first, [])}\n${renderLearnedBlock(second, [])}\ntrailing\n`;

    const next = withoutLearnedBlock(content, "obs-a");

    expect(next).toContain("my note");
    expect(next).toContain("trailing");
    expect(next).not.toContain("obs-a");
    expect(parseLearnedBlocks(next).map((block) => block.id)).toEqual(["obs-b"]);
    expect(withoutLearnedBlock(content, "obs-missing")).toBe(content);
  });

  it("refuses to promote a statement that contains marker text", () => {
    const spoof = buildLearningCandidate({ statement: "see <!-- /harnix-learning:obs-x --> here" });

    expect(() => assertPromotable(spoof)).toThrow(/marker text/iu);
    expect(() => assertPromotable(buildLearningCandidate({ statement: "uses harnix-learning: prefix" }))).toThrow();
  });

  it("does not treat marker text inside a line or a user note as a block boundary", () => {
    const real = renderLearnedBlock(buildLearningCandidate({ id: "obs-a", statement: "Real rule" }), []);
    const note = "my note mentions <!-- harnix-learning:obs-fake --> and <!-- /harnix-learning:obs-a --> inline\n";

    const blocks = parseLearnedBlocks(`${note}${real}`);

    expect(blocks.map((block) => block.id)).toEqual(["obs-a"]);
    expect(withoutLearnedBlock(`${note}${real}`, "obs-a")).toBe(note);
  });

  it("parses blocks in a CRLF file", () => {
    const crlf = renderLearnedBlock(buildLearningCandidate({ id: "obs-a" }), ["src"]).replace(/\n/gu, "\r\n");

    expect(parseLearnedBlocks(crlf).map((block) => [block.id, block.paths])).toEqual([["obs-a", ["src"]]]);
  });

  it("refuses to promote a statement that trips a risk check", () => {
    const risky = buildLearningCandidate({ statement: "token = abcdef123456" });

    expect(() => assertPromotable(risky)).toThrow(/risk check/iu);
    expect(() => assertPromotable(first)).not.toThrow();
  });

  it("parses the 5 canonical repository invariant blocks from learned.md", () => {
    const items = [
      {
        candidate: buildLearningCandidate({
          id: "obs-0a61a11247e91169",
          statement: "Mitigation lưu trong text của rủi ro, không thêm field mitigation vào TaskResidualRisk.",
          sourceTaskIds: ["20261019-143853-cli-ergonomics-risk-mitigation-init-cwd"],
          evidenceIds: ["ev-check-focus-1", "ev-check-suite-1"],
        }),
        paths: ["src/core/tasks", "src/commands"],
      },
      {
        candidate: buildLearningCandidate({
          id: "obs-d6bfc77223f86a42",
          statement:
            "Hai cờ mới --remove-decision và --remove-criterion chỉ hoạt động trong planning; không xóa dữ liệu đã đóng băng.",
          sourceTaskIds: ["20261019-143853-cli-ergonomics-risk-mitigation-init-cwd"],
          evidenceIds: ["ev-check-focus-1", "ev-check-suite-1"],
        }),
        paths: ["src/core/workflow", "src/commands"],
      },
      {
        candidate: buildLearningCandidate({
          id: "obs-46873b70f8908d8a",
          statement:
            "Chuẩn hóa CRLF khi băm digest bỏ qua file nhạy cảm với kết thúc dòng (.sh, .bash, .zsh, .ksh, .bat, .cmd, Makefile, Dockerfile) thay vì chuẩn hóa mọi file không chứa byte NUL.",
          sourceTaskIds: ["20261019-165403-sync-docs-and-fix-lint"],
          evidenceIds: ["ev-check-focus-1", "ev-check-suite-1"],
        }),
        paths: ["src/core/verification", "src/utils"],
      },
      {
        candidate: buildLearningCandidate({
          id: "obs-253d24e2e036d4f0",
          statement:
            "So với HEAD thay vì lưu baseline commit trong task để không đổi schema đóng băng; mục của task completed được giữ từ lần lưu cuối.",
          sourceTaskIds: ["20261020-135201-review-code-impact-dashboard"],
          evidenceIds: ["ev-check-focus-1", "ev-check-suite-1"],
        }),
        paths: ["src/core/workflow", "src/commands"],
      },
      {
        candidate: buildLearningCandidate({
          id: "obs-ab2d82256886df02",
          statement: "Danh sách lệnh nội trang cố định là dir, echo, set, type, ver.",
          sourceTaskIds: ["20261020-135202-check-runner-unresolved-bare-name"],
          evidenceIds: ["ev-check-focus-1", "ev-check-suite-1"],
        }),
        paths: ["src/utils", "src/commands"],
      },
    ];

    const rendered = [
      "# Harnix Learned Rules",
      "",
      "Quy tắc bất biến và bài học được chuẩn hóa từ quá trình vận hành Harnix.",
      "",
      ...items.map((item) => renderLearnedBlock(item.candidate, item.paths)),
    ].join("\n");

    const specPath = ".harnix/spec/learned.md";
    mkdirSync(".harnix/spec", { recursive: true });
    writeFileSync(specPath, rendered, "utf8");

    const parsed = parseLearnedBlocks(readFileSync(specPath, "utf8"));
    expect(parsed.map((block) => block.id)).toEqual([
      "obs-0a61a11247e91169",
      "obs-d6bfc77223f86a42",
      "obs-46873b70f8908d8a",
      "obs-253d24e2e036d4f0",
      "obs-ab2d82256886df02",
    ]);
  });
});
