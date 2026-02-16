import { Link, useLocation } from "wouter";
import { 
  Luggage, 
  LayoutDashboard, 
  Settings,
  Menu,
  X,
  Globe,
  Users,
  LogOut,
  ChevronDown,
  MapPin,
  History,
  Compass,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/UserContext";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import type { Journey } from "@shared/schema";
import { ChatBubble } from "./ChatBubble";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isJourneysOpen, setIsJourneysOpen] = useState(
    location === "/journeys" || location === "/history"
  );
  const { settings } = useUser();
  const { user, logout } = useAuth();

  const { data: journeys = [] } = useQuery<Journey[]>({
    queryKey: ["/api/journeys"],
    queryFn: async () => {
      const res = await fetch("/api/journeys", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const planningJourneys = journeys
    .filter((j) => j.status !== "Completed")
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const completedJourneys = journeys
    .filter((j) => j.status === "Completed")
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const recentJourneys = [...planningJourneys, ...completedJourneys].slice(0, 5);

  const userInitials = user
    ? `${(user.firstName || "")[0] || ""}${(user.lastName || "")[0] || ""}`.toUpperCase() || "U"
    : "U";
  const userName = user
    ? [user.firstName, user.lastName].filter(Boolean).join(" ") || "Traveler"
    : "Traveler";

  const topNavItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
  ];

  const bottomNavItems = [
    { href: "/packing", label: "Smart Pack", icon: Luggage },
    { href: "/inspire", label: "Inspire", icon: Sparkles },
    { href: "/community", label: "Community", icon: Users },
  ];

  const isJourneyActive = location === "/journeys" || location === "/history";

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col md:flex-row relative">
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-sidebar/50 backdrop-blur-md sticky top-0 z-50">
        <h1 className="font-serif text-xl font-bold tracking-tight text-primary">VOYAGER</h1>
        <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} data-testid="button-mobile-menu">
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      <aside className={cn(
        "fixed inset-0 z-40 bg-sidebar border-r border-sidebar-border transition-transform duration-300 ease-in-out flex flex-col",
        "md:translate-x-0 md:inset-auto md:top-0 md:left-0 md:w-64 md:h-screen",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 hidden md:block">
          <h1 className="font-serif text-2xl font-bold tracking-tight text-primary">VOYAGER</h1>
          <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">Travel Without Limits</p>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {topNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group cursor-pointer",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}

          <div>
            <button
              onClick={() => setIsJourneysOpen(!isJourneysOpen)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group cursor-pointer w-full",
                isJourneyActive
                  ? "bg-sidebar-primary/10 text-sidebar-primary-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              data-testid="button-journeys-toggle"
            >
              <Globe className={cn("h-5 w-5", isJourneyActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
              <span className="flex-1 text-left">Your Journeys</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isJourneysOpen ? "rotate-180" : "")} />
            </button>

            {isJourneysOpen && (
              <div className="ml-4 pl-4 border-l border-sidebar-border space-y-1 mt-1">
                <Link href="/journeys">
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-all duration-200 cursor-pointer",
                      location === "/journeys"
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="link-journeys-upcoming"
                  >
                    <MapPin className="h-4 w-4" />
                    Upcoming & Planning
                  </div>
                </Link>
                <Link href="/history">
                  <div
                    className={cn(
                      "flex items-center gap-3 px-4 py-2.5 text-sm rounded-md transition-all duration-200 cursor-pointer",
                      location === "/history"
                        ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                    data-testid="link-journeys-past"
                  >
                    <History className="h-4 w-4" />
                    Past Journeys
                  </div>
                </Link>
                {recentJourneys.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-sidebar-border">
                    <span className="px-4 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Recent</span>
                    {recentJourneys.map((j) => (
                      <Link key={j.id} href={`/planner/${j.id}`}>
                        <div
                          className={cn(
                            "flex items-center gap-3 px-4 py-2 text-sm rounded-md transition-all duration-200 cursor-pointer mt-1",
                            location === `/planner/${j.id}`
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm font-medium"
                              : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                          onClick={() => setIsMobileMenuOpen(false)}
                          data-testid={`link-journey-${j.id}`}
                        >
                          <Compass className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{j.title}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {bottomNavItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-all duration-200 group cursor-pointer",
                    isActive 
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm" 
                      : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <item.icon className={cn("h-5 w-5", isActive ? "text-sidebar-primary-foreground" : "text-muted-foreground group-hover:text-sidebar-accent-foreground")} />
                  {item.label}
                </div>
              </Link>
            );
          })}

          {recentJourneys.length > 0 && (
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="px-4 text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent Journeys</p>
              {recentJourneys.map((journey) => {
                const isPlanning = journey.status !== "Completed";
                return (
                  <Link key={journey.id} href={isPlanning ? `/planner/${journey.id}` : "/history"}>
                    <div
                      className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-all duration-200 cursor-pointer group"
                      onClick={() => setIsMobileMenuOpen(false)}
                      data-testid={`link-recent-journey-${journey.id}`}
                    >
                      <div className="h-6 w-6 rounded-md bg-muted/50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {journey.image ? (
                          <img src={journey.image} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <Globe className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <span className="truncate flex-1">{journey.title}</span>
                      {isPlanning && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0" data-testid={`tag-planning-${journey.id}`}>
                          Planning
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-4 py-3">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                alt={userName}
                className="h-8 w-8 rounded-full object-cover"
                data-testid="img-avatar"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-sidebar-accent flex items-center justify-center text-sidebar-accent-foreground font-serif font-bold" data-testid="text-avatar-initials">
                {userInitials}
              </div>
            )}
            <div className="text-sm flex-1 min-w-0">
              <p className="font-medium text-foreground truncate" data-testid="text-username">{userName}</p>
              <p className="text-xs text-muted-foreground">Member</p>
            </div>
            
            <div className="flex items-center gap-1">
              <Link href="/settings">
                <button data-testid="button-settings">
                  <Settings className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                </button>
              </Link>

              <button onClick={() => logout()} data-testid="button-logout" title="Log out">
                <LogOut className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-destructive transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-background/50 relative md:ml-64">
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
          {children}
        </div>
      </main>

      <ChatBubble />
    </div>
  );
}
