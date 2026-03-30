export const VALID_SERVICE_TYPES = [
  "bookkeeping",
  "vat",
  "withholding_tax",
  "payroll",
  "social_security",
  "closing",
  "audit",
  "internal_audit",
  "registration",
];

export const VALID_STATUSES = ["active", "paused", "cancelled"];

export interface ServiceEntry {
  serviceType: string;
  active: boolean;
  monthlyFee: number;
}

export function sanitizeServices(raw: unknown): ServiceEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (s: any) => s.serviceType && VALID_SERVICE_TYPES.includes(s.serviceType)
    )
    .map((s: any) => ({
      serviceType: s.serviceType,
      active: s.active !== false,
      monthlyFee: Number(s.monthlyFee) || 0,
    }));
}

export function computeTotalMonthlyFee(services: ServiceEntry[]): number {
  return services
    .filter((s) => s.active)
    .reduce((sum, s) => sum + (s.monthlyFee || 0), 0);
}
