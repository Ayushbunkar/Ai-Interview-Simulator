"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, Mail, ArrowRight, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process request.");
      }

      setSubmitted(true);
      if (data.resetToken) {
        setDemoToken(data.resetToken);
      }
    } catch (err: any) {
      setError(err.message || "Failed to process password reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-3">
            <KeyRound className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Reset your password</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Enter your email and we will send you a secure link to reset your credentials
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          {submitted ? (
            <div className="py-2 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Check your inbox</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  If an account exists for <strong className="text-foreground">{email}</strong>, you will receive password reset instructions.
                </p>
              </div>

              {demoToken && (
                <div className="mt-4 p-3 rounded-lg border border-border bg-muted/30 text-xs">
                  <span className="text-muted-foreground block text-[11px] mb-1 font-semibold uppercase">Development Quick Link:</span>
                  <Link
                    href={`/reset-password?token=${demoToken}`}
                    className="font-mono text-primary break-all hover:underline"
                  >
                    /reset-password?token={demoToken}
                  </Link>
                </div>
              )}

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition shadow-2xs mt-4"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Email address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background pl-9 pr-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <span>{loading ? "Generating reset link..." : "Send Reset Instructions"}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
