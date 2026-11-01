"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck, CheckCircle2, AlertCircle, RefreshCw, ArrowRight } from "lucide-react";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryToken = searchParams.get("token") || "";
  const queryEmail = searchParams.get("email") || "";

  const [token, setToken] = useState(queryToken);
  const [email, setEmail] = useState(queryEmail);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Auto-verify if token is in URL
  useEffect(() => {
    if (queryToken && !success) {
      handleVerify(queryToken);
    }
  }, [queryToken]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleVerify = async (tokenToVerify?: string) => {
    const t = tokenToVerify || token;
    if (!t.trim()) {
      setError("Please enter the verification code or token from your email.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: t.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to verify email.");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification token.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("Please provide your email address to resend the verification code.");
      return;
    }

    setError(null);
    setResending(true);
    setResendMsg(null);

    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to resend verification.");
      }

      setResendMsg(data.message || "A new verification code has been dispatched.");
      if (data.verificationToken) {
        setToken(data.verificationToken);
      }
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-3">
            <MailCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Verify your email</h1>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {email ? (
              <>
                We sent verification instructions to <strong className="text-foreground">{email}</strong>
              </>
            ) : (
              "Confirm your email address to access your interview simulator"
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xs">
          {success ? (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 mx-auto">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Email verified successfully!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Your account is now active and ready. You can sign in to launch your interview sessions.
                </p>
              </div>
              <Link
                href="/login?verified=true"
                className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition shadow-xs mt-2"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {resendMsg && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-500 flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{resendMsg}</span>
                </div>
              )}

              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleVerify();
                }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Verification code or token</label>
                  <input
                    type="text"
                    required
                    placeholder="Paste token or enter verification code"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="w-full rounded-xl border border-input bg-background px-3.5 py-2 text-xs font-mono text-foreground placeholder:font-sans placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !token.trim()}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <span>{loading ? "Verifying..." : "Verify Email Address"}</span>
                </button>
              </form>

              <div className="border-t border-border pt-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">Didn&apos;t receive it?</span>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || cooldown > 0}
                    className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`h-3 w-3 ${resending ? "animate-spin" : ""}`} />
                    <span>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Wrong email address?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Register again
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[80vh] flex items-center justify-center text-xs text-muted-foreground">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
