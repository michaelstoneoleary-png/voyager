import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRIP_DATA } from "@/lib/mock-data";
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CloudSun, 
  CheckCircle2, 
  Plus, 
  Clock, 
  Wallet,
  MoreHorizontal
} from "lucide-react";
import heroTravel from "@/assets/hero-travel.png";
import kyotoImg from "@/assets/kyoto.png";
import tuscanyImg from "@/assets/tuscany.png";
import patagoniaImg from "@/assets/patagonia.png";

export default function Dashboard() {
  const upcomingTrips = [
    {
      id: "trip-2",
      title: "Kyoto: Autumn Colors",
      dates: "Nov 15 - Nov 24, 2026",
      image: kyotoImg,
      days: 10,
      cost: "$3,200",
      progress: 30,
      status: "Planning"
    },
    {
      id: "trip-3",
      title: "Tuscan Wine Tour",
      dates: "May 20 - May 30, 2027",
      image: tuscanyImg,
      days: 11,
      cost: "$4,500",
      progress: 10,
      status: "Dreaming"
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
      status: "Completed"
    }
  ];

  return (
    <Layout>
      <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Left Column: Actions & Active Trip (66%) */}
        <div className="flex-1 space-y-8">
          
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl font-bold">Welcome back, John</h1>
            <p className="text-muted-foreground text-sm hidden md:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* Start New Journey CTA */}
          <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative group cursor-pointer hover:bg-primary/95 transition-colors">
            <div className="absolute top-0 right-0 p-12 opacity-10 transform group-hover:scale-110 transition-transform duration-700">
              <MapPin className="w-48 h-48" />
            </div>
            <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
              <div>
                <h2 className="font-serif text-2xl font-bold mb-2">Where to next?</h2>
                <p className="text-primary-foreground/80 max-w-md">
                  Start planning your next adventure. AI-powered itineraries, smart packing lists, and route optimization.
                </p>
              </div>
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 font-medium whitespace-nowrap shadow-sm">
                <Plus className="mr-2 h-5 w-5" /> Start New Journey
              </Button>
            </CardContent>
          </Card>

          {/* Active Trip Section - Compact */}
          <div>
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-serif text-xl font-bold">Next Departure</h3>
               <Button variant="link" className="text-sm p-0 h-auto">View Itinerary <ArrowRight className="ml-1 h-4 w-4" /></Button>
            </div>
            
            <Card className="overflow-hidden border-sidebar-border hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-48 h-48 md:h-auto relative">
                   <img 
                     src={heroTravel} 
                     alt="Travel" 
                     className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                   />
                   <div className="absolute inset-0 bg-black/20" />
                   <Badge className="absolute top-3 left-3 bg-white/90 text-foreground backdrop-blur-sm shadow-sm border-0">
                      12 Days Away
                   </Badge>
                </div>
                
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <div>
                         <h3 className="font-serif text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
                           {TRIP_DATA.title}
                         </h3>
                         <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                           <Calendar className="h-3.5 w-3.5" /> {TRIP_DATA.dates}
                           <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                           <MapPin className="h-3.5 w-3.5" /> {TRIP_DATA.destinations.length} Stops
                         </div>
                       </div>
                       <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-2">
                         <MoreHorizontal className="h-4 w-4" />
                       </Button>
                    </div>
                    
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      A 10-day journey through the cultural heart of the Balkans. 
                      Highlights include Alexander Nevsky Cathedral, Rila Monastery, and Belgrade Fortress.
                    </p>
                  </div>

                  <div className="space-y-2">
                     <div className="flex justify-between text-xs font-medium">
                       <span>Trip Readiness</span>
                       <span>85%</span>
                     </div>
                     <Progress value={85} className="h-1.5" />
                     <div className="flex gap-3 mt-4 pt-4 border-t border-border">
                       <div className="flex-1 text-center border-r border-border">
                         <span className="block text-xs text-muted-foreground uppercase tracking-wider">Est. Cost</span>
                         <span className="font-semibold text-sm">$1,850</span>
                       </div>
                       <div className="flex-1 text-center border-r border-border">
                         <span className="block text-xs text-muted-foreground uppercase tracking-wider">Weather</span>
                         <span className="font-semibold text-sm">15-20°C</span>
                       </div>
                       <div className="flex-1 text-center">
                          <span className="block text-xs text-muted-foreground uppercase tracking-wider">Tasks</span>
                          <span className="font-semibold text-sm">3 Pending</span>
                       </div>
                     </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Weather Widget */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Card className="bg-sidebar/50 border-sidebar-border">
               <CardHeader className="pb-2">
                 <CardTitle className="text-base font-serif flex items-center gap-2">
                   <CloudSun className="h-4 w-4 text-amber-500" /> Weather Check
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="flex justify-between items-center">
                   <div>
                     <p className="text-sm font-medium">Sofia, Bulgaria</p>
                     <p className="text-xs text-muted-foreground">Arrival Forecast</p>
                   </div>
                   <div className="text-right">
                     <span className="text-2xl font-bold">18°C</span>
                     <p className="text-xs text-muted-foreground">Partly Cloudy</p>
                   </div>
                 </div>
               </CardContent>
             </Card>

             <Card className="bg-sidebar/50 border-sidebar-border">
               <CardHeader className="pb-2">
                 <CardTitle className="text-base font-serif flex items-center gap-2">
                   <CheckCircle2 className="h-4 w-4 text-primary" /> Pending Tasks
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <ul className="space-y-2">
                   <li className="text-sm flex items-center gap-2 text-muted-foreground">
                     <div className="h-1.5 w-1.5 rounded-full bg-destructive" />
                     Book Rila Monastery shuttle
                   </li>
                   <li className="text-sm flex items-center gap-2 text-muted-foreground">
                     <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                     Buy travel insurance
                   </li>
                 </ul>
               </CardContent>
             </Card>
          </div>

        </div>

        {/* Right Column: Library (33%) */}
        <div className="w-full lg:w-96 space-y-6">
          <div className="flex items-center justify-between">
             <h3 className="font-serif text-xl font-bold">Your Library</h3>
             <Button variant="ghost" size="sm" className="text-xs">View All</Button>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-4">
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="past">Past Trips</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upcoming" className="space-y-4 animate-in fade-in duration-300">
              {upcomingTrips.map(trip => (
                <Card key={trip.id} className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors">
                  <div className="aspect-[2/1] relative overflow-hidden">
                    <img 
                      src={trip.image} 
                      alt={trip.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                      <h4 className="font-serif text-lg font-bold text-white leading-none">{trip.title}</h4>
                      <Badge variant="secondary" className="text-[10px] h-5 bg-white/20 text-white border-0 backdrop-blur-sm">
                        {trip.status}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{trip.days} Days</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Wallet className="h-3.5 w-3.5" />
                        <span>{trip.cost}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Planning Progress</span>
                        <span>{trip.progress}%</span>
                      </div>
                      <Progress value={trip.progress} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              <Button variant="outline" className="w-full border-dashed h-12 text-muted-foreground hover:text-foreground">
                <Plus className="mr-2 h-4 w-4" /> Create New Plan
              </Button>
            </TabsContent>

            <TabsContent value="past" className="space-y-4 animate-in fade-in duration-300">
              {pastTrips.map(trip => (
                <Card key={trip.id} className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors opacity-75 hover:opacity-100">
                  <div className="aspect-[2/1] relative overflow-hidden">
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
            </TabsContent>
          </Tabs>

        </div>
      </div>
    </Layout>
  );
}
