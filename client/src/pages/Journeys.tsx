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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Assets - using what we have available
import kyotoImg from "@/assets/kyoto.png";
import tuscanyImg from "@/assets/tuscany.png";
import patagoniaImg from "@/assets/patagonia.png";
import heroTravel from "@/assets/hero-travel.png";

export default function Journeys() {
  const upcomingTrips = [
    {
      id: "trip-1",
      title: "Balkan Odyssey",
      dates: "Oct 12 - Oct 22, 2026",
      image: heroTravel,
      days: 10,
      cost: "$1,850",
      progress: 85,
      status: "Upcoming",
      seasonality: {
        type: "Shoulder Season",
        description: "Great choice! October offers cooler temperatures and fewer crowds compared to summer. You'll catch the beautiful autumn foliage in the Rila mountains.",
        crowdLevel: "Low",
        weatherIcon: "🍂"
      },
      priceAlert: {
        status: "Price Drop",
        amount: "-$120",
        trend: "down",
        currentPrice: "$850 (Flights)",
        recommendation: "Book Now"
      },
      logistics: {
        visa: "Visa Free",
        health: "Standard"
      }
    },
    {
      id: "trip-2",
      title: "Kyoto: Autumn Colors",
      dates: "Nov 15 - Nov 24, 2026",
      image: kyotoImg,
      days: 10,
      cost: "$3,200",
      progress: 30,
      status: "Planning",
      seasonality: {
        type: "Peak Season",
        description: "You are visiting during the famous Momiji (maple leaf) season. Expect heavy crowds at major temples, but the scenery will be breathtaking.",
        crowdLevel: "Very High",
        weatherIcon: "🍁"
      },
      priceAlert: {
        status: "Tracking",
        amount: "+$50",
        trend: "stable",
        currentPrice: "$1,200 (Flights)",
        recommendation: "Wait"
      },
      logistics: {
        visa: "e-Visa Required",
        health: "None"
      }
    },
    {
      id: "trip-3",
      title: "Tuscan Wine Tour",
      dates: "May 20 - May 30, 2027",
      image: tuscanyImg,
      days: 11,
      cost: "$4,500",
      progress: 10,
      status: "Dreaming",
      seasonality: {
        type: "Shoulder Season",
        description: "Late May is perfect. The rolling hills are vibrant green, poppies are in bloom, and it's warm enough for al fresco dining without the intense summer heat.",
        crowdLevel: "Moderate",
        weatherIcon: "🌤️"
      },
      priceAlert: {
        status: "High Demand",
        amount: "+$200",
        trend: "up",
        currentPrice: "$1,400 (Flights)",
        recommendation: "Book Soon"
      },
      logistics: {
        visa: "Schengen",
        health: "Standard"
      }
    }
  ];

  const pastTrips = [
    {
      id: "trip-4",
      title: "Patagonia Trek",
      dates: "Jan 10 - Jan 24, 2025",
      image: patagoniaImg,
      days: 14,
      cost: "$2,800",
      progress: 100,
      status: "Completed",
      seasonality: {
        type: "Peak Season",
        description: "January is peak summer in Patagonia, offering the best hiking weather but requiring bookings months in advance.",
        crowdLevel: "High",
        weatherIcon: "🏔️"
      }
    }
  ];

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-serif text-3xl font-bold">Your Journeys</h1>
            <p className="text-muted-foreground">Manage your upcoming adventures and relive past memories.</p>
          </div>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
             <Plus className="mr-2 h-5 w-5" /> Start New Journey
          </Button>
        </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="upcoming">Upcoming & Planning</TabsTrigger>
            <TabsTrigger value="past">Past Trips</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingTrips.map(trip => (
                <Dialog key={trip.id}>
                  <DialogTrigger asChild>
                    <Card className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-full text-left">
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <img 
                          src={trip.image} 
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
                        src={trip.image} 
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
                        <div className="bg-muted/30 rounded-xl p-4 border border-border">
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="font-medium flex items-center gap-2 text-primary">
                               <Info className="h-4 w-4" /> Seasonality
                             </h4>
                             <Badge variant={trip.seasonality.type === "Peak Season" ? "destructive" : "secondary"} className="font-mono text-[10px]">
                               {trip.seasonality.weatherIcon} {trip.seasonality.type}
                             </Badge>
                           </div>
                           <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                             {trip.seasonality.description}
                           </p>
                           <div className="flex items-center gap-2 text-xs font-medium bg-background/50 p-2 rounded-lg w-fit">
                             <Users className="h-3 w-3 text-muted-foreground" />
                             Crowds: <span className={trip.seasonality.crowdLevel.includes("High") ? "text-orange-600" : "text-emerald-600"}>{trip.seasonality.crowdLevel}</span>
                           </div>
                        </div>

                        <div className="space-y-4">
                           {/* Price Alert Widget */}
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

                           {/* Logistics Mini-Grid */}
                           <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold">Visa</span>
                                <p className="text-sm font-medium">{trip.logistics?.visa}</p>
                              </div>
                              <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                <span className="text-[10px] uppercase text-muted-foreground font-bold">Health</span>
                                <p className="text-sm font-medium">{trip.logistics?.health}</p>
                              </div>
                           </div>
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
              
              <Button variant="outline" className="h-full min-h-[300px] flex flex-col gap-4 border-dashed text-muted-foreground hover:text-foreground hover:bg-muted/30">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium text-lg">Create New Plan</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastTrips.map(trip => (
                <Card key={trip.id} className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors opacity-80 hover:opacity-100">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img 
                      src={trip.image} 
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
  );
}
