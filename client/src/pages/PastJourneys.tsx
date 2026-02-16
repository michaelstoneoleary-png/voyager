import { useState } from "react";
import { Layout } from "@/components/Layout";
import { WorldMap } from "@/components/WorldMap";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Globe, Calendar, Loader2, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/auth-utils";
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
      const res = await fetch(`/api/past-trips/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/past-trips"] });
    },
  });

  const visitedPlaces = pastTrips
    .filter((t) => t.lat && t.lng)
    .map((t) => ({
      lat: parseFloat(t.lat!),
      lng: parseFloat(t.lng!),
      name: t.destination,
      date: t.startDate || "",
    }));

  const uniqueCountries = new Set(pastTrips.map(t => t.country).filter(Boolean));

  const fileToCSV = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext === "xlsx" || ext === "xls") {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const parts: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          parts.push(`=== Tab: ${sheetName} ===\n${csv}`);
        }
      }
      return parts.join("\n\n");
    }
    return await file.text();
  };

  const handleUploadComplete = async (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    setAiParsing(true);

    try {
      const text = await fileToCSV(file);

      const res = await fetch("/api/past-trips/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ csvText: text }),
      });

      if (res.status === 401) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        window.location.href = "/api/login";
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        toast({
          title: "Import Issue",
          description: data.message || "Could not parse the file.",
          variant: "destructive",
        });
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["/api/past-trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });

      const journeyCount = data.journeys?.length || 0;
      const tripCount = data.pastTrips?.length || 0;
      toast({
        title: "Import Successful",
        description: `AI created ${journeyCount} journey${journeyCount !== 1 ? 's' : ''} and ${tripCount} map pin${tripCount !== 1 ? 's' : ''} from your file.`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Import Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setAiParsing(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">Past Journeys</h1>
            <p className="text-muted-foreground text-sm">Visualize your travel history and import past adventures.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-export">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden border-sidebar-border h-[400px]">
                <CardHeader className="pb-2">
                   <div className="flex items-center justify-between">
                     <CardTitle className="font-serif text-xl flex items-center gap-2">
                       <Globe className="h-5 w-5 text-primary" /> World Map
                     </CardTitle>
                     <Badge variant="secondary" className="font-mono" data-testid="text-cities-count">{visitedPlaces.length} Cities Visited</Badge>
                   </div>
                </CardHeader>
                <CardContent className="p-0 h-[320px] relative">
                  <WorldMap places={visitedPlaces} />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                   <CardHeader>
                     <CardTitle className="text-lg font-serif">Travel Stats</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Countries</span>
                        <span className="font-bold" data-testid="text-country-count">{uniqueCountries.size}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Destinations</span>
                        <span className="font-bold">{pastTrips.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Map Pins</span>
                        <span className="font-bold">{visitedPlaces.length}</span>
                      </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader>
                     <CardTitle className="text-lg font-serif flex items-center gap-2">
                       <Sparkles className="h-4 w-4 text-primary" /> Marco-Powered Import
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     <p className="text-sm text-muted-foreground">Upload any spreadsheet or CSV — no special formatting needed. Marco creates full journey records with seasonality insights, logistics, and map pins.</p>
                     <div className="bg-muted/30 p-3 rounded-lg text-xs text-muted-foreground space-y-1">
                       <div>Creates complete Journey records</div>
                       <div>Adds seasonality & logistics data</div>
                       <div>Auto-detects coordinates for map</div>
                       <div>Works with any column names</div>
                     </div>
                   </CardContent>
                 </Card>
              </div>
            </div>

            <div className="space-y-6">
              <Tabs defaultValue="history" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
                  <TabsTrigger value="import" data-testid="tab-import">Import</TabsTrigger>
                </TabsList>
                
                <TabsContent value="import">
                  <Card className="border-sidebar-border">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg flex items-center gap-2">
                        Import History
                        {aiParsing && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      </CardTitle>
                      <CardDescription>
                        {aiParsing
                          ? "Marco is reading your file and extracting trip data..."
                          : "Upload any spreadsheet — Marco handles the rest"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {aiParsing ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                          <div className="relative">
                            <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                          </div>
                          <p className="text-sm text-muted-foreground text-center">Marco is analyzing your spreadsheet...</p>
                          <p className="text-xs text-muted-foreground text-center">Identifying destinations, dates, and coordinates</p>
                        </div>
                      ) : (
                        <FileUpload onUploadComplete={handleUploadComplete} />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history">
                  <Card className="border-sidebar-border h-[500px] flex flex-col">
                    <CardHeader>
                      <CardTitle className="font-serif text-lg">Timeline</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0">
                      <ScrollArea className="h-[400px]">
                        <div className="px-6 pb-6 space-y-6">
                          {pastTrips.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">No past trips yet. Import your travel history to get started.</p>
                          ) : (
                            [...pastTrips].sort((a, b) => ((a.startDate || "") > (b.startDate || "") ? -1 : 1)).map((trip, i) => (
                              <div key={trip.id || i} className="relative pl-6 border-l border-border last:border-0 group" data-testid={`timeline-item-${i}`}>
                                 <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                                 <div className="flex items-start justify-between">
                                   <div>
                                     <div className="mb-1 text-sm font-medium">{trip.destination}</div>
                                     {trip.country && <div className="text-xs text-muted-foreground mb-0.5">{trip.country}</div>}
                                     <div className="text-xs text-muted-foreground flex items-center gap-1">
                                       <Calendar className="h-3 w-3" /> {trip.startDate || "Unknown date"}
                                     </div>
                                   </div>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                     onClick={() => deleteTripMutation.mutate(trip.id)}
                                     data-testid={`button-delete-trip-${i}`}
                                   >
                                     <Trash2 className="h-3 w-3" />
                                   </Button>
                                 </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
