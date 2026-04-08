import { useState } from "react";
import { Mail } from "lucide-react";

interface EmailVerificationBannerProps {
  user: any;
}

export function EmailVerificationBanner({ user }: EmailVerificationBannerProps) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!user || user.emailVerified || user.authProvider !== "local") return null;

  const handleResend = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/resend-verification", {
        method: "POST",
        credentials: "include",
      });
      setSent(true);
    } catch {
      // silent fail — user can try again
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-4 text-sm text-amber-900">
      <div className="flex items-center gap-2">
        <Mail className="h-4 w-4 flex-shrink-0" />
        <span>Please verify your email address — check your inbox for a confirmation link.</span>
      </div>
      <button
        onClick={handleResend}
        disabled={loading || sent}
        className="flex-shrink-0 underline text-amber-800 hover:text-amber-900 disabled:opacity-50 whitespace-nowrap"
      >
        {sent ? "Sent!" : loading ? "Sending…" : "Resend"}
      </button>
    </div>
  );
}
