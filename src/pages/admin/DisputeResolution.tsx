import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AlertTriangle, Phone, MessageSquare, RefreshCw, RotateCcw, XCircle, Check } from "lucide-react";

interface Dispute {
  id: string;
  booking_id: string;
  user_id: string;
  reason: string;
  partner_error: string | null;
  partner_status_at_attempt: string | null;
  previous_booking_status: string | null;
  status: string;
  admin_notes: any[];
  resolved_at: string | null;
  created_at: string;
}

interface Booking {
  id: string;
  tracking_id: string | null;
  sender_name: string;
  sender_phone: string;
  receiver_name: string;
  receiver_phone: string;
  sender_city: string;
  receiver_city: string;
  courier_name: string;
  courier_price: number;
  status: string | null;
  booking_source: string;
  prayog_awb: string | null;
  payment_id: string | null;
  created_at: string;
}

const STATUS_OPTIONS = ["open", "in_progress", "resolved_cancelled", "resolved_reinstated", "closed"];

const statusVariant = (s: string): "default" | "secondary" | "destructive" | "outline" => {
  if (s === "open") return "destructive";
  if (s === "in_progress") return "secondary";
  if (s.startsWith("resolved")) return "default";
  return "outline";
};

const DisputeResolution = () => {
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [bookings, setBookings] = useState<Record<string, Booking>>({});
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [note, setNote] = useState("");
  const [acting, setActing] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const { data: disputeRows, error } = await (supabase as any)
        .from("cancellation_disputes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = (disputeRows || []).map((d: Dispute) => d.booking_id);
      let bookingMap: Record<string, Booking> = {};
      if (ids.length) {
        const { data: bk } = await supabase.from("bookings").select("*").in("id", ids);
        bookingMap = Object.fromEntries((bk || []).map((b: any) => [b.id, b]));
      }
      setBookings(bookingMap);
      setDisputes(disputeRows || []);
    } catch (e: any) {
      toast({ title: "Failed to load disputes", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    const ch = (supabase as any)
      .channel("admin-disputes")
      .on("postgres_changes", { event: "*", schema: "public", table: "cancellation_disputes" }, () => fetchAll())
      .subscribe();
    return () => {
      (supabase as any).removeChannel(ch);
    };
  }, []);

  const visible = disputes.filter((d) => {
    if (filterStatus !== "all" && d.status !== filterStatus) return false;
    if (search) {
      const b = bookings[d.booking_id];
      const hay = [b?.tracking_id, b?.sender_phone, b?.receiver_phone, b?.sender_name, b?.receiver_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const counts = {
    open: disputes.filter((d) => d.status === "open").length,
    in_progress: disputes.filter((d) => d.status === "in_progress").length,
    resolved: disputes.filter((d) => d.status.startsWith("resolved")).length,
    closed: disputes.filter((d) => d.status === "closed").length,
  };

  const updateDispute = async (id: string, patch: Record<string, any>) => {
    const { error } = await (supabase as any).from("cancellation_disputes").update(patch).eq("id", id);
    if (error) throw error;
  };

  const addNote = async () => {
    if (!selected || !note.trim()) return;
    setActing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newNotes = [
        ...(selected.admin_notes || []),
        { at: new Date().toISOString(), by: session?.user?.email || "admin", text: note.trim() },
      ];
      await updateDispute(selected.id, {
        admin_notes: newNotes,
        status: selected.status === "open" ? "in_progress" : selected.status,
        assigned_admin: session?.user?.id,
      });
      toast({ title: "Note added" });
      setNote("");
      setSelected({ ...selected, admin_notes: newNotes, status: selected.status === "open" ? "in_progress" : selected.status });
      fetchAll();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const reinstate = async () => {
    if (!selected) return;
    setActing(true);
    try {
      const prev = selected.previous_booking_status || "CREATED";
      const { error: bErr } = await supabase
        .from("bookings")
        .update({ status: prev })
        .eq("id", selected.booking_id);
      if (bErr) throw bErr;
      await updateDispute(selected.id, {
        status: "resolved_reinstated",
        resolved_at: new Date().toISOString(),
      });
      toast({ title: "Order reinstated", description: `Status restored to ${prev}` });
      setSelected(null);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Reinstate failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const markResolvedCancelled = async () => {
    if (!selected) return;
    setActing(true);
    try {
      await supabase.from("bookings").update({ status: "CANCELLED" }).eq("id", selected.booking_id);
      await updateDispute(selected.id, {
        status: "resolved_cancelled",
        resolved_at: new Date().toISOString(),
      });
      toast({ title: "Marked cancelled", description: "Booking status set to CANCELLED" });
      setSelected(null);
      fetchAll();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const closeDispute = async () => {
    if (!selected) return;
    if (!note.trim()) {
      toast({ title: "Add a closing note first", variant: "destructive" });
      return;
    }
    setActing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const newNotes = [
        ...(selected.admin_notes || []),
        { at: new Date().toISOString(), by: session?.user?.email || "admin", text: note.trim() },
      ];
      await updateDispute(selected.id, {
        admin_notes: newNotes,
        status: "closed",
        resolved_at: new Date().toISOString(),
      });
      toast({ title: "Dispute closed" });
      setSelected(null);
      setNote("");
      fetchAll();
    } catch (e: any) {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const selectedBooking = selected ? bookings[selected.booking_id] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dispute Resolution</h2>
          <p className="text-muted-foreground">Cancellation requests that need manual follow-up</p>
        </div>
        <Button variant="outline" onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Open", value: counts.open, color: "text-red-600" },
          { label: "In Progress", value: counts.in_progress, color: "text-amber-600" },
          { label: "Resolved", value: counts.resolved, color: "text-green-600" },
          { label: "Closed", value: counts.closed, color: "text-muted-foreground" },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Disputes</CardTitle>
          <CardDescription>Customer cancellation requests rejected by the courier partner</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-2">
            <Input
              placeholder="Search by tracking ID, phone, or name"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="md:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading…</p>
          ) : visible.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No disputes match.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Courier</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((d) => {
                    const b = bookings[d.booking_id];
                    return (
                      <TableRow key={d.id}>
                        <TableCell className="text-xs">{format(new Date(d.created_at), "dd MMM HH:mm")}</TableCell>
                        <TableCell className="text-xs font-medium">{b?.tracking_id || d.booking_id.slice(0, 8)}</TableCell>
                        <TableCell className="text-sm">
                          {b?.sender_name}
                          <br />
                          <span className="text-xs text-muted-foreground">{b?.sender_phone}</span>
                        </TableCell>
                        <TableCell className="text-sm">{b?.courier_name}</TableCell>
                        <TableCell className="text-sm max-w-xs truncate" title={d.reason}>{d.reason}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(d.status)}>{d.status.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => setSelected(d)}>
                            Open
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Dispute #{selected.id.slice(0, 8)}
                </SheetTitle>
                <SheetDescription>
                  Raised {format(new Date(selected.created_at), "dd MMM yyyy, HH:mm")} · Status{" "}
                  <Badge variant={statusVariant(selected.status)}>{selected.status.replace(/_/g, " ")}</Badge>
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 mt-4">
                {selectedBooking && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Booking</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-1">
                      <p><strong>Tracking:</strong> {selectedBooking.tracking_id || "—"}</p>
                      <p><strong>AWB:</strong> {selectedBooking.prayog_awb || "—"}</p>
                      <p><strong>Courier:</strong> {selectedBooking.courier_name} ({selectedBooking.booking_source})</p>
                      <p><strong>Route:</strong> {selectedBooking.sender_city} → {selectedBooking.receiver_city}</p>
                      <p><strong>Amount:</strong> ₹{selectedBooking.courier_price?.toLocaleString()}</p>
                      <p><strong>Current status:</strong> {selectedBooking.status || "—"}</p>
                      <div className="flex gap-2 pt-2">
                        <Button asChild size="sm" variant="outline">
                          <a href={`tel:${selectedBooking.sender_phone}`}>
                            <Phone className="h-3 w-3 mr-1" /> Call sender
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={`https://wa.me/91${selectedBooking.sender_phone}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageSquare className="h-3 w-3 mr-1" /> WhatsApp
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Reason & Partner Response</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <p><strong>Customer reason:</strong> {selected.reason}</p>
                    <p><strong>Partner status at attempt:</strong> {selected.partner_status_at_attempt || "—"}</p>
                    <p className="font-mono text-xs bg-muted p-2 rounded">
                      {selected.partner_error || "No partner error captured"}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Activity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {(selected.admin_notes || []).length === 0 && (
                      <p className="text-sm text-muted-foreground">No notes yet.</p>
                    )}
                    {(selected.admin_notes || []).map((n: any, i: number) => (
                      <div key={i} className="border rounded p-2 text-sm">
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(n.at), "dd MMM HH:mm")} · {n.by}
                        </p>
                        <p>{n.text}</p>
                      </div>
                    ))}
                    <Textarea
                      placeholder="Add a note (call summary, partner update, etc.)"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                    <Button onClick={addNote} disabled={acting || !note.trim()} size="sm">
                      Add note
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-2">
                  <Button onClick={reinstate} disabled={acting} variant="outline">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reinstate order (restore to {selected.previous_booking_status || "CREATED"})
                  </Button>
                  <Button onClick={markResolvedCancelled} disabled={acting} variant="destructive">
                    <Check className="h-4 w-4 mr-2" />
                    Mark cancelled (resolved with partner)
                  </Button>
                  <Button onClick={closeDispute} disabled={acting} variant="ghost">
                    <XCircle className="h-4 w-4 mr-2" />
                    Close dispute (no change)
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default DisputeResolution;
