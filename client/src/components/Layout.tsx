import { Link, useLocation } from "wouter";
import { 
  Map, 
  Compass, 
  Luggage, 
  Info, 
  LayoutDashboard, 
  Settings,
  Menu,
  X,
  Globe
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/planner", label: "Trip Planner", icon: Map },
    { href: "/packing", label: "Smart Pack", icon: Luggage },
    { href: "/intel", label: "Travel Intel", icon: Info },
    { href: "/explore", label: "Explore", icon: Compass },
    { href: "/journeys", label: "Your Journeys", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar/50 backdrop-blur-md sticky top-0 z-50">
        <h1 className="font-serif text-xl font-bold tracking-tight text-primary">VOYAGER</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={cn(
        "fixed inset-0 z-40 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:w-64 md:flex-shrink-0 flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 hidden md:block">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">VOYAGER</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Travel Curator</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}>
                  <item.icon className={cn("h-5 w-5", isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-serif font-bold">
              JD
            </div>
            <div className="text-sm">
              <p className="font-medium text-foreground">Jennifer Doe</p>
              <p className="text-xs text-muted-foreground">Pro Member</p>
            </div>
            <Settings className="ml-auto h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-background/50 relative">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
}
