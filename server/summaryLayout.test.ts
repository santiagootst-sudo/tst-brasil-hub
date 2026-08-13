import { describe, expect, it } from "vitest";
import {
  defaultSummaryOrder,
  moveSummaryWidget,
  normalizeSummaryLayout,
  toggleSummaryWidget,
} from "../client/src/lib/summaryLayout";

describe("summary layout preferences", () => {
  it("normalizes missing, duplicated and unknown widgets without losing the default set", () => {
    expect(normalizeSummaryLayout({ order: ["cipa", "cipa", "unknown"], hidden: ["hero", "hero", "unknown"] })).toEqual({
      order: ["cipa", "alerts", "hero", "priorities"],
      hidden: ["hero"],
    });
  });

  it("moves widgets up and down without mutating the original order", () => {
    const initial = [...defaultSummaryOrder];
    expect(moveSummaryWidget(initial, "priorities", "up")).toEqual(["alerts", "priorities", "hero", "cipa"]);
    expect(moveSummaryWidget(initial, "alerts", "up")).toEqual(initial);
    expect(moveSummaryWidget(initial, "cipa", "down")).toEqual(initial);
    expect(initial).toEqual(defaultSummaryOrder);
  });

  it("toggles visibility while preserving the remaining hidden widgets", () => {
    expect(toggleSummaryWidget([], "alerts")).toEqual(["alerts"]);
    expect(toggleSummaryWidget(["alerts", "cipa"], "alerts")).toEqual(["cipa"]);
  });
});
