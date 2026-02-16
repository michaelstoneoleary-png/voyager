import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Calendar, 
  MapPin, 
  CloudSun, 
  CheckCircle2, 
  Plus, 
  Wallet,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTrips } from "@/lib/TripContext";
import heroTravel from "@/assets/hero-travel.png";
import { NewTripDialog } from "@/components/NewTripDialog";
import { useState } from "react";
import { Link } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const { trips } = useTrips();

  const firstName = user?.firstName || "Traveler";
  const planningTrip = trips.find(t => t.status === "Upcoming" || t.status === "Planning");
  const activeTrip = planningTrip || trips[0];

  return (
    <>
      <NewTripDialog 
        open={isNewTripOpen} 
        onOpenChange={setIsNewTripOpen} 
      />
      <Layout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header with Start New Trip */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold" data-testid="text-welcome">Welcome back, {firstName}</h1>
              <p className="text-muted-foreground text-sm">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <Button 
              size="lg" 
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              onClick={() => setIsNewTripOpen(true)}
              data-testid="button-new-journey"
            >
               <Plus className="mr-2 h-5 w-5" /> Start New Journey
            </Button>
          </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Trip Hero (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="font-serif text-xl font-bold flex items-center gap-2">
                 <MapPin className="h-5 w-5 text-primary" /> {planningTrip ? "Current Focus" : "Recent Journey"}
               </h3>
               <div className="text-xs text-muted-foreground">
                 Last edited 2 hours ago
               </div>
            </div>
            
            {activeTrip ? (
              <Card className="overflow-hidden border-sidebar-border shadow-md group relative">
                <div className="absolute top-0 right-0 w-1/2 h-full">
                   <img 
                     src={activeTrip.image || heroTravel} 
                     alt="Travel" 
                     className="w-full h-full object-cover opacity-60 mask-image-linear-to-l" 
                   />
                   <div className="absolute inset-0 bg-gradient-to-l from-transparent to-background" />
                </div>

                <div className="relative z-10 p-6 md:p-8 flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-6">
                     <div>
                       <Badge className={`mb-2 border-0 ${activeTrip.status === "Completed" ? "bg-emerald-100 text-emerald-800" : "bg-accent text-accent-foreground"}`}>
                         {activeTrip.status === "Completed" ? "Completed Journey" : activeTrip.status === "Upcoming" ? "Upcoming Trip" : "In Planning Phase"}
                       </Badge>
                       <h2 className="font-serif text-4xl font-bold text-foreground mb-2" data-testid="text-active-trip-title">
                         {activeTrip.title}
                       </h2>
                       <div className="flex items-center gap-4 text-sm text-muted-foreground">
                         <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {activeTrip.dates}</span>
                         <span className="flex items-center gap-1"><Wallet className="h-4 w-4" /> {activeTrip.cost} Est.</span>
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/30 p-3 rounded-lg border border-border">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Duration</span>
                          <div className="font-medium flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" /> {activeTrip.days} days
                          </div>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-lg border border-border">
                          <span className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Status</span>
                          <div className="font-medium flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-primary" /> {activeTrip.status === "Completed" ? "Completed" : `${activeTrip.progress}% Ready`}
                          </div>
                        </div>
                     </div>

                     <div className="flex gap-3 pt-2">
                       <Link href={`/planner/${activeTrip.id}`}><Button className="shadow-sm" data-testid="button-open-itinerary">{activeTrip.status === "Completed" ? "View Itinerary" : "Open Itinerary"}</Button></Link>
                       {activeTrip.status === "Completed" ? (
                         <Button variant="outline" onClick={() => setIsNewTripOpen(true)} data-testid="button-plan-new">Plan New Trip</Button>
                       ) : (
                         <Link href="/packing"><Button variant="outline" data-testid="button-view-packing">View Packing List</Button></Link>
                       )}
                     </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-8 text-center border-sidebar-border border-dashed">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium">No Active Journeys</h3>
                    <p className="text-muted-foreground">Start planning your next adventure today.</p>
                  </div>
                  <Button onClick={() => setIsNewTripOpen(true)} data-testid="button-create-journey">Create New Journey</Button>
                </div>
              </Card>
            )}

            {activeTrip && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Planning Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                     <div className="flex items-end justify-between mb-2">
                       <span className="text-2xl font-bold">{activeTrip.progress}%</span>
                       <span className="text-xs text-muted-foreground">{activeTrip.status}</span>
                     </div>
                     <Progress value={activeTrip.progress} className="h-2" />
                  </CardContent>
                </Card>

                <Card className="hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trip Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration</span>
                        <span className="font-medium">{activeTrip.days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Budget</span>
                        <span className="font-medium">{activeTrip.cost}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Right Column: Mini Widgets (1/3 width) */}
          <div className="space-y-6">
            {trips.length > 0 ? (
              <Card className="bg-sidebar border-sidebar-border">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Your Journeys</CardTitle>
                  <CardDescription>Quick overview of your plans</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {trips.slice(0, 3).map(trip => (
                    <div key={trip.id} className="p-3 bg-background rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-primary">{trip.title}</span>
                        <Badge variant="outline" className="text-[10px]">{trip.status}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{trip.dates} &middot; {trip.days} days</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-sidebar border-sidebar-border">
                <CardHeader>
                  <CardTitle className="font-serif text-lg">Getting Started</CardTitle>
                  <CardDescription>Begin your travel planning journey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">Create your first journey to start seeing travel insights, packing lists, and more.</p>
                  <Button onClick={() => setIsNewTripOpen(true)} variant="outline" className="w-full" data-testid="button-get-started">
                    <Plus className="mr-2 h-4 w-4" /> Plan Your First Trip
                  </Button>
                </CardContent>
              </Card>
            )}

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
  </>
);
}
