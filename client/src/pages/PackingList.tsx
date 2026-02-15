import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Shirt, 
  Smartphone, 
  FileText, 
  Plus, 
  Info,
  CheckCircle2,
  Cloud,
  Thermometer,
  Briefcase,
  Zap,
  Cross,
  Droplets,
  ShoppingBag
} from "lucide-react";
import { useState } from "react";
import { useUser } from "@/lib/UserContext";

// Mock Data for Comprehensive List
const INITIAL_PACKING_LIST = {
  clothing: [
    { id: "c1", item: "T-Shirts / Tops", quantity: 5, packed: true, reason: "Daily wear" },
    { id: "c2", item: "Long Sleeve Shirt", quantity: 2, packed: false, reason: "Cool evenings" },
    { id: "c3", item: "Light Jacket", quantity: 1, packed: false, reason: "Mountain trip" },
    { id: "c4", item: "Jeans / Trousers", quantity: 3, packed: true, reason: "City walking" },
    { id: "c5", item: "Walking Shoes", quantity: 1, packed: true, reason: "Cobblestone streets" },
    { id: "c6", item: "Underwear", quantity: 7, packed: true, reason: "Daily + spare" },
    { id: "c7", item: "Socks", quantity: 7, packed: true, reason: "Daily + spare" },
    { id: "c8", item: "Scarf", quantity: 1, packed: false, reason: "Modesty for churches" },
    { id: "c9", item: "Sleepwear", quantity: 2, packed: false, reason: "Comfort" },
  ],
  toiletries: [
    { id: "t1", item: "Toothbrush & Paste", quantity: 1, packed: true, reason: "Essential" },
    { id: "t2", item: "Shampoo / Conditioner", quantity: 1, packed: false, reason: "Travel size" },
    { id: "t3", item: "Deodorant", quantity: 1, packed: true, reason: "Essential" },
    { id: "t4", item: "Sunscreen", quantity: 1, packed: false, reason: "Sunny days forecast" },
    { id: "t5", item: "Prescription Meds", quantity: 1, packed: false, reason: "Daily supply + 2 days" },
  ],
  electronics: [
    { id: "e1", item: "Phone Charger", quantity: 1, packed: true, reason: "Essential" },
    { id: "e2", item: "Power Bank", quantity: 1, packed: false, reason: "Long day trips" },
    { id: "e3", item: "Type C/F Adapter", quantity: 2, packed: true, reason: "Bulgaria/Serbia standard" },
    { id: "e4", item: "Headphones", quantity: 1, packed: true, reason: "Travel comfort" },
    { id: "e5", item: "Camera + SD Card", quantity: 1, packed: false, reason: "Photography" },
  ],
  documents: [
    { id: "d1", item: "Passport", quantity: 1, packed: true, reason: "Required" },
    { id: "d2", item: "Travel Insurance", quantity: 1, packed: true, reason: "Printed copy" },
    { id: "d3", item: "Boarding Passes", quantity: 1, packed: false, reason: "Digital & Print" },
    { id: "d4", item: "Hotel Reservations", quantity: 1, packed: false, reason: "Reference" },
  ]
};

export default function PackingList() {
  const { formatTemp } = useUser();
  const [list, setList] = useState(INITIAL_PACKING_LIST);
  
  // Calculate Progress
  const allItems = Object.values(list).flat();
  const totalItems = allItems.length;
  const packedItems = allItems.filter(i => i.packed).length;
  const progress = Math.round((packedItems / totalItems) * 100);

  const toggleItem = (category: keyof typeof list, id: string) => {
    setList(prev => ({
      ...prev,
      [category]: prev[category].map(item => 
        item.id === id ? { ...item, packed: !item.packed } : item
      )
    }));
  };

  const categories = [
    { id: "clothing", label: "Clothing", icon: Shirt, color: "text-blue-500", bg: "bg-blue-500/10" },
    { id: "toiletries", label: "Toiletries", icon: Droplets, color: "text-teal-500", bg: "bg-teal-500/10" },
    { id: "electronics", label: "Electronics", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
    { id: "documents", label: "Documents", icon: FileText, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">Smart Packing</h1>
            <p className="text-muted-foreground">Comprehensive checklist for your 10-day trip to Bulgaria & Serbia.</p>
          </div>
          
          <Card className="min-w-[240px] border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex justify-between items-end mb-2">
                <div>
                   <span className="text-xs font-bold uppercase tracking-wider text-primary">Bag Status</span>
                   <div className="text-2xl font-bold text-foreground">{progress}% Ready</div>
                </div>
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Briefcase className="h-4 w-4" />
                </div>
              </div>
              <Progress value={progress} className="h-2 bg-primary/20" />
            </CardContent>
          </Card>
        </div>

        {/* AI Insight Alert */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-3 flex items-start gap-3 mb-6">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 dark:text-amber-100 text-sm">Weather Adaptation</h4>
            <p className="text-amber-800 dark:text-amber-200 text-sm">
              Temp drop to {formatTemp(10)} on Oct 14. We've added a <strong>Light Jacket</strong> and <strong>Scarf</strong> to your list.
            </p>
          </div>
        </div>

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Main List Column */}
           <div className="lg:col-span-2 flex flex-col min-h-0">
             <Tabs defaultValue="clothing" className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="w-full pb-2">
                  <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-lg mb-4 inline-flex">
                    {categories.map((cat) => (
                      <TabsTrigger 
                        key={cat.id} 
                        value={cat.id}
                        className="flex-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
                      >
                        <cat.icon className={`h-4 w-4 mr-2 ${cat.color}`} />
                        {cat.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </ScrollArea>

                <div className="flex-1 overflow-y-auto min-h-0 pr-2">
                  {categories.map((cat) => (
                    <TabsContent key={cat.id} value={cat.id} className="mt-0 space-y-4">
                      {/* Add Item Button */}
                      <Button variant="outline" className="w-full border-dashed text-muted-foreground hover:text-foreground">
                        <Plus className="mr-2 h-4 w-4" /> Add Item to {cat.label}
                      </Button>

                      {/* List Items */}
                      <div className="space-y-2">
                        {list[cat.id as keyof typeof list].map((item: any) => (
                          <div 
                            key={item.id} 
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 group ${item.packed ? 'bg-muted/30 border-transparent opacity-60' : 'bg-card border-border hover:border-primary/50 hover:shadow-sm'}`}
                            onClick={() => toggleItem(cat.id as any, item.id)}
                          >
                            <Checkbox 
                              checked={item.packed} 
                              className="mt-1 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div className="flex-1 cursor-pointer select-none">
                              <div className="flex justify-between items-start">
                                <span className={`font-medium text-sm ${item.packed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                  {item.item}
                                </span>
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-muted text-muted-foreground">
                                  Qty: {item.quantity}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                 {item.reason && <span className="flex items-center gap-1"><Info className="h-3 w-3 opacity-50" /> {item.reason}</span>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </div>
             </Tabs>
           </div>

           {/* Right Column: Bag Summary */}
           <div className="hidden lg:flex flex-col gap-6">
              <Card className="bg-sidebar border-sidebar-border h-full max-h-[600px] flex flex-col">
                <CardHeader>
                  <CardTitle className="font-serif text-lg flex items-center gap-2">
                    <ShoppingBag className="h-5 w-5" /> In Your Bag
                  </CardTitle>
                  <CardDescription>
                    {packedItems} of {totalItems} items packed
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto pr-2">
                   {packedItems === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                       <Briefcase className="h-12 w-12 mb-2 opacity-20" />
                       <p className="text-sm">Your bag is empty.<br/>Start checking off items!</p>
                     </div>
                   ) : (
                     <div className="space-y-4">
                       {categories.map(cat => {
                         const items = list[cat.id as keyof typeof list].filter((i: any) => i.packed);
                         if (items.length === 0) return null;
                         
                         return (
                           <div key={cat.id}>
                             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                               <cat.icon className={`h-3 w-3 ${cat.color}`} /> {cat.label}
                             </h4>
                             <ul className="space-y-1">
                               {items.map((item: any) => (
                                 <li key={item.id} className="text-sm flex justify-between items-center p-1.5 rounded hover:bg-muted/50">
                                   <span className="truncate">{item.item}</span>
                                   <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                                 </li>
                               ))}
                             </ul>
                             <Separator className="my-2 opacity-50" />
                           </div>
                         );
                       })}
                     </div>
                   )}
                </CardContent>
                <div className="p-4 border-t border-border bg-muted/20">
                   <div className="flex justify-between items-center text-sm font-medium">
                     <span>Total Weight (Est.)</span>
                     <span>~8.5 kg</span>
                   </div>
                   <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                     <span>Carry-on limit</span>
                     <span>10 kg</span>
                   </div>
                   <Progress value={85} className="h-1.5 mt-2" />
                </div>
              </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
}
