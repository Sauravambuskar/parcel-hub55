import { AlertTriangle } from "lucide-react";

const CancellationPolicyNotice = ({ compact = false }: { compact?: boolean }) => (
  <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex gap-2">
    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
    <p className={`text-amber-900 ${compact ? "text-xs" : "text-sm"}`}>
      <strong>Cancellation policy:</strong> In most cases orders cannot be cancelled once
      placed and handed to the courier. You can request a cancellation — if the courier has
      already accepted the shipment, our team will reach out to help resolve it.
    </p>
  </div>
);

export default CancellationPolicyNotice;
