// One-shot seeder for the xpressbees_pincodes table.
// Reads the bundled TS data module and upserts in 1,000-row batches via the service role.
// Idempotent (truncates first). Delete this function after a successful run.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PINCODES } from "./pincodes_data.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Truncate first
    const { error: delErr } = await supabase
      .from("xpressbees_pincodes")
      .delete()
      .neq("pincode", "__never__");
    if (delErr) throw delErr;

    const rows = PINCODES.map(([pincode, city, state, is_cod, is_prepaid, is_pickup]) => ({
      pincode,
      city,
      state,
      is_cod,
      is_prepaid,
      is_pickup,
    }));

    const batchSize = 1000;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase
        .from("xpressbees_pincodes")
        .insert(batch);
      if (error) {
        return new Response(
          JSON.stringify({
            error: error.message,
            inserted_so_far: inserted,
            failed_batch_start: i,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      inserted += batch.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        total_rows: rows.length,
        inserted,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: (e as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
