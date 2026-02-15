import { Globe, Map, Compass, BookOpen, ArrowRight, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroTravel from "@/assets/hero-travel.png";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-primary" data-testid="text-brand">VOYAGER</h1>
          <a href="/api/login" data-testid="link-login-header">
            <Button variant="outline" size="sm">Sign In</Button>
          </a>
        </div>
      </header>

      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <img
            src={heroTravel}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground mb-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
            Premium Travel Curation
          </p>
          <h2 className="font-serif text-5xl md:text-7xl font-bold leading-tight mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700" data-testid="text-hero-headline">
            Your journeys, curated.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-700">
            Plan extraordinary trips with intelligent itineraries, real-time travel intel, and a personal travel curator that learns your style.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <a href="/api/login" data-testid="link-cta-hero">
              <Button size="lg" className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
                Begin Your Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </a>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground animate-in fade-in duration-1000">
            <span className="flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Free to use
            </span>
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" /> No credit card required
            </span>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-muted/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.2em] text-primary mb-3">Features</p>
            <h3 className="font-serif text-3xl md:text-4xl font-bold" data-testid="text-features-heading">
              Everything you need to travel better
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Globe,
                title: "Explore Destinations",
                description: "Discover curated destinations with insider knowledge and seasonal recommendations."
              },
              {
                icon: Map,
                title: "Smart Itineraries",
                description: "AI-powered trip planning that optimizes routes, timing, and budget automatically."
              },
              {
                icon: Compass,
                title: "Travel Intel",
                description: "Real-time alerts on prices, weather, visa requirements, and local events."
              },
              {
                icon: BookOpen,
                title: "Journey History",
                description: "Log your adventures with a beautiful travel timeline and world map visualization."
              }
            ].map((feature, i) => (
              <div
                key={i}
                className="group p-6 rounded-xl bg-background border border-border hover:border-primary/30 hover:shadow-md transition-all duration-300"
                data-testid={`card-feature-${i}`}
              >
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="font-serif text-lg font-semibold mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="font-serif text-3xl md:text-4xl font-bold mb-4">
            Start planning your next adventure
          </h3>
          <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">
            Join travelers who plan smarter, explore deeper, and create unforgettable journeys.
          </p>
          <a href="/api/login" data-testid="link-cta-bottom">
            <Button size="lg" className="text-base px-8 py-6 shadow-lg hover:shadow-xl transition-shadow">
              Get Started — It's Free <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </a>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground">
          <span className="font-serif font-bold text-foreground">VOYAGER</span>
          <span>© {new Date().getFullYear()} Voyager. All rights reserved.</span>
        </div>
      </footer>
    </div>
  );
}
