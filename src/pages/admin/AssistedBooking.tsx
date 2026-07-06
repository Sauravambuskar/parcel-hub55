import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserSearch, ArrowRight } from "lucide-react";

const AssistedBooking = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const digits = phone.replace(/\D/g, "").slice(-10);
    if (digits.length !== 10) {
      toast({ title: "Invalid phone", description: "Enter a 10-digit mobile number.", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "Name required", description: "Enter the customer's name.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-lookup-customer", {
        body: { phone: digits, name: name.trim() },
      });
      if (error || !data?.user_id) {
        throw new Error(error?.message || data?.error || "Lookup failed");
      }
      toast({
        title: data.isNew ? "New customer created" : "Customer found",
        description: `${data.name || name} · +91 ${digits}`,
      });
      // Hand off to the standard booking flow with an admin-assisted context.
      // Booking.tsx reads location.state.assistedContext to override userId,
      // prefill sender, and swap the payment CTA for "Send payment link".
      navigate("/booking", {
        state: {
          assistedContext: {
            userId: data.user_id,
            name: data.name || name.trim(),
            phone: digits,
          },
        },
      });
    } catch (e: any) {
      toast({ title: "Lookup failed", description: e?.message || "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Assisted Booking</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Book a courier on behalf of a customer. Payment link is sent to the customer's phone via SMS.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserSearch className="h-5 w-5 text-primary" />
            Find or create customer
          </CardTitle>
          <CardDescription>
            Existing customers keep their history. New numbers are created as fresh accounts automatically.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="assisted-name">Customer name</Label>
            <Input
              id="assisted-name"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assisted-phone">Customer phone (10 digits)</Label>
            <div className="flex gap-2 items-center">
              <span className="px-3 h-10 flex items-center rounded-md border border-input bg-muted text-sm">
                +91
              </span>
              <Input
                id="assisted-phone"
                inputMode="numeric"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={loading}
              />
            </div>
          </div>

          <Button className="w-full" onClick={handleContinue} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Looking up...
              </>
            ) : (
              <>
                Continue to booking <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground pt-2">
            You'll go through the standard 6-step flow. At the end, a Razorpay payment link is sent to the
            customer's phone via SMS. The booking is confirmed once they pay.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssistedBooking;
