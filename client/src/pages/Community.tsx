import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Map, 
  Heart, 
  MessageCircle, 
  Share2,
  Copy,
  ArrowRight,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Plus,
  Instagram,
  Rss,
  Sparkles,
  ExternalLink
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Assets
import kotor from "@/assets/kotor.png";
import transylvania from "@/assets/transylvania.png";
import albania from "@/assets/albania.png";

const COMMUNITY_TRIPS = [
  {
    id: 1,
    title: "Balkan Coastline Explorer",
    author: {
      name: "Elena R.",
      avatar: "https://i.pravatar.cc/150?u=elena",
      handle: "@elenatravels"
    },
    route: "Dubrovnik → Kotor → Budva → Tirana",
    days: 10,
    budget: "$$",
    likes: 1243,
    image: kotor,
    tags: ["Coastal", "Relaxing", "History"],
    description: "A slow travel itinerary along the Adriatic coast, focusing on Venetian architecture and seafood.",
    itinerary: [
      { day: 1, title: "Arrival in Dubrovnik", highlight: "Sunset walk on the city walls" },
      { day: 2, title: "Dubrovnik Old Town", highlight: "Game of Thrones tour & Lokrum Island" },
      { day: 3, title: "Drive to Kotor", highlight: "Scenic drive around the Bay of Kotor" },
      { day: 4, title: "Kotor Climb", highlight: "Hiking to St. John's Fortress for the view" },
      { day: 5, title: "Perast Day Trip", highlight: "Boat ride to Our Lady of the Rocks" },
      { day: 6, title: "Budva Riviera", highlight: "Relaxing on Mogren Beach" },
      { day: 7, title: "Sveti Stefan", highlight: "Luxury lunch with a view of the islet" },
      { day: 8, title: "Drive to Tirana", highlight: "Stopping at Shkodër Lake" },
      { day: 9, title: "Tirana Culture", highlight: "Bunk'Art museum & delicious coffee" },
      { day: 10, title: "Departure", highlight: "Final souvenir shopping in the New Bazaar" }
    ]
  },
  {
    id: 2,
    title: "Transylvania Roadtrip",
    author: {
      name: "Marko J.",
      avatar: "https://i.pravatar.cc/150?u=marko",
      handle: "@markoontheroad"
    },
    route: "Bucharest → Brasov → Sibiu → Cluj",
    days: 7,
    budget: "$",
    likes: 856,
    image: transylvania,
    tags: ["Roadtrip", "Castles", "Nature"],
    description: "Driving through the heart of Romania. Must-see castles, bear sanctuaries, and scenic mountain roads.",
    itinerary: [
      { day: 1, title: "Bucharest", highlight: "Palace of the Parliament tour" },
      { day: 2, title: "Peles Castle", highlight: "Visit the stunning Neo-Renaissance castle" },
      { day: 3, title: "Brasov", highlight: "Black Church and Council Square" },
      { day: 4, title: "Bran Castle", highlight: "Dracula's Castle myth vs reality" },
      { day: 5, title: "Transfagarasan Highway", highlight: "Driving one of the world's best roads" },
      { day: 6, title: "Sibiu", highlight: "Eyes of Sibiu architecture tour" },
      { day: 7, title: "Cluj-Napoca", highlight: "Botanical Garden walk" }
    ]
  },
  {
    id: 3,
    title: "Albanian Riviera Secrets",
    author: {
      name: "Sarah & Tom",
      avatar: "https://i.pravatar.cc/150?u=sarah",
      handle: "@wanderingduo"
    },
    route: "Vlorë → Himarë → Sarandë → Ksamil",
    days: 14,
    budget: "$$",
    likes: 2105,
    image: albania,
    tags: ["Beaches", "Summer", "Foodie"],
    description: "The ultimate guide to the best beaches in Albania, including hidden coves accessible only by boat.",
    itinerary: [
      { day: 1, title: "Vlorë", highlight: "Seafood dinner on the promenade" },
      { day: 2, title: "Llogara Pass", highlight: "Epic drive over the mountain pass" },
      { day: 3, title: "Dhermi Beach", highlight: "Crystal clear waters and beach clubs" },
      { day: 4, title: "Gjipe Canyon", highlight: "Hiking down to the secluded beach" },
      { day: 5, title: "Himarë", highlight: "Old town sunset views" },
      { day: 6, title: "Porto Palermo", highlight: "Ali Pasha's fortress visit" },
      { day: 7, title: "Borsh", highlight: "The longest beach on the Riviera" },
      { day: 8, title: "Sarandë", highlight: "Evening cocktail at Lekursi Castle" },
      { day: 9, title: "Ksamil Islands", highlight: "Swimming to the three islands" },
      { day: 10, title: "Butrint", highlight: "Ancient Greek/Roman ruins (UNESCO)" },
      { day: 11, title: "Blue Eye", highlight: "Natural spring day trip" },
      { day: 12, title: "Mirror Beach", highlight: "Hidden gem for snorkeling" },
      { day: 13, title: "Sarandë Nightlife", highlight: "Experiencing the vibrant promenade" },
      { day: 14, title: "Ferry to Corfu", highlight: "Departure via Greece" }
    ]
  }
];

const EXTERNAL_SOURCES = [
  {
    id: 1,
    name: "Nomadic Matt",
    type: "blog",
    url: "nomadicmatt.com",
    icon: Rss,
    status: "active",
    lastMatch: "Money saving tips for Balkans",
    matchReason: "Matches your upcoming 'Balkan Odyssey' trip"
  },
  {
    id: 2,
    name: "@lostleblanc",
    type: "instagram",
    url: "instagram.com/lostleblanc",
    icon: Instagram,
    status: "active",
    lastMatch: "Reel: Hidden gems in Kyoto",
    matchReason: "Relevant to your interest in 'Photography'"
  },
  {
    id: 3,
    name: "The Points Guy",
    type: "blog",
    url: "thepointsguy.com",
    icon: Rss,
    status: "active",
    lastMatch: "Flight deal alert: NYC to Tokyo",
    matchReason: "Price watch trigger for 'Kyoto' trip"
  }
];

export default function Community() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [likedTrips, setLikedTrips] = useState<number[]>([]);
  const [followedSources, setFollowedSources] = useState(EXTERNAL_SOURCES);

  const handleLike = (id: number) => {
    if (likedTrips.includes(id)) {
      setLikedTrips(likedTrips.filter(t => t !== id));
    } else {
      setLikedTrips([...likedTrips, id]);
      toast({
        title: "Trip Liked!",
        description: "Saved to your favorites.",
      });
    }
  };

  const handleClone = (title: string) => {
    toast({
      title: "Trip Cloned!",
      description: `"${title}" has been added to Your Journeys.`,
    });
  };

  const handleAddSource = () => {
    toast({
      title: "Source Added",
      description: "We'll monitor this source for relevant travel intel.",
    });
  };

  const filteredTrips = COMMUNITY_TRIPS.filter(trip => 
    trip.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    trip.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold mb-3">Community Feed</h1>
            <p className="text-muted-foreground text-lg">
              Explore itineraries crafted by the Voyager community. Clone their routes or find inspiration for your next adventure.
            </p>
          </div>
          <Button>
            <Map className="h-4 w-4 mr-2" /> Share Your Trip
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          
          {/* Main Content Column */}
          <div className="space-y-8">
             {/* Search & Filter Bar */}
            <div className="flex gap-4 items-center bg-card p-4 rounded-xl border border-border shadow-sm">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search destinations, tags, or routes..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2 hidden md:flex">
                <Filter className="h-4 w-4" /> Filters
              </Button>
            </div>

            {/* Featured Feed */}
            <div className="grid grid-cols-1 gap-8">
              {filteredTrips.map((journey) => (
                <Dialog key={journey.id}>
                  <Card className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-colors group">
                    <div className="flex flex-col md:flex-row">
                      {/* Image Section */}
                      <DialogTrigger className="md:w-2/5 relative h-64 md:h-auto min-h-[300px] cursor-pointer overflow-hidden">
                        <img 
                          src={journey.image} 
                          alt={journey.title} 
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                        <div className="absolute top-4 left-4">
                           <Badge className="bg-white/90 text-black hover:bg-white backdrop-blur-md">
                              {journey.days} Days
                           </Badge>
                        </div>
                      </DialogTrigger>

                      {/* Content Section */}
                      <div className="flex-1 p-6 md:p-8 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <Avatar>
                                <AvatarImage src={journey.author.avatar} />
                                <AvatarFallback>{journey.author.name[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium leading-none">{journey.author.name}</p>
                                <p className="text-xs text-muted-foreground">{journey.author.handle}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="font-mono">
                              {journey.budget}
                            </Badge>
                          </div>

                          <DialogTrigger className="text-left w-full hover:underline decoration-primary underline-offset-4 transition-all">
                            <h3 className="font-serif text-2xl font-bold mb-2">{journey.title}</h3>
                          </DialogTrigger>
                          <p className="text-muted-foreground mb-4">{journey.description}</p>

                          <div className="flex items-center gap-2 text-sm text-primary font-medium mb-6 bg-primary/5 p-3 rounded-lg w-fit">
                            <Map className="h-4 w-4" />
                            {journey.route}
                          </div>

                          <div className="flex gap-2 mb-6">
                            {journey.tags.map(tag => (
                              <Badge key={tag} variant="secondary" className="font-normal">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex gap-4 text-muted-foreground text-sm">
                            <button 
                              onClick={() => handleLike(journey.id)}
                              className={`flex items-center gap-1 transition-colors ${likedTrips.includes(journey.id) ? "text-red-500" : "hover:text-red-500"}`}
                            >
                              <Heart className={`h-4 w-4 ${likedTrips.includes(journey.id) ? "fill-current" : ""}`} /> 
                              {journey.likes + (likedTrips.includes(journey.id) ? 1 : 0)}
                            </button>
                            <button className="flex items-center gap-1 hover:text-primary transition-colors">
                              <MessageCircle className="h-4 w-4" /> 42
                            </button>
                            <button className="flex items-center gap-1 hover:text-primary transition-colors">
                              <Share2 className="h-4 w-4" />
                            </button>
                          </div>
                          
                          <Button 
                            className="group"
                            onClick={() => handleClone(journey.title)}
                          >
                            <Copy className="h-4 w-4 mr-2 group-hover:hidden" />
                            <ArrowRight className="h-4 w-4 mr-2 hidden group-hover:block" />
                            Clone Trip
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Detail Modal */}
                  <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0 flex flex-col">
                     <div className="relative h-48 md:h-64 flex-shrink-0">
                        <img 
                          src={journey.image} 
                          alt={journey.title} 
                          className="absolute inset-0 w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                           <Badge className="mb-2 bg-primary text-primary-foreground border-0">{journey.days} Days</Badge>
                           <DialogTitle className="font-serif text-3xl md:text-4xl font-bold mb-2">{journey.title}</DialogTitle>
                           <div className="flex items-center gap-4 text-sm opacity-90">
                             <span className="flex items-center gap-1"><Map className="h-4 w-4" /> {journey.route}</span>
                             <span className="flex items-center gap-1"><DollarSign className="h-4 w-4" /> Budget: {journey.budget}</span>
                           </div>
                        </div>
                     </div>

                     <ScrollArea className="flex-1 p-6 md:p-8">
                        <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-8">
                           <div className="space-y-6">
                              <div>
                                <h3 className="text-lg font-bold mb-3 font-serif">About this trip</h3>
                                <p className="text-muted-foreground leading-relaxed">{journey.description}</p>
                              </div>

                              <div>
                                <h3 className="text-lg font-bold mb-4 font-serif">Itinerary Highlights</h3>
                                <div className="relative border-l border-border ml-2 space-y-6 pb-2">
                                   {journey.itinerary.map((item, idx) => (
                                     <div key={idx} className="ml-6 relative">
                                        <div className="absolute -left-[31px] top-0 h-4 w-4 rounded-full border-2 border-primary bg-background" />
                                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                                          <span className="text-sm font-bold text-primary">Day {item.day}</span>
                                          <h4 className="font-semibold">{item.title}</h4>
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-1">{item.highlight}</p>
                                     </div>
                                   ))}
                                </div>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <div className="bg-muted/50 p-4 rounded-xl border border-border">
                                 <div className="flex items-center gap-3 mb-4">
                                    <Avatar className="h-12 w-12 border-2 border-background">
                                      <AvatarImage src={journey.author.avatar} />
                                      <AvatarFallback>{journey.author.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-bold">{journey.author.name}</p>
                                      <p className="text-xs text-muted-foreground">{journey.author.handle}</p>
                                    </div>
                                 </div>
                                 <Button variant="outline" className="w-full text-xs h-8">View Profile</Button>
                              </div>

                              <div className="space-y-2">
                                 <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Trip Tags</h4>
                                 <div className="flex flex-wrap gap-2">
                                    {journey.tags.map(tag => (
                                      <Badge key={tag} variant="secondary">{tag}</Badge>
                                    ))}
                                 </div>
                              </div>

                              <Button size="lg" className="w-full" onClick={() => handleClone(journey.title)}>
                                <Copy className="h-4 w-4 mr-2" /> Clone to My Journeys
                              </Button>
                           </div>
                        </div>
                     </ScrollArea>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>

          {/* Right Sidebar - Travel Pulse */}
          <div className="space-y-6">
             <Card className="border-border bg-sidebar/30 backdrop-blur-sm sticky top-6">
               <CardHeader className="pb-3">
                 <div className="flex items-center justify-between">
                   <CardTitle className="text-lg font-serif font-bold flex items-center gap-2">
                     <Sparkles className="h-4 w-4 text-primary" /> Travel Pulse
                   </CardTitle>
                   <Button variant="ghost" size="icon" className="h-6 w-6">
                     <Plus className="h-4 w-4" onClick={handleAddSource} />
                   </Button>
                 </div>
                 <p className="text-xs text-muted-foreground">
                   AI-curated updates from your followed sources, matched to your interests.
                 </p>
               </CardHeader>
               <CardContent className="space-y-4">
                  {followedSources.map(source => (
                    <div key={source.id} className="group relative bg-background/50 hover:bg-background p-3 rounded-lg transition-colors border border-transparent hover:border-border">
                       <div className="flex justify-between items-start mb-1">
                          <div className="flex items-center gap-2">
                             <source.icon className="h-3 w-3 text-muted-foreground" />
                             <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{source.name}</span>
                          </div>
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                       </div>
                       <p className="text-sm font-medium leading-snug mb-2 group-hover:text-primary transition-colors cursor-pointer">
                         "{source.lastMatch}"
                       </p>
                       <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground bg-primary/5 w-fit px-1.5 py-0.5 rounded">
                         <Sparkles className="h-2.5 w-2.5 text-primary" /> {source.matchReason}
                       </div>
                    </div>
                  ))}
                  
                  <Button variant="outline" className="w-full text-xs" onClick={handleAddSource}>
                    <Plus className="h-3 w-3 mr-1" /> Add Blog or Social
                  </Button>
               </CardContent>
             </Card>

             <Card className="border-border bg-gradient-to-br from-primary/10 to-transparent border-0">
               <CardContent className="p-6 text-center space-y-3">
                 <h3 className="font-serif font-bold text-lg">Voyager AI</h3>
                 <p className="text-sm text-muted-foreground">
                   Connect your favorite creators to get personalized travel alerts.
                 </p>
                 <Button className="w-full shadow-md bg-background text-foreground hover:bg-muted">
                   Connect Accounts
                 </Button>
               </CardContent>
             </Card>
          </div>

        </div>
      </div>
    </Layout>
  );
}
