import React, { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Lock, Mail, UserCheck, LogOut, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { signInOwner, signUpOwner, signOutOwner, ENABLE_GOOGLE_AUTH, signInWithGoogle } from "../../lib/supabase";

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  onAuthenticatedContinue?: () => void;
  onSignUpSuccess?: () => void;
  primaryColor?: string;
  reasonText?: string;
}

export function OwnerAuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onAuthenticatedContinue,
  onSignUpSuccess,
  primaryColor = "#D97706",
  reasonText = "Authenticate with Supabase to publish and persist your restaurant menu & tables to cloud database.",
}: OwnerAuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("azizharrabi07@gmail.com");
  const [password, setPassword] = useState("Password123!");
  const [confirmPassword, setConfirmPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Please enter your email address.");
      return;
    }

    // Validation: Invalid email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMsg("Please enter your password.");
      return;
    }

    // Validation: Password too short
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    // Validation: Passwords don't match (signup only)
    if (mode === "signup") {
      if (!confirmPassword) {
        setErrorMsg("Please confirm your password.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { user, error } = await signInOwner(trimmedEmail, password);
        if (error) {
          setErrorMsg(error);
        } else if (user) {
          setSuccessMsg(`Welcome back, ${user.email}! Authenticated successfully.`);
          onUserChanged(user);
          setTimeout(() => {
            if (onAuthenticatedContinue) {
              onAuthenticatedContinue();
            } else {
              onClose();
            }
          }, 500);
        }
      } else {
        // Mode: signup
        const { user, error } = await signUpOwner(trimmedEmail, password);
        if (error) {
          // Validation: email already registered handling
          if (
            error.toLowerCase().includes("already registered") ||
            error.toLowerCase().includes("already exists")
          ) {
            setErrorMsg("This email is already registered. Please sign in instead.");
          } else {
            setErrorMsg(error);
          }
        } else if (user) {
          setSuccessMsg(`Account created for ${user.email}! Proceeding to Step 1...`);
          onUserChanged(user);
          setTimeout(() => {
            if (onSignUpSuccess) {
              onSignUpSuccess();
            } else if (onAuthenticatedContinue) {
              onAuthenticatedContinue();
            } else {
              onClose();
            }
          }, 600);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "An authentication error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!ENABLE_GOOGLE_AUTH) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Google sign in could not be completed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOutOwner();
    onUserChanged(null);
    setLoading(false);
    setSuccessMsg("Signed out successfully.");
  };

  const setPresetCredentials = (presetEmail: string, presetPass: string) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setConfirmPassword(presetPass);
    setErrorMsg(null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={currentUser ? "Supabase Owner Session" : "Owner Authentication"}
      description={currentUser ? `Connected as ${currentUser.email}` : reasonText}
      maxWidth="md"
    >
      <div className="space-y-6 pt-2">
        {currentUser ? (
          /* Already Signed In View */
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex items-center gap-3.5">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shadow-sm"
                style={{ backgroundColor: primaryColor }}
              >
                {currentUser.email?.charAt(0).toUpperCase() || "O"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white truncate">
                    {currentUser.email}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <ShieldCheck className="w-3 h-3" />
                    Verified
                  </span>
                </div>
                <span className="text-xs text-white/40 block truncate font-mono mt-0.5">
                  ID: {currentUser.id}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Your Supabase session is active. You can publish changes directly to your database.
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-white/10">
              <Button
                type="button"
                variant="outline"
                onClick={handleSignOut}
                disabled={loading}
                leftIcon={<LogOut className="w-4 h-4 text-rose-400" />}
              >
                Sign Out
              </Button>

              {onAuthenticatedContinue ? (
                <Button
                  type="button"
                  onClick={() => {
                    onAuthenticatedContinue();
                    onClose();
                  }}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Continue to Publish
                </Button>
              ) : (
                <Button type="button" onClick={onClose}>
                  Done
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Sign In / Sign Up Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 bg-black/40 border border-white/10 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "signin"
                    ? "bg-white text-black shadow-xs"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  mode === "signup"
                    ? "bg-white text-black shadow-xs"
                    : "text-white/60 hover:text-white"
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Google OAuth Button - Preserved behind ENABLE_GOOGLE_AUTH feature flag */}
            {ENABLE_GOOGLE_AUTH && (
              <div className="space-y-3 pt-1">
                <button
                  type="button"
                  id="google-owner-auth-btn"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-white/10 w-full" />
                  <span className="bg-[#0D0D0D] px-2 text-[10px] text-white/40 uppercase tracking-wider font-mono absolute">
                    or continue with email
                  </span>
                </div>
              </div>
            )}

            {/* Quick-fill Helper for testing/evaluation */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg flex flex-col gap-1.5 text-xs text-white/50">
              <span className="text-[10px] uppercase font-mono tracking-wider text-white/30">
                Quick Owner Credentials:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPresetCredentials("azizharrabi07@gmail.com", "Password123!")}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-white/80 border border-white/10 cursor-pointer transition-colors"
                >
                  azizharrabi07@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => setPresetCredentials("owner.demo@menuos.app", "Password123!")}
                  className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-[11px] font-mono text-white/80 border border-white/10 cursor-pointer transition-colors"
                >
                  owner.demo@menuos.app
                </button>
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Owner Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@restaurant.com"
                  required
                  className="w-full bg-[#0A0A0A] border border-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/40 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-white/30 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#0A0A0A] border border-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/40 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-white/30 outline-hidden transition-all"
                />
              </div>
            </div>

            {/* Confirm Password Field (Signup only) */}
            {mode === "signup" && (
              <div className="animate-in fade-in duration-200">
                <label className="block text-xs font-medium text-white/70 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full bg-[#0A0A0A] border border-white/15 focus:border-white/40 focus:ring-1 focus:ring-white/40 rounded-lg pl-9 pr-3.5 py-2 text-sm text-white placeholder:text-white/30 outline-hidden transition-all"
                  />
                </div>
              </div>
            )}

            {/* Feedback Messages */}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-300">
                {successMsg}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                leftIcon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
              >
                {loading
                  ? "Verifying..."
                  : mode === "signin"
                  ? "Sign In & Continue"
                  : "Create Account & Sign In"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
