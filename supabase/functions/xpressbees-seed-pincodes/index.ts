// One-shot seeder for the xpressbees_pincodes table.
// Reads the bundled CSV (pincode,city,state,is_cod,is_prepaid,is_pickup) and
// upserts in 1,000-row batches via the service role.
//
// Invoke once, then this function can be deleted. Idempotent (truncates first).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Row {
  pincode: string;
  city: string;
  state: string;
  is_cod: boolean;
  is_prepaid: boolean;
  is_pickup: boolean;
}

function parseCsv(text: string): Row[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  // header: Pincode,City,State,COD Delivery,Prepaid Delivery,Pickup
  const out: Row[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    // CSV with possible quoted fields
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 6) continue;
    const pincode = cells[0].trim();
    if (!pincode || seen.has(pincode)) continue;
    seen.add(pincode);
    out.push({
      pincode,
      city: cells[1].trim(),
      state: cells[2].trim(),
      is_cod: cells[3].trim().toUpperCase() === "Y",
      is_prepaid: cells[4].trim().toUpperCase() === "Y",
      is_pickup: cells[5].trim().toUpperCase() === "Y",
    });
  }
  return out;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Read bundled CSV
    const csvUrl = new URL("./pincodes.csv", import.meta.url);
    const csvText = await Deno.readTextFile(csvUrl);
    const rows = parseCsv(csvText);

    // Truncate first
    const { error: delErr } = await supabase
      .from("xpressbees_pincodes")
      .delete()
      .neq("pincode", "__never__");
    if (delErr) throw delErr;

    // Insert in batches of 1,000
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
