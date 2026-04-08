import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import LandingPage from "@/pages/LandingPage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import TripPlanner from "@/pages/TripPlanner";
import PackingList from "@/pages/PackingList";
import Intel from "@/pages/Intel";
import Journeys from "@/pages/Journeys";
import Inspire from "@/pages/Inspire";
import Community from "@/pages/Community";
import PastJourneys from "@/pages/PastJourneys";
import Onboarding from "@/pages/Onboarding";
import Settings from "@/pages/Settings";
import SmsConsent from "@/pages/SmsConsent";
import SharedJourney from "@/pages/SharedJourney";
import AdminPage from "@/pages/Admin";
import VerifyEmail from "@/pages/VerifyEmail";
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
    return <Redirect to="/login" />;
  }

  if (!settings.onboardingCompleted) {
    return <Redirect to="/onboarding" />;
  }

  return <Component />;
}

function AdminRoute() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) return <Redirect to="/login" />;
  if (!(user as any).isAdmin) return <Redirect to="/" />;
  return <AdminPage />;
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
    return <Redirect to="/login" />;
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
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/sms-consent" component={SmsConsent} />
      <Route path="/share/:id" component={SharedJourney} />
      <Route path="/onboarding" component={OnboardingRoute} />
      <Route path="/planner/:id">{() => <ProtectedRoute component={TripPlanner} />}</Route>
      <Route path="/packing">{() => <ProtectedRoute component={PackingList} />}</Route>
      <Route path="/intel">{() => <ProtectedRoute component={Intel} />}</Route>
      <Route path="/journeys">{() => <ProtectedRoute component={Journeys} />}</Route>
      <Route path="/community">{() => <ProtectedRoute component={Community} />}</Route>
      <Route path="/inspire">{() => <ProtectedRoute component={Inspire} />}</Route>
      <Route path="/history">{() => <ProtectedRoute component={PastJourneys} />}</Route>
      <Route path="/settings">{() => <ProtectedRoute component={Settings} />}</Route>
      <Route path="/admin">{() => <AdminRoute />}</Route>
      <Route path="/verify-email" component={VerifyEmail} />
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
