import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Percent, Bell, RefreshCw, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PlatformSettings {
  name: string;
  support_email: string;
  contact_phone: string;
  maintenance_mode: boolean;
  allow_registrations: boolean;
}

interface PricingSettings {
  platform_commission_percent: number;
  prayog_commission_percent: number;
  gst_percent: number;
}

interface OperationsSettings {
  max_delivery_radius_km: number;
  real_time_tracking: boolean;
  auto_assign_orders: boolean;
}

const SystemSettings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [platform, setPlatform] = useState<PlatformSettings>({
    name: "ViaSetu", support_email: "support@viasetu.com", contact_phone: "",
    maintenance_mode: false, allow_registrations: true,
  });
  const [pricing, setPricing] = useState<PricingSettings>({
    platform_commission_percent: 10, prayog_commission_percent: 5, gst_percent: 18,
  });
  const [operations, setOperations] = useState<OperationsSettings>({
    max_delivery_radius_km: 5000, real_time_tracking: true, auto_assign_orders: true,
  });
  const { toast } = useToast();

  useEffect(() => { fetchSettings(); }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("system_settings").select("*");
      if (error) throw error;

      (data || []).forEach((row: any) => {
        if (row.key === "platform") setPlatform(row.value as PlatformSettings);
        if (row.key === "pricing") setPricing(row.value as PricingSettings);
        if (row.key === "operations") setOperations(row.value as OperationsSettings);
      });
    } catch (error: any) {
      toast({ title: "Error loading settings", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: any) => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("system_settings")
        .update({ value, updated_by: session?.user?.id })
        .eq("key", key);
      if (error) throw error;
      toast({ title: "Settings saved successfully" });
    } catch (error: any) {
      toast({ title: "Error saving settings", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System & App Settings</h2>
          <p className="text-muted-foreground">Configure platform settings, pricing, and operational parameters</p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />Refresh
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="pricing">Pricing & Commission</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5" />Platform Configuration</CardTitle>
                <CardDescription>Basic platform settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Platform Name</Label>
                  <Input value={platform.name} onChange={(e) => setPlatform({ ...platform, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Support Email</Label>
                  <Input value={platform.support_email} onChange={(e) => setPlatform({ ...platform, support_email: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input value={platform.contact_phone} onChange={(e) => setPlatform({ ...platform, contact_phone: e.target.value })} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={platform.maintenance_mode} onCheckedChange={(v) => setPlatform({ ...platform, maintenance_mode: v })} />
                  <Label>Maintenance Mode</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={platform.allow_registrations} onCheckedChange={(v) => setPlatform({ ...platform, allow_registrations: v })} />
                  <Label>Allow New Registrations</Label>
                </div>
                <Button onClick={() => saveSetting("platform", platform)} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Changes
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operational Settings</CardTitle>
                <CardDescription>Configure delivery parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Maximum Delivery Radius (km)</Label>
                  <Input type="number" value={operations.max_delivery_radius_km}
                    onChange={(e) => setOperations({ ...operations, max_delivery_radius_km: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={operations.real_time_tracking} onCheckedChange={(v) => setOperations({ ...operations, real_time_tracking: v })} />
                  <Label>Real-time Tracking</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch checked={operations.auto_assign_orders} onCheckedChange={(v) => setOperations({ ...operations, auto_assign_orders: v })} />
                  <Label>Auto-assign Orders</Label>
                </div>
                <Button onClick={() => saveSetting("operations", operations)} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pricing">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" />Pricing & Commission Structure</CardTitle>
              <CardDescription>Configure commission rates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Platform Commission (%)</Label>
                  <Input type="number" value={pricing.platform_commission_percent}
                    onChange={(e) => setPricing({ ...pricing, platform_commission_percent: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>Prayog Commission (%)</Label>
                  <Input type="number" value={pricing.prayog_commission_percent}
                    onChange={(e) => setPricing({ ...pricing, prayog_commission_percent: parseInt(e.target.value) || 0 })} />
                </div>
                <div className="space-y-2">
                  <Label>GST (%)</Label>
                  <Input type="number" value={pricing.gst_percent}
                    onChange={(e) => setPricing({ ...pricing, gst_percent: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <Button onClick={() => saveSetting("pricing", pricing)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Update Pricing
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Notification Settings</CardTitle>
              <CardDescription>Notification templates are managed through the Prayog dashboard</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Notification templates and triggers are configured in the Prayog platform.</p>
                <p className="text-sm mt-2">Contact your Prayog account manager to modify notification settings.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
