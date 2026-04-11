import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail } from "lucide-react";

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.54 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701"/>
    </svg>
  );
}

export default function Login() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Handle query params for feedback messages
  const params = new URLSearchParams(window.location.search);
  const errorParam = params.get("error");
  const verifiedParam = params.get("verified");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Login failed");
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/user-settings"] });
      navigate("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const oauthError = errorParam === "google"
    ? "Google sign-in failed. Please try again."
    : errorParam === "apple"
    ? "Apple sign-in failed. Please try again."
    : errorParam === "expired-token"
    ? "Verification link has expired. Please request a new one."
    : errorParam === "invalid-token"
    ? "Invalid verification link."
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="font-serif text-2xl font-bold tracking-tight text-primary cursor-pointer" data-testid="text-brand-login">bon VOYAGER</span>
          </Link>
          <Link href="/register">
            <Button variant="outline" size="sm" data-testid="link-register-header">Create Account</Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="font-serif text-2xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to your bon VOYAGER account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {verifiedParam && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md px-4 py-3">
                Email verified! You can now sign in.
              </div>
            )}
            {(oauthError || error) && (
              <p className="text-sm text-destructive" data-testid="text-login-error">{oauthError || error}</p>
            )}

            {/* OAuth buttons */}
            <a href="/api/auth/google" className="block">
              <Button variant="outline" className="w-full gap-2" type="button">
                <GoogleIcon /> Continue with Google
              </Button>
            </a>
            <Button variant="outline" className="w-full gap-2 opacity-40 cursor-not-allowed" type="button" disabled>
              <AppleIcon /> Continue with Apple
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="input-login-email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  required
                  data-testid="input-login-password"
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading} data-testid="button-login-submit">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</>
                ) : (
                  <><Mail className="mr-2 h-4 w-4" /> Sign In with Email</>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register">
                <span className="text-primary hover:underline cursor-pointer" data-testid="link-goto-register">Create one</span>
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
