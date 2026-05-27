export type TotalPart = { qty: number; unitPrice: number };
export type TotalService =
  | { costType: 'hourly'; hours: number; rate: number }
  | { costType: 'fixed'; fixedAmount: number };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function computeOrderTotals(parts: TotalPart[], services: TotalService[]) {
  const partsTotal = parts.reduce((sum, p) => sum + p.qty * p.unitPrice, 0);
  const servicesTotal = services.reduce(
    (sum, s) => sum + (s.costType === 'hourly' ? s.hours * s.rate : s.fixedAmount),
    0,
  );
  const parts2 = round2(partsTotal);
  const services2 = round2(servicesTotal);
  return { parts: parts2, services: services2, grand: round2(parts2 + services2) };
}
