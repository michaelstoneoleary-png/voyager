import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SettingsForm, SettingsFormData } from "@/components/SettingsForm";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Onboarding() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<SettingsFormData>({
    displayName: user?.firstName || "",
    homeLocation: "",
    passportCountry: "",
    gender: "",
    phoneNumber: "",
    temperatureUnit: "F",
    weightUnit: "lbs",
    currency: "USD",
    distanceUnit: "mi",
    dateFormat: "MM/DD/YYYY",
    travelStyles: [],
    cuisinePreferences: [],
    dietaryRestrictions: [],
    diningPriceRange: "",
  });

  const handleFinish = async () => {
    setSaving(true);
    try {
      await apiRequest("PUT", "/api/user-settings", {
        ...formData,
        onboardingCompleted: true,
      });
      queryClient.setQueryData(["/api/user-settings"], (old: any) => ({
        ...old,
        ...formData,
        onboardingCompleted: true,
      }));
      await queryClient.refetchQueries({ queryKey: ["/api/user-settings"] });
      setLocation("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="font-serif text-4xl font-bold text-primary tracking-tight">bon VOYAGER</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Travel Without Limits</p>
        </div>

        <Card className="border-sidebar-border shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-2xl font-bold">
                  {step === 1 ? "Welcome aboard" : "Your preferences"}
                </h2>
                <span className="text-xs text-muted-foreground">Step {step} of 2</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {step === 1
                  ? "Tell us a bit about yourself so we can personalize your travel experience."
                  : "Set your display preferences and travel style."}
              </p>
            </div>

            <div className="flex gap-2 mb-2">
              <div className={`h-1 flex-1 rounded-full ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
              <div className={`h-1 flex-1 rounded-full ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
            </div>

            <SettingsForm data={formData} onChange={setFormData} step={step} />

            <div className="flex justify-between pt-4">
              {step === 1 ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={handleFinish}
                    className="text-muted-foreground"
                    data-testid="button-skip"
                  >
                    Skip for now
                  </Button>
                  <Button onClick={() => setStep(2)} data-testid="button-next">
                    Next <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setStep(1)} data-testid="button-back">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button onClick={handleFinish} disabled={saving} data-testid="button-finish">
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      "Start Exploring"
                    )}
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
