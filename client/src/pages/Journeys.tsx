import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock, 
  Wallet,
  MoreHorizontal,
  Plus,
  Info,
  TrendingUp,
  Users
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { NewTripDialog } from "@/components/NewTripDialog";
import { Link } from "wouter";
import { useTrips } from "@/lib/TripContext";

const DEFAULT_IMAGE = "/images/destinations/city.jpg";

export default function Journeys() {
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const { trips } = useTrips();

  const upcomingJourneys = trips.filter(t => t.status !== "Completed");
  const pastJourneys = trips.filter(t => t.status === "Completed");

  return (
    <>
      <NewTripDialog 
        open={isNewTripOpen} 
        onOpenChange={(open) => {
          console.log("Dialog open change:", open);
          setIsNewTripOpen(open);
        }} 
      />
      
      <Layout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold">Your Journeys</h1>
              <p className="text-muted-foreground">Manage your upcoming adventures and relive past memories.</p>
            </div>
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              onClick={() => {
                console.log("Opening new trip dialog");
                setIsNewTripOpen(true);
              }}
            >
               <Plus className="mr-2 h-5 w-5" /> Start New Journey
            </Button>
          </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming & Planning</TabsTrigger>
            <TabsTrigger value="past">Past Journeys</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingJourneys.map(trip => (
                <Dialog key={trip.id}>
                  <DialogTrigger asChild>
                    <Card className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-full text-left">
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <img 
                          src={trip.image || DEFAULT_IMAGE} 
                          alt={trip.title} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                           {trip.priceAlert?.status === "Price Drop" && (
                             <Badge className="bg-emerald-500/90 hover:bg-emerald-500 border-0 text-white backdrop-blur-sm animate-pulse">
                               <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> Price Drop
                             </Badge>
                           )}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                          <Badge variant="secondary" className="text-[10px] h-5 bg-white/20 text-white border-0 backdrop-blur-sm shadow-sm">
                            {trip.status}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-primary transition-colors">{trip.title}</h3>
                           <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground">
                             <MoreHorizontal className="h-4 w-4" />
                           </Button>
                        </div>
                        
                        <div className="text-sm text-muted-foreground mb-4 space-y-1">
                           <div className="flex items-center gap-2">
                             <Calendar className="h-3.5 w-3.5" /> {trip.dates}
                           </div>
                           <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {trip.days} Days</span>
                              <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {trip.cost}</span>
                           </div>
                        </div>

                        <div className="mt-auto space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>Planning Progress</span>
                            <span>{trip.progress}%</span>
                          </div>
                          <Progress value={trip.progress} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-[600px] overflow-hidden p-0">
                    <div className="relative h-48 w-full">
                      <img 
                        src={trip.image || DEFAULT_IMAGE} 
                        alt={trip.title} 
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute bottom-6 left-6 text-white">
                        <Badge className="mb-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                          {trip.status}
                        </Badge>
                        <DialogTitle className="font-serif text-3xl font-bold text-white">{trip.title}</DialogTitle>
                        <div className="flex items-center gap-4 text-sm mt-1 opacity-90">
                           <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {trip.dates}</span>
                           <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {trip.days} Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Seasonality Insight */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trip.seasonality && (
                        <div className="bg-muted/30 rounded-xl p-4 border border-border">
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="font-medium flex items-center gap-2 text-primary">
                               <Info className="h-4 w-4" /> Seasonality
                             </h4>
                             {(trip.seasonality as any).peak_season ? (
                               <Badge variant="secondary" className="font-mono text-[10px]">
                                 {(trip.seasonality as any).peak_season}
                               </Badge>
                             ) : (trip.seasonality as any).type && (
                               <Badge variant={(trip.seasonality as any).type === "Peak Season" ? "destructive" : "secondary"} className="font-mono text-[10px]">
                                 {(trip.seasonality as any).weatherIcon} {(trip.seasonality as any).type}
                               </Badge>
                             )}
                           </div>
                           <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                             {(trip.seasonality as any).tip || (trip.seasonality as any).description || ""}
                           </p>
                           {(trip.seasonality as any).best_months && (
                             <div className="flex flex-wrap gap-1 mb-2">
                               {((trip.seasonality as any).best_months as string[]).slice(0, 4).map((m: string) => (
                                 <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                               ))}
                             </div>
                           )}
                           {(trip.seasonality as any).crowdLevel && (
                             <div className="flex items-center gap-2 text-xs font-medium bg-background/50 p-2 rounded-lg w-fit">
                               <Users className="h-3 w-3 text-muted-foreground" />
                               Crowds: <span className={(trip.seasonality as any).crowdLevel?.includes("High") ? "text-orange-600" : "text-emerald-600"}>{(trip.seasonality as any).crowdLevel}</span>
                             </div>
                           )}
                        </div>
                        )}

                        <div className="space-y-4">
                           {/* Price Alert Widget */}
                           {trip.priceAlert && (
                             <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Price Watch
                                  </h4>
                                  <Badge variant="outline" className={trip.priceAlert?.trend === "down" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-orange-600 border-orange-200 bg-orange-50"}>
                                    {trip.priceAlert?.recommendation}
                                  </Badge>
                                </div>
                                <div className="flex items-baseline justify-between">
                                   <div>
                                     <p className="text-2xl font-bold font-mono">{trip.priceAlert?.currentPrice}</p>
                                     <p className="text-xs text-muted-foreground">Checked today</p>
                                   </div>
                                   <div className={`text-sm font-bold ${trip.priceAlert?.trend === "down" ? "text-emerald-600" : "text-orange-600"}`}>
                                     {trip.priceAlert?.amount}
                                   </div>
                                </div>
                             </div>
                           )}

                           {/* Logistics Mini-Grid */}
                           {trip.logistics && (
                             <div className="space-y-3">
                               <div className="grid grid-cols-2 gap-3">
                                  {(trip.logistics as any)?.visa && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Visa</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).visa}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.currency && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Currency</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).currency}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.timezone && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Timezone</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).timezone}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.language && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Language</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).language}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.health && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Health</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).health}</p>
                                    </div>
                                  )}
                               </div>
                               {(trip.logistics as any)?.budget_notes && (
                                 <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                   <span className="text-[10px] uppercase text-amber-700 dark:text-amber-400 font-bold">Budget Notes</span>
                                   <p className="text-sm text-amber-900 dark:text-amber-200">{(trip.logistics as any).budget_notes}</p>
                                 </div>
                               )}
                               {Array.isArray((trip.logistics as any)?.travel_tips) && (trip.logistics as any).travel_tips.length > 0 && (
                                 <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                   <span className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Travel Tips</span>
                                   <ul className="text-sm text-muted-foreground space-y-1">
                                     {((trip.logistics as any).travel_tips as string[]).map((tip: string, idx: number) => (
                                       <li key={idx} className="flex items-start gap-2">
                                         <span className="text-primary mt-0.5">•</span> {tip}
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                               )}
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Button className="flex-1 bg-primary hover:bg-primary/90">
                          Edit Itinerary
                        </Button>
                        <Button variant="outline" className="flex-1">View Bookings</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
              
              <Button 
                variant="outline" 
                className="h-full min-h-[300px] flex flex-col gap-4 border-dashed text-muted-foreground hover:text-foreground hover:bg-muted/30 cursor-pointer w-full"
                onClick={() => {
                  console.log("Opening new trip dialog from card");
                  setIsNewTripOpen(true);
                }}
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium text-lg">Create New Plan</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border">
               <div>
                 <h3 className="font-medium">Manage Your Travel History</h3>
                 <p className="text-sm text-muted-foreground">Import trips from spreadsheets, visualize your world map, and see your travel stats.</p>
               </div>
               <Link href="/history">
                 <Button variant="outline">Manage Past Journeys</Button>
               </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastJourneys.map(trip => (
                <Card key={trip.id} className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors opacity-80 hover:opacity-100">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img 
                      src={trip.image || DEFAULT_IMAGE} 
                      alt={trip.title} 
                      className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-3 left-3 text-white">
                      <h4 className="font-serif text-lg font-bold">{trip.title}</h4>
                      <p className="text-xs opacity-80">{trip.dates}</p>
                    </div>
                  </div>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{trip.days} Days</span> • {trip.cost}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {trip.status}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      </Layout>
    </>
  );
}
