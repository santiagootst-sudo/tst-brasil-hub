import { describe, expect, it } from "vitest";
import { getPlanSelectionAction, getPortalAccessAction } from "../client/src/lib/landingNavigation";

describe("landing navigation", () => {
  it("opens the authenticated portal", () => {
    expect(getPortalAccessAction(true, true)).toEqual({ kind: "route", href: "/app" });
  });

  it("starts OAuth when the portal is configured", () => {
    expect(getPortalAccessAction(false, true)).toEqual({ kind: "login" });
    expect(getPlanSelectionAction(false, true, "anual")).toEqual({ kind: "login" });
  });

  it("keeps the access CTA useful when OAuth is not configured in production", () => {
    expect(getPortalAccessAction(false, false)).toEqual({ kind: "route", href: "/planos?access=setup" });
  });

  it("routes a plan selection to sales instead of a dead button when checkout cannot authenticate", () => {
    expect(getPlanSelectionAction(false, false, "trimestral")).toEqual({
      kind: "contact",
      href: "/?contact=vendas&plan=trimestral#contato",
    });
  });
});
