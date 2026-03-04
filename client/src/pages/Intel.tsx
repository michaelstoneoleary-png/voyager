import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/lib/TripContext";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  ShieldAlert,
  Languages,
  BookOpen,
  Phone,
  Sparkles,
  MapPin,
  Loader2,
  Globe,
} from "lucide-react";

interface Phrase {
  english: string;
  local: string;
  transliteration: string;
  language: string;
}

interface TravelIntel {
  emergency_number: string;
  emergency_note: string;
  etiquette: string[];
  safety: string[];
  phrases: Phrase[];
  languages: string[];
}

export default function Intel() {
  const { trips } = useTrips();
  const { toast } = useToast();
  const [selectedJourneyId, setSelectedJourneyId] = useState<string>("");
  const [intel, setIntel] = useState<TravelIntel | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedJourney = trips.find(t => t.id === selectedJourneyId);

  const handleGenerate = async () => {
    if (!selectedJourneyId) return;
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/intel/generate", { journeyId: selectedJourneyId });
      const data = await res.json();
      setIntel(data);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate travel intelligence", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Group phrases by language
  const phrasesByLanguage = intel?.phrases.reduce<Record<string, Phrase[]>>((acc, phrase) => {
    const lang = phrase.language || "Unknown";
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(phrase);
    return acc;
  }, {}) ?? {};

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center md:text-left">
          <h1 className="font-serif text-3xl font-bold mb-2">Travel Intelligence</h1>
          <p className="text-muted-foreground">Cultural norms, safety alerts, and essential knowledge for your trip.</p>
        </div>

        {/* Journey selector */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Select a Journey</label>
                <Select value={selectedJourneyId} onValueChange={(val) => { setSelectedJourneyId(val); setIntel(null); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a journey to get travel intel..." />
                  </SelectTrigger>
                  <SelectContent>
                    {trips.map(trip => (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.title}{trip.dates ? ` · ${trip.dates}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={!selectedJourneyId || loading}
                className="shrink-0"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="mr-2 h-4 w-4" /> {intel ? "Regenerate" : "Generate Intel"}</>
                )}
              </Button>
            </div>

            {selectedJourney && (
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[selectedJourney.origin, ...(selectedJourney.destinations || []), selectedJourney.finalDestination]
                    .filter(Boolean).join(" → ") || selectedJourney.title}
                </Badge>
                {selectedJourney.dates && (
                  <Badge variant="outline">{selectedJourney.dates}</Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Empty state — no journeys at all */}
        {trips.length === 0 && (
          <Card className="p-8 text-center border-dashed">
            <Globe className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No journeys yet</h3>
            <p className="text-sm text-muted-foreground">Create a journey first, then come back here to get travel intelligence for your destination.</p>
          </Card>
        )}

        {/* Prompt to generate if journey selected but intel not yet fetched */}
        {selectedJourney && !intel && !loading && (
          <Card className="p-8 text-center border-dashed">
            <Sparkles className="h-10 w-10 mx-auto text-primary mb-3" />
            <h3 className="font-medium mb-1">Ready to generate intel for {selectedJourney.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Get emergency numbers, cultural etiquette, safety tips, and essential phrases for your destinations.
            </p>
            <Button onClick={handleGenerate}>
              <Sparkles className="mr-2 h-4 w-4" /> Generate Intel
            </Button>
          </Card>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Skeleton className="h-36" />
              <Skeleton className="h-36" />
            </div>
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
        )}

        {/* Intel results */}
        {intel && !loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Languages */}
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
                    <Languages className="h-4 w-4" /> Languages Spoken
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-serif mb-1">
                    {intel.languages?.join(" & ") || "See phrases below"}
                  </p>
                </CardContent>
              </Card>

              {/* Emergency */}
              <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2 text-destructive">
                    <Phone className="h-4 w-4" /> Emergency
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold font-serif mb-1">{intel.emergency_number}</p>
                  {intel.emergency_note && (
                    <p className="text-xs text-muted-foreground">{intel.emergency_note}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {/* Cultural Etiquette */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-accent-foreground" />
                      Cultural Etiquette
                    </CardTitle>
                    {selectedJourney && (
                      <CardDescription>Do's and Don'ts for {selectedJourney.title}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {intel.etiquette.map((item, idx) => (
                        <AccordionItem key={idx} value={`etiquette-${idx}`}>
                          <AccordionTrigger className="text-sm font-medium text-left">
                            {item}
                          </AccordionTrigger>
                          <AccordionContent className="text-muted-foreground text-sm">
                            Following this norm shows respect for local culture and will make your experience more welcoming.
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>

                {/* Safety */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-serif flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-orange-600" />
                      Safety Advisories
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {intel.safety.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                        <div className="h-2 w-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                        <p className="text-sm">{item}</p>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                {/* Language Phrases */}
                <Card className="bg-sidebar">
                  <CardHeader>
                    <CardTitle className="font-serif text-lg flex items-center gap-2">
                      <Languages className="h-4 w-4" /> Essential Phrases
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(phrasesByLanguage).map(([lang, phrases]) => (
                      <div key={lang} className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-muted-foreground border-b border-border pb-1">{lang}</h4>
                        {phrases.map((phrase, idx) => (
                          <div key={idx} className="flex flex-col">
                            <div className="text-sm font-medium">{phrase.local}</div>
                            <div className="text-xs text-muted-foreground">{phrase.english} · {phrase.transliteration}</div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
