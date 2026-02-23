import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Bookmark, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  flat_no: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

interface SavedAddressPickerProps {
  onSelect: (address: {
    name: string;
    phone: string;
    flatNo: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
  }) => void;
  type: 'sender' | 'receiver';
}

const getPrayogAuth = () => {
  try {
    const auth = localStorage.getItem('prayog_auth');
    if (auth) return JSON.parse(auth);
  } catch {}
  return null;
};

const SavedAddressPicker = ({ onSelect, type }: SavedAddressPickerProps) => {
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const fetchAddresses = async () => {
    const auth = getPrayogAuth();
    if (!auth?.user_id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('saved-addresses', {
        method: 'GET',
        headers: {
          'x-prayog-auth': JSON.stringify(auth),
        },
      });
      if (error) throw error;
      setAddresses(data?.addresses || []);
    } catch (err) {
      console.error('Failed to fetch saved addresses:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAddress = async (addressId: string) => {
    const auth = getPrayogAuth();
    if (!auth?.user_id) return;
    try {
      await supabase.functions.invoke('saved-addresses', {
        body: { address_id: addressId },
        method: 'DELETE' as any,
        headers: {
          'x-prayog-auth': JSON.stringify(auth),
        },
      });
      setAddresses(prev => prev.filter(a => a.id !== addressId));
      toast({ title: "Address deleted" });
    } catch {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (open) fetchAddresses();
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button" className="gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          Saved Addresses
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Saved Addresses</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : addresses.length === 0 ? (
          <p className="text-center text-muted-foreground py-6 text-sm">
            No saved addresses yet. Save one from the booking form.
          </p>
        ) : (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors group"
                onClick={() => {
                  onSelect({
                    name: addr.name,
                    phone: addr.phone,
                    flatNo: addr.flat_no || '',
                    address: addr.address,
                    city: addr.city,
                    state: addr.state,
                    pincode: addr.pincode,
                  });
                  setOpen(false);
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium text-primary">{addr.label}</p>
                    <p className="text-sm font-medium">{addr.name}</p>
                    <p className="text-xs text-muted-foreground">{addr.phone}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {addr.flat_no ? `${addr.flat_no}, ` : ''}{addr.address}, {addr.city}, {addr.state} - {addr.pincode}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAddress(addr.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export const useSaveAddress = () => {
  const { toast } = useToast();

  const saveAddress = async (data: {
    name: string;
    phone: string;
    flatNo: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    label?: string;
  }) => {
    const auth = getPrayogAuth();
    if (!auth?.user_id) return;

    try {
      await supabase.functions.invoke('saved-addresses', {
        body: {
          label: data.label || 'Home',
          name: data.name,
          phone: data.phone,
          flat_no: data.flatNo,
          address: data.address,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
        },
        headers: {
          'x-prayog-auth': JSON.stringify(auth),
        },
      });
      toast({ title: "Address saved!" });
    } catch {
      toast({ title: "Failed to save address", variant: "destructive" });
    }
  };

  return { saveAddress };
};

export default SavedAddressPicker;
