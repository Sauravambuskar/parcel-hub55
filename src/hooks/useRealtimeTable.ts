import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Subscribe to realtime changes on one or more Supabase tables and invoke
 * `onChange` (debounced) whenever any change is received. Used by admin
 * pages to keep data in sync without altering existing fetch logic.
 */
export function useRealtimeTable(
  tables: string | string[],
  onChange: () => void,
  options: { channelName?: string; enabled?: boolean; debounceMs?: number } = {}
) {
  const { channelName, enabled = true, debounceMs = 400 } = options;
  const cbRef = useRef(onChange);
  cbRef.current = onChange;

  useEffect(() => {
    if (!enabled) return;
    const list = Array.isArray(tables) ? tables : [tables];
    if (list.length === 0) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const fire = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => cbRef.current(), debounceMs);
    };

    const name = channelName || `rt-${list.join("-")}-${Math.random().toString(36).slice(2, 8)}`;
    let channel = supabase.channel(name);
    for (const t of list) {
      channel = channel.on(
        "postgres_changes" as never,
        { event: "*", schema: "public", table: t } as never,
        fire as never
      );
    }
    channel.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Array.isArray(tables) ? tables.join("|") : tables, enabled, channelName, debounceMs]);
}
