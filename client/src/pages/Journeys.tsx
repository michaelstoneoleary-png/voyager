import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Map, 
  Heart, 
  MessageCircle, 
  Share2,
  Copy,
  ArrowRight
} from "lucide-react";

// Assets
import kotor from "@/assets/kotor.png";
import transylvania from "@/assets/transylvania.png";
import albania from "@/assets/albania.png";

const JOURNEYS = [
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
    description: "A slow travel itinerary along the Adriatic coast, focusing on Venetian architecture and seafood."
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
    description: "Driving through the heart of Romania. Must-see castles, bear sanctuaries, and scenic mountain roads."
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
    description: "The ultimate guide to the best beaches in Albania, including hidden coves accessible only by boat."
  }
];

export default function Journeys() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold mb-3">Community Journeys</h1>
            <p className="text-muted-foreground text-lg">
              Explore itineraries crafted by the Voyager community. Clone their routes or find inspiration for your next adventure.
            </p>
          </div>
          <Button>
            <Map className="h-4 w-4 mr-2" /> Share Your Trip
          </Button>
        </div>

        {/* Featured Feed */}
        <div className="grid grid-cols-1 gap-8">
          {JOURNEYS.map((journey) => (
            <Card key={journey.id} className="overflow-hidden border-0 bg-card/50 hover:bg-card transition-colors">
              <div className="flex flex-col md:flex-row">
                {/* Image Section */}
                <div className="md:w-2/5 relative h-64 md:h-auto min-h-[300px]">
                  <img 
                    src={journey.image} 
                    alt={journey.title} 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4">
                     <Badge className="bg-white/90 text-black hover:bg-white backdrop-blur-md">
                        {journey.days} Days
                     </Badge>
                  </div>
                </div>

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

                    <h3 className="font-serif text-2xl font-bold mb-2">{journey.title}</h3>
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
                      <button className="flex items-center gap-1 hover:text-red-500 transition-colors">
                        <Heart className="h-4 w-4" /> {journey.likes}
                      </button>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <MessageCircle className="h-4 w-4" /> 42
                      </button>
                      <button className="flex items-center gap-1 hover:text-primary transition-colors">
                        <Share2 className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <Button className="group">
                      <Copy className="h-4 w-4 mr-2 group-hover:hidden" />
                      <ArrowRight className="h-4 w-4 mr-2 hidden group-hover:block" />
                      Clone Trip
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
