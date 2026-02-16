import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/lib/UserContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import {
  Shirt,
  Droplets,
  Zap,
  FileText,
  Heart,
  Watch,
  Luggage,
  RotateCcw,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Globe,
  Info,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plane,
  CheckCircle2,
  Scale,
  Smartphone,
  Send,
  X,
} from "lucide-react";

const ACTIVITY_OPTIONS = [
  "Beach",
  "City",
  "Adventure",
  "Business",
  "Winter Sports",
  "Hiking",
  "Cultural",
  "Nightlife",
  "Wellness",
  "Road Trip",
];

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  clothing: Shirt,
  toiletries: Droplets,
  electronics: Zap,
  documents: FileText,
  health: Heart,
  accessories: Watch,
};

const CATEGORY_STYLES: Record<string, { color: string; bg: string }> = {
  clothing: { color: "text-blue-600", bg: "bg-blue-500/10" },
  toiletries: { color: "text-teal-600", bg: "bg-teal-500/10" },
  electronics: { color: "text-amber-600", bg: "bg-amber-500/10" },
  documents: { color: "text-purple-600", bg: "bg-purple-500/10" },
  health: { color: "text-rose-600", bg: "bg-rose-500/10" },
  accessories: { color: "text-emerald-600", bg: "bg-emerald-500/10" },
};

interface PackingItem {
  name: string;
  quantity: number;
  reason: string;
  packed: boolean;
  weight_grams?: number;
}

interface PackingCategory {
  name: string;
  icon: string;
  items: PackingItem[];
}

interface FormData {
  destination: string;
  origin: string;
  startDate: string;
  endDate: string;
  activities: string[];
  journeyId?: string;
}

interface JourneyOption {
  id: string;
  title: string;
  origin?: string;
  finalDestination?: string;
  destinations?: string[];
  dates?: string;
  days?: number;
  itinerary?: any;
}

export default function PackingList() {
  const { settings } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: journeys } = useQuery<JourneyOption[]>({
    queryKey: ["/api/journeys"],
    queryFn: async () => {
      const res = await fetch("/api/journeys", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({
    destination: "",
    origin: "",
    startDate: "",
    endDate: "",
    activities: [],
  });
  const [categories, setCategories] = useState<PackingCategory[] | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  const [isCreatingJourney, setIsCreatingJourney] = useState(false);
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsPhone, setSmsPhone] = useState(settings.phoneNumber || "");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [journeyCreated, setJourneyCreated] = useState(false);
  const [savedPackingListId, setSavedPackingListId] = useState<string | null>(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/packing-lists/latest", { credentials: "include" });
        if (res.ok) {
          const saved = await res.json();
          if (saved && saved.categories) {
            setCategories(saved.categories as PackingCategory[]);
            setSavedPackingListId(saved.id);
            setForm({
              destination: saved.destination || "",
              origin: saved.origin || "",
              startDate: saved.startDate || "",
              endDate: saved.endDate || "",
              activities: saved.activities || [],
              journeyId: saved.journeyId || undefined,
            });
          }
        }
      } catch {}
      setIsLoadingSaved(false);
    })();
  }, []);

  const saveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistCategories = useCallback((cats: PackingCategory[], listId: string | null) => {
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(async () => {
      if (!listId) return;
      try {
        await apiRequest("PUT", `/api/packing-lists/${listId}`, { categories: cats });
      } catch {}
    }, 500);
  }, []);

  const selectJourney = (journey: JourneyOption) => {
    setSelectedJourneyId(journey.id);
    const allStops = [
      ...(journey.destinations || []),
      journey.finalDestination,
    ].filter(Boolean);
    const destination = allStops.join(", ") || journey.title;

    const activityTypes = new Set<string>();
    const itinerary = journey.itinerary as any;
    if (itinerary?.days) {
      for (const day of itinerary.days) {
        for (const act of day.activities || []) {
          const t = (act.type || "").toLowerCase();
          if (t === "nature" || t === "relaxation") activityTypes.add("Hiking");
          if (t === "food") activityTypes.add("Cultural");
          if (t === "culture") activityTypes.add("Cultural");
          if (t === "nightlife") activityTypes.add("Nightlife");
          if (t === "shopping") activityTypes.add("City");
        }
      }
    }

    setForm({
      destination,
      origin: journey.origin || "",
      startDate: journey.dates?.split(" - ")?.[0] || "",
      endDate: journey.dates?.split(" - ")?.[1] || "",
      activities: Array.from(activityTypes),
      journeyId: journey.id,
    });
  };

  const selectedJourneyForDisplay = journeys?.find(j => j.id === form.journeyId);

  const duration = useMemo(() => {
    if (form.startDate && form.endDate) {
      const start = new Date(form.startDate);
      const end = new Date(form.endDate);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diff > 0) return diff;
    }
    if (selectedJourneyForDisplay?.days) return selectedJourneyForDisplay.days;
    return 0;
  }, [form.startDate, form.endDate, selectedJourneyForDisplay]);

  const toggleActivity = (activity: string) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter((a) => a !== activity)
        : [...prev.activities, activity],
    }));
  };

  const handleGenerate = async () => {
    const hasJourney = !!form.journeyId;
    if (!hasJourney && (!form.destination || !form.startDate || !form.endDate)) {
      toast({
        title: "Missing fields",
        description: "Please select a journey or fill in destination and travel dates.",
        variant: "destructive",
      });
      return;
    }
    if (!hasJourney && duration <= 0) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const selectedJourney = journeys?.find(j => j.id === form.journeyId);
      const effectiveDuration = duration > 0 ? duration : (selectedJourney?.days || 7);
      const res = await apiRequest("POST", "/api/packing-list/generate", {
        destination: form.destination || undefined,
        origin: form.origin || undefined,
        dates: form.startDate && form.endDate ? { start: form.startDate, end: form.endDate } : undefined,
        duration: effectiveDuration,
        activities: form.activities,
        gender: settings.gender || undefined,
        journeyId: form.journeyId || undefined,
      });
      const data = await res.json();
      const cats: PackingCategory[] = (data.categories || []).map((cat: any) => ({
        ...cat,
        items: cat.items.map((item: any) => ({ ...item, packed: false })),
      }));
      setCategories(cats);
      setCollapsedCategories(new Set());
      setJourneyCreated(false);

      try {
        const saveRes = await apiRequest("POST", "/api/packing-lists", {
          destination: form.destination,
          origin: form.origin || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
          activities: form.activities,
          categories: cats,
          journeyId: form.journeyId || null,
        });
        const savedList = await saveRes.json();
        setSavedPackingListId(savedList.id);
      } catch {}
    } catch (err: any) {
      toast({
        title: "Generation failed",
        description: err.message || "Could not generate packing list. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePacked = (catIndex: number, itemIndex: number) => {
    setCategories((prev) => {
      if (!prev) return prev;
      const updated = prev.map((cat, ci) =>
        ci === catIndex
          ? {
              ...cat,
              items: cat.items.map((item, ii) =>
                ii === itemIndex ? { ...item, packed: !item.packed } : item
              ),
            }
          : cat
      );
      persistCategories(updated, savedPackingListId);
      return updated;
    });
  };

  const toggleCategory = (catName: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(catName)) next.delete(catName);
      else next.add(catName);
      return next;
    });
  };

  const handleStartOver = () => {
    setCategories(null);
    setJourneyCreated(false);
    setCollapsedCategories(new Set());
    setSelectedJourneyId(null);
    setSavedPackingListId(null);
    setForm({ destination: "", origin: "", startDate: "", endDate: "", activities: [] });
  };

  const handleCreateJourney = async () => {
    setIsCreatingJourney(true);
    try {
      await apiRequest("POST", "/api/journeys", {
        title: `Trip to ${form.destination}`,
        destination: form.destination,
        startDate: form.startDate,
        endDate: form.endDate,
        status: "Planning",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      setJourneyCreated(true);
      toast({ title: "Journey created!", description: `Your trip to ${form.destination} has been added to your journeys.` });
    } catch (err: any) {
      toast({
        title: "Could not create journey",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingJourney(false);
    }
  };

  const handleSendSms = async () => {
    if (!smsPhone.trim()) return;
    setIsSendingSms(true);
    try {
      await apiRequest("POST", "/api/send-packing-sms", { phoneNumber: smsPhone.trim() });
      setSmsSent(true);
      toast({ title: "Text sent!", description: "Check your phone for the packing list link." });
      setTimeout(() => {
        setShowSmsInput(false);
        setSmsSent(false);
      }, 3000);
    } catch (err: any) {
      toast({
        title: "Couldn't send text",
        description: err.message || "Please check the number and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingSms(false);
    }
  };

  const { totalItems, packedItems, progress, totalWeightGrams, packedWeightGrams, estimatedBagWeightGrams } = useMemo(() => {
    if (!categories) return { totalItems: 0, packedItems: 0, progress: 0, totalWeightGrams: 0, packedWeightGrams: 0, estimatedBagWeightGrams: 0 };
    const all = categories.flatMap((c) => c.items);
    const total = all.length;
    const packed = all.filter((i) => i.packed).length;
    const totalW = all.reduce((sum, i) => sum + (i.weight_grams || 0) * i.quantity, 0);
    const packedW = all.filter((i) => i.packed).reduce((sum, i) => sum + (i.weight_grams || 0) * i.quantity, 0);
    const bagW = totalW <= 5000 ? 800 : totalW <= 10000 ? 1500 : totalW <= 20000 ? 2500 : 3500;
    return { totalItems: total, packedItems: packed, progress: total > 0 ? Math.round((packed / total) * 100) : 0, totalWeightGrams: totalW, packedWeightGrams: packedW, estimatedBagWeightGrams: bagW };
  }, [categories]);

  const formatWeight = (grams: number) => {
    if (settings.weightUnit === "lbs") {
      const lbs = grams / 453.592;
      if (lbs >= 1) return `${lbs.toFixed(1)} lbs`;
      const oz = grams / 28.3495;
      return `${oz.toFixed(0)} oz`;
    }
    if (grams >= 1000) return `${(grams / 1000).toFixed(1)} kg`;
    return `${grams} g`;
  };

  const weightLimitGrams = settings.weightUnit === "lbs" ? 22680 : 23000;
  const weightLimitLabel = settings.weightUnit === "lbs" ? "50 lbs" : "23 kg";

  const getCategoryIcon = (iconName: string) => {
    const key = iconName.toLowerCase();
    return CATEGORY_ICONS[key] || Luggage;
  };

  const getCategoryStyle = (iconName: string) => {
    const key = iconName.toLowerCase();
    return CATEGORY_STYLES[key] || { color: "text-stone-600", bg: "bg-stone-500/10" };
  };

  if (isLoadingSaved) {
    return (
      <Layout>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">Smart Packing</h1>
            <p className="text-muted-foreground">Loading your packing list…</p>
          </div>
          <div className="flex items-center gap-3 mb-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Checking for saved lists…</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (isGenerating) {
    return (
      <Layout>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold mb-2">Smart Packing</h1>
            <p className="text-muted-foreground">Generating your personalized packing list…</p>
          </div>
          <div className="flex items-center gap-3 mb-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Marco is analyzing weather, activities, and local customs for <strong>{form.destination}</strong>…</span>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-4 flex-1" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (categories) {
    return (
      <Layout>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-3xl font-bold mb-1">Smart Packing</h1>
              <p className="text-muted-foreground">
                {form.destination} · {duration} {duration === 1 ? "day" : "days"}{duration > 0 ? `, ${duration - 1} ${duration - 1 === 1 ? "night" : "nights"}` : ""} · {form.activities.length > 0 ? form.activities.join(", ") : "General travel"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { setShowSmsInput(!showSmsInput); setSmsSent(false); }} data-testid="button-send-to-phone">
                <Smartphone className="h-4 w-4 mr-2" /> Send to Phone
              </Button>
              <Button variant="outline" onClick={handleStartOver} data-testid="button-start-over">
                <RotateCcw className="h-4 w-4 mr-2" /> Start Over
              </Button>
            </div>
          </div>

          {showSmsInput && (
            <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2 duration-300" data-testid="panel-sms-input">
              <div className="flex items-center gap-2 mb-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Text yourself a link to this packing list</span>
                <button onClick={() => setShowSmsInput(false)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground mb-3">Check off items from your phone as you pack.</p>
              <div className="flex gap-2">
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="flex-1"
                  data-testid="input-sms-phone"
                  onKeyDown={(e) => e.key === "Enter" && handleSendSms()}
                />
                <Button
                  onClick={handleSendSms}
                  disabled={isSendingSms || !smsPhone.trim() || smsSent}
                  data-testid="button-send-sms"
                >
                  {isSendingSms ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : smsSent ? (
                    <><CheckCircle2 className="h-4 w-4 mr-2" /> Sent</>
                  ) : (
                    <><Send className="h-4 w-4 mr-2" /> Send</>
                  )}
                </Button>
              </div>
            </div>
          )}

          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Packing Progress</span>
                  <div className="text-2xl font-bold text-foreground" data-testid="text-progress">{progress}% Packed</div>
                </div>
                <span className="text-sm text-muted-foreground" data-testid="text-packed-count">{packedItems} of {totalItems} items</span>
              </div>
              <Progress value={progress} className="h-2 bg-primary/20" data-testid="progress-bar" />
            </CardContent>
          </Card>

          {totalWeightGrams > 0 && (
            <Card className="mb-6 border-border" data-testid="card-weight-summary">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Scale className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Weight Estimate</span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-lg font-bold text-foreground" data-testid="text-contents-weight">{formatWeight(totalWeightGrams)}</div>
                    <span className="text-xs text-muted-foreground">Contents</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-foreground" data-testid="text-bag-weight">+ {formatWeight(estimatedBagWeightGrams)}</div>
                    <span className="text-xs text-muted-foreground">Est. bag</span>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-primary" data-testid="text-total-weight">{formatWeight(totalWeightGrams + estimatedBagWeightGrams)}</div>
                    <span className="text-xs text-muted-foreground">Total packed</span>
                  </div>
                </div>
                {totalWeightGrams + estimatedBagWeightGrams > weightLimitGrams && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-md" data-testid="banner-weight-warning">
                    <p className="text-xs text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                      <Info className="h-3 w-3 flex-shrink-0" />
                      Over {weightLimitLabel} — most airlines charge for checked bags above this weight.
                    </p>
                  </div>
                )}
                {packedWeightGrams > 0 && packedWeightGrams < totalWeightGrams && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Packed so far: {formatWeight(packedWeightGrams)} of {formatWeight(totalWeightGrams)}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {!journeyCreated && !form.journeyId && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6" data-testid="banner-create-journey">
              <div className="flex items-start gap-3 flex-1">
                <Globe className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-amber-900 dark:text-amber-100 text-sm">Want to track this trip?</h4>
                  <p className="text-amber-800 dark:text-amber-200 text-sm">Create a Journey to save itinerary, notes, and more.</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={handleCreateJourney}
                disabled={isCreatingJourney}
                data-testid="button-create-journey"
              >
                {isCreatingJourney ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
                Create a Journey
              </Button>
            </div>
          )}

          <div className="space-y-4">
            {categories.map((cat, catIndex) => {
              const IconComp = getCategoryIcon(cat.icon || cat.name);
              const style = getCategoryStyle(cat.icon || cat.name);
              const isCollapsed = collapsedCategories.has(cat.name);
              const catPacked = cat.items.filter((i) => i.packed).length;

              return (
                <Card key={cat.name} data-testid={`card-category-${cat.name.toLowerCase().replace(/\s/g, "-")}`}>
                  <button
                    className="w-full text-left"
                    onClick={() => toggleCategory(cat.name)}
                    data-testid={`button-toggle-category-${cat.name.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="font-serif text-lg flex items-center gap-2">
                          <div className={`h-8 w-8 rounded-lg ${style.bg} flex items-center justify-center`}>
                            <IconComp className={`h-4 w-4 ${style.color}`} />
                          </div>
                          {cat.name}
                          <Badge variant="secondary" className="ml-2 text-xs font-normal">
                            {catPacked}/{cat.items.length}
                          </Badge>
                        </CardTitle>
                        {isCollapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronUp className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </CardHeader>
                  </button>

                  {!isCollapsed && (
                    <CardContent className="pt-0 space-y-1">
                      {cat.items.map((item, itemIndex) => (
                        <div
                          key={`${cat.name}-${itemIndex}`}
                          className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                            item.packed
                              ? "bg-muted/30 border-transparent opacity-60"
                              : "bg-card border-border hover:border-primary/50 hover:shadow-sm"
                          }`}
                          onClick={() => togglePacked(catIndex, itemIndex)}
                          data-testid={`item-${cat.name.toLowerCase().replace(/\s/g, "-")}-${itemIndex}`}
                        >
                          <Checkbox
                            checked={item.packed}
                            className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            data-testid={`checkbox-${cat.name.toLowerCase().replace(/\s/g, "-")}-${itemIndex}`}
                          />
                          <div className="flex-1 select-none min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`font-medium text-sm ${item.packed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {item.name}
                              </span>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {item.weight_grams && (
                                  <span className="text-[10px] text-muted-foreground/70">
                                    {formatWeight(item.weight_grams * item.quantity)}
                                  </span>
                                )}
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                                  Qty: {item.quantity}
                                </Badge>
                              </div>
                            </div>
                            {item.reason && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Info className="h-3 w-3 opacity-50 flex-shrink-0" /> {item.reason}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </Layout>
    );
  }

  const journeysWithItinerary = journeys?.filter(j => j.itinerary) || [];
  const hasJourneySelected = !!selectedJourneyId;
  const selectedJourney = journeys?.find(j => j.id === selectedJourneyId);
  const canGenerate = hasJourneySelected || (form.destination && form.startDate && form.endDate && duration > 0);

  return (
    <Layout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
            <Luggage className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Smart Packing</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {journeysWithItinerary.length > 0
              ? "Select a journey and Marco will build a packing list based on your actual itinerary."
              : "Tell us about your trip and Marco will generate a personalized packing list for you."}
          </p>
        </div>

        {journeysWithItinerary.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <Plane className="h-4 w-4 text-primary" /> Pack for a Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {journeysWithItinerary.map((journey) => {
                  const isSelected = selectedJourneyId === journey.id;
                  const stops = [journey.origin, ...(journey.destinations || []), journey.finalDestination].filter(Boolean);
                  const hasItinerary = !!(journey.itinerary as any)?.days?.length;
                  return (
                    <div
                      key={journey.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/40 hover:bg-muted/30"
                      }`}
                      onClick={() => selectJourney(journey)}
                      data-testid={`journey-option-${journey.id}`}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {isSelected ? <CheckCircle2 className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{journey.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          {stops.join(" → ")}
                          {journey.days ? ` · ${journey.days} days` : ""}
                        </p>
                      </div>
                      {hasItinerary && (
                        <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                          Itinerary ready
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedJourney && (
                <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-primary" />
                    Marco will analyze your full itinerary — activities, destinations, hotels, and travel modes — to create the perfect packing list.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!hasJourneySelected && journeysWithItinerary.length > 0 && (
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-xs text-muted-foreground uppercase tracking-wider">or enter trip details manually</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>
        )}

        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="destination" className="text-sm font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" /> Destination
              </Label>
              <Input
                id="destination"
                placeholder="e.g. Tokyo, Japan"
                value={form.destination}
                onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                data-testid="input-destination"
              />
            </div>

            {!hasJourneySelected && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" /> Origin <span className="text-xs text-muted-foreground">(optional)</span>
                  </Label>
                  <Input
                    id="origin"
                    placeholder="e.g. New York, US"
                    value={form.origin}
                    onChange={(e) => setForm((p) => ({ ...p, origin: e.target.value }))}
                    data-testid="input-origin"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" /> Start Date
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={form.startDate}
                      onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" /> End Date
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={form.endDate}
                      onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                      data-testid="input-end-date"
                    />
                  </div>
                </div>

                {duration > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2" data-testid="text-duration">
                    <Clock className="h-4 w-4" />
                    <span>Trip duration: <strong className="text-foreground">{duration} {duration === 1 ? "day" : "days"}</strong></span>
                  </div>
                )}
              </>
            )}

            {hasJourneySelected && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                <Clock className="h-4 w-4" />
                <span>Trip duration: <strong className="text-foreground">{selectedJourney?.days || duration || "?"} days</strong></span>
                {form.origin && <span className="ml-2">from <strong className="text-foreground">{form.origin}</strong></span>}
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-medium">Trip Activities</Label>
              <div className="flex flex-wrap gap-2">
                {ACTIVITY_OPTIONS.map((activity) => {
                  const isSelected = form.activities.includes(activity);
                  return (
                    <Badge
                      key={activity}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-all text-sm py-1.5 px-3 ${
                        isSelected
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleActivity(activity)}
                      data-testid={`badge-activity-${activity.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {activity}
                    </Badge>
                  );
                })}
              </div>
            </div>

            <Button
              className="w-full h-12 text-base"
              onClick={handleGenerate}
              disabled={!canGenerate}
              data-testid="button-generate"
            >
              <Sparkles className="h-5 w-5 mr-2" /> {hasJourneySelected ? "Generate Packing List for This Journey" : "Generate My Packing List"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
