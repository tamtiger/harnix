import { describe, expect, it } from "vitest";

import { orderEpicMembers, validateEpicOrder } from "src/core/epics/order.js";

const A = "20260928-100000-a";
const B = "20260928-100001-b";
const C = "20260928-100002-c";

describe("epic member order", () => {
  it("puts ordered members first in that order and the rest by id", () => {
    const members = [{ id: A }, { id: B }, { id: C }];

    expect(orderEpicMembers(members, [C, A]).map((member) => member.id)).toEqual([C, A, B]);
    expect(orderEpicMembers(members, [B]).map((member) => member.id)).toEqual([B, A, C]);
  });

  it("ignores ids that are not members and leaves an epic without order untouched", () => {
    const members = [{ id: A }, { id: B }];

    expect(orderEpicMembers(members, ["20260928-100009-gone", B]).map((member) => member.id)).toEqual([B, A]);
    expect(orderEpicMembers(members, undefined)).toEqual(members);
    expect(orderEpicMembers(members, [])).toEqual(members);
  });

  it("validates a list of distinct task ids", () => {
    expect(validateEpicOrder([A, B])).toEqual([A, B]);
    expect(() => validateEpicOrder("x")).toThrow(/order/u);
    expect(() => validateEpicOrder([A, A])).toThrow(/duplicate/iu);
    expect(() => validateEpicOrder(["Bad Id"])).toThrow(/task id/iu);
    expect(() => validateEpicOrder([1])).toThrow(/order/u);
  });
});
