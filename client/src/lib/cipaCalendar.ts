export type CipaMeetingItem = {
  id: string;
  date: string;
  time: string;
  title: string;
  status: "agendada" | "realizada" | "cancelada";
  notes: string;
};

export function meetingsToIcs(meetings: CipaMeetingItem[], companyName: string) {
  const formattedCompany = companyName || "Empresa";
  const events = meetings.map(meeting => {
    const start = meeting.date.replace(/-/g, "");
    const [hours, minutes] = meeting.time.split(":");
    const timeStr = `${hours || "09"}${minutes || "00"}00`;
    return [
      "BEGIN:VEVENT",
      `UID:${meeting.id}@tstbrasilhub.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
      `DTSTART:${start}T${timeStr}Z`,
      `SUMMARY:${meeting.title} - ${formattedCompany}`,
      `DESCRIPTION:Reunião Ordinária da CIPA.\\nStatus: ${meeting.status}\\nPauta: ${meeting.notes || "Sem observações"}`,
      "END:VEVENT",
    ].join("\r\n");
  });

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TST Brasil Hub//Assistant CIPA//PT",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");
}

export function buildMeetingMinutesContent(meeting: CipaMeetingItem, companyName: string) {
  return [
    `ATA DE REUNIÃO ORDINÁRIA DA CIPA`,
    `Empresa: ${companyName || "Empresa não informada"}`,
    `Data: ${meeting.date} · Horário: ${meeting.time}`,
    `Status: ${meeting.status.toUpperCase()}`,
    ``,
    `1. ABERTURA E COMPARECIMENTO`,
    `Aos dias ${meeting.date}, às ${meeting.time} horas, reuniu-se ordinariamente a Comissão Interna de Prevenção de Acidentes e Assédio (CIPA) da empresa ${companyName || "mencionada"}, conforme planejamento normativo da NR-05.`,
    ``,
    `2. PAUTA E DISCUSSÃO`,
    `${meeting.notes || "Foram discutidas as condições de segurança do trabalho, os riscos operacionais identificados no período, o andamento do plano de ação e as medidas preventivas aplicadas nos setores."}`,
    ``,
    `3. ENCAMINHAMENTOS E DELIBERAÇÕES`,
    `- A comissão deliberou pela continuidade das rondas semanais de inspeção e verificação de EPIs.`,
    `- O próximo encontro ordinário ficou agendado conforme o calendário oficial da comissão.`,
    ``,
    `4. ENCERRAMENTO`,
    `Nada mais havendo a tratar, encerrou-se a reunião lavrando-se a presente ata que, após lida e aprovada, vai assinada pelos membros presentes.`,
    ``,
    `___________________________________________________`,
    `Presidente da CIPA`,
    ``,
    `___________________________________________________`,
    `Secretário(a) da CIPA`,
  ].join("\n");
}
