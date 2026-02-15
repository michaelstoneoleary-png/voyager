import { Layout } from "@/components/Layout";
import { WorldMap } from "@/components/WorldMap";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Globe, Calendar, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/auth-utils";
import Papa from "papaparse";

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

const KNOWN_COORDINATES: Record<string, { lat: string; lng: string }> = {
  "paris": { lat: "48.8566", lng: "2.3522" },
  "london": { lat: "51.5074", lng: "-0.1278" },
  "tokyo": { lat: "35.6762", lng: "139.6503" },
  "new york": { lat: "40.7128", lng: "-74.0060" },
  "rome": { lat: "41.9028", lng: "12.4964" },
  "bangkok": { lat: "13.7563", lng: "100.5018" },
  "rio de janeiro": { lat: "-22.9068", lng: "-43.1729" },
  "cairo": { lat: "30.0444", lng: "31.2357" },
  "sydney": { lat: "-33.8688", lng: "151.2093" },
  "istanbul": { lat: "41.0082", lng: "28.9784" },
  "barcelona": { lat: "41.3874", lng: "2.1686" },
  "lisbon": { lat: "38.7223", lng: "-9.1393" },
  "berlin": { lat: "52.5200", lng: "13.4050" },
  "amsterdam": { lat: "52.3676", lng: "4.9041" },
  "prague": { lat: "50.0755", lng: "14.4378" },
  "vienna": { lat: "48.2082", lng: "16.3738" },
  "athens": { lat: "37.9838", lng: "23.7275" },
  "dubai": { lat: "25.2048", lng: "55.2708" },
  "singapore": { lat: "1.3521", lng: "103.8198" },
  "hong kong": { lat: "22.3193", lng: "114.1694" },
  "seoul": { lat: "37.5665", lng: "126.9780" },
  "mumbai": { lat: "19.0760", lng: "72.8777" },
  "cape town": { lat: "-33.9249", lng: "18.4241" },
  "mexico city": { lat: "19.4326", lng: "-99.1332" },
  "buenos aires": { lat: "-34.6037", lng: "-58.3816" },
  "marrakech": { lat: "31.6295", lng: "-7.9811" },
  "kyoto": { lat: "35.0116", lng: "135.7681" },
  "florence": { lat: "43.7696", lng: "11.2558" },
  "cusco": { lat: "-13.5319", lng: "-71.9675" },
  "reykjavik": { lat: "64.1466", lng: "-21.9426" },
};

function guessCoordinates(destination: string): { lat: string; lng: string } | null {
  const lower = destination.toLowerCase();
  for (const [city, coords] of Object.entries(KNOWN_COORDINATES)) {
    if (lower.includes(city)) return coords;
  }
  return null;
}

export default function PastJourneys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  const bulkImportMutation = useMutation({
    mutationFn: async (trips: Omit<PastTrip, "id">[]) => {
      const res = await fetch("/api/past-trips/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ trips }),
      });
      if (res.status === 401) throw new Error("401: Unauthorized");
      if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/past-trips"] });
      toast({
        title: "Import Successful",
        description: `Successfully imported ${Array.isArray(data) ? data.length : 0} trips.`,
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({ title: "Session expired", description: "Please log in again.", variant: "destructive" });
        window.location.href = "/api/login";
        return;
      }
      toast({ title: "Import Failed", description: "Could not import trips. Check your file format.", variant: "destructive" });
    },
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

  const handleUploadComplete = (files: File[]) => {
    if (files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({ title: "Error", description: "Could not read file.", variant: "destructive" });
        return;
      }

      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (h: string) => h.trim().toLowerCase(),
      });

      if (result.errors.length > 0 && result.data.length === 0) {
        toast({ title: "Parse Error", description: "Could not parse the file. Make sure it's a valid CSV.", variant: "destructive" });
        return;
      }

      const trips = (result.data as Record<string, string>[]).map((row) => {
        const destination = row.destination || row.city || row.place || row.location || "";
        const country = row.country || row.nation || "";
        const startDate = row.start_date || row.startdate || row.date || row.start || row.when || "";
        const endDate = row.end_date || row.enddate || row.end || "";
        const notes = row.notes || row.note || row.description || "";
        const lat = row.lat || row.latitude || "";
        const lng = row.lng || row.longitude || row.lon || "";

        const coords = (lat && lng) ? { lat, lng } : guessCoordinates(destination);

        return {
          destination: destination.trim(),
          country: country.trim() || null,
          startDate: startDate.trim() || null,
          endDate: endDate.trim() || null,
          notes: notes.trim() || null,
          lat: coords?.lat || null,
          lng: coords?.lng || null,
        };
      }).filter(t => t.destination);

      if (trips.length === 0) {
        toast({
          title: "No trips found",
          description: "Make sure your CSV has a 'destination' or 'city' column.",
          variant: "destructive",
        });
        return;
      }

      bulkImportMutation.mutate(trips as any);
    };

    reader.readAsText(file);
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
                     <CardTitle className="text-lg font-serif">Import Guide</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-3">
                     <p className="text-sm text-muted-foreground">Your CSV should have columns like:</p>
                     <div className="bg-muted/30 p-3 rounded-lg text-xs font-mono">
                       destination, country, start_date, end_date, notes
                     </div>
                     <p className="text-xs text-muted-foreground">We'll try to automatically place your destinations on the map. You can also include <span className="font-mono">lat</span> and <span className="font-mono">lng</span> columns for exact positioning.</p>
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
                      <CardTitle className="font-serif text-lg">Import History</CardTitle>
                      <CardDescription>Add trips from CSV spreadsheets</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FileUpload onUploadComplete={handleUploadComplete} />
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
