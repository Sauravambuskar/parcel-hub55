import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, Phone, Mail, FileText, Save, Edit2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  doc_type: string | null;
  doc_number: string | null;
  kyc_status: string | null;
  status: string | null;
}

const Profile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const prayogAuth = localStorage.getItem('prayog_auth');
      
      if (!prayogAuth) {
        toast({
          title: "Authentication required",
          description: "Please sign in to view your profile",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const authData = JSON.parse(prayogAuth);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authData.user_id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || "",
          email: data.email || "",
        });
      } else {
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: authData.user_id,
            phone: authData.phone,
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating profile:", createError);
        } else {
          setProfile(newProfile);
          setFormData({
            full_name: newProfile.full_name || "",
            email: newProfile.email || "",
          });
        }
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          email: formData.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      setProfile({
        ...profile,
        full_name: formData.full_name,
        email: formData.email,
      });
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getKycStatusColor = (status: string | null) => {
    switch (status?.toLowerCase()) {
      case 'verified':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-background/95 backdrop-blur-sm border-b border-border p-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">My Profile</h1>
          </div>
          {!isEditing ? (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Saving..." : "Save"}
            </Button>
          )}
        </div>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-4">
        {/* Profile Avatar */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {profile?.full_name || "User"}
                </h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {profile?.phone || "No phone"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              {isEditing ? (
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Enter your full name"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.full_name || "Not set"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter your email"
                />
              ) : (
                <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{profile?.email || "Not set"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Phone Number</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.phone || "Not set"}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KYC Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>KYC Information</span>
              <Badge className={getKycStatusColor(profile?.kyc_status)}>
                {profile?.kyc_status || "Not Verified"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="capitalize">{profile?.doc_type || "Not submitted"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Document Number</Label>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{profile?.doc_number ? `****${profile.doc_number.slice(-4)}` : "Not submitted"}</span>
              </div>
            </div>

            {profile?.kyc_status !== 'verified' && (
              <p className="text-sm text-muted-foreground">
                Complete your KYC verification to unlock all features.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle>Account Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Account Status</span>
              <Badge variant={profile?.status === 'active' ? 'default' : 'secondary'}>
                {profile?.status || "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Cancel Edit */}
        {isEditing && (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => {
              setIsEditing(false);
              setFormData({
                full_name: profile?.full_name || "",
                email: profile?.email || "",
              });
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};

export default Profile;
