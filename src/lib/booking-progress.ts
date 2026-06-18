import { supabase } from "@/integrations/supabase/client";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const STEP_NAMES: Record<number, string> = {
  1: "Pincode & Package",
  2: "Goods Details",
  3: "Courier Selection",
  4: "Pickup Date",
  5: "Address Details",
  6: "Review & Pay",
};

const SESSION_KEY = "booking_progress_session_id";

export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  const id = crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export async function trackStep(userId: string | null, step: number) {
  if (!userId || !UUID_RE.test(userId)) return;
  const sessionId = getOrCreateSessionId();
  try {
    await supabase.from("booking_progress" as any).upsert(
      {
        user_id: userId,
        session_id: sessionId,
        last_step: step,
        last_step_name: STEP_NAMES[step] || `Step ${step}`,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,session_id" }
    );
  } catch (e) {
    console.warn("trackStep failed", e);
  }
}

export async function markCompleted(userId: string | null, bookingId: string | null) {
  if (!userId || !UUID_RE.test(userId)) return;
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return;
  try {
    await supabase
      .from("booking_progress" as any)
      .update({
        completed: true,
        booking_id: bookingId,
        last_step: 6,
        last_step_name: "Completed",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("session_id", sessionId);
  } catch (e) {
    console.warn("markCompleted failed", e);
  }
  // Start a fresh session for the next booking
  resetSessionId();
}
