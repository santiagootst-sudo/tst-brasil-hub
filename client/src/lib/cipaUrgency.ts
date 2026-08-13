export function daysUntilCipaMeeting(date: string, referenceDate = new Date()) {
  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);
  const meetingDate = new Date(`${date}T00:00:00`);
  meetingDate.setHours(0, 0, 0, 0);
  return Math.round((meetingDate.getTime() - today.getTime()) / 86_400_000);
}

export function isCipaMeetingUrgent(date: string, referenceDate = new Date()) {
  const days = daysUntilCipaMeeting(date, referenceDate);
  return days >= 0 && days <= 3;
}

export function cipaMeetingUrgencyLabel(date: string, referenceDate = new Date()) {
  const days = daysUntilCipaMeeting(date, referenceDate);
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  if (days >= 2 && days <= 3) return `Em ${days} dias`;
  return "Agendada";
}
