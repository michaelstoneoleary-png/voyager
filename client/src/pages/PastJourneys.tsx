import { Layout } from "@/components/Layout";
import { WorldMap } from "@/components/WorldMap";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Globe, Map as MapIcon, Calendar, ArrowRight, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/auth-utils";

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
      const res = await apiRequest("POST", "/api/past-trips/bulk", { trips });
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
      toast({ title: "Import Failed", description: "Could not import trips.", variant: "destructive" });
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

  const handleUploadComplete = (files: File[]) => {
    const sampleTrips = [
      { destination: "Bangkok, Thailand", country: "Thailand", startDate: "Nov 2017", endDate: null, notes: null, lat: "13.7563", lng: "100.5018", userId: "" },
      { destination: "Rio de Janeiro, Brazil", country: "Brazil", startDate: "Feb 2020", endDate: null, notes: null, lat: "-22.9068", lng: "-43.1729", userId: "" },
      { destination: "Cairo, Egypt", country: "Egypt", startDate: "Mar 2015", endDate: null, notes: null, lat: "30.0444", lng: "31.2357", userId: "" },
    ];
    bulkImportMutation.mutate(sampleTrips as any);
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
            {/* Main Map Area */}
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
                        <span className="text-sm text-muted-foreground">Continents</span>
                        <span className="font-bold">4 / 7</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Countries</span>
                        <span className="font-bold" data-testid="text-country-count">{pastTrips.length}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Total Distance</span>
                        <span className="font-bold">42,503 km</span>
                      </div>
                   </CardContent>
                 </Card>
              </div>
            </div>

            {/* Sidebar: Upload & List */}
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
                      <CardDescription>Add trips from spreadsheets</CardDescription>
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
                              <div key={trip.id || i} className="relative pl-6 border-l border-border last:border-0" data-testid={`timeline-item-${i}`}>
                                 <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                                 <div className="mb-1 text-sm font-medium">{trip.destination}</div>
                                 <div className="text-xs text-muted-foreground flex items-center gap-1">
                                   <Calendar className="h-3 w-3" /> {trip.startDate || "Unknown"}
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
