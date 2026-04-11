import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  ShieldAlert,
  Languages,
  BookOpen,
  Phone,
  Sparkles,
  Loader2,
  TriangleAlert,
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

export interface TravelAdvisory {
  level: number;
  title: string;
  url: string;
}

interface JourneyIntelPanelProps {
  journeyId: string;
  journeyTitle: string;
  advisory: TravelAdvisory | null;
}

export function JourneyIntelPanel({ journeyId, journeyTitle, advisory }: JourneyIntelPanelProps) {
  const [intel, setIntel] = useState<TravelIntel | null>(null);
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const { toast } = useToast();

  // Auto-generate on first open
  useEffect(() => {
    if (!generated && !intel) {
      handleGenerate();
    }
  }, [journeyId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/intel/generate", { journeyId });
      const data = await res.json();
      setIntel(data);
      setGenerated(true);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to generate travel intelligence", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  const phrasesByLanguage = intel?.phrases.reduce<Record<string, Phrase[]>>((acc, phrase) => {
    const lang = phrase.language || "Unknown";
    if (!acc[lang]) acc[lang] = [];
    acc[lang].push(phrase);
    return acc;
  }, {}) ?? {};

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* State Dept advisory banner */}
      {advisory && advisory.level >= 3 && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <TriangleAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {advisory.level === 4
                ? "Level 4 — Do Not Travel"
                : "Level 3 — Reconsider Travel"}
            </p>
            <p className="text-xs text-red-700 mt-0.5">{advisory.title}</p>
            <a
              href={advisory.url}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-red-600 underline hover:text-red-800"
            >
              Read full State Dept advisory →
            </a>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-xl font-semibold">Travel Intelligence</h2>
          <p className="text-sm text-muted-foreground">
            Cultural norms, safety tips, and essential phrases for {journeyTitle}
          </p>
        </div>
        {generated && (
          <Button variant="outline" size="sm" onClick={handleGenerate} disabled={loading}>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5">Refresh</span>
          </Button>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-56" />
          <Skeleton className="h-40" />
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Cultural Etiquette */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-accent-foreground" />
                    Cultural Etiquette
                  </CardTitle>
                  <CardDescription>Do's and Don'ts for {journeyTitle}</CardDescription>
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
                <CardContent className="space-y-3">
                  {intel.safety.map((item, idx) => (
                    <div key={idx} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                      <div className="h-2 w-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                      <p className="text-sm">{item}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Essential Phrases */}
            <div>
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
  );
}
