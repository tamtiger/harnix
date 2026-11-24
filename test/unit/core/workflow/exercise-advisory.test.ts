import { describe, expect, it } from "vitest";
import { exerciseAdvisories } from "src/core/workflow/exercise-advisory.js";
import { buildCheck, buildCriterion, buildTaskV3 } from "test/support/builders.js";

function taskWith(text: string, check: Parameters<typeof buildCheck>[0] = {}) {
  return buildTaskV3({
    acceptanceCriteria: [buildCriterion({ id: "ac-1", text })],
    validationPlan: [buildCheck({ id: "chk-1", criterionIds: ["ac-1"], required: true, ...check })],
  });
}

describe("exerciseAdvisories", () => {
  it("warns when a criterion describes an endpoint and no required check starts with exercise", () => {
    const found = exerciseAdvisories(taskWith("GET /orders trả về HTTP 200 với danh sách đơn"));
    expect(found).toHaveLength(1);
    expect(found[0]).toContain("ac-1");
    expect(found[0]).toContain("harnix skill harnix-exercise");
  });

  it("warns for a command, a screen and a browser flow written in Vietnamese or English", () => {
    for (const text of [
      "Lệnh CLI in ra JSON hợp lệ",
      "Giao diện hiển thị tổng tiền đúng",
      "Người dùng mở trình duyệt và thấy trang đăng nhập",
      "The page shows the total",
    ]) {
      expect(exerciseAdvisories(taskWith(text))).toHaveLength(1);
    }
  });

  it("stays silent when the criterion has no observable behavior", () => {
    expect(exerciseAdvisories(taskWith("Hàm tính phí làm tròn đến đồng gần nhất"))).toEqual([]);
    expect(exerciseAdvisories(taskWith("Therapist notes remain unchanged"))).toEqual([]);
  });

  it("accepts a required check whose id or description starts with exercise and covers the criterion", () => {
    expect(exerciseAdvisories(taskWith("API trả 200", { id: "exercise-orders" }))).toEqual([]);
    expect(exerciseAdvisories(taskWith("API trả 200", { description: "Exercise: gọi endpoint thật" }))).toEqual([]);
  });

  it("ignores an exercise check that is optional or does not cover the criterion", () => {
    expect(exerciseAdvisories(taskWith("API trả 200", { id: "exercise-orders", required: false }))).toHaveLength(1);
    expect(exerciseAdvisories(taskWith("API trả 200", { id: "exercise-orders", criterionIds: [] }))).toHaveLength(1);
  });

  it("ignores waived and met-by-nothing criteria that are already waived", () => {
    const task = taskWith("API trả 200");
    const waived = { ...task, acceptanceCriteria: [{ ...task.acceptanceCriteria[0]!, status: "waived" as const }] };
    expect(exerciseAdvisories(waived)).toEqual([]);
  });
});
