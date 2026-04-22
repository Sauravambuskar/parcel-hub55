import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, RefreshCw, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PARTNER_FUNCTIONS: Record<string, string> = {
  shadowfax: "shadowfax-tracking",
  delhivery: "delhivery-tracking",
};

const RealTimeTracking = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingId, setTrackingId] = useState(searchParams.get("id") || "");
  const [partner, setPartner] = useState<string>(searchParams.get("partner") || "shadowfax");
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchTracking = async (awb: string, partnerCode: string) => {
    if (!awb.trim()) return;
    const fn = PARTNER_FUNCTIONS[partnerCode];
    if (!fn) {
      toast({ title: "Unsupported partner", variant: "destructive" });
      return;
    }
    setLoading(true);
    setTrackingData(null);
    try {
      const { data, error } = await supabase.functions.invoke(fn, {
        body: { awb, waybill: awb, tracking_id: awb },
      });
      if (error) throw error;
      setTrackingData(data);
      setLastUpdate(new Date());
    } catch (error: any) {
      toast({ title: "Tracking Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const id = searchParams.get("id");
    const p = searchParams.get("partner");
    if (id) {
      setTrackingId(id);
      if (p) setPartner(p);
      fetchTracking(id, p || partner);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleSearch = () => {
    if (trackingId.trim()) {
      setSearchParams({ id: trackingId, partner });
      fetchTracking(trackingId.trim(), partner);
    }
  };

  const handleRefresh = () => {
    if (trackingId) fetchTracking(trackingId, partner);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Real-Time Package Tracking</h2>
        <p className="text-muted-foreground">Track packages directly via partner APIs (Shadowfax, Delhivery)</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Search className="h-5 w-5" />Track Package</CardTitle>
          <CardDescription>Select courier partner and enter AWB number</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={partner} onValueChange={setPartner}>
              <SelectTrigger className="sm:w-48">
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shadowfax">Shadowfax</SelectItem>
                <SelectItem value="delhivery">Delhivery</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder="Enter AWB number..."
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Search className="h-4 w-4 mr-2" />}
              Track
            </Button>
          </div>
        </CardContent>
      </Card>

      {loading && !trackingData && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {trackingData && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><Navigation className="h-5 w-5" />Tracking Response</CardTitle>
            <div className="flex items-center gap-3">
              {lastUpdate && (
                <Badge variant="outline" className="text-xs">
                  Fetched: {lastUpdate.toLocaleTimeString()}
                </Badge>
              )}
              <Button variant="outline" size="sm" onClick={handleRefresh} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto max-h-[600px]">
              {JSON.stringify(trackingData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default RealTimeTracking;
