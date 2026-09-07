import React, { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Lock, Mail, UserCheck, LogOut, ArrowRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { signInOwner, signUpOwner, signOutOwner } from "../../lib/supabase";

interface OwnerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onUserChanged: (user: User | null) => void;
  onAuthenticatedContinue?: () => void;
  primaryColor?: string;
  reasonText?: string;
}

export function OwnerAuthModal({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  onAuthenticatedContinue,
  primaryColor = "#D97706",
  reasonText = "Authenticate with Supabase to publish and persist your restaurant menu & tables to cloud database.",
}: OwnerAuthModalProps) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("azizharrabi07@gmail.com");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both your email and password.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signin") {
        const { user, error } = await signInOwner(email.trim(), password);
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
          }, 600);
        }
      } else {
        const { user, error } = await signUpOwner(email.trim(), password);
        if (error) {
          setErrorMsg(error);
        } else if (user) {
          setSuccessMsg(`Account created for ${user.email}! Authenticated.`);
          onUserChanged(user);
          setTimeout(() => {
            if (onAuthenticatedContinue) {
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
