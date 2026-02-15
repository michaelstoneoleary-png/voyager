import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TRIP_DATA } from "@/lib/mock-data";
import { 
  Shirt, 
  Smartphone, 
  FileText, 
  Plus, 
  Info,
  CheckCircle,
  Cloud,
  Thermometer
} from "lucide-react";

export default function PackingList() {
  const categories = [
    { id: "clothing", label: "Clothing", icon: Shirt, data: TRIP_DATA.packingList.clothing },
    { id: "electronics", label: "Electronics", icon: Smartphone, data: TRIP_DATA.packingList.electronics },
    { id: "documents", label: "Documents", icon: FileText, data: TRIP_DATA.packingList.documents },
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold mb-2">Smart Packing List</h1>
            <p className="text-muted-foreground">Generated based on 10-day forecast and cultural requirements.</p>
          </div>
          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-4 flex items-center gap-4">
              <div>
                <div className="text-xs opacity-80 uppercase tracking-wider mb-1">Packing Status</div>
                <div className="font-bold text-2xl">45%</div>
              </div>
              <div className="h-10 w-10">
                 <CheckCircle className="h-full w-full opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insight Alert */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-amber-900 dark:text-amber-100 text-sm">AI Recommendation</h4>
            <p className="text-amber-800 dark:text-amber-200 text-sm mt-1">
              Temperature in Sofia will drop to 10°C on Oct 14. We've added a <strong>Light Jacket</strong> and <strong>Scarf</strong> to your list.
            </p>
          </div>
        </div>

        <Tabs defaultValue="clothing" className="w-full">
          <TabsList className="w-full justify-start h-auto p-1 bg-muted/50 rounded-lg">
            {categories.map((cat) => (
              <TabsTrigger 
                key={cat.id} 
                value={cat.id}
                className="flex-1 py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all"
              >
                <cat.icon className="h-4 w-4 mr-2" />
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((cat) => (
            <TabsContent key={cat.id} value={cat.id} className="mt-6 animate-in fade-in duration-300">
              <Card>
                <CardHeader>
                  <CardTitle className="font-serif flex items-center justify-between">
                    {cat.label}
                    <Button variant="ghost" size="sm" className="text-xs h-8">
                      <Plus className="h-3 w-3 mr-1" /> Add Item
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    {cat.data.length} items recommended
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-1">
                  {cat.data.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                    >
                      <Checkbox id={`${cat.id}-${idx}`} checked={item.packed} className="mt-1" />
                      <div className="flex-1">
                        <label 
                          htmlFor={`${cat.id}-${idx}`} 
                          className="font-medium text-sm cursor-pointer block text-foreground"
                        >
                          {item.item}
                        </label>
                        <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                           <Info className="h-3 w-3 opacity-50" /> {item.reason}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="sr-only">Remove</span>
                         <Plus className="h-4 w-4 rotate-45" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
