import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { STEP_NAMES } from "@/lib/booking-progress";

type Row = {
  user_id: string;
  session_id: string;
  last_step: number;
  last_step_name: string;
  completed: boolean;
  updated_at: string;
  started_at: string;
};

const RANGES = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
  { label: "All time", days: 0 },
];

const AbandonmentFunnel = () => {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    (async () => {
      setLoading(true);
      let q = supabase
        .from("booking_progress" as any)
        .select("user_id, session_id, last_step, last_step_name, completed, updated_at, started_at")
        .order("updated_at", { ascending: false })
        .limit(1000);
      if (days > 0) {
        const since = new Date(Date.now() - days * 86400000).toISOString();
        q = q.gte("updated_at", since);
      }
      const { data } = await q;
      setRows((data as any[]) || []);
      setLoading(false);
    })();
  }, [days]);

  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.completed).length;
    const abandoned = total - completed;
    const completionRate = total ? Math.round((completed / total) * 100) : 0;

    const byStep: { step: number; name: string; completed: number; abandoned: number }[] = [];
    for (let s = 1; s <= 6; s++) {
      const stepRows = rows.filter((r) => r.last_step === s);
      byStep.push({
        step: s,
        name: STEP_NAMES[s] || `Step ${s}`,
        completed: stepRows.filter((r) => r.completed).length,
        abandoned: stepRows.filter((r) => !r.completed).length,
      });
    }
    const topDrop = byStep.reduce((a, b) => (b.abandoned > a.abandoned ? b : a), byStep[0]);
    const max = Math.max(1, ...byStep.map((s) => s.completed + s.abandoned));
    return { total, completed, abandoned, completionRate, byStep, topDrop, max };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Booking Abandonment Funnel</h2>
        <p className="text-muted-foreground">Where users drop off in the 6-step booking flow</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <Button
            key={r.days}
            size="sm"
            variant={days === r.days ? "default" : "outline"}
            onClick={() => setDays(r.days)}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Sessions</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.total}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completed</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-green-600">{stats.completed}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Abandoned</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-destructive">{stats.abandoned}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Completion Rate</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{stats.completionRate}%</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drop-off by Step</CardTitle>
          {stats.topDrop && stats.topDrop.abandoned > 0 && (
            <p className="text-sm text-muted-foreground">
              Biggest drop-off: <span className="font-semibold text-destructive">Step {stats.topDrop.step} — {stats.topDrop.name}</span> ({stats.topDrop.abandoned} users)
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-3">
              {stats.byStep.map((s) => {
                const totalForStep = s.completed + s.abandoned;
                const pct = (totalForStep / stats.max) * 100;
                const completedPct = totalForStep ? (s.completed / totalForStep) * 100 : 0;
                return (
                  <div key={s.step} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Step {s.step}: {s.name}</span>
                      <span className="text-muted-foreground">
                        <span className="text-green-600 font-semibold">{s.completed}</span> completed ·{" "}
                        <span className="text-destructive font-semibold">{s.abandoned}</span> abandoned
                      </span>
                    </div>
                    <div className="h-6 w-full bg-muted rounded overflow-hidden" style={{ width: `${pct}%`, minWidth: "8px" }}>
                      <div className="h-full flex">
                        <div className="bg-green-500 h-full" style={{ width: `${completedPct}%` }} />
                        <div className="bg-destructive h-full" style={{ width: `${100 - completedPct}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AbandonmentFunnel;
