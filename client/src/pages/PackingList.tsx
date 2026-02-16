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
import { useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
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
}

export default function PackingList() {
  const { settings } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
  const [journeyCreated, setJourneyCreated] = useState(false);

  const duration = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const start = new Date(form.startDate);
    const end = new Date(form.endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  }, [form.startDate, form.endDate]);

  const toggleActivity = (activity: string) => {
    setForm((prev) => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter((a) => a !== activity)
        : [...prev.activities, activity],
    }));
  };

  const handleGenerate = async () => {
    if (!form.destination || !form.startDate || !form.endDate) {
      toast({
        title: "Missing fields",
        description: "Please fill in destination and travel dates.",
        variant: "destructive",
      });
      return;
    }
    if (duration <= 0) {
      toast({
        title: "Invalid dates",
        description: "End date must be after start date.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/packing-list/generate", {
        destination: form.destination,
        origin: form.origin || undefined,
        dates: { start: form.startDate, end: form.endDate },
        duration,
        activities: form.activities,
        gender: settings.gender || undefined,
      });
      const data = await res.json();
      const cats: PackingCategory[] = (data.categories || []).map((cat: any) => ({
        ...cat,
        items: cat.items.map((item: any) => ({ ...item, packed: false })),
      }));
      setCategories(cats);
      setCollapsedCategories(new Set());
      setJourneyCreated(false);
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
      return prev.map((cat, ci) =>
        ci === catIndex
          ? {
              ...cat,
              items: cat.items.map((item, ii) =>
                ii === itemIndex ? { ...item, packed: !item.packed } : item
              ),
            }
          : cat
      );
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

  const { totalItems, packedItems, progress } = useMemo(() => {
    if (!categories) return { totalItems: 0, packedItems: 0, progress: 0 };
    const all = categories.flatMap((c) => c.items);
    const total = all.length;
    const packed = all.filter((i) => i.packed).length;
    return { totalItems: total, packedItems: packed, progress: total > 0 ? Math.round((packed / total) * 100) : 0 };
  }, [categories]);

  const getCategoryIcon = (iconName: string) => {
    const key = iconName.toLowerCase();
    return CATEGORY_ICONS[key] || Luggage;
  };

  const getCategoryStyle = (iconName: string) => {
    const key = iconName.toLowerCase();
    return CATEGORY_STYLES[key] || { color: "text-stone-600", bg: "bg-stone-500/10" };
  };

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
                {form.destination} · {duration} days · {form.activities.length > 0 ? form.activities.join(", ") : "General travel"}
              </p>
            </div>
            <Button variant="outline" onClick={handleStartOver} data-testid="button-start-over">
              <RotateCcw className="h-4 w-4 mr-2" /> Start Over
            </Button>
          </div>

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

          {!journeyCreated && (
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
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground flex-shrink-0">
                                Qty: {item.quantity}
                              </Badge>
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

  return (
    <Layout>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mb-4">
            <Luggage className="h-7 w-7 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-bold mb-2">Smart Packing</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Tell us about your trip and Marco will generate a personalized packing list for you.
          </p>
        </div>

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
              disabled={!form.destination || !form.startDate || !form.endDate || duration <= 0}
              data-testid="button-generate"
            >
              <Sparkles className="h-5 w-5 mr-2" /> Generate My Packing List
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
