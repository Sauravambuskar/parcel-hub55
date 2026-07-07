import { supabase } from "@/integrations/supabase/client";
import { getAuthSession } from "@/lib/auth";

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

function prayogAuthHeader(): string | null {
  const s = getAuthSession();
  if (!s?.user_id) return null;
  return JSON.stringify({ user_id: s.user_id });
}

export async function trackStep(userId: string | null, step: number) {
  if (!userId || !UUID_RE.test(userId)) return;
  const sessionId = getOrCreateSessionId();
  const header = prayogAuthHeader();
  if (!header) return;
  try {
    await supabase.functions.invoke("track-booking-progress", {
      body: {
        action: "track",
        session_id: sessionId,
        step,
        step_name: STEP_NAMES[step] || `Step ${step}`,
      },
      headers: { "x-prayog-auth": header },
    });
  } catch (e) {
    console.warn("trackStep failed", e);
  }
}

export async function markCompleted(userId: string | null, bookingId: string | null) {
  if (!userId || !UUID_RE.test(userId)) return;
  const sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) return;
  const header = prayogAuthHeader();
  if (header) {
    try {
      await supabase.functions.invoke("track-booking-progress", {
        body: {
          action: "complete",
          session_id: sessionId,
          booking_id: bookingId,
        },
        headers: { "x-prayog-auth": header },
      });
    } catch (e) {
      console.warn("markCompleted failed", e);
    }
  }
  // Start a fresh session for the next booking
  resetSessionId();
}
