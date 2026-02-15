import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TRIP_DATA } from "@/lib/mock-data";
import { 
  ShieldAlert, 
  Banknote, 
  Languages, 
  BookOpen, 
  Phone
} from "lucide-react";

export default function Intel() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center md:text-left">
          <h1 className="font-serif text-3xl font-bold mb-2">Travel Intelligence</h1>
          <p className="text-muted-foreground">Cultural norms, safety alerts, and essential knowledge for your trip.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Info Cards */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
                <Banknote className="h-4 w-4" /> Currency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-serif mb-1">{TRIP_DATA.intel.currency}</p>
              <p className="text-xs text-muted-foreground">Cash is king in smaller towns. ATMs widely available in Sofia.</p>
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
             <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-destructive">
                <Phone className="h-4 w-4" /> Emergency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold font-serif mb-1">{TRIP_DATA.intel.emergency}</p>
              <p className="text-xs text-muted-foreground">Universal European Emergency Number</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 space-y-6">
             {/* Cultural Etiquette */}
             <Card>
               <CardHeader>
                 <CardTitle className="font-serif flex items-center gap-2">
                   <BookOpen className="h-5 w-5 text-accent-foreground" />
                   Cultural Etiquette
                 </CardTitle>
                 <CardDescription>Do's and Don'ts for Bulgaria & Serbia</CardDescription>
               </CardHeader>
               <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                   {TRIP_DATA.intel.etiquette.map((item, idx) => (
                     <AccordionItem key={idx} value={`item-${idx}`}>
                       <AccordionTrigger className="text-sm font-medium text-left">
                         {item}
                       </AccordionTrigger>
                       <AccordionContent className="text-muted-foreground text-sm">
                         This is considered a sign of respect. Locals appreciate when visitors make an effort to follow these norms.
                       </AccordionContent>
                     </AccordionItem>
                   ))}
                 </Accordion>
               </CardContent>
             </Card>

             {/* Safety */}
             <Card>
               <CardHeader>
                 <CardTitle className="font-serif flex items-center gap-2">
                   <ShieldAlert className="h-5 w-5 text-orange-600" />
                   Safety Advisories
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 {TRIP_DATA.intel.safety.map((item, idx) => (
                   <div key={idx} className="flex gap-3 p-3 bg-muted/30 rounded-lg border border-border">
                     <div className="h-2 w-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                     <p className="text-sm">{item}</p>
                   </div>
                 ))}
               </CardContent>
             </Card>
           </div>

           <div className="space-y-6">
             {/* Language Cheat Sheet */}
             <Card className="bg-sidebar">
               <CardHeader>
                 <CardTitle className="font-serif text-lg flex items-center gap-2">
                   <Languages className="h-4 w-4" /> Essential Phrases
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <div className="space-y-2">
                   <h4 className="text-xs font-bold uppercase text-muted-foreground">Bulgarian (Cyrillic)</h4>
                   <div className="flex justify-between text-sm border-b border-border pb-1">
                     <span>Hello</span>
                     <span className="font-medium">Здравейте (Zdraveyte)</span>
                   </div>
                   <div className="flex justify-between text-sm border-b border-border pb-1">
                     <span>Thank you</span>
                     <span className="font-medium">Благодаря (Blagodarya)</span>
                   </div>
                   <div className="flex justify-between text-sm border-b border-border pb-1">
                     <span>Yes/No</span>
                     <span className="font-medium">Да/Не (Da/Ne)</span>
                   </div>
                 </div>

                 <div className="space-y-2 pt-2">
                   <h4 className="text-xs font-bold uppercase text-muted-foreground">Serbian</h4>
                   <div className="flex justify-between text-sm border-b border-border pb-1">
                     <span>Hello</span>
                     <span className="font-medium">Здраво (Zdravo)</span>
                   </div>
                   <div className="flex justify-between text-sm border-b border-border pb-1">
                     <span>Cheers</span>
                     <span className="font-medium">Живели (Živeli)</span>
                   </div>
                 </div>
               </CardContent>
             </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
}
