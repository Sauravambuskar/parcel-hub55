import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  userId: string;
  onCompleted: () => void;
}

const FREQ_OPTIONS = ["1-5", "5-10", "10+"] as const;
const COURIER_OPTIONS = ["Documents", "Box Items"] as const;

const OnboardingSurveyDialog = ({ open, userId, onCompleted }: Props) => {
  const { toast } = useToast();
  const [source, setSource] = useState("");
  const [frequency, setFrequency] = useState<string>("");
  const [courierType, setCourierType] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = source.trim();
    if (!trimmed) {
      toast({ title: "Please tell us where you heard about us", variant: "destructive" });
      return;
    }
    if (trimmed.length > 200) {
      toast({ title: "Please keep your answer under 200 characters", variant: "destructive" });
      return;
    }
    if (!frequency) {
      toast({ title: "Please select how often you send parcels", variant: "destructive" });
      return;
    }
    if (!courierType) {
      toast({ title: "Please select the type of courier", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("update-profile", {
        body: {
          user_id: userId,
          survey_source: trimmed,
          survey_frequency: frequency,
          survey_courier_type: courierType,
        },
      });
      if (error) throw error;
      toast({ title: "Thanks for sharing!", description: "Your responses have been saved." });
      onCompleted();
    } catch (e: any) {
      console.error(e);
      toast({ title: "Failed to save", description: e?.message || "Please try again", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => { /* mandatory — cannot dismiss */ }}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Help us get to know you</DialogTitle>
          <DialogDescription>
            Three quick questions so we can serve you better.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="survey-source">Where did you hear about us?</Label>
            <Input
              id="survey-source"
              placeholder="e.g. Google, friend, Instagram..."
              value={source}
              onChange={(e) => setSource(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>How often do you send parcels in a month?</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger><SelectValue placeholder="Select frequency" /></SelectTrigger>
              <SelectContent>
                {FREQ_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>What type of courier do you send?</Label>
            <Select value={courierType} onValueChange={setCourierType}>
              <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {COURIER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full" onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingSurveyDialog;
