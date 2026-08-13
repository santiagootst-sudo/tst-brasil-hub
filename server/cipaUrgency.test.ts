import { describe, expect, it } from "vitest";
import { cipaMeetingUrgencyLabel, daysUntilCipaMeeting, isCipaMeetingUrgent } from "../client/src/lib/cipaUrgency";

describe("Assistant CIPA — urgência de reuniões", () => {
  const referenceDate = new Date("2026-08-13T15:00:00");

  it("considera hoje e os próximos três dias como janela de urgência", () => {
    expect(daysUntilCipaMeeting("2026-08-13", referenceDate)).toBe(0);
    expect(daysUntilCipaMeeting("2026-08-16", referenceDate)).toBe(3);
    expect(isCipaMeetingUrgent("2026-08-13", referenceDate)).toBe(true);
    expect(isCipaMeetingUrgent("2026-08-16", referenceDate)).toBe(true);
  });

  it("não alerta reuniões fora da janela de três dias ou já passadas", () => {
    expect(isCipaMeetingUrgent("2026-08-17", referenceDate)).toBe(false);
    expect(isCipaMeetingUrgent("2026-08-12", referenceDate)).toBe(false);
    expect(cipaMeetingUrgencyLabel("2026-08-13", referenceDate)).toBe("Hoje");
    expect(cipaMeetingUrgencyLabel("2026-08-15", referenceDate)).toBe("Em 2 dias");
    expect(cipaMeetingUrgencyLabel("2026-08-17", referenceDate)).toBe("Agendada");
  });
});
