import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Users,
  BarChart3,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  Trash2,
  Eye,
  MapPin,
  History,
  Search,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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
  createdAt: string | null;
}

interface UserDetail {
  user: AdminUser;
  journeys: Array<{ id: string; title: string; status: string; dates: string | null; finalDestination: string | null }>;
  pastTrips: Array<{ id: string; destination: string; startDate: string | null; endDate: string | null }>;
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
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Debounce search
  const handleSearch = (value: string) => {
    setSearch(value);
    clearTimeout((handleSearch as any)._t);
    (handleSearch as any)._t = setTimeout(() => setDebouncedSearch(value), 350);
  };

  // ── Queries ──

  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    queryFn: () => fetch("/api/admin/stats", { credentials: "include" }).then(r => r.json()),
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users", debouncedSearch],
    queryFn: () => {
      const qs = debouncedSearch ? `?search=${encodeURIComponent(debouncedSearch)}` : "";
      return fetch(`/api/admin/users${qs}`, { credentials: "include" }).then(r => r.json());
    },
  });

  const { data: userDetail } = useQuery<UserDetail>({
    queryKey: ["/api/admin/users", selectedUserId],
    queryFn: () => fetch(`/api/admin/users/${selectedUserId}`, { credentials: "include" }).then(r => r.json()),
    enabled: !!selectedUserId,
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

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Users
            </TabsTrigger>
          </TabsList>

          {/* ── Overview ── */}
          <TabsContent value="overview">
            {stats ? (
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
            {/* Search */}
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-md border border-input bg-background text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

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
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Button
                          size="sm" variant="ghost"
                          className="gap-1.5 text-muted-foreground"
                          onClick={() => setSelectedUserId(u.id)}
                        >
                          <Eye className="h-4 w-4" /> View
                        </Button>

                        <Button
                          size="sm" variant="ghost"
                          className="gap-1.5 text-muted-foreground"
                          title={u.isAdmin ? "Remove admin" : "Make admin"}
                          onClick={() => patchUser.mutate({ id: u.id, data: { isAdmin: !u.isAdmin } })}
                        >
                          {u.isAdmin ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </Button>

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
        </Tabs>
      </div>

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
