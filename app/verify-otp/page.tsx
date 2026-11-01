"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  RotateCcw,
  Mail,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();

  const challengeIdParam = searchParams.get("challenge") || searchParams.get("challengeId") || "";
  const emailParam = searchParams.get("email") || "";
  const purposeParam = searchParams.get("purpose") || "login";

  const [challengeId, setChallengeId] = useState<string>(challengeIdParam);
  const [maskedEmail, setMaskedEmail] = useState<string>(emailParam ? maskEmailStr(emailParam) : "your email");
  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  // Resend cooldown timer (60 seconds)
  const [countdown, setCountdown] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  function maskEmailStr(str: string): string {
    const parts = str.split("@");
    if (parts.length !== 2) return str;
    const [name, domain] = parts;
    if (name.length <= 2) return `${name[0]}*@${domain}`;
    return `${name[0]}${"*".repeat(Math.min(5, name.length - 2))}${name[name.length - 1]}@${domain}`;
  }

  // Load challenge from session storage or URL
  useEffect(() => {
    if (!challengeId) {
      try {
        const stored = sessionStorage.getItem("interviewforge_pending_challenge");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.challengeId) {
            setChallengeId(parsed.challengeId);
            if (parsed.email) setMaskedEmail(parsed.email);
          }
        }
      } catch {}
    }
  }, [challengeId]);

  // Resend countdown timer interval
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    setCanResend(false);
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Focus the first empty digit input on mount
  useEffect(() => {
    const firstEmpty = digits.findIndex(d => !d);
    const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
    inputRefs.current[targetIdx]?.focus();
  }, []);

  // Handle single digit typing
  const handleDigitChange = (index: number, value: string) => {
    if (isLocked) return;
    setError(null);

    // Accept only numeric characters
    const numericChar = value.replace(/\D/g, "");
    if (!numericChar) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const singleDigit = numericChar.slice(-1);
    const next = [...digits];
    next[index] = singleDigit;
    setDigits(next);

    // Auto-advance to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle Backspace and Arrow Key navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Move back and clear previous
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle full OTP Paste (e.g. copied from email)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isLocked) return;

    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pastedData) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      if (i < pastedData.length) {
        next[i] = pastedData[i];
      }
    }
    setDigits(next);

    const targetFocus = Math.min(5, pastedData.length);
    inputRefs.current[targetFocus]?.focus();

    // If all 6 digits pasted, auto-trigger verification
    if (pastedData.length >= 6) {
      handleVerify(pastedData.slice(0, 6));
    }
  };

  // Submit OTP Verification
  const handleVerify = async (codeToVerify?: string) => {
    const fullOtp = codeToVerify || digits.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter all 6 numeric digits of your verification code.");
      return;
    }

    if (!challengeId) {
      setError("Missing verification session. Please return to login.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId,
          otp: fullOtp,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Verification failed.");
        if (data.locked) {
          setIsLocked(true);
        }
        if (data.expired) {
          setIsExpired(true);
        }
        if (typeof data.attemptsRemaining === "number") {
          setAttemptsRemaining(data.attemptsRemaining);
        }
        setDigits(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
        return;
      }

      // Successful verification
      setSuccess(true);
      try {
        sessionStorage.removeItem("interviewforge_pending_challenge");
      } catch {}

      // Refresh auth context to update navbar
      await refreshUser();

      // Redirect to target destination
      setTimeout(() => {
        router.push(data.redirectUrl || "/");
        router.refresh();
      }, 700);
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  // Resend fresh OTP
  const handleResend = async () => {
    if (!canResend || resending || !challengeId) return;
    setResending(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Failed to resend code.");
        if (data.resendAvailableInSeconds) {
          setCountdown(data.resendAvailableInSeconds);
        }
        return;
      }

      setCountdown(data.resendAvailableInSeconds || 60);
      setIsExpired(false);
      setIsLocked(false);
      setAttemptsRemaining(5);
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Network error while resending code.");
    } finally {
      setResending(false);
    }
  };

  const isComplete = digits.every(d => d.length === 1);

  return (
    <div className="flex min-h-[calc(100vh-120px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Card Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Verify Your Email
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Enter the 6-digit verification code sent to{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-200 font-mono">
              {maskedEmail}
            </span>
          </p>
        </div>

        {/* Verification Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 sm:p-8 shadow-sm space-y-6 transition-colors">
          {/* Status Banners */}
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-shake">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              <div className="space-y-0.5 flex-1">
                <span className="font-semibold block">{error}</span>
                {typeof attemptsRemaining === "number" && !isLocked && (
                  <span className="text-[11px] opacity-80 block">
                    Security precaution: Challenge locks after 5 failed tries.
                  </span>
                )}
              </div>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">Code verified! Loading your session...</span>
            </div>
          )}

          {/* 6-Digit Code Input Station */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                Security Code
              </label>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-mono">
                <Clock className="h-3 w-3 text-amber-500" />
                <span>Expires in 5 mins</span>
              </span>
            </div>

            <div className="grid grid-cols-6 gap-2 sm:gap-2.5" onPaste={handlePaste}>
              {digits.map((digit, index) => (
                <input
                  key={index}
                  ref={el => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  disabled={loading || isLocked || success}
                  value={digit}
                  onChange={e => handleDigitChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  className={`h-12 sm:h-14 w-full text-center text-lg sm:text-xl font-bold font-mono rounded-xl border transition-all ${
                    digit
                      ? "border-blue-600 dark:border-blue-500 bg-blue-50/40 dark:bg-blue-950/30 text-zinc-900 dark:text-zinc-50 shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100"
                  } focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50`}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {/* Verify Action Button */}
          <button
            onClick={() => handleVerify()}
            disabled={!isComplete || loading || isLocked || success}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Verifying Security Code...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>

          {/* Resend OTP & Cooldown Counter */}
          <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500 dark:text-zinc-400">Didn&apos;t receive code?</span>

            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || loading || isLocked}
                className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {resending ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="h-3 w-3" />
                    <span>Resend Code</span>
                  </>
                )}
              </button>
            ) : (
              <span className="text-zinc-400 dark:text-zinc-500 font-mono text-[11px] flex items-center gap-1">
                <span>Resend in</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">{countdown}s</span>
              </span>
            )}
          </div>
        </div>

        {/* Back Navigation */}
        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      }
    >
      <VerifyOtpContent />
    </Suspense>
  );
}
