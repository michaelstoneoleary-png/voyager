import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
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
  MoreHorizontal,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight
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
      <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-[calc(100vh-8rem)]">
        
        {/* Left Column: Trip Library (Sidebar Style) */}
        <div className="w-full lg:w-80 flex flex-col gap-6 lg:border-r border-border pr-0 lg:pr-6 min-h-0">
          <div className="flex-shrink-0">
             <h2 className="font-serif text-xl font-bold mb-1">Your Journeys</h2>
             <p className="text-xs text-muted-foreground">3 Upcoming • 1 Past</p>
          </div>

          <Button variant="outline" className="w-full justify-start border-dashed text-muted-foreground hover:text-foreground">
             <Plus className="mr-2 h-4 w-4" /> Start New Trip
          </Button>

          <ScrollArea className="flex-1 -mr-4 pr-4">
            <div className="space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h3>
              
              {/* Active Trip Mini-Card */}
              <div className="group flex gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20 cursor-pointer hover:bg-primary/10 transition-colors">
                 <div className="h-16 w-16 rounded-md overflow-hidden relative flex-shrink-0">
                   <img src={heroTravel} className="object-cover w-full h-full" alt="Balkan" />
                 </div>
                 <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-start">
                     <h4 className="font-serif font-bold text-sm truncate text-primary">Balkan Odyssey</h4>
                     <Badge className="text-[10px] h-4 px-1 bg-primary text-primary-foreground">Next</Badge>
                   </div>
                   <p className="text-xs text-muted-foreground truncate">12 days away</p>
                   <Progress value={85} className="h-1 mt-2 bg-primary/20" />
                 </div>
              </div>

              {upcomingTrips.map(trip => (
                <div key={trip.id} className="group flex gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-transparent hover:border-border">
                   <div className="h-14 w-14 rounded-md overflow-hidden relative flex-shrink-0">
                     <img src={trip.image} className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all" alt={trip.title} />
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <h4 className="font-medium text-sm truncate group-hover:text-primary transition-colors">{trip.title}</h4>
                     <p className="text-xs text-muted-foreground">{trip.dates.split(' - ')[0]}</p>
                   </div>
                </div>
              ))}

              <Separator className="my-4" />
              
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Past Memories</h3>
              {pastTrips.map(trip => (
                <div key={trip.id} className="group flex gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors opacity-70 hover:opacity-100">
                   <div className="h-12 w-12 rounded-md overflow-hidden relative flex-shrink-0">
                     <img src={trip.image} className="object-cover w-full h-full grayscale" alt={trip.title} />
                   </div>
                   <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <h4 className="font-medium text-sm truncate">{trip.title}</h4>
                     <p className="text-xs text-muted-foreground">Completed Jan 2025</p>
                   </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-8 min-h-0 overflow-y-auto pr-2">
          
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-3xl font-bold">Welcome back, Jennifer</h1>
            <p className="text-muted-foreground text-sm hidden md:block">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          {/* AI Synergy Alert */}
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-xl p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Sparkles className="w-32 h-32 text-amber-600" />
            </div>
            
            <div className="relative z-10 flex gap-4 items-start">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-700 dark:text-amber-400">
                <Lightbulb className="h-6 w-6" />
              </div>
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-lg text-amber-900 dark:text-amber-100">Trip Synergy Detected</h3>
                  <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-100/50">High Value Opportunity</Badge>
                </div>
                <p className="text-amber-800 dark:text-amber-200 text-sm leading-relaxed">
                  We noticed your <strong>Tuscan Wine Tour</strong> (May 2027) is geographically close to your dream destination <strong>Cinque Terre</strong>.
                </p>
                
                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-sm space-y-2 border border-amber-200/50">
                  <div className="flex items-center gap-2 font-medium text-amber-900 dark:text-amber-100">
                    <ArrowUpRight className="h-4 w-4" />
                    Missed Opportunity: Combine Trips
                  </div>
                  <ul className="list-disc list-inside text-amber-800/80 dark:text-amber-200/80 text-xs space-y-1 ml-1">
                    <li>Save approx. <strong>$850</strong> in future airfare by extending your Tuscany trip by 3 days.</li>
                    <li>Direct train connection available from Florence (2.5 hrs).</li>
                    <li>May is optimal shoulder season for both locations.</li>
                  </ul>
                  <Button size="sm" variant="outline" className="mt-2 bg-white/50 border-amber-300 text-amber-900 hover:bg-amber-100">
                    Apply Synergy to Plan
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Trip Hero (Redesigned) */}
          <div>
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                 <MapPin className="h-5 w-5 text-primary" /> Current Focus
               </h3>
               <div className="text-xs text-muted-foreground">
                 Last edited 2 hours ago
               </div>
            </div>
            
            <Card className="overflow-hidden border-sidebar-border shadow-md group relative">
              <div className="absolute top-0 right-0 w-1/2 h-full">
                 <img 
                   src={heroTravel} 
                   alt="Travel" 
                   className="w-full h-full object-cover opacity-20 mask-image-linear-to-l" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background" />
              </div>

              <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-6">
                   <div>
                     <Badge className="mb-2 bg-accent text-accent-foreground border-0">12 Days to Departure</Badge>
                     <h2 className="font-serif text-4xl font-bold text-foreground mb-2">
                       {TRIP_DATA.title}
                     </h2>
                     <div className="flex items-center gap-4 text-sm text-muted-foreground">
                       <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {TRIP_DATA.dates}</span>
                       <span className="flex items-center gap-1"><Wallet className="h-4 w-4" /> $1,850 Est.</span>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Weather</span>
                        <div className="font-medium flex items-center gap-2">
                          <CloudSun className="h-4 w-4 text-amber-500" /> 18°C Sunny
                        </div>
                      </div>
                      <div className="bg-muted/30 p-3 rounded-lg border border-border">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
                        <div className="font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary" /> 85% Ready
                        </div>
                      </div>
                   </div>

                   <div className="flex gap-3 pt-2">
                     <Button className="shadow-sm">Open Itinerary</Button>
                     <Button variant="outline">View Packing List</Button>
                   </div>
                </div>

                {/* Vertical Progress Step */}
                <div className="w-full md:w-64 bg-card rounded-xl border border-border p-4 shadow-sm">
                  <h4 className="font-medium mb-3 text-sm">Action Items</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 h-4 w-4 rounded-full border border-primary flex items-center justify-center bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span className="text-sm line-through text-muted-foreground">Book flights</span>
                    </div>
                    <div className="flex gap-3 items-start">
                      <div className="mt-0.5 h-4 w-4 rounded-full border border-primary flex items-center justify-center bg-primary text-primary-foreground">
                        <CheckCircle2 className="h-3 w-3" />
                      </div>
                      <span className="text-sm line-through text-muted-foreground">Reserve hotels</span>
                    </div>
                    <div className="flex gap-3 items-start animate-pulse">
                      <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <span className="text-sm font-medium">Book Rila Monastery shuttle</span>
                    </div>
                    <div className="flex gap-3 items-start opacity-50">
                      <div className="mt-0.5 h-4 w-4 rounded-full border border-muted-foreground flex items-center justify-center">
                      </div>
                      <span className="text-sm text-muted-foreground">Buy insurance</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
