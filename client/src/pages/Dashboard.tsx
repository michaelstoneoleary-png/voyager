import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TRIP_DATA } from "@/lib/mock-data";
import { 
  Calendar, 
  MapPin, 
  ArrowRight, 
  CloudSun, 
  CheckCircle2, 
  Plus, 
  Wallet,
  MoreHorizontal,
  Sparkles,
  Lightbulb,
  ArrowUpRight
} from "lucide-react";
import heroTravel from "@/assets/hero-travel.png";

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header with Start New Trip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold">Welcome back, Jennifer</h1>
            <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
             <Plus className="mr-2 h-5 w-5" /> Start New Journey
          </Button>
        </div>

        {/* Compact Synergy Alert */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-4 shadow-sm">
           <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-full text-amber-700 dark:text-amber-400 flex-shrink-0">
             <Sparkles className="h-5 w-5" />
           </div>
           <div className="flex-1">
             <div className="flex items-center gap-2 mb-1">
               <h3 className="font-serif font-bold text-amber-900 dark:text-amber-100 text-sm">Trip Synergy Detected</h3>
               <Badge variant="outline" className="border-amber-500 text-amber-700 bg-amber-100/50 text-[10px] h-5 px-1.5">Opportunity</Badge>
             </div>
             <p className="text-amber-800 dark:text-amber-200 text-xs md:text-sm">
               Combine <strong>Tuscan Wine Tour</strong> with <strong>Cinque Terre</strong> to save ~$850.
             </p>
           </div>
           <Button variant="ghost" size="sm" className="text-amber-700 hover:text-amber-900 hover:bg-amber-100/50 h-8 text-xs">
             View Details <ArrowRight className="ml-1 h-3 w-3" />
           </Button>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Trip Hero (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
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
              </div>
            </Card>

            {/* Quick Stats / Upcoming Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Pending Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex gap-3 items-center">
                        <div className="h-2 w-2 rounded-full bg-destructive" />
                        <span className="text-sm font-medium">Book Rila Monastery shuttle</span>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-sm text-muted-foreground">Review travel insurance options</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Packing Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="flex items-end justify-between mb-2">
                       <span className="text-2xl font-bold">45%</span>
                       <span className="text-xs text-muted-foreground">12 items remaining</span>
                     </div>
                     <Progress value={45} className="h-2" />
                  </CardContent>
                </Card>
            </div>
          </div>

          {/* Right Column: Mini Widgets (1/3 width) */}
          <div className="space-y-6">
            <Card className="bg-sidebar border-sidebar-border">
              <CardHeader>
                <CardTitle className="font-serif text-lg">Travel Intel</CardTitle>
                <CardDescription>Latest updates for your destinations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-3 bg-background rounded-lg border border-border">
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-bold text-primary">Bulgaria</span>
                     <span className="text-[10px] text-muted-foreground">2h ago</span>
                   </div>
                   <p className="text-sm text-muted-foreground">Public transport strike expected on Oct 15 in Sofia. Check alternative routes.</p>
                </div>
                <div className="p-3 bg-background rounded-lg border border-border">
                   <div className="flex items-center justify-between mb-1">
                     <span className="text-xs font-bold text-primary">Currency</span>
                     <span className="text-[10px] text-muted-foreground">Live</span>
                   </div>
                   <p className="text-sm text-muted-foreground">1 USD = 1.78 BGN. Favorable rate compared to last month.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader>
                <CardTitle className="font-serif text-lg text-primary">Explore</CardTitle>
                <CardDescription>Trending destinations for you</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="aspect-video rounded-md bg-muted mb-3 relative overflow-hidden group cursor-pointer">
                   <img 
                     src="https://images.unsplash.com/photo-1499678329028-101435549a4e?q=80&w=2070&auto=format&fit=crop" 
                     alt="Tuscany" 
                     className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                   />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                   <div className="absolute bottom-2 left-2 text-white font-bold text-sm shadow-sm">Tuscany in May</div>
                 </div>
                 <Button variant="link" className="px-0 text-primary h-auto text-xs">View 3 more recommendations</Button>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
