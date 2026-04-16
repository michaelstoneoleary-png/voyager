import { Layout } from "@/components/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Wallet,
  MoreHorizontal,
  Plus,
  Info,
  TrendingUp,
  Users,
  Archive,
  RotateCcw,
  Trash2,
  Share2,
  Copy,
  UserCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogHeader,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { NewTripDialog } from "@/components/NewTripDialog";
import { Link } from "wouter";
import { useTrips } from "@/lib/TripContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_IMAGE = "/images/destinations/city.jpg";

export default function Journeys() {
  const [isNewTripOpen, setIsNewTripOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareJourneyId, setShareJourneyId] = useState<string | null>(null);
  const [shareJourneyTitle, setShareJourneyTitle] = useState("");
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const { trips } = useTrips();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const upcomingJourneys = trips.filter(t => t.status !== "Completed" && t.status !== "Archived");
  const pastJourneys     = trips.filter(t => t.status === "Completed");
  const archivedJourneys = trips.filter(t => t.status === "Archived");

  const { data: friends = [] } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    queryFn: () => fetch("/api/friends", { credentials: "include" }).then(r => r.json()),
  });

  const { data: sharedJourneys = [] } = useQuery<any[]>({
    queryKey: ["/api/journeys/shared"],
    queryFn: () => fetch("/api/journeys/shared", { credentials: "include" }).then(r => r.json()),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/journeys/${id}`, { status: "Archived" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/journeys"] }),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => apiRequest("PATCH", `/api/journeys/${id}`, { status: "Planning" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/journeys"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/journeys/${id}`),
    onSuccess: () => {
      setConfirmDeleteId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
    },
  });

  const shareMutation = useMutation({
    mutationFn: ({ journeyId, friendId }: { journeyId: string; friendId: string }) =>
      apiRequest("POST", `/api/journeys/${journeyId}/share`, { friendId }),
    onSuccess: () => {
      setShareDialogOpen(false);
      setSelectedFriendId("");
      toast({ title: "Journey shared!", description: `${shareJourneyTitle} has been shared. They'll receive an email notification.` });
    },
    onError: async (err: any) => {
      const msg = await err?.response?.text?.() ?? "Failed to share journey";
      toast({ title: "Share failed", description: msg, variant: "destructive" });
    },
  });

  const copyMutation = useMutation({
    mutationFn: (journeyId: string) => apiRequest("POST", `/api/journeys/${journeyId}/copy`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
      toast({ title: "Journey copied!", description: "Added to your Upcoming & Planning tab." });
    },
    onError: () => toast({ title: "Failed to copy journey", variant: "destructive" }),
  });

  const openShareDialog = (e: React.MouseEvent, tripId: string, tripTitle: string) => {
    e.stopPropagation();
    setShareJourneyId(tripId);
    setShareJourneyTitle(tripTitle);
    setSelectedFriendId("");
    setShareDialogOpen(true);
  };

  return (
    <>
      <NewTripDialog open={isNewTripOpen} onOpenChange={setIsNewTripOpen} />

      {/* Share journey dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg flex items-center gap-2">
              <Share2 className="h-4 w-4 text-primary" /> Share Journey
            </DialogTitle>
            <DialogDescription>
              Share <strong>{shareJourneyTitle}</strong> with a friend. They'll get read-only access and can copy it to their own account.
            </DialogDescription>
          </DialogHeader>
          {friends.length === 0 ? (
            <p className="text-sm text-muted-foreground py-2">
              You have no friends yet. Add friends via the <strong>Invite Friends</strong> button in the sidebar.
            </p>
          ) : (
            <div className="space-y-3 py-1">
              <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a friend…" />
                </SelectTrigger>
                <SelectContent>
                  {friends.map((f: any) => (
                    <SelectItem key={f.friend.id} value={f.friend.id}>
                      {f.friend.firstName} {f.friend.lastName} <span className="text-muted-foreground">({f.friend.email})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            {friends.length > 0 && (
              <Button
                disabled={!selectedFriendId || shareMutation.isPending}
                onClick={() => shareJourneyId && shareMutation.mutate({ journeyId: shareJourneyId, friendId: selectedFriendId })}
              >
                {shareMutation.isPending ? "Sharing…" : "Share"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Layout>
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold">Your Journeys</h1>
              <p className="text-muted-foreground">Manage your upcoming adventures and relive past memories.</p>
            </div>
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              onClick={() => setIsNewTripOpen(true)}
            >
               <Plus className="mr-2 h-5 w-5" /> Start New Journey
            </Button>
          </div>

        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 mb-8">
            <TabsTrigger value="upcoming">Upcoming & Planning</TabsTrigger>
            <TabsTrigger value="past">Past Journeys</TabsTrigger>
            <TabsTrigger value="archived">
              Archived{archivedJourneys.length > 0 && ` (${archivedJourneys.length})`}
            </TabsTrigger>
            <TabsTrigger value="shared">
              Shared with Me{sharedJourneys.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                  {sharedJourneys.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingJourneys.map(trip => (
                <Dialog key={trip.id}>
                  <DialogTrigger asChild>
                    <Card className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors flex flex-col h-full text-left">
                      <div className="aspect-[16/9] relative overflow-hidden">
                        <img
                          src={trip.image || DEFAULT_IMAGE}
                          alt={trip.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute top-3 left-3 flex gap-2">
                           {trip.priceAlert?.status === "Price Drop" && (
                             <Badge className="bg-emerald-500/90 hover:bg-emerald-500 border-0 text-white backdrop-blur-sm animate-pulse">
                               <TrendingUp className="h-3 w-3 mr-1 rotate-180" /> Price Drop
                             </Badge>
                           )}
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                          <Badge variant="secondary" className="text-[10px] h-5 bg-white/20 text-white border-0 backdrop-blur-sm shadow-sm">
                            {trip.status}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-5 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                           <h3 className="font-serif text-xl font-bold leading-tight group-hover:text-primary transition-colors">{trip.title}</h3>
                           <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                               <Button
                                 variant="ghost" size="icon"
                                 className="h-6 w-6 -mr-2 -mt-1 text-muted-foreground"
                                 onClick={(e) => e.stopPropagation()}
                                 onPointerDown={(e) => e.stopPropagation()}
                               >
                                 <MoreHorizontal className="h-4 w-4" />
                               </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                               <DropdownMenuItem
                                 onClick={(e) => openShareDialog(e, trip.id, trip.title)}
                                 className="gap-2"
                               >
                                 <Share2 className="h-4 w-4" /> Share with friend
                               </DropdownMenuItem>
                               <DropdownMenuItem
                                 onClick={() => archiveMutation.mutate(trip.id)}
                                 className="gap-2"
                               >
                                 <Archive className="h-4 w-4" /> Archive journey
                               </DropdownMenuItem>
                             </DropdownMenuContent>
                           </DropdownMenu>
                        </div>

                        <div className="text-sm text-muted-foreground mb-4 space-y-1">
                           <div className="flex items-center gap-2">
                             <Calendar className="h-3.5 w-3.5" /> {trip.dates || "No dates"}
                           </div>
                           <div className="flex items-center gap-4">
                              {trip.days && <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {trip.days} Days</span>}
                              {trip.cost && <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> {trip.cost}</span>}
                           </div>
                        </div>

                        <div className="mt-auto space-y-1.5">
                          <div className="flex justify-between text-xs text-muted-foreground font-medium">
                            <span>Planning Progress</span>
                            <span>{trip.progress}%</span>
                          </div>
                          <Progress value={trip.progress} className="h-1.5" />
                        </div>
                      </CardContent>
                    </Card>
                  </DialogTrigger>

                  <DialogContent className="w-full sm:max-w-[600px] overflow-hidden p-0">
                    <div className="relative h-48 w-full">
                      <img
                        src={trip.image || DEFAULT_IMAGE}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40" />
                      <div className="absolute bottom-6 left-6 text-white">
                        <Badge className="mb-2 bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md">
                          {trip.status}
                        </Badge>
                        <DialogTitle className="font-serif text-3xl font-bold text-white">{trip.title}</DialogTitle>
                        <div className="flex items-center gap-4 text-sm mt-1 opacity-90">
                           <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {trip.dates || "No dates"}</span>
                           {trip.days && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {trip.days} Days</span>}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Seasonality Insight */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {trip.seasonality && (
                        <div className="bg-muted/30 rounded-xl p-4 border border-border">
                           <div className="flex items-center justify-between mb-2">
                             <h4 className="font-medium flex items-center gap-2 text-primary">
                               <Info className="h-4 w-4" /> Seasonality
                             </h4>
                             {(trip.seasonality as any).peak_season ? (
                               <Badge variant="secondary" className="font-mono text-[10px]">
                                 {(trip.seasonality as any).peak_season}
                               </Badge>
                             ) : (trip.seasonality as any).type && (
                               <Badge variant={(trip.seasonality as any).type === "Peak Season" ? "destructive" : "secondary"} className="font-mono text-[10px]">
                                 {(trip.seasonality as any).weatherIcon} {(trip.seasonality as any).type}
                               </Badge>
                             )}
                           </div>
                           <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                             {(trip.seasonality as any).tip || (trip.seasonality as any).description || ""}
                           </p>
                           {(trip.seasonality as any).best_months && (
                             <div className="flex flex-wrap gap-1 mb-2">
                               {((trip.seasonality as any).best_months as string[]).slice(0, 4).map((m: string) => (
                                 <Badge key={m} variant="outline" className="text-[10px]">{m}</Badge>
                               ))}
                             </div>
                           )}
                           {(trip.seasonality as any).crowdLevel && (
                             <div className="flex items-center gap-2 text-xs font-medium bg-background/50 p-2 rounded-lg w-fit">
                               <Users className="h-3 w-3 text-muted-foreground" />
                               Crowds: <span className={(trip.seasonality as any).crowdLevel?.includes("High") ? "text-orange-600" : "text-emerald-600"}>{(trip.seasonality as any).crowdLevel}</span>
                             </div>
                           )}
                        </div>
                        )}

                        <div className="space-y-4">
                           {/* Price Alert Widget */}
                           {trip.priceAlert && (
                             <div className="bg-background rounded-xl p-4 border border-border shadow-sm">
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="font-medium flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-emerald-500" /> Price Watch
                                  </h4>
                                  <Badge variant="outline" className={trip.priceAlert?.trend === "down" ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-orange-600 border-orange-200 bg-orange-50"}>
                                    {trip.priceAlert?.recommendation}
                                  </Badge>
                                </div>
                                <div className="flex items-baseline justify-between">
                                   <div>
                                     <p className="text-2xl font-bold font-mono">{trip.priceAlert?.currentPrice}</p>
                                     <p className="text-xs text-muted-foreground">Checked today</p>
                                   </div>
                                   <div className={`text-sm font-bold ${trip.priceAlert?.trend === "down" ? "text-emerald-600" : "text-orange-600"}`}>
                                     {trip.priceAlert?.amount}
                                   </div>
                                </div>
                             </div>
                           )}

                           {/* Logistics Mini-Grid */}
                           {trip.logistics && (
                             <div className="space-y-3">
                               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {(trip.logistics as any)?.visa && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Visa</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).visa}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.currency && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Currency</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).currency}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.timezone && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Timezone</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).timezone}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.language && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Language</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).language}</p>
                                    </div>
                                  )}
                                  {(trip.logistics as any)?.health && (
                                    <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                      <span className="text-[10px] uppercase text-muted-foreground font-bold">Health</span>
                                      <p className="text-sm font-medium">{(trip.logistics as any).health}</p>
                                    </div>
                                  )}
                               </div>
                               {(trip.logistics as any)?.budget_notes && (
                                 <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
                                   <span className="text-[10px] uppercase text-amber-700 dark:text-amber-400 font-bold">Budget Notes</span>
                                   <p className="text-sm text-amber-900 dark:text-amber-200">{(trip.logistics as any).budget_notes}</p>
                                 </div>
                               )}
                               {Array.isArray((trip.logistics as any)?.travel_tips) && (trip.logistics as any).travel_tips.length > 0 && (
                                 <div className="bg-muted/30 p-3 rounded-lg border border-border">
                                   <span className="text-[10px] uppercase text-muted-foreground font-bold mb-2 block">Travel Tips</span>
                                   <ul className="text-sm text-muted-foreground space-y-1">
                                     {((trip.logistics as any).travel_tips as string[]).map((tip: string, idx: number) => (
                                       <li key={idx} className="flex items-start gap-2">
                                         <span className="text-primary mt-0.5">•</span> {tip}
                                       </li>
                                     ))}
                                   </ul>
                                 </div>
                               )}
                             </div>
                           )}
                        </div>
                      </div>

                      <div className="flex gap-3 pt-2">
                        <Link href={`/planner/${trip.id}`}>
                          <Button className="flex-1 bg-primary hover:bg-primary/90">
                            Edit Itinerary
                          </Button>
                        </Link>
                        <Button variant="outline" className="flex-1">View Bookings</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}

              <Button
                variant="outline"
                className="h-full min-h-[300px] flex flex-col gap-4 border-dashed text-muted-foreground hover:text-foreground hover:bg-muted/30 cursor-pointer w-full"
                onClick={() => setIsNewTripOpen(true)}
              >
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="font-medium text-lg">Create New Plan</span>
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="past" className="space-y-6">
            <div className="flex items-center justify-between bg-muted/30 p-4 rounded-lg border border-border">
               <div>
                 <h3 className="font-medium">Manage Your Travel History</h3>
                 <p className="text-sm text-muted-foreground">Import trips from spreadsheets, visualize your world map, and see your travel stats.</p>
               </div>
               <Link href="/history">
                 <Button variant="outline">Manage Past Journeys</Button>
               </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastJourneys.map(trip => (
                <Link key={trip.id} href={`/planner/${trip.id}`}>
                  <Card className="group overflow-hidden cursor-pointer hover:border-primary/50 transition-colors opacity-80 hover:opacity-100" data-testid={`card-past-journey-${trip.id}`}>
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={trip.image || DEFAULT_IMAGE}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                      <div className="absolute bottom-3 left-3 text-white">
                        <h4 className="font-serif text-lg font-bold">{trip.title}</h4>
                        <p className="text-xs opacity-80">{trip.dates || ""}</p>
                      </div>
                    </div>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        {trip.days && <span className="font-medium text-foreground">{trip.days} Days</span>}{trip.days && trip.cost && " • "}{trip.cost || ""}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {trip.status}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="archived" className="space-y-6">
            {archivedJourneys.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Archive className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No archived journeys.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {archivedJourneys.map(trip => (
                  <Card key={trip.id} className="overflow-hidden opacity-70 hover:opacity-90 transition-opacity">
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={trip.image || DEFAULT_IMAGE}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover grayscale"
                      />
                      <div className="absolute inset-0 bg-black/50" />
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-serif text-lg font-bold text-white leading-tight">{trip.title}</h3>
                        {trip.dates && <p className="text-xs text-white/70 mt-0.5">{trip.dates}</p>}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        {trip.days && <span>{trip.days} days</span>}
                        {trip.days && trip.cost && " · "}
                        {trip.cost && <span>{trip.cost}</span>}
                      </div>

                      {confirmDeleteId === trip.id ? (
                        <div className="space-y-2">
                          <p className="text-sm text-destructive font-medium">Delete permanently? This cannot be undone.</p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={deleteMutation.isPending}
                              onClick={() => deleteMutation.mutate(trip.id)}
                            >
                              {deleteMutation.isPending ? "Deleting..." : "Yes, delete"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setConfirmDeleteId(null)}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={restoreMutation.isPending}
                            onClick={() => restoreMutation.mutate(trip.id)}
                          >
                            <RotateCcw className="h-3.5 w-3.5" /> Restore
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setConfirmDeleteId(trip.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete permanently
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shared" className="space-y-6">
            {sharedJourneys.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <UserCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">No journeys shared with you yet.</p>
                <p className="text-xs mt-1">When a friend shares a journey, it will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sharedJourneys.map((trip: any) => (
                  <Card key={trip.id} className="overflow-hidden">
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={trip.image || DEFAULT_IMAGE}
                        alt={trip.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-[10px]">
                          Read-only
                        </Badge>
                      </div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="font-serif text-lg font-bold text-white leading-tight">{trip.title}</h3>
                        {trip.dates && <p className="text-xs text-white/70 mt-0.5">{trip.dates}</p>}
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1">
                        <UserCheck className="h-3 w-3" />
                        Shared by <span className="font-medium text-foreground ml-1">{trip.sharedBy?.firstName} {trip.sharedBy?.lastName}</span>
                      </p>
                      <div className="text-sm text-muted-foreground mb-4">
                        {trip.days && <span>{trip.days} days</span>}
                        {trip.days && trip.cost && " · "}
                        {trip.cost && <span>{trip.cost}</span>}
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/planner/${trip.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full gap-1.5">
                            View Itinerary
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          disabled={copyMutation.isPending}
                          onClick={() => copyMutation.mutate(trip.id)}
                        >
                          <Copy className="h-3.5 w-3.5" /> Copy to Mine
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      </Layout>
    </>
  );
}
