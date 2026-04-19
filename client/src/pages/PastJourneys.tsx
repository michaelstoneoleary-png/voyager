import { useState } from "react";
import { Layout } from "@/components/Layout";
import { WorldMap } from "@/components/WorldMap";
import { FileUpload } from "@/components/FileUpload";
import { Button } from "@/components/ui/button";
import { Masthead, Kicker } from "@/components/ui/editorial";
import { Download, Loader2, Sparkles, Trash2, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

interface PastTrip {
  id: string;
  destination: string;
  country: string | null;
  startDate: string | null;
  endDate: string | null;
  notes: string | null;
  lat: string | null;
  lng: string | null;
}

export default function PastJourneys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiParsing, setAiParsing] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data: pastTrips = [], isLoading } = useQuery<PastTrip[]>({
    queryKey: ["/api/past-trips"],
    queryFn: async () => {
      const res = await fetch("/api/past-trips", { credentials: "include" });
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    retry: false,
  });

  const deleteTripMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/past-trips/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/past-trips"] }),
  });

  const visitedPlaces = pastTrips
    .filter((t) => t.lat && t.lng)
    .map((t) => ({ lat: parseFloat(t.lat!), lng: parseFloat(t.lng!), name: t.destination, date: t.startDate || "" }));

  const uniqueCountries = new Set(pastTrips.map((t) => t.country).filter(Boolean));

  const years = pastTrips
    .map((t) => t.startDate ? new Date(t.startDate).getFullYear() : null)
    .filter((y): y is number => y !== null);
  const earliestYear = years.length > 0 ? Math.min(...years) : null;
  const eyebrow = earliestYear ? `LIFETIME · ${earliestYear} — TODAY` : "LIFETIME TRAVELS";

  const fileToCSV = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const parts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) parts.push(`=== Tab: ${sheetName} ===\n${csv}`);
      }
      return parts.join("\n\n");
    }
    return await file.text();
  };

  const handleUploadComplete = async (files: File[]) => {
    if (files.length === 0) return;
    setAiParsing(true);
    try {
      const text = await fileToCSV(files[0]);
      const res = await fetch("/api/past-trips/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ csvText: text }),
      });
      if (res.status === 401) { toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" }); window.location.href = "/api/login"; return; }
      const data = await res.json();
      if (!res.ok) { toast({ title: "Import Issue", description: data.message || "Could not parse the file.", variant: "destructive" }); return; }
      queryClient.invalidateQueries({ queryKey: ["/api/past-trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      const journeyCount = data.journeys?.length || 0;
      const tripCount = data.pastTrips?.length || 0;
      toast({ title: "Import Successful", description: `AI created ${journeyCount} journey${journeyCount !== 1 ? "s" : ""} and ${tripCount} map pin${tripCount !== 1 ? "s" : ""}.` });
      setImportOpen(false);
    } catch {
      toast({ title: "Import Failed", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setAiParsing(false);
    }
  };

  const sortedTrips = [...pastTrips].sort((a, b) =>
    (a.startDate || "") > (b.startDate || "") ? -1 : 1
  );

  return (
    <Layout>
      <div className="space-y-10 animate-in fade-in duration-500">

        {/* Masthead */}
        <div className="flex items-start justify-between gap-4">
          <Masthead eyebrow={eyebrow} title="The Atlas" className="flex-1" />
          <Button
            variant="outline"
            size="sm"
            className="mt-1 flex-shrink-0 rounded-full border-[color:var(--rule)] text-[color:var(--ink)] hover:bg-[color:var(--sand)] text-[13px]"
            data-testid="button-export"
          >
            <Download className="mr-2 h-3.5 w-3.5" /> Export
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats band */}
            <div className="border-y border-[color:var(--rule)] py-6 grid grid-cols-2 sm:grid-cols-4 divide-x divide-[color:var(--rule)]">
              {[
                { label: "COUNTRIES", value: uniqueCountries.size > 0 ? String(uniqueCountries.size) : "—" },
                { label: "DESTINATIONS", value: pastTrips.length > 0 ? String(pastTrips.length) : "—", testid: "text-cities-count" },
                { label: "MAP PINS", value: visitedPlaces.length > 0 ? String(visitedPlaces.length) : "—", testid: "text-country-count" },
                { label: "YEARS", value: earliestYear ? String(new Date().getFullYear() - earliestYear) : "—" },
              ].map(({ label, value, testid }) => (
                <div key={label} className="flex flex-col items-center gap-1 px-4 py-2">
                  <Kicker>{label}</Kicker>
                  <span
                    className="[font-family:var(--serif)] text-[36px] font-medium tracking-[-0.02em] text-[color:var(--ink)] leading-none mt-1"
                    data-testid={testid}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>

            {/* World map — full width */}
            <div className="rounded-[14px] overflow-hidden border border-[color:var(--rule)] h-[320px] sm:h-[420px]">
              <WorldMap places={visitedPlaces} />
            </div>

            {/* Archive grid */}
            {sortedTrips.length > 0 ? (
              <section className="space-y-5">
                <h2 className="[font-family:var(--serif)] text-[22px] font-medium tracking-[-0.02em] text-[color:var(--ink)]">
                  Archive
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {sortedTrips.map((trip, i) => (
                    <div
                      key={trip.id || i}
                      className="group flex flex-col gap-2 p-4 rounded-[14px] border border-[color:var(--rule)] bg-[color:var(--bg-raised)] hover:border-[color:var(--ink-soft)] transition-colors duration-150"
                      data-testid={`timeline-item-${i}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {trip.startDate && (
                            <Kicker className="mb-1">
                              {new Date(trip.startDate).getFullYear()}
                            </Kicker>
                          )}
                          <p className="[font-family:var(--serif)] text-[16px] font-medium leading-[1.2] text-[color:var(--ink)] truncate">
                            {trip.destination}
                          </p>
                          {trip.country && (
                            <p className="[font-family:var(--serif)] text-[13px] italic text-[color:var(--ink-soft)] mt-0.5">
                              {trip.country}
                            </p>
                          )}
                          {trip.startDate && (
                            <p className="flex items-center gap-1 text-[11px] [font-family:var(--mono)] text-[color:var(--ink-muted)] mt-1.5 tracking-[0.05em]">
                              <Calendar className="h-3 w-3" /> {trip.startDate}
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => deleteTripMutation.mutate(trip.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-[color:var(--ink-muted)] hover:text-destructive"
                          data-testid={`button-delete-trip-${i}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {trip.notes && (
                        <p className="text-[12px] text-[color:var(--ink-muted)] line-clamp-2 leading-relaxed">
                          {trip.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <div className="rounded-[14px] border border-dashed border-[color:var(--rule)] p-12 text-center space-y-3">
                <p className="[font-family:var(--serif)] text-[22px] font-medium text-[color:var(--ink)]">No trips yet</p>
                <p className="text-[15px] text-[color:var(--ink-muted)]">Import your travel history to start building The Atlas.</p>
              </div>
            )}

            {/* Marco import — collapsible */}
            <div className="border border-[color:var(--rule)] rounded-[14px] overflow-hidden">
              <button
                onClick={() => setImportOpen(!importOpen)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[color:var(--sand)]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-[color:var(--clay)]" />
                  <div>
                    <p className="[font-family:var(--serif)] text-[16px] font-medium text-[color:var(--ink)]">Marco-Powered Import</p>
                    <p className="text-[13px] text-[color:var(--ink-muted)]">Upload any spreadsheet — Marco handles the rest</p>
                  </div>
                </div>
                {importOpen ? <ChevronUp className="h-4 w-4 text-[color:var(--ink-muted)]" /> : <ChevronDown className="h-4 w-4 text-[color:var(--ink-muted)]" />}
              </button>

              {importOpen && (
                <div className="px-6 pb-6 border-t border-[color:var(--rule)]">
                  {aiParsing ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                      <Sparkles className="h-8 w-8 text-[color:var(--clay)] animate-pulse" />
                      <p className="text-[15px] text-[color:var(--ink-soft)] text-center [font-family:var(--serif)] italic">Marco is reading your file…</p>
                      <p className="text-[13px] text-[color:var(--ink-muted)] text-center">Identifying destinations, dates, and coordinates</p>
                    </div>
                  ) : (
                    <div className="pt-5 space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-[12px] text-[color:var(--ink-soft)] [font-family:var(--mono)] tracking-[0.05em]">
                        {["Creates complete Journey records", "Adds seasonality & logistics data", "Auto-detects coordinates for map", "Works with any column names"].map(s => (
                          <div key={s} className="flex items-center gap-2">
                            <div className="h-1 w-1 rounded-full bg-[color:var(--clay)]" /> {s}
                          </div>
                        ))}
                      </div>
                      <FileUpload onUploadComplete={handleUploadComplete} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
