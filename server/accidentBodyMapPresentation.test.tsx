import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AccidentBodyMapSummary } from "../client/src/components/AnatomicalBodyMap";

describe("AccidentBodyMapSummary", () => {
  it("mostra a quantidade agregada de lesões em cada região classificada", () => {
    const markup = renderToStaticMarkup(<AccidentBodyMapSummary injuries={[
      { bodyRegion: "hand_left" },
      { bodyRegion: "hand_left" },
      { bodyRegion: "knee_right" },
    ]} />);

    expect(markup).toContain("Lesões classificadas por região");
    expect(markup).toContain("3</span> lesão(ões)");
    expect(markup).toContain(">2</text>");
    expect(markup).toContain(">1</text>");
  });
});
