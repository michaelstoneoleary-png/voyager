import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  BarChart3,
  Shield,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  MapPin,
  History,
  Search,
  Zap,
  Activity,
  RefreshCw,
  Clock,
  Database,
  Globe,
  MessageSquare,
  Phone,
  Key,
  Rss,
  Image,
  UserPlus,
  Loader2,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ── Types ──────────────────────────────────────────────────────────────────

interface AdminStats {
  totalUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalJourneys: number;
  totalPastTrips: number;
  activeUsersThisWeek: number;
}

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  isAdmin: boolean;
  disabled: boolean;
  role?: string;
  createdAt: string | null;
}

interface UserDetail {
  user: AdminUser;
  journeys: Array<{ id: string; title: string; status: string; dates: string | null; finalDestination: string | null }>;
  pastTrips: Array<{ id: string; destination: string; startDate: string | null; endDate: string | null }>;
}

interface UsageSummaryRow {
  userId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  totalInputTokens: number;
  totalOutputTokens: number;
  byFeature: Record<string, { input: number; output: number }>;
}

type HealthStatus = "healthy" | "degraded" | "configured" | "unconfigured";
interface ServiceHealth {
  name: string;
  status: HealthStatus;
  latency?: number;
  message?: string;
  checkedAt: string;
}
interface HealthReport {
  services: ServiceHealth[];
  generatedAt: string;
}

interface FeedbackItem {
  id: string;
  message: string;
  pageUrl: string | null;
  screenshot: string | null;
  createdAt: string | null;
  userId: string;
  userEmail: string | null;
  userFirstName: string | null;
  userLastName: string | null;
}

// ── Helpers ────────────────────────────────────────────────────────────────

// Cost rates per million tokens [input, output]
const MODEL_RATES: Record<string, [number, number]> = {
  "claude-haiku-4-5-20251001": [0.25, 1.25],
  "claude-sonnet-4-6": [3, 15],
  "claude-sonnet-4-5": [3, 15],
};

// Feature → model mapping for cost estimation
const FEATURE_MODEL: Record<string, string> = {
  "inspire": "claude-haiku-4-5-20251001",
  "inspire-thinking": "claude-sonnet-4-6",
  "marco-thinking": "claude-sonnet-4-6",
  "itinerary": "claude-sonnet-4-6",
  "activity-replace": "claude-sonnet-4-5",
  "highlights": "claude-sonnet-4-5",
  "csv-parse": "claude-sonnet-4-5",
  "packing": "claude-sonnet-4-5",
  "intel": "claude-sonnet-4-5",
  "chat": "claude-sonnet-4-5",
};

function estimateCost(byFeature: Record<string, { input: number; output: number }>): number {
  let total = 0;
  for (const [feature, counts] of Object.entries(byFeature)) {
    const model = FEATURE_MODEL[feature] || "claude-sonnet-4-5";
    const [inRate, outRate] = MODEL_RATES[model] || [3, 15];
    total += (counts.input / 1_000_000) * inRate + (counts.output / 1_000_000) * outRate;
  }
  return total;
}

// ── Health components ──────────────────────────────────────────────────────

const STATUS_CONFIG: Record<HealthStatus, { label: string; dotClass: string; badgeClass: string }> = {
  healthy:      { label: "Healthy",      dotClass: "bg-green-500",  badgeClass: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  degraded:     { label: "Error",        dotClass: "bg-red-500",    badgeClass: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  configured:   { label: "Configured",   dotClass: "bg-yellow-400", badgeClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
  unconfigured: { label: "Unconfigured", dotClass: "bg-gray-400",   badgeClass: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" },
};

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  "Anthropic":    <Activity className="h-4 w-4" />,
  "Google Places":<Globe className="h-4 w-4" />,
  "Wikipedia":    <Globe className="h-4 w-4" />,
  "RSS Feed":     <Rss className="h-4 w-4" />,
  "Database":     <Database className="h-4 w-4" />,
  "Resend":       <MessageSquare className="h-4 w-4" />,
  "Twilio":       <Phone className="h-4 w-4" />,
  "Google OAuth": <Key className="h-4 w-4" />,
  "Apple OAuth":  <Key className="h-4 w-4" />,
  "Cloudinary":   <Image className="h-4 w-4" />,
};

function HealthServiceCard({ service }: { service: ServiceHealth }) {
  const config = STATUS_CONFIG[service.status];
  const icon = SERVICE_ICONS[service.name] ?? <Activity className="h-4 w-4" />;
  const checkedTime = new Date(service.checkedAt).toLocaleTimeString();
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">{icon}</span>
            {service.name}
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${config.badgeClass}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dotClass}`} />
            {config.label}
          </span>
        </div>
        {service.latency !== undefined && (
          <p className="text-xs text-muted-foreground">{service.latency} ms</p>
        )}
        {service.message && (service.status === "degraded" || service.status === "unconfigured") && (
          <p className={`text-xs break-words ${service.status === "degraded" ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`}>
            {service.message}
          </p>
        )}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Clock className="h-3 w-3" />
          Checked at {checkedTime}
        </div>
      </CardContent>
    </Card>
  );
}

function HealthSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── Stat card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value.toLocaleString()}</div>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function AdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "usage" | "health" | "feedback">("overview");
  const [expandedScreenshot, setExpandedScreenshot] = useState<string | null>(null);
  const [adminInviteOpen, setAdminInviteOpen] = useState(false);
  const [adminInviteEmail, setAdminInviteEmail] = useState("");
  const [adminInviteNote, setAdminInviteNote] = useState("");
  const [adminInvitePending, setAdminInvitePending] = useState(false);

  // Usage date filter
  type UsagePeriod = "7d" | "30d" | "90d" | "all" | "custom";
  const [usagePeriod, setUsagePeriod] = useState<UsagePeriod>("30d");
  const [customStart, setCustomStart] = useState("");
  const [customEnd,   setCustomEnd]   = useState("");

  const usageDateRange = useMemo(() => {
    const now = new Date();
    const toISO = (d: Date) => d.toISOString().split("T")[0];
    if (usagePeriod === "7d")  return { start: toISO(new Date(now.getTime() - 7  * 86400000)), end: toISO(now) };
    if (usagePeriod === "30d") return { start: toISO(new Date(now.getTime() - 30 * 86400000)), end: toISO(now) };
    if (usagePeriod === "90d") return { start: toISO(new Date(now.getTime() - 90 * 86400000)), end: toISO(now) };
    if (usagePeriod === "custom") return { start: customStart, end: customEnd };
    return { start: "", end: "" }; // "all"
  }, [usagePeriod, customStart, customEnd]);

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(value), 350);
  };

  // ── Queries ──

  const adminFetch = (url: string) =>
    fetch(url, { credentials: "include" }).then(r => {
      if (!r.ok) throw new Error(`${r.status}: ${r.statusText}`);
      return r.json();
    });

  const { data: stats, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => adminFetch("/api/admin/stats"),
    retry: 1,
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users", debouncedSearch],
    queryFn: () => {
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
      return adminFetch(`/api/admin/users${qs}`);
    },
    retry: 1,
  });

  const { data: userDetail } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", selectedUserId],
    queryFn: () => adminFetch(`/api/admin/users/${selectedUserId}`),
    enabled: !!selectedUserId,
    retry: 1,
  });

  const { data: usageRows = [] } = useQuery<UsageSummaryRow[]>({
    queryKey: ["/api/admin/usage", usageDateRange.start, usageDateRange.end],
    queryFn: () => {
      const qs = new URLSearchParams();
      if (usageDateRange.start) qs.set("start", usageDateRange.start);
      if (usageDateRange.end)   qs.set("end",   usageDateRange.end);
      return adminFetch(`/api/admin/usage${qs.toString() ? "?" + qs : ""}`);
    },
    retry: 1,
  });

  const { data: healthReport, isLoading: healthLoading, refetch: refetchHealth } = useQuery<HealthReport>({
    queryKey: ["/api/admin/health"],
    queryFn: () => adminFetch("/api/admin/health"),
    enabled: activeTab === "health",
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const { data: feedbackItems = [], isLoading: feedbackLoading } = useQuery<FeedbackItem[]>({
    queryKey: ["/api/admin/feedback"],
    queryFn: () => adminFetch("/api/admin/feedback"),
    enabled: activeTab === "feedback",
    retry: 1,
  });

  // ── Mutations ──

  const patchUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<AdminUser> }) =>
      apiRequest("PATCH", `/api/admin/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
    },
  });

  const fullName = (u: AdminUser) =>
    [u.firstName, u.lastName].filter(Boolean).join(" ") || u.email || "Unknown";

  const initials = (u: AdminUser) =>
    `${(u.firstName || "")[0] || ""}${(u.lastName || "")[0] || ""}`.toUpperCase() || "?";

  return (
    <Layout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-serif text-3xl font-bold">Admin</h1>
            <p className="text-muted-foreground text-sm">Site management and statistics</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="usage" className="gap-2">
              <Zap className="h-4 w-4" /> Usage
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" /> Health
            </TabsTrigger>
            <TabsTrigger value="feedback" className="gap-2">
              <MessageSquare className="h-4 w-4" /> Feedback
            </TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview">
            {statsError ? (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                Failed to load stats: {(statsError as Error).message}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Total users" value={stats.totalUsers} />
                <StatCard label="New this week" value={stats.newUsersThisWeek} />
                <StatCard label="New this month" value={stats.newUsersThisMonth} />
                <StatCard label="Total journeys" value={stats.totalJourneys} />
                <StatCard label="Past trips logged" value={stats.totalPastTrips} />
                <StatCard label="Active this week" value={stats.activeUsersThisWeek} sub="users who updated a journey" />
              </div>
            ) : (
              <div className="text-muted-foreground text-sm">Loading stats…</div>
            )}
          </TabsContent>

          {/* ── Users ── */}
          <TabsContent value="users" className="space-y-4">
            {/* Search + Invite */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by name or email…"
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button size="sm" className="gap-1.5 flex-shrink-0" onClick={() => setAdminInviteOpen(true)}>
                <UserPlus className="h-4 w-4" /> Invite user
              </Button>
            </div>

            {/* Admin invite dialog */}
            <Dialog open={adminInviteOpen} onOpenChange={setAdminInviteOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite a user</DialogTitle>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Email address</label>
                    <input
                      type="email"
                      value={adminInviteEmail}
                      onChange={e => setAdminInviteEmail(e.target.value)}
                      placeholder="user@example.com"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-muted-foreground">Personal note (optional)</label>
                    <input
                      value={adminInviteNote}
                      onChange={e => setAdminInviteNote(e.target.value)}
                      placeholder="Looking forward to having you on Voyager!"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      className="flex-1"
                      disabled={!adminInviteEmail || adminInvitePending}
                      onClick={async () => {
                        setAdminInvitePending(true);
                        try {
                          const r = await fetch("/api/admin/invites", {
                            method: "POST", credentials: "include",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: adminInviteEmail, note: adminInviteNote || undefined }),
                          });
                          if (!r.ok) throw new Error();
                          toast({ title: "Invite sent!", description: `Invitation sent to ${adminInviteEmail}.` });
                          setAdminInviteOpen(false); setAdminInviteEmail(""); setAdminInviteNote("");
                        } catch {
                          toast({ title: "Failed to send invite", variant: "destructive" });
                        } finally { setAdminInvitePending(false); }
                      }}
                    >
                      {adminInvitePending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Send invite email
                    </Button>
                    <Button variant="outline" onClick={async () => {
                      setAdminInvitePending(true);
                      try {
                        const r = await fetch("/api/admin/invites", {
                          method: "POST", credentials: "include",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ note: adminInviteNote || undefined }),
                        });
                        const data = await r.json();
                        await navigator.clipboard?.writeText(data.link);
                        toast({ title: "Invite link copied!", description: "Share it with the user." });
                        setAdminInviteOpen(false); setAdminInviteEmail(""); setAdminInviteNote("");
                      } catch {
                        toast({ title: "Failed", variant: "destructive" });
                      } finally { setAdminInvitePending(false); }
                    }}>
                      Copy link
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {usersLoading ? (
              <div className="text-muted-foreground text-sm">Loading…</div>
            ) : (
              <div className="space-y-2">
                {users.map((u) => (
                  <Card key={u.id} className={u.disabled ? "opacity-60" : ""}>
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Avatar */}
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {u.profileImageUrl
                          ? <img src={u.profileImageUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                          : initials(u)}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{fullName(u)}</span>
                          {u.isAdmin && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Admin</Badge>}
                          {u.disabled && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email || "No email"}</p>
                        {u.createdAt && (
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(u.createdAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm" variant="ghost"
                          className="gap-1.5 text-muted-foreground"
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>

                        {/* Role dropdown */}
                        <select
                          value={u.isAdmin ? "admin" : "user"}
                          onChange={(e) => patchUser.mutate({ id: u.id, data: {
                            role: e.target.value,
                            isAdmin: e.target.value === "admin",
                          }})}
                          className="text-xs border border-input rounded-md px-2 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>

                        <Button
                          size="sm" variant="ghost"
                          className="gap-1.5 text-muted-foreground"
                          title={u.disabled ? "Reinstate" : "Suspend"}
                          onClick={() => patchUser.mutate({ id: u.id, data: { disabled: !u.disabled } })}
                        >
                          {u.disabled ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                        </Button>

                        {confirmDeleteId === u.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm" variant="destructive"
                              disabled={deleteUser.isPending}
                              onClick={() => deleteUser.mutate(u.id)}
                            >
                              {deleteUser.isPending ? "…" : "Confirm"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm" variant="ghost"
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirmDeleteId(u.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {users.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">No users found.</p>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── Usage ── */}
          <TabsContent value="usage" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Token usage per user. Cost estimates use Haiku ($0.25/$1.25 per M) and Sonnet ($3/$15 per M) rates.
            </p>

            {/* Date filter strip */}
            <div className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {(["7d", "30d", "90d", "all", "custom"] as const).map((p) => (
                  <Button
                    key={p}
                    size="sm"
                    variant={usagePeriod === p ? "default" : "outline"}
                    onClick={() => setUsagePeriod(p)}
                    className="text-xs h-7 px-3"
                  >
                    {p === "7d" ? "7 days" : p === "30d" ? "30 days" : p === "90d" ? "90 days" : p === "all" ? "All time" : "Custom"}
                  </Button>
                ))}
              </div>

              {usagePeriod === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={customStart}
                    onChange={(e) => setCustomStart(e.target.value)}
                    className="text-xs border rounded px-2 py-1 bg-background h-7"
                  />
                  <span className="text-xs text-muted-foreground">→</span>
                  <input
                    type="date"
                    value={customEnd}
                    onChange={(e) => setCustomEnd(e.target.value)}
                    className="text-xs border rounded px-2 py-1 bg-background h-7"
                  />
                </div>
              )}

              {/* Summary line */}
              {usageRows.length > 0 && (() => {
                const totalTokens = usageRows.reduce((s, r) => s + r.totalInputTokens + r.totalOutputTokens, 0);
                const totalCost   = usageRows.reduce((s, r) => s + estimateCost(r.byFeature), 0);
                const periodLabel =
                  usagePeriod === "7d"  ? "Last 7 days" :
                  usagePeriod === "30d" ? "Last 30 days" :
                  usagePeriod === "90d" ? "Last 90 days" :
                  usagePeriod === "all" ? "All time" :
                  customStart && customEnd ? `${customStart} – ${customEnd}` : "Custom range";
                return (
                  <p className="text-xs text-muted-foreground">
                    {periodLabel} · {usageRows.length} {usageRows.length === 1 ? "user" : "users"} · {totalTokens.toLocaleString()} tokens · ≈ ${totalCost.toFixed(2)}
                  </p>
                );
              })()}
            </div>

            {usageRows.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No usage data for this period.</p>
            ) : (
              <div className="space-y-3">
                {usageRows.map((row) => {
                  const totalTokens = row.totalInputTokens + row.totalOutputTokens;
                  const cost = estimateCost(row.byFeature);
                  const name = [row.firstName, row.lastName].filter(Boolean).join(" ") || row.email || "Unknown";
                  return (
                    <Card key={row.userId}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="font-medium text-sm">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">{row.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-semibold text-sm">{totalTokens.toLocaleString()} tokens</p>
                            <p className="text-xs text-muted-foreground">≈ ${cost.toFixed(4)}</p>
                          </div>
                        </div>
                        {/* Feature breakdown */}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {Object.entries(row.byFeature).map(([feature, counts]) => (
                            <span
                              key={feature}
                              className="inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full"
                            >
                              <span className="font-medium">{feature}</span>
                              <span className="text-muted-foreground">{(counts.input + counts.output).toLocaleString()}</span>
                            </span>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ── Health ── */}
          <TabsContent value="health" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Real-time status of all external services. Results cached for 30 seconds.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={() => refetchHealth()}
                disabled={healthLoading}
              >
                <RefreshCw className={`h-4 w-4 ${healthLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {healthLoading ? (
              <HealthSkeleton />
            ) : healthReport ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {healthReport.services.map((service) => (
                    <HealthServiceCard key={service.name} service={service} />
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Report generated: {new Date(healthReport.generatedAt).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Switch to this tab to run health checks.
              </p>
            )}
          </TabsContent>

          {/* ── Feedback ── */}
          <TabsContent value="feedback" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Beta feedback submitted by users. Click any screenshot to expand.
            </p>
            {feedbackLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-1 flex-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-16 w-full rounded" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : feedbackItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No feedback yet.</p>
            ) : (
              <div className="space-y-3">
                {feedbackItems.map((item) => {
                  const name = [item.userFirstName, item.userLastName].filter(Boolean).join(" ") || item.userEmail || "Unknown";
                  const initials2 = `${(item.userFirstName || "")[0] || ""}${(item.userLastName || "")[0] || ""}`.toUpperCase() || "?";
                  const relativeUrl = item.pageUrl
                    ? item.pageUrl.replace(/^https?:\/\/[^/]+/, "")
                    : null;
                  return (
                    <Card key={item.id}>
                      <CardContent className="p-4 space-y-3">
                        {/* Header row */}
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {initials2}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">{name}</p>
                            <p className="text-xs text-muted-foreground truncate">{item.userEmail}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-muted-foreground">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString() : "—"}
                            </p>
                            {relativeUrl && (
                              <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[160px]">{relativeUrl}</p>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{item.message}</p>

                        {/* Screenshot thumbnail */}
                        {item.screenshot && (
                          <button
                            onClick={() => setExpandedScreenshot(item.screenshot)}
                            className="block w-full rounded-lg overflow-hidden border border-border bg-muted/20 hover:opacity-80 transition-opacity"
                            title="Click to expand screenshot"
                          >
                            <img
                              src={item.screenshot}
                              alt="Screenshot"
                              className="w-full h-28 object-cover object-top"
                            />
                          </button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* ── Screenshot expand dialog ── */}
      <Dialog open={!!expandedScreenshot} onOpenChange={(v) => { if (!v) setExpandedScreenshot(null); }}>
        <DialogContent className="sm:max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Screenshot</DialogTitle>
          </DialogHeader>
          {expandedScreenshot && (
            <img src={expandedScreenshot} alt="Expanded screenshot" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>

      {/* ── User detail dialog ── */}
      <Dialog open={!!selectedUserId} onOpenChange={(v) => { if (!v) setSelectedUserId(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          {userDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-xl flex items-center gap-2">
                  {fullName(userDetail.user)}
                  {userDetail.user.isAdmin && <Badge className="text-[10px] bg-primary/10 text-primary border-0">Admin</Badge>}
                  {userDetail.user.disabled && <Badge variant="destructive" className="text-[10px]">Suspended</Badge>}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">{userDetail.user.email}</p>
                {userDetail.user.createdAt && (
                  <p className="text-xs text-muted-foreground">
                    Joined {new Date(userDetail.user.createdAt).toLocaleDateString()}
                  </p>
                )}
              </DialogHeader>

              <div className="space-y-5 pt-2">
                {/* Journeys */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Journeys ({userDetail.journeys.length})
                  </h3>
                  {userDetail.journeys.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No journeys.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetail.journeys.map((j) => (
                        <div key={j.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-md px-3 py-2">
                          <span className="font-medium truncate">{j.title}</span>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {j.dates && <span className="text-xs text-muted-foreground">{j.dates}</span>}
                            <Badge variant="outline" className="text-[10px]">{j.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Past trips */}
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2 mb-2">
                    <History className="h-4 w-4 text-primary" />
                    Past trips ({userDetail.pastTrips.length})
                  </h3>
                  {userDetail.pastTrips.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No past trips logged.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {userDetail.pastTrips.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-sm bg-muted/30 rounded-md px-3 py-2">
                          <span className="font-medium truncate">{t.destination}</span>
                          {(t.startDate || t.endDate) && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                              {[t.startDate, t.endDate].filter(Boolean).join(" – ")}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-sm">Loading…</div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
