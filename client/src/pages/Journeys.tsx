import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Wallet,
  MoreHorizontal,
  Plus
} from "lucide-react";
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
      status: "Upcoming"
    },
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
                <Card key={trip.id} className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-full">
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img 
                      src={trip.image} 
                      alt={trip.title} 
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
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
