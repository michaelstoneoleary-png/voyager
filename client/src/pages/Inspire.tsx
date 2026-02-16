import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useUser } from "@/lib/UserContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  MapPin, 
  Heart, 
  Plus, 
  Search,
  Loader2,
  Sparkles,
  RefreshCw,
  Calendar,
  DollarSign,
  Compass,
  Globe,
  ArrowRight,
  Mountain,
  UtensilsCrossed,
  Palmtree,
  Building2,
  Waves,
  Flower2
} from "lucide-react";
import { Input } from "@/components/ui/input";

interface Suggestion {
  title: string;
  country: string;
  category: string;
  description: string;
  best_months: string;
  avg_daily_budget: string;
  tags: string[];
  lat: number;
  lng: number;
  image_url?: string;
  image_query?: string;
  why_for_you: string;
}

interface InspireData {
  suggestions: Suggestion[];
  generatedAt: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Adventure": <Mountain className="h-3.5 w-3.5" />,
  "Culture": <Building2 className="h-3.5 w-3.5" />,
  "Food & Drink": <UtensilsCrossed className="h-3.5 w-3.5" />,
  "Nature": <Palmtree className="h-3.5 w-3.5" />,
  "Urban": <Building2 className="h-3.5 w-3.5" />,
  "Beach": <Waves className="h-3.5 w-3.5" />,
  "Wellness": <Flower2 className="h-3.5 w-3.5" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  "Adventure": "bg-orange-100 text-orange-700 border-orange-200",
  "Culture": "bg-violet-100 text-violet-700 border-violet-200",
  "Food & Drink": "bg-amber-100 text-amber-700 border-amber-200",
  "Nature": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Urban": "bg-slate-100 text-slate-700 border-slate-200",
  "Beach": "bg-cyan-100 text-cyan-700 border-cyan-200",
  "Wellness": "bg-pink-100 text-pink-700 border-pink-200",
};

function GemCard({ gem, onStartJourney }: { gem: Suggestion; onStartJourney: (gem: Suggestion) => void }) {
  const fallbackBg = "bg-gradient-to-br from-primary/20 to-primary/5";

  return (
    <Card className="group overflow-hidden border-0 shadow-none bg-transparent hover:bg-card hover:shadow-lg transition-all duration-300 rounded-xl" data-testid={`inspire-card-${gem.title.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
        {gem.image_url ? (
          <img 
            src={gem.image_url} 
            alt={gem.title} 
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              const el = e.target as HTMLImageElement;
              el.style.display = "none";
              el.parentElement?.classList.add(fallbackBg);
            }}
          />
        ) : (
          <div className={`absolute inset-0 ${fallbackBg} flex items-center justify-center`}>
            <Globe className="h-12 w-12 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className={`backdrop-blur-md border text-[11px] ${CATEGORY_COLORS[gem.category] || "bg-white/20 text-white border-0"}`}>
              {CATEGORY_ICONS[gem.category]} {gem.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs font-medium bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
              <DollarSign className="h-3 w-3" /> {gem.avg_daily_budget}
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 pt-5">
        <div className="mb-2">
          <h3 className="font-serif text-xl font-bold group-hover:text-primary transition-colors">{gem.title}</h3>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" /> {gem.country}
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {gem.description}
        </p>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>Best: {gem.best_months}</span>
        </div>

        {gem.why_for_you && (
          <div className="bg-primary/5 border border-primary/10 rounded-md px-3 py-2 mb-3">
            <p className="text-xs text-primary flex items-start gap-1.5">
              <Sparkles className="h-3 w-3 mt-0.5 flex-shrink-0" />
              {gem.why_for_you}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1.5">
            {gem.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">#{tag}</span>
            ))}
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 rounded-full hover:bg-primary/10 hover:text-primary text-xs"
            onClick={() => onStartJourney(gem)}
            data-testid={`button-start-journey-${gem.title.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Start Journey
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Inspire() {
  const { settings } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, error } = useQuery<InspireData>({
    queryKey: ["/api/inspire/suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/inspire/suggestions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load suggestions");
      return res.json();
    },
    staleTime: 30 * 60 * 1000,
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/inspire/refresh");
      const res = await fetch("/api/inspire/suggestions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to refresh");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/inspire/suggestions"], data);
      toast({ title: "Fresh inspiration", description: "Marco has curated new dream destinations just for you." });
    },
    onError: () => {
      toast({ title: "Refresh failed", description: "Please try again.", variant: "destructive" });
    },
  });

  const createJourneyMutation = useMutation({
    mutationFn: async (gem: Suggestion) => {
      const res = await apiRequest("POST", "/api/journeys", {
        title: `${gem.title} Adventure`,
        origin: settings.homeLocation || "",
        finalDestination: `${gem.title}, ${gem.country}`,
        destinations: [],
        days: 7,
        cost: gem.avg_daily_budget ? `${gem.avg_daily_budget}/day` : "TBD",
        status: "planning",
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      toast({ title: "Journey created!", description: `"${data.title}" is ready for planning.` });
      window.location.href = `/planner/${data.id}`;
    },
    onError: () => {
      toast({ title: "Failed to create journey", description: "Please try again.", variant: "destructive" });
    },
  });

  const suggestions = data?.suggestions || [];
  const filteredBySearch = searchQuery.trim()
    ? suggestions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : suggestions;

  const filterByCategory = (categorySlug: string) => {
    if (categorySlug === "all") return filteredBySearch;
    return filteredBySearch.filter(s => slugify(s.category) === categorySlug);
  };

  const categories = Array.from(new Set(suggestions.map(s => s.category)));

  function slugify(str: string) {
    return str.toLowerCase().replace(/\s+/g, "-").replace(/&/g, "and");
  }

  const hasPreferences = (settings.travelStyles?.length ?? 0) > 0 || !!settings.homeLocation;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 animate-in fade-in duration-500">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold mb-2">Marco is finding your dream voyage</h2>
            <p className="text-muted-foreground max-w-md">
              {hasPreferences 
                ? "Analyzing your travel soul to uncover destinations you didn't know you were dreaming of..."
                : "Curating inspiring destinations from every corner of the world..."}
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || suggestions.length === 0) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
          <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Compass className="h-10 w-10 text-primary" />
          </div>
          <div className="text-center">
            <h2 className="font-serif text-2xl font-bold mb-2">Couldn't load inspiration</h2>
            <p className="text-muted-foreground mb-4">Marco had trouble finding destinations. Try again?</p>
            <Button onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending} data-testid="button-retry-inspire">
              {refreshMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Try Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold mb-3" data-testid="text-inspire-title">Find Your Dream Voyage</h1>
            <p className="text-muted-foreground text-lg">
              {hasPreferences 
                ? "Marco has handpicked destinations that match your travel soul. Your next great adventure starts here."
                : "Let Marco inspire your wanderlust with destinations you didn't know you were dreaming of."}
            </p>
            {!hasPreferences && (
              <p className="text-sm text-primary mt-2 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <Link href="/settings" className="underline underline-offset-2 hover:text-primary/80">Tell Marco about your travel style</Link> for deeply personal inspiration.
              </p>
            )}
          </div>
          <div className="flex gap-2 w-full md:w-auto items-center">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="search" 
                placeholder="Search dream destinations..." 
                className="pl-9 bg-background" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-inspire"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => refreshMutation.mutate()} 
              disabled={refreshMutation.isPending}
              className="flex-shrink-0"
              data-testid="button-refresh-inspire"
            >
              {refreshMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b border-border rounded-none mb-6 flex-wrap">
            <TabsTrigger value="all" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid="tab-all">
              All
            </TabsTrigger>
            {categories.map(cat => (
              <TabsTrigger key={cat} value={slugify(cat)} className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" data-testid={`tab-${slugify(cat)}`}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filterByCategory("all").map((gem, idx) => (
                <GemCard key={`${gem.title}-${idx}`} gem={gem} onStartJourney={(g) => createJourneyMutation.mutate(g)} />
              ))}
            </div>
            {filterByCategory("all").length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <p>No destinations match your search.</p>
              </div>
            )}
          </TabsContent>

          {categories.map(cat => (
            <TabsContent key={cat} value={slugify(cat)} className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filterByCategory(slugify(cat)).map((gem, idx) => (
                  <GemCard key={`${gem.title}-${idx}`} gem={gem} onStartJourney={(g) => createJourneyMutation.mutate(g)} />
                ))}
              </div>
              {filterByCategory(slugify(cat)).length === 0 && (
                <div className="py-12 text-center text-muted-foreground">
                  <p>No {cat.toLowerCase()} destinations found.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
