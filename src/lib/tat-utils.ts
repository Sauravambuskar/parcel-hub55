/**
 * Normalize TAT (Turnaround Time) days from API response.
 * When API returns 0, apply default values based on service type:
 * - Surface: 2 days
 * - Air: 1 day
 */
export function normalizeTatDays(tatDays: number | undefined | null, serviceName?: string): number {
  // If TAT is valid (greater than 0), return it as-is
  if (tatDays && tatDays > 0) {
    return tatDays;
  }

  // Determine if it's an Air service based on service name
  const isAirService = serviceName 
    ? /\b(air|express|priority|fast)\b/i.test(serviceName)
    : false;

  // Return 1 day for Air, 2 days for Surface
  return isAirService ? 1 : 2;
}

/**
 * Format TAT days for display with range (e.g., "2-3 days")
 */
export function formatTatRange(tatDays: number | undefined | null, serviceName?: string): string {
  const normalizedDays = normalizeTatDays(tatDays, serviceName);
  return `${normalizedDays}-${normalizedDays + 1} days`;
}
