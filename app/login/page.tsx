"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("error");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-teal-800 font-headline tracking-tight">
            The Curator
          </h1>
          <p className="text-xs uppercase tracking-widest text-on-surface-variant mt-1">
            Premium Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-10 shadow-[0px_20px_60px_rgba(25,28,29,0.1)]">
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold font-headline text-on-surface">
              Welcome back
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">
              Sign in to track your team&apos;s subscriptions
            </p>
          </div>

          {(authError || error) && (
            <div className="flex items-center gap-3 p-4 bg-error-container/30 text-error rounded-xl mb-6">
              <span className="material-symbols-outlined text-sm">error</span>
              <p className="text-sm">
                {error || "Authentication failed. Please try again."}
              </p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 h-14 rounded-xl border-2 border-outline-variant bg-white hover:bg-surface-container-low transition-all active:scale-95 font-semibold text-on-surface disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-primary">
                progress_activity
              </span>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-surface-container-lowest px-3 text-xs text-on-surface-variant">
                or
              </span>
            </div>
          </div>

          {/* Demo mode */}
          <button
            onClick={handleDemoMode}
            className="w-full h-12 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-all active:scale-95 font-medium text-sm"
          >
            Continue in demo mode
          </button>

          <p className="text-center text-xs text-on-surface-variant/50 mt-6 leading-relaxed">
            By signing in you agree to our terms. Your data is encrypted and
            never shared.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
