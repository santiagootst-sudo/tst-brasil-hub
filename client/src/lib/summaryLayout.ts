export type SummaryWidgetId = "alerts" | "hero" | "priorities" | "cipa";

export const defaultSummaryOrder: SummaryWidgetId[] = ["alerts", "hero", "priorities", "cipa"];

const isSummaryWidgetId = (value: unknown): value is SummaryWidgetId =>
  typeof value === "string" && defaultSummaryOrder.includes(value as SummaryWidgetId);

export function normalizeSummaryLayout(value: unknown) {
  const parsed = value && typeof value === "object" ? value as { order?: unknown; hidden?: unknown } : {};
  const order = Array.isArray(parsed.order) ? parsed.order.filter(isSummaryWidgetId) : [];
  const uniqueOrder = Array.from(new Set(order));
  const normalizedOrder = defaultSummaryOrder.filter(id => !uniqueOrder.includes(id)).reduce<SummaryWidgetId[]>((result, id) => [...result, id], uniqueOrder);
  const hidden = Array.isArray(parsed.hidden) ? Array.from(new Set(parsed.hidden.filter(isSummaryWidgetId))) : [];
  return { order: normalizedOrder, hidden };
}

export function moveSummaryWidget(order: SummaryWidgetId[], id: SummaryWidgetId, direction: "up" | "down") {
  const index = order.indexOf(id);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= order.length) return order;
  const next = [...order];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  return next;
}

export function toggleSummaryWidget(hidden: SummaryWidgetId[], id: SummaryWidgetId) {
  return hidden.includes(id) ? hidden.filter(item => item !== id) : [...hidden, id];
}
