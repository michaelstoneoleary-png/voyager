import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TRIP_DATA } from "@/lib/mock-data";
import { Calendar, MapPin, ArrowRight, CloudSun, CheckCircle2 } from "lucide-react";
import heroTravel from "@/assets/hero-travel.png";

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Welcome Hero */}
        <section className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-lg group">
          <div className="absolute inset-0 z-0">
             <img 
               src={heroTravel} 
               alt="Travel" 
               className="w-full h-full object-cover opacity-40 mix-blend-overlay transition-transform duration-1000 group-hover:scale-105" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/30" />
          </div>
          
          <div className="relative z-10 p-8 md:p-12 max-w-2xl">
            <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 mb-4 backdrop-blur-sm">
              Upcoming Trip • 12 Days Away
            </Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 leading-tight">
              Ready for your <br/>
              <span className="text-accent italic">{TRIP_DATA.title}?</span>
            </h1>
            <p className="text-primary-foreground/90 text-lg mb-8 leading-relaxed max-w-lg">
              Your itinerary is 85% complete. We've curated a list of hidden gems in Sofia and tailored your packing list for the mountain weather.
            </p>
            <div className="flex gap-4">
              <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 border-0 font-medium">
                View Itinerary
              </Button>
              <Button size="lg" variant="outline" className="text-white border-white/30 hover:bg-white/10 hover:text-white backdrop-blur-sm">
                Check Packing List
              </Button>
            </div>
          </div>
        </section>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trip Duration</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10 Days</div>
              <p className="text-xs text-muted-foreground mt-1">
                Oct 12 - Oct 22, 2026
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Destinations</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{TRIP_DATA.destinations.length} Stops</div>
              <p className="text-xs text-muted-foreground mt-1">
                Bulgaria & Serbia
              </p>
            </CardContent>
          </Card>
          
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Readiness</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">85%</div>
                <span className="text-xs text-muted-foreground">Prepared</span>
              </div>
              <Progress value={85} className="mt-2 h-2" />
            </CardContent>
          </Card>
        </div>

        {/* Destinations Preview */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-serif text-2xl font-bold">Your Route</h2>
            <Button variant="ghost" className="text-sm">View Full Map <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRIP_DATA.destinations.map((dest, index) => (
              <div key={dest.id} className="group relative aspect-[3/4] overflow-hidden rounded-xl cursor-pointer">
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                
                <div className="absolute bottom-0 left-0 p-4 text-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider">
                      Stop {index + 1}
                    </span>
                    <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-medium">
                      {dest.days} Days
                    </span>
                  </div>
                  <h3 className="font-serif text-xl font-bold mb-1">{dest.name}</h3>
                  <p className="text-xs text-white/80 line-clamp-2">
                    {dest.highlights.join(" • ")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weather Insight */}
        <Card className="bg-sidebar border-sidebar-border overflow-hidden">
           <CardContent className="p-0 flex flex-col md:flex-row">
             <div className="p-6 md:p-8 flex-1">
               <h3 className="font-serif text-xl font-bold mb-2 flex items-center gap-2">
                 <CloudSun className="h-5 w-5 text-amber-500" />
                 Weather Forecast
               </h3>
               <p className="text-muted-foreground mb-4">
                 Expect cool autumn weather. Days will be crisp (15-18°C) with chilly evenings. 
                 Perfect for hiking Vitosha but pack layers for city walks.
               </p>
               <div className="flex gap-4">
                 <div className="text-center p-3 bg-background rounded-lg border border-border">
                    <span className="block text-xs text-muted-foreground uppercase">Sofia</span>
                    <span className="font-bold text-lg">18°C</span>
                 </div>
                 <div className="text-center p-3 bg-background rounded-lg border border-border">
                    <span className="block text-xs text-muted-foreground uppercase">Rila</span>
                    <span className="font-bold text-lg">12°C</span>
                 </div>
                 <div className="text-center p-3 bg-background rounded-lg border border-border">
                    <span className="block text-xs text-muted-foreground uppercase">Belgrade</span>
                    <span className="font-bold text-lg">20°C</span>
                 </div>
               </div>
             </div>
             <div className="bg-sidebar-accent/50 p-6 md:p-8 md:w-1/3 flex flex-col justify-center border-t md:border-t-0 md:border-l border-sidebar-border">
               <h4 className="font-medium mb-2">Packing Tip</h4>
               <p className="text-sm text-muted-foreground">
                 "Because of the temperature drop in the mountains, we've added a <strong>light thermal layer</strong> to your packing list."
               </p>
               <Button variant="link" className="self-start px-0 mt-2 text-primary">Update Packing List &rarr;</Button>
             </div>
           </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
