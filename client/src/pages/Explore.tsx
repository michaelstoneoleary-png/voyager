import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MapPin, 
  Heart, 
  Plus, 
  Search,
  Filter
} from "lucide-react";
import { Input } from "@/components/ui/input";

// Assets
import belgradeCafe from "@/assets/belgrade-cafe.png";
import rilaHike from "@/assets/rila-hike.png";
import plovdiv from "@/assets/plovdiv.png";
import serbianFood from "@/assets/serbian-food.png";

const GEMS = [
  {
    id: 1,
    title: "Smokvica Molerova",
    category: "Food & Drink",
    location: "Belgrade, Serbia",
    image: belgradeCafe,
    rating: 4.8,
    description: "A hidden bohemian courtyard cafe perfect for breakfast or late-night cocktails.",
    tags: ["Cafe", "Garden", "Vintage"]
  },
  {
    id: 2,
    title: "Seven Rila Lakes",
    category: "Adventure",
    location: "Rila, Bulgaria",
    image: rilaHike,
    rating: 4.9,
    description: "A breathtaking hike past seven glacial lakes. Moderate difficulty, high reward.",
    tags: ["Hiking", "Nature", "Photography"]
  },
  {
    id: 3,
    title: "Kapana District",
    category: "Culture",
    location: "Plovdiv, Bulgaria",
    image: plovdiv,
    rating: 4.7,
    description: "The creative heart of Plovdiv, filled with galleries, studios, and street art.",
    tags: ["Art", "Historic", "Shopping"]
  },
  {
    id: 4,
    title: "Skadarlija Dinner",
    category: "Food & Drink",
    location: "Belgrade, Serbia",
    image: serbianFood,
    rating: 4.6,
    description: "Traditional Serbian cuisine in the historic bohemian quarter accompanied by live music.",
    tags: ["Traditional", "Live Music", "Dinner"]
  },
  {
    id: 5,
    title: "Secret Jazz Bar",
    category: "Culture",
    location: "Sofia, Bulgaria",
    image: "https://images.unsplash.com/photo-1514525253440-b393452e8d26?q=80&w=1974&auto=format&fit=crop",
    rating: 4.9,
    description: "An underground jazz club only locals know about. Password required for entry.",
    tags: ["Nightlife", "Music", "Exclusive"]
  },
  {
    id: 6,
    title: "Vitosha Waterfall",
    category: "Adventure",
    location: "Sofia, Bulgaria",
    image: "https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?q=80&w=2070&auto=format&fit=crop",
    rating: 4.5,
    description: "A secluded waterfall just 20 minutes from the city center.",
    tags: ["Nature", "Short Hike", "Water"]
  }
];

function GemCard({ gem }: { gem: typeof GEMS[0] }) {
  return (
    <Card className="group overflow-hidden border-0 shadow-none bg-transparent hover:bg-card hover:shadow-lg transition-all duration-300 rounded-xl">
      <div className="aspect-[4/3] relative overflow-hidden rounded-xl">
        <img 
          src={gem.image} 
          alt={gem.title} 
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        
        <div className="absolute top-3 right-3">
          <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border-0 text-white hover:bg-white hover:text-red-500 transition-colors">
            <Heart className="h-4 w-4" />
          </Button>
        </div>

        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="flex items-center justify-between mb-1">
            <Badge variant="secondary" className="bg-white/20 backdrop-blur-md border-0 text-white hover:bg-white/30">
              {gem.category}
            </Badge>
            <div className="flex items-center gap-1 text-xs font-bold bg-black/40 backdrop-blur-md px-2 py-1 rounded-full">
              ★ {gem.rating}
            </div>
          </div>
        </div>
      </div>
      
      <CardContent className="p-4 pt-5">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-serif text-xl font-bold group-hover:text-primary transition-colors">{gem.title}</h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" /> {gem.location}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
          {gem.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {gem.tags.map(tag => (
              <span key={tag} className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">#{tag}</span>
            ))}
          </div>
          <Button size="sm" variant="ghost" className="h-8 rounded-full hover:bg-primary/10 hover:text-primary">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function GemGrid({ category }: { category: string }) {
  const filteredGems = category === "all" 
    ? GEMS 
    : GEMS.filter(gem => gem.category.toLowerCase().includes(category.toLowerCase()) || (category === "food" && gem.category === "Food & Drink"));

  if (filteredGems.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p>No gems found in this category yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredGems.map((gem) => (
        <GemCard key={gem.id} gem={gem} />
      ))}
    </div>
  );
}

export default function Explore() {
  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-4">
          <div className="max-w-xl">
            <h1 className="font-serif text-4xl font-bold mb-3">Discover Hidden Gems</h1>
            <p className="text-muted-foreground text-lg">
              Curated experiences in Bulgaria & Serbia recommended by Marco based on your interests.
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search places..." className="pl-9 bg-background" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Categories */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-transparent border-b border-border rounded-none mb-6">
            <TabsTrigger value="all" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Gems</TabsTrigger>
            <TabsTrigger value="food" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Food & Drink</TabsTrigger>
            <TabsTrigger value="adventure" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Adventure</TabsTrigger>
            <TabsTrigger value="culture" className="rounded-full px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Culture</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-0">
            <GemGrid category="all" />
          </TabsContent>
          <TabsContent value="food" className="mt-0">
            <GemGrid category="food" />
          </TabsContent>
          <TabsContent value="adventure" className="mt-0">
            <GemGrid category="adventure" />
          </TabsContent>
          <TabsContent value="culture" className="mt-0">
            <GemGrid category="culture" />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
