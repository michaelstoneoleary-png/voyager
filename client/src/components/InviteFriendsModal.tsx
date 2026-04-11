import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Gift, Copy, Check, Send, Loader2 } from "lucide-react";

interface InviteFriendsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteFriendsModal({ open, onOpenChange }: InviteFriendsModalProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteNote, setInviteNote] = useState("");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: myInvites = [], refetch: refetchInvites } = useQuery<any[]>({
    queryKey: ["/api/invites"],
    queryFn: () => fetch("/api/invites", { credentials: "include" }).then(r => r.json()),
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" /> Invite Friends
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Invite friends to join bon VOYAGER. They'll get a personalised link to sign up.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {/* Email invite */}
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

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="flex-1 border-t border-border" />
          </div>

          {/* Copy link */}
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

          {/* Sent invites */}
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
