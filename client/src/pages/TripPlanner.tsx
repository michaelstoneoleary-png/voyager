import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRIP_DATA } from "@/lib/mock-data";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Navigation, 
  Car, 
  Plane, 
  Utensils, 
  Camera, 
  Info,
  ChevronRight,
  Plus
} from "lucide-react";

export default function TripPlanner() {
  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold">Itinerary Planner</h1>
            <p className="text-muted-foreground">Drag and drop to reorder your journey</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline"><Calendar className="mr-2 h-4 w-4" /> Calendar View</Button>
            <Button><Plus className="mr-2 h-4 w-4" /> Add Activity</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Left Column: Itinerary Timeline */}
          <div className="lg:col-span-1 flex flex-col min-h-0 bg-card rounded-xl border border-border shadow-sm">
            <div className="p-4 border-b border-border">
              <Tabs defaultValue="day1" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="day1">Day 1</TabsTrigger>
                  <TabsTrigger value="day2">Day 2</TabsTrigger>
                  <TabsTrigger value="day3">Day 3</TabsTrigger>
                  <TabsTrigger value="day4">Day 4</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6 relative">
                {/* Timeline Line */}
                <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border z-0"></div>

                {TRIP_DATA.itinerary[0].activities.map((activity, idx) => (
                  <div key={idx} className="relative z-10 flex gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-primary flex items-center justify-center text-[10px] font-bold text-primary shadow-sm mt-1">
                      {idx + 1}
                    </div>
                    <Card className="flex-1 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary/50 hover:border-l-primary">
                      <CardContent className="p-3">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {activity.time}
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                            {activity.type}
                          </Badge>
                        </div>
                        <h4 className="font-serif font-medium text-lg leading-tight mb-1">{activity.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">
                          Approx. 2 hours • Walking distance
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Logistics Gap */}
                <div className="relative z-10 flex gap-4 ml-12 opacity-70">
                   <div className="p-3 w-full bg-sidebar rounded-lg border border-dashed border-sidebar-border text-center">
                     <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-2">
                       <Car className="h-3 w-3" /> 15 min travel time
                     </p>
                   </div>
                </div>

                <div className="relative z-10 flex gap-4 group">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-background border-2 border-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm mt-1">
                      4
                    </div>
                    <Card className="flex-1 border-dashed border-muted bg-transparent hover:bg-muted/30 transition-colors cursor-pointer flex items-center justify-center p-6">
                      <div className="text-center">
                        <Plus className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
                        <span className="text-sm text-muted-foreground font-medium">Add Activity</span>
                      </div>
                    </Card>
                  </div>
              </div>
            </ScrollArea>
          </div>

          {/* Right Column: Map & Details */}
          <div className="lg:col-span-2 flex flex-col gap-6">
             {/* Map Placeholder */}
             <div className="flex-1 bg-muted rounded-xl border border-border relative overflow-hidden group min-h-[300px]">
               <div className="absolute inset-0 bg-[url('https://api.mapbox.com/styles/v1/mapbox/outdoors-v11/static/23.3219,42.6977,12,0/800x600@2x?access_token=pk.eyJ1IjoibW9ja3VwIiwiYSI6ImNrdjR6b3F4djJ4aDIydnBtcjR4b3F4djIifQ.mockup')] bg-cover bg-center opacity-80 mix-blend-multiply grayscale-[20%] transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105" />
               <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
               
               {/* Map Markers Overlay (Mock) */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-primary rounded-full ring-4 ring-white shadow-lg animate-pulse" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-8 bg-white px-3 py-1 rounded shadow-lg text-xs font-bold transform -translate-x-1/2">
                 Alexander Nevsky Cathedral
               </div>

               <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow text-xs">
                 <div className="font-bold">Sofia City Center</div>
                 <div className="text-muted-foreground">Showing Day 1 Route</div>
               </div>
             </div>

             {/* Activity Details Panel */}
             <Card className="h-1/3 min-h-[200px]">
               <CardHeader className="pb-3">
                 <div className="flex justify-between items-start">
                   <div>
                     <CardTitle className="text-xl font-serif">Alexander Nevsky Cathedral</CardTitle>
                     <CardDescription className="flex items-center gap-1 mt-1">
                       <MapPin className="h-3 w-3" /> St. Alexander Nevsky Square, Sofia
                     </CardDescription>
                   </div>
                   <Badge>Must See</Badge>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Hours</span>
                      <p className="font-medium">07:00 - 19:00</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Cost</span>
                      <p className="font-medium">Free (Museum 10 BGN)</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-muted-foreground text-xs uppercase tracking-wider">Note</span>
                      <p className="font-medium text-orange-600 flex items-center gap-1">
                        <Info className="h-3 w-3" /> Dress modestly
                      </p>
                    </div>
                 </div>
                 <div className="mt-4 flex gap-2">
                   <Button variant="outline" size="sm" className="w-full">View Website</Button>
                   <Button variant="default" size="sm" className="w-full">Get Directions</Button>
                 </div>
               </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
