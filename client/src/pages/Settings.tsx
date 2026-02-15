import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { SettingsForm, SettingsFormData } from "@/components/SettingsForm";
import { useAuth } from "@/hooks/use-auth";
import { useUser } from "@/lib/UserContext";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, LogOut, Instagram, Globe, Youtube, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.87a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.3z"/>
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

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
    gender: "",
    phoneNumber: "",
    temperatureUnit: "F",
    currency: "USD",
    distanceUnit: "mi",
    dateFormat: "MM/DD/YYYY",
    travelStyles: [],
  });

  const [socialData, setSocialData] = useState({
    socialInstagram: "",
    socialBlogUrl: "",
    socialYoutube: "",
    socialTiktok: "",
    socialTwitter: "",
    publishBlog: false,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        displayName: settings.displayName || "",
        homeLocation: settings.homeLocation || "",
        passportCountry: settings.passportCountry || "",
        gender: settings.gender || "",
        phoneNumber: settings.phoneNumber || "",
        temperatureUnit: settings.temperatureUnit || "F",
        currency: settings.currency || "USD",
        distanceUnit: settings.distanceUnit || "mi",
        dateFormat: settings.dateFormat || "MM/DD/YYYY",
        travelStyles: settings.travelStyles || [],
      });
      setSocialData({
        socialInstagram: settings.socialInstagram || "",
        socialBlogUrl: settings.socialBlogUrl || "",
        socialYoutube: settings.socialYoutube || "",
        socialTiktok: settings.socialTiktok || "",
        socialTwitter: settings.socialTwitter || "",
        publishBlog: settings.publishBlog || false,
      });
    }
  }, [settings]);

  const handleChange = (data: SettingsFormData) => {
    setFormData(data);
    setHasChanges(true);
  };

  const handleSocialChange = (field: string, value: string | boolean) => {
    setSocialData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/user-settings", {
        ...formData,
        ...socialData,
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

        <Card>
          <CardHeader>
            <CardTitle className="font-serif text-xl">Connected Accounts</CardTitle>
            <CardDescription>Link your social media and travel profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="socialInstagram" className="flex items-center gap-2 text-sm font-medium">
                <Instagram className="h-4 w-4 text-pink-500" /> Instagram
              </Label>
              <Input
                id="socialInstagram"
                value={socialData.socialInstagram}
                onChange={(e) => handleSocialChange("socialInstagram", e.target.value)}
                placeholder="@yourusername"
                data-testid="input-social-instagram"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialTwitter" className="flex items-center gap-2 text-sm font-medium">
                <XIcon className="h-4 w-4" /> X (Twitter)
              </Label>
              <Input
                id="socialTwitter"
                value={socialData.socialTwitter}
                onChange={(e) => handleSocialChange("socialTwitter", e.target.value)}
                placeholder="@yourusername"
                data-testid="input-social-twitter"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialYoutube" className="flex items-center gap-2 text-sm font-medium">
                <Youtube className="h-4 w-4 text-red-500" /> YouTube
              </Label>
              <Input
                id="socialYoutube"
                value={socialData.socialYoutube}
                onChange={(e) => handleSocialChange("socialYoutube", e.target.value)}
                placeholder="Channel URL or @handle"
                data-testid="input-social-youtube"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialTiktok" className="flex items-center gap-2 text-sm font-medium">
                <TikTokIcon className="h-4 w-4" /> TikTok
              </Label>
              <Input
                id="socialTiktok"
                value={socialData.socialTiktok}
                onChange={(e) => handleSocialChange("socialTiktok", e.target.value)}
                placeholder="@yourusername"
                data-testid="input-social-tiktok"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="socialBlogUrl" className="flex items-center gap-2 text-sm font-medium">
                <Globe className="h-4 w-4 text-blue-500" /> Blog / Website
              </Label>
              <Input
                id="socialBlogUrl"
                value={socialData.socialBlogUrl}
                onChange={(e) => handleSocialChange("socialBlogUrl", e.target.value)}
                placeholder="https://yourblog.com"
                data-testid="input-social-blog"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">Publish Your Travel Blog</p>
                    <Badge variant="secondary" className="text-xs font-normal">Coming Soon</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Share your journeys as a beautiful public travel blog
                  </p>
                </div>
              </div>
              <Switch
                checked={socialData.publishBlog}
                onCheckedChange={(checked) => handleSocialChange("publishBlog", checked)}
                data-testid="switch-publish-blog"
              />
            </div>
            {socialData.publishBlog && (
              <div className="mt-4 rounded-md bg-muted/50 p-3">
                <p className="text-sm text-muted-foreground">
                  We're working on this feature. When it launches, your completed journeys and travel stories will be published as a personalized travel blog. We'll notify you when it's ready.
                </p>
              </div>
            )}
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
