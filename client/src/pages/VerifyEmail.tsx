import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setStatus("no-token");
      return;
    }
    // The server redirects to / on success, so if we're still here it either
    // errored or we need to call it and handle the result
    fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
      credentials: "include",
      redirect: "manual",
    })
      .then((r) => {
        // Server returns a redirect — if redirected to /, treat as success
        if (r.status === 302 || r.type === "opaqueredirect") {
          window.location.href = "/?verified=1";
        } else if (r.ok) {
          window.location.href = "/?verified=1";
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <div className="max-w-md w-full text-center space-y-4">
        <Link href="/">
          <span className="font-serif text-2xl font-bold tracking-tight text-primary cursor-pointer">bon VOYAGER</span>
        </Link>

        {status === "loading" && (
          <div className="space-y-3 pt-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Verifying your email address…</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-3 pt-4">
            <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
            <h2 className="font-serif text-xl font-bold">Email verified!</h2>
            <p className="text-muted-foreground">Redirecting you to bon VOYAGER…</p>
          </div>
        )}

        {(status === "error" || status === "no-token") && (
          <div className="space-y-4 pt-4">
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <h2 className="font-serif text-xl font-bold">Verification failed</h2>
            <p className="text-muted-foreground">
              {status === "no-token"
                ? "No verification token found."
                : "This link may have expired or already been used. Please request a new one."}
            </p>
            <Link href="/login">
              <Button>Back to sign in</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
