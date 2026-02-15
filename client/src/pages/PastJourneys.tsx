import { useState } from "react";
import { Layout } from "@/components/Layout";
import { WorldMap } from "@/components/WorldMap";
import { FileUpload } from "@/components/FileUpload";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Globe, Map as MapIcon, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for initial state
const INITIAL_VISITED_PLACES = [
  { lat: 48.8566, lng: 2.3522, name: "Paris, France", date: "June 2023" },
  { lat: 35.6762, lng: 139.6503, name: "Tokyo, Japan", date: "April 2019" },
  { lat: 40.7128, lng: -74.0060, name: "New York, USA", date: "Dec 2024" },
  { lat: 51.5074, lng: -0.1278, name: "London, UK", date: "Sept 2022" },
  { lat: -33.8688, lng: 151.2093, name: "Sydney, Australia", date: "Jan 2018" },
  { lat: 41.9028, lng: 12.4964, name: "Rome, Italy", date: "May 2023" },
];

export default function PastJourneys() {
  const [visitedPlaces, setVisitedPlaces] = useState(INITIAL_VISITED_PLACES);
  const { toast } = useToast();

  const handleUploadComplete = (files: File[]) => {
    // Simulate parsing the file and adding new places
    setTimeout(() => {
      const newPlaces = [
        { lat: 13.7563, lng: 100.5018, name: "Bangkok, Thailand", date: "Nov 2017" },
        { lat: -22.9068, lng: -43.1729, name: "Rio de Janeiro, Brazil", date: "Feb 2020" },
        { lat: 30.0444, lng: 31.2357, name: "Cairo, Egypt", date: "Mar 2015" }
      ];
      
      setVisitedPlaces(prev => [...prev, ...newPlaces]);
      
      toast({
        title: "Import Successful",
        description: `Successfully imported ${newPlaces.length} trips from ${files[0].name}.`,
      });
    }, 500);
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
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" /> Export Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Map Area */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="overflow-hidden border-sidebar-border">
              <CardHeader className="pb-2">
                 <div className="flex items-center justify-between">
                   <CardTitle className="font-serif text-xl flex items-center gap-2">
                     <Globe className="h-5 w-5 text-primary" /> World Map
                   </CardTitle>
                   <Badge variant="secondary" className="font-mono">{visitedPlaces.length} Cities Visited</Badge>
                 </div>
              </CardHeader>
              <CardContent className="p-0">
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
                      <span className="font-bold">12</span>
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
            <Card className="border-sidebar-border">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Import History</CardTitle>
                <CardDescription>Add trips from spreadsheets</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onUploadComplete={handleUploadComplete} />
              </CardContent>
            </Card>

            <Card className="border-sidebar-border h-[400px] flex flex-col">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Timeline</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[300px]">
                  <div className="px-6 pb-6 space-y-6">
                    {[...visitedPlaces].sort((a, b) => (a.date > b.date ? -1 : 1)).map((place, i) => (
                      <div key={i} className="relative pl-6 border-l border-border last:border-0">
                         <div className="absolute left-[-5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                         <div className="mb-1 text-sm font-medium">{place.name}</div>
                         <div className="text-xs text-muted-foreground flex items-center gap-1">
                           <Calendar className="h-3 w-3" /> {place.date}
                         </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
