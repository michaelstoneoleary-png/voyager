import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import LandingPage from "@/pages/LandingPage";
import TripPlanner from "@/pages/TripPlanner";
import PackingList from "@/pages/PackingList";
import Intel from "@/pages/Intel";
import Journeys from "@/pages/Journeys";
import Explore from "@/pages/Explore";
import Community from "@/pages/Community";
import PastJourneys from "@/pages/PastJourneys";
import Onboarding from "@/pages/Onboarding";
import Settings from "@/pages/Settings";
import { UserProvider, useUser } from "@/lib/UserContext";
import { TripProvider } from "@/lib/TripContext";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useUser();

  if (isLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  if (!settings.onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

function OnboardingRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/api/login";
    return null;
  }

  return <Onboarding />;
}

function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const { settings, isLoading: settingsLoading } = useUser();

  if (isLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  if (!settings.onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/onboarding" component={OnboardingRoute} />
      <Route path="/planner">{() => <ProtectedRoute component={TripPlanner} />}</Route>
      <Route path="/packing">{() => <ProtectedRoute component={PackingList} />}</Route>
      <Route path="/intel">{() => <ProtectedRoute component={Intel} />}</Route>
      <Route path="/journeys">{() => <ProtectedRoute component={Journeys} />}</Route>
      <Route path="/community">{() => <ProtectedRoute component={Community} />}</Route>
      <Route path="/explore">{() => <ProtectedRoute component={Explore} />}</Route>
      <Route path="/history">{() => <ProtectedRoute component={PastJourneys} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <TripProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </TripProvider>
      </UserProvider>
    </QueryClientProvider>
  );
}

export default App;
