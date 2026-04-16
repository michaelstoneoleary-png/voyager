import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Gift, Copy, Check, Send, Loader2, UserPlus, UserCheck, Users } from "lucide-react";

interface InviteFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [friendEmail, setFriendEmail] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: myInvites = [], refetch: refetchInvites } = useQuery<any[]>({
    queryKey: ["/api/invites"],
    queryFn: () => fetch("/api/invites", { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  const { data: friends = [] } = useQuery<any[]>({
    queryKey: ["/api/friends"],
    queryFn: () => fetch("/api/friends", { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  const { data: friendRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/friends/requests"],
    queryFn: () => fetch("/api/friends/requests", { credentials: "include" }).then(r => r.json()),
    enabled: open,
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (data: { email?: string; note?: string }) =>
      fetch("/api/invites", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),
    onSuccess: (data) => {
      if (inviteEmail) {
        toast({ title: "Invite sent!", description: `Invitation emailed to ${inviteEmail}.` });
        setInviteEmail("");
        setInviteNote("");
      } else {
        navigator.clipboard?.writeText(data.link).catch(() => {});
        setCopiedToken(data.token);
        setTimeout(() => setCopiedToken(null), 3000);
        toast({ title: "Invite link copied!", description: "Share it with your friends." });
      }
      refetchInvites();
    },
    onError: () => toast({ title: "Failed to create invite", variant: "destructive" }),
  });

  const sendFriendRequestMutation = useMutation({
    mutationFn: async (email: string) =>
      fetch("/api/friends/request", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }).then(async r => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),
    onSuccess: () => {
      toast({ title: "Friend request sent!", description: `A request was sent to ${friendEmail}.` });
      setFriendEmail("");
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
    },
    onError: async (err: any) => {
      toast({ title: "Request failed", description: err.message ?? "Could not send friend request.", variant: "destructive" });
    },
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/friends/${id}/accept`, { method: "POST", credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      toast({ title: "Friend request accepted!" });
      queryClient.invalidateQueries({ queryKey: ["/api/friends"] });
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/friends/${id}/decline`, { method: "POST", credentials: "include" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/friends/requests"] });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Friends & Invites
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="friends" className="gap-1.5">
              <Users className="h-3.5 w-3.5" /> Friends
              {friends.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {friends.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-1.5">
              <UserCheck className="h-3.5 w-3.5" /> Requests
              {friendRequests.length > 0 && (
                <span className="ml-1 inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold leading-none">
                  {friendRequests.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="invite" className="gap-1.5">
              <UserPlus className="h-3.5 w-3.5" /> Invite
            </TabsTrigger>
          </TabsList>

          {/* Friends tab */}
          <TabsContent value="friends" className="space-y-4 pt-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Add a friend by email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={friendEmail}
                  onChange={e => setFriendEmail(e.target.value)}
                  className="flex-1"
                  onKeyDown={e => {
                    if (e.key === "Enter" && friendEmail) {
                      sendFriendRequestMutation.mutate(friendEmail.trim().toLowerCase());
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => sendFriendRequestMutation.mutate(friendEmail.trim().toLowerCase())}
                  disabled={!friendEmail || sendFriendRequestMutation.isPending}
                  className="shrink-0"
                >
                  {sendFriendRequestMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">They must already have a bon VOYAGER account.</p>
            </div>

            {friends.length > 0 ? (
              <div className="space-y-1 pt-1 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Your friends</p>
                {friends.map((f: any) => (
                  <div key={f.id} className="flex items-center gap-3 py-2">
                    {f.friend.profileImageUrl ? (
                      <img src={f.friend.profileImageUrl} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                        {(f.friend.firstName?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{f.friend.firstName} {f.friend.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{f.friend.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No friends yet. Add some above!</p>
              </div>
            )}
          </TabsContent>

          {/* Requests tab */}
          <TabsContent value="requests" className="space-y-3 pt-3">
            {friendRequests.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No pending friend requests.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending requests</p>
                {friendRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center gap-3 bg-muted/30 rounded-lg p-3">
                    {req.requester.profileImageUrl ? (
                      <img src={req.requester.profileImageUrl} alt="" className="h-8 w-8 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                        {(req.requester.firstName?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{req.requester.firstName} {req.requester.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.requester.email}</p>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        disabled={acceptMutation.isPending}
                        onClick={() => acceptMutation.mutate(req.id)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={declineMutation.isPending}
                        onClick={() => declineMutation.mutate(req.id)}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Invite tab */}
          <TabsContent value="invite" className="space-y-4 pt-3">
            <p className="text-sm text-muted-foreground">
              Invite new users to join bon VOYAGER. They'll get a personalised sign-up link.
            </p>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Send by email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="friend@example.com"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  className="flex-1"
                  onKeyDown={e => {
                    if (e.key === "Enter" && inviteEmail) {
                      sendInviteMutation.mutate({ email: inviteEmail, note: inviteNote || undefined });
                    }
                  }}
                />
                <Button
                  size="sm"
                  onClick={() => sendInviteMutation.mutate({ email: inviteEmail, note: inviteNote || undefined })}
                  disabled={!inviteEmail || sendInviteMutation.isPending}
                  className="shrink-0"
                >
                  {sendInviteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
              <Input
                placeholder="Add a personal note (optional)"
                value={inviteNote}
                onChange={e => setInviteNote(e.target.value)}
                className="text-sm"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => sendInviteMutation.mutate({})}
              disabled={sendInviteMutation.isPending}
            >
              {copiedToken
                ? <><Check className="h-4 w-4 text-emerald-600" /> Link copied!</>
                : <><Copy className="h-4 w-4" /> Copy invite link</>
              }
            </Button>

            {myInvites.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sent invites</p>
                {myInvites.slice(0, 5).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-foreground truncate flex-1">{inv.email || "Shareable link"}</span>
                    <span className={`text-xs flex-shrink-0 ml-2 ${inv.acceptedAt ? "text-emerald-600" : inv.expired ? "text-muted-foreground line-through" : "text-amber-600"}`}>
                      {inv.acceptedAt ? "Accepted" : inv.expired ? "Expired" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
