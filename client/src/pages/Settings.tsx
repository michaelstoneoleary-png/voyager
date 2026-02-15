import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SettingsForm, SettingsFormData } from "@/components/SettingsForm";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/lib/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user, logout } = useAuth();
  const { settings } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [formData, setFormData] = useState<SettingsFormData>({
    displayName: "",
    homeLocation: "",
    passportCountry: "",
    temperatureUnit: "F",
    currency: "USD",
    distanceUnit: "mi",
    dateFormat: "MM/DD/YYYY",
    travelStyles: [],
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        displayName: settings.displayName || "",
        homeLocation: settings.homeLocation || "",
        passportCountry: settings.passportCountry || "",
        temperatureUnit: settings.temperatureUnit || "F",
        currency: settings.currency || "USD",
        distanceUnit: settings.distanceUnit || "mi",
        dateFormat: settings.dateFormat || "MM/DD/YYYY",
        travelStyles: settings.travelStyles || [],
      });
    }
  }, [settings]);

  const handleChange = (data: SettingsFormData) => {
    setFormData(data);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/user-settings", {
        ...formData,
        onboardingCompleted: true,
      });
      await queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      setHasChanges(false);
      toast({
        title: "Settings saved",
        description: "Your preferences have been updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
        <div>
          <h1 className="font-serif text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Profile</CardTitle>
            <CardDescription>Your account information from Replit</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              {user?.profileImageUrl ? (
                <img
                  src={user.profileImageUrl}
                  alt="Profile"
                  className="h-16 w-16 rounded-full object-cover"
                  data-testid="img-settings-avatar"
                />
              ) : (
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center font-serif font-bold text-xl text-muted-foreground" data-testid="text-settings-avatar">
                  {(user?.firstName || "U")[0]}
                </div>
              )}
              <div>
                <p className="font-medium text-lg" data-testid="text-settings-name">
                  {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Traveler"}
                </p>
                <p className="text-sm text-muted-foreground" data-testid="text-settings-email">
                  {user?.email || "No email"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Preferences</CardTitle>
            <CardDescription>Customize your Voyager experience</CardDescription>
          </CardHeader>
          <CardContent>
            <SettingsForm data={formData} onChange={handleChange} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => logout()}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            data-testid="button-settings-logout"
          >
            <LogOut className="mr-2 h-4 w-4" /> Log Out
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            data-testid="button-save-settings"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" /> Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
