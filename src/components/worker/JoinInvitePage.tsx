import React, { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import {
  ChefHat,
  Receipt,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  LogOut,
  Sparkles,
  Utensils,
  ChevronLeft,
} from "lucide-react";
import { Button } from "../ui/Button";
import {
  redeemWorkerInvite,
  fetchInviteTokenDetails,
} from "../../lib/workerService";
import {
  getCurrentUser,
  onAuthStateChange,
  signInOwner as signInWorker,
  signUpOwner as signUpWorker,
  signOut as signOutWorker,
  supabase,
  ENABLE_GOOGLE_AUTH,
  signInWithGoogle,
} from "../../lib/supabase";
import { WorkerRole } from "../../types";

interface JoinInvitePageProps {
  inviteToken: string;
  onRedirectToDashboard: (restaurantId: string) => void;
  onNavigateHome?: () => void;
}

export function JoinInvitePage({
  inviteToken,
  onRedirectToDashboard,
  onNavigateHome,
}: JoinInvitePageProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Invite lookup metadata (restaurant name, role)
  const [inviteMeta, setInviteMeta] = useState<{
    restaurantName?: string;
    role?: WorkerRole;
    isExpired?: boolean;
    isUsed?: boolean;
  } | null>(null);

  // Auth form state - default to signup for worker invites
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submittingAuth, setSubmittingAuth] = useState(false);

  // Redemption process state
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasAttemptedAutoRedeem, setHasAttemptedAutoRedeem] = useState(false);
  const redeemingRef = useRef(false);

  // 1. Check current auth status and listen for auth changes
  useEffect(() => {
    let mounted = true;

    getCurrentUser().then((user) => {
      if (mounted) {
        setCurrentUser(user);
        setLoadingAuth(false);
      }
    });

    const {
      data: { subscription },
    } = onAuthStateChange((user) => {
      if (mounted) {
        setCurrentUser(user);
        setLoadingAuth(false);
      }
    });

    // 2. Fetch public invite details for display
    fetchInviteTokenDetails(inviteToken).then((res) => {
      if (mounted && res.invite) {
        setInviteMeta({
          restaurantName: res.restaurantName,
          role: res.invite.role,
          isExpired: res.isExpired,
          isUsed: res.isUsed,
        });

        // Pre-flag invalid states if already known
        if (res.isExpired || res.isUsed) {
          setErrorMessage(
            "This invite is no longer valid — ask your manager for a new QR code."
          );
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [inviteToken]);

  // 3. Auto-redeem when an authenticated user lands on the page
  useEffect(() => {
    if (currentUser && !hasAttemptedAutoRedeem && !errorMessage && !isRedeeming) {
      setHasAttemptedAutoRedeem(true);
      executeRedeem();
    }
  }, [currentUser, hasAttemptedAutoRedeem, errorMessage, isRedeeming]);

  const executeRedeem = async () => {
    if (redeemingRef.current) return;
    redeemingRef.current = true;
    setIsRedeeming(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await redeemWorkerInvite(inviteToken);

      if (!result.success || !result.restaurantId) {
        // Required exact error copy
        setErrorMessage(
          "This invite is no longer valid — ask your manager for a new QR code."
        );
        setIsRedeeming(false);
        redeemingRef.current = false;
        return;
      }

      setSuccessMessage(
        `Staff invitation claimed successfully as ${result.role || "worker"}! Redirecting to kitchen orders dashboard...`
      );

      // Brief delay for delightful confirmation before navigation
      setTimeout(() => {
        onRedirectToDashboard(result.restaurantId!);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(
        "This invite is no longer valid — ask your manager for a new QR code."
      );
      setIsRedeeming(false);
      redeemingRef.current = false;
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    // Validation: Invalid email check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    // Validation: Password too short
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    // Validation: Passwords don't match (signup only)
    if (authMode === "signup") {
      if (!confirmPassword) {
        setErrorMessage("Please confirm your password.");
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    }

    setSubmittingAuth(true);

    try {
      if (authMode === "login") {
        const { user, error } = await signInWorker(trimmedEmail, password);
        if (error || !user) {
          setErrorMessage(error || "Invalid login credentials. Please check your email and password.");
          setSubmittingAuth(false);
          return;
        }
        setCurrentUser(user);
        setHasAttemptedAutoRedeem(true);
        // User logged in, execute redeem
        await executeRedeem();
      } else {
        // Signup
        const { user, error } = await signUpWorker(trimmedEmail, password);
        if (error || !user) {
          // Validation: Email already registered
          if (
            error?.toLowerCase().includes("already registered") ||
            error?.toLowerCase().includes("already exists")
          ) {
            setErrorMessage("This email is already registered. Please sign in instead.");
          } else {
            setErrorMessage(error || "Failed to create account. Please try again.");
          }
          setSubmittingAuth(false);
          return;
        }

        // Also update full_name metadata if provided
        if (fullName.trim()) {
          try {
            await supabase.auth.updateUser({
              data: { full_name: fullName.trim() },
            });
          } catch {
            // Non-blocking
          }
        }

        setCurrentUser(user);
        setHasAttemptedAutoRedeem(true);
        // User signed up, execute redeem
        await executeRedeem();
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Authentication error occurred");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!ENABLE_GOOGLE_AUTH) return;
    setSubmittingAuth(true);
    setErrorMessage(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMessage(error);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Google sign in could not be completed.");
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleSignOut = async () => {
    await signOutWorker();
    setCurrentUser(null);
    setHasAttemptedAutoRedeem(false);
    redeemingRef.current = false;
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const getRoleBadge = (role?: WorkerRole) => {
    switch (role) {
      case "kitchen":
        return {
          icon: <ChefHat className="w-5 h-5 text-emerald-400" />,
          label: "Kitchen Staff",
          badgeColor: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
        };
      case "cashier":
        return {
          icon: <Receipt className="w-5 h-5 text-amber-400" />,
          label: "Cashier",
          badgeColor: "bg-amber-500/15 text-amber-300 border-amber-500/30",
        };
      case "manager":
        return {
          icon: <Shield className="w-5 h-5 text-purple-400" />,
          label: "Store Manager",
          badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
        };
      default:
        return {
          icon: <Utensils className="w-5 h-5 text-white/80" />,
          label: "Staff Member",
          badgeColor: "bg-white/10 text-white border-white/20",
        };
    }
  };

  const roleInfo = getRoleBadge(inviteMeta?.role);

  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col justify-between selection:bg-emerald-500/20 selection:text-emerald-200">
      {/* Top Header */}
      <header className="border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-md px-6 py-4 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-white/5"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500 flex items-center justify-center text-black font-bold text-xs">
                M
              </div>
              <span className="font-semibold text-sm text-white tracking-tight">
                MenuOS Staff Portal
              </span>
            </div>
          </div>

          {currentUser && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-neutral-400 hidden sm:inline">
                {currentUser.email}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch Account</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-md space-y-6">
          {/* Invitation Card */}
          <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Header / Brand visual */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 mx-auto flex items-center justify-center shadow-inner">
                {roleInfo.icon}
              </div>

              <div>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border uppercase tracking-wider ${roleInfo.badgeColor} mt-2`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{roleInfo.label} Invitation</span>
                </span>

                <h1 className="text-xl font-bold text-white tracking-tight mt-3">
                  {inviteMeta?.restaurantName
                    ? `Join ${inviteMeta.restaurantName}`
                    : "Staff Member Invitation"}
                </h1>
                <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">
                  Scan pass token:{" "}
                  <span className="font-mono text-white bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                    {inviteToken}
                  </span>
                </p>
              </div>
            </div>

            {/* Error Message Display (Exact Required Text) */}
            {errorMessage && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 text-red-300 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div className="font-medium leading-relaxed">{errorMessage}</div>
                </div>

                {onNavigateHome && (
                  <div className="pt-2 border-t border-red-500/20 flex justify-end">
                    <button
                      type="button"
                      onClick={onNavigateHome}
                      className="text-xs text-red-300 hover:text-white underline cursor-pointer"
                    >
                      Return to Home Dashboard
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Success Message Display */}
            {successMessage && (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3 animate-in fade-in duration-200">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 animate-bounce" />
                <div className="font-medium leading-relaxed">{successMessage}</div>
              </div>
            )}

            {/* CASE 1: User is Authenticated */}
            {loadingAuth ? (
              <div className="py-8 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Checking credentials...</span>
              </div>
            ) : currentUser ? (
              <div className="space-y-4 pt-2">
                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="text-[11px] text-neutral-400 uppercase tracking-wider">
                      Connected Account
                    </div>
                    <div className="text-white font-medium">{currentUser.email}</div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                </div>

                {!errorMessage && !successMessage && (
                  <Button
                    type="button"
                    onClick={executeRedeem}
                    disabled={isRedeeming}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isRedeeming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Redeeming Invite...</span>
                      </>
                    ) : (
                      <>
                        <span>Accept Invite & Access Orders</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                )}

                {errorMessage && (
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={executeRedeem}
                      disabled={isRedeeming}
                      className="w-full text-xs"
                    >
                      Retry Invite Redemption
                    </Button>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="text-xs text-neutral-400 hover:text-white py-1 transition-colors cursor-pointer text-center"
                    >
                      Sign out & try another worker account
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* CASE 2: User is NOT Authenticated - Simple Supabase Auth Login/Signup */
              <div className="space-y-4 pt-1">
                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 p-1 bg-white/5 border border-white/10 rounded-xl text-xs font-medium">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("login");
                      setErrorMessage(null);
                      setConfirmPassword("");
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      authMode === "login"
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    Staff Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode("signup");
                      setErrorMessage(null);
                      setConfirmPassword("");
                    }}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      authMode === "signup"
                        ? "bg-white text-black font-semibold shadow-xs"
                        : "text-neutral-400 hover:text-white"
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
                      id="google-worker-auth-btn"
                      onClick={handleGoogleSignIn}
                      disabled={submittingAuth || isRedeeming}
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
                      <span>Sign in with Google</span>
                    </button>

                    <div className="relative flex items-center justify-center my-2">
                      <div className="border-t border-white/10 w-full" />
                      <span className="bg-[#0D0D0D] px-2 text-[10px] text-white/40 uppercase tracking-wider font-mono absolute">
                        or continue with email
                      </span>
                    </div>
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-3.5">
                  {authMode === "signup" && (
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-300 font-medium">
                        Your Full Name (Optional)
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          placeholder="e.g. Chef Alex"
                          className="w-full bg-[#141414] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-white/40 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-300 font-medium">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="worker@restaurant.com"
                        className="w-full bg-[#141414] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-white/40 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-neutral-300 font-medium">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-[#141414] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-white/40 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Confirm Password Field (Signup only) */}
                  {authMode === "signup" && (
                    <div className="space-y-1 animate-in fade-in duration-200">
                      <label className="text-xs text-neutral-300 font-medium">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#141414] border border-white/10 rounded-xl py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-neutral-600 focus:outline-hidden focus:border-white/40 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={submittingAuth || isRedeeming}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs py-3 rounded-xl flex items-center justify-center gap-2 mt-4 cursor-pointer"
                  >
                    {submittingAuth || isRedeeming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>
                          {authMode === "login"
                            ? "Signing in & Claiming Invite..."
                            : "Creating Account & Claiming..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <span>
                          {authMode === "login"
                            ? "Sign In & Accept Invite"
                            : "Create Account & Accept Invite"}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>

                <p className="text-[11px] text-neutral-500 text-center leading-relaxed">
                  By accepting this invite, your worker profile will be linked to{" "}
                  {inviteMeta?.restaurantName || "this restaurant"} for live kitchen orders.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-neutral-600 border-t border-white/5">
        MenuOS Restaurant Systems • Staff Access Portal
      </footer>
    </div>
  );
}
