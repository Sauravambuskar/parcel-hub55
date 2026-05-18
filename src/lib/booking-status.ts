// Canonical booking status buckets used by admin dashboard + dispute UI.
// Partner APIs return many raw values (CREATED, MANIFESTED, IN_TRANSIT, etc.);
// this maps any case/format into a single bucket.

export type StatusBucket =
  | "created"
  | "confirmed"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "rto"
  | "other";

export const STATUS_BUCKETS: { key: StatusBucket; label: string; color: string }[] = [
  { key: "created", label: "Created", color: "bg-slate-100 text-slate-700" },
  { key: "confirmed", label: "Confirmed / Manifested", color: "bg-blue-50 text-blue-700" },
  { key: "picked_up", label: "Picked Up", color: "bg-indigo-50 text-indigo-700" },
  { key: "in_transit", label: "In Transit", color: "bg-cyan-50 text-cyan-700" },
  { key: "out_for_delivery", label: "Out for Delivery", color: "bg-amber-50 text-amber-700" },
  { key: "delivered", label: "Delivered", color: "bg-green-50 text-green-700" },
  { key: "cancelled", label: "Cancelled", color: "bg-red-50 text-red-700" },
  { key: "rto", label: "RTO / Returned", color: "bg-orange-50 text-orange-700" },
  { key: "other", label: "Other", color: "bg-muted text-muted-foreground" },
];

export function bucketOfStatus(status: string | null | undefined): StatusBucket {
  if (!status) return "created";
  const s = String(status).toLowerCase().replace(/[\s-]+/g, "_");
  if (s.includes("deliver") && !s.includes("out_for")) return "delivered";
  if (s.includes("out_for_delivery") || s.includes("ofd")) return "out_for_delivery";
  if (s.includes("rto") || s.includes("return")) return "rto";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("in_transit") || s === "intransit" || s.includes("transit") || s.includes("reached_hub")) return "in_transit";
  if (s.includes("picked") || s.includes("pickup_done")) return "picked_up";
  if (
    s.includes("manifest") ||
    s.includes("confirmed") ||
    s.includes("ready_for_dispatch") ||
    s === "booked" ||
    s === "assigned" ||
    s === "order_confirmed"
  ) return "confirmed";
  if (s === "created" || s === "pending" || s === "new" || s === "order_received" || s === "") return "created";
  return "other";
}

export function bucketCounts(rows: { status: string | null }[]): Record<StatusBucket, number> {
  const acc: Record<StatusBucket, number> = {
    created: 0, confirmed: 0, picked_up: 0, in_transit: 0,
    out_for_delivery: 0, delivered: 0, cancelled: 0, rto: 0, other: 0,
  };
  for (const r of rows) acc[bucketOfStatus(r.status)]++;
  return acc;
}
