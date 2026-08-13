import { describe, expect, it } from "vitest";
import { buildMeetingMinutesContent, meetingsToIcs } from "../client/src/lib/cipaCalendar";

describe("Assistant CIPA — atas e iCalendar", () => {
  it("gera conteúdo formatado de ata de reunião ordinária", () => {
    const meeting = {
      id: "meet-1",
      date: "2026-09-15",
      time: "09:30",
      title: "Reunião Ordinária da CIPA",
      status: "realizada" as const,
      notes: "Discussão sobre extintores e EPIs",
    };
    const content = buildMeetingMinutesContent(meeting, "Empresa Modelo LTDA");
    expect(content).toContain("ATA DE REUNIÃO ORDINÁRIA DA CIPA");
    expect(content).toContain("Empresa Modelo LTDA");
    expect(content).toContain("2026-09-15");
    expect(content).toContain("Discussão sobre extintores e EPIs");
  });

  it("exporta reuniões para o formato iCalendar (.ics)", () => {
    const meetings = [
      {
        id: "meet-1",
        date: "2026-09-15",
        time: "09:30",
        title: "Reunião Ordinária da CIPA",
        status: "agendada" as const,
        notes: "Inspeção",
      },
    ];
    const ics = meetingsToIcs(meetings, "Empresa Modelo LTDA");
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Reunião Ordinária da CIPA - Empresa Modelo LTDA");
    expect(ics).toContain("DTSTART:20260915T093000Z");
    expect(ics).toContain("END:VCALENDAR");
  });
});
