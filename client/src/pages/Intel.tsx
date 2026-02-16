import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TRIP_DATA } from "@/lib/mock-data";
import { 
  ShieldAlert, 
  Banknote, 
  Languages, 
  BookOpen, 
  Phone,
  Volume2,
  TrendingUp,
  RefreshCw
} from "lucide-react";

export default function Intel() {
  const playAudio = (_text: string) => {
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center md:text-left">
          <h1 className="font-serif text-3xl font-bold mb-2">Travel Intelligence</h1>
          <p className="text-muted-foreground">Cultural norms, safety alerts, and essential knowledge for your trip.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Info Cards */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2 text-primary">
                <Banknote className="h-4 w-4" /> Currency & Rates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-2xl font-bold font-serif mb-1">{TRIP_DATA.intel.currency.code}</p>
                  <p className="text-xs text-muted-foreground">Cash preferred in rural areas.</p>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground">
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2 bg-background/50 p-3 rounded-lg border border-primary/10">
                {TRIP_DATA.intel.currency.rates.map((rate, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{rate.pair}</span>
                    <span className="font-mono font-medium flex items-center gap-1">
                      {rate.rate} <TrendingUp className="h-3 w-3 text-emerald-500" />
                    </span>
                  </div>
                ))}
              </div>
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
               <CardContent className="space-y-6">
                 <div className="space-y-3">
                   <h4 className="text-xs font-bold uppercase text-muted-foreground border-b border-border pb-1">Bulgarian</h4>
                   {TRIP_DATA.intel.phrases.bulgarian.map((phrase, idx) => (
                     <div key={idx} className="flex justify-between items-center group">
                       <div>
                         <div className="text-sm font-medium">{phrase.local}</div>
                         <div className="text-xs text-muted-foreground">{phrase.english} • {phrase.transliteration}</div>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 opacity-50 group-hover:opacity-100 hover:bg-background hover:text-primary transition-all"
                         onClick={() => playAudio(phrase.local)}
                       >
                         <Volume2 className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                 </div>

                 <div className="space-y-3">
                   <h4 className="text-xs font-bold uppercase text-muted-foreground border-b border-border pb-1">Serbian</h4>
                   {TRIP_DATA.intel.phrases.serbian.map((phrase, idx) => (
                     <div key={idx} className="flex justify-between items-center group">
                       <div>
                         <div className="text-sm font-medium">{phrase.local}</div>
                         <div className="text-xs text-muted-foreground">{phrase.english} • {phrase.transliteration}</div>
                       </div>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-8 w-8 opacity-50 group-hover:opacity-100 hover:bg-background hover:text-primary transition-all"
                         onClick={() => playAudio(phrase.local)}
                       >
                         <Volume2 className="h-4 w-4" />
                       </Button>
                     </div>
                   ))}
                 </div>
               </CardContent>
             </Card>
           </div>
        </div>
      </div>
    </Layout>
  );
}
