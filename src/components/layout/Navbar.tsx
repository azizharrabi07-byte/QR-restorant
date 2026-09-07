import React from "react";
import { Smartphone, Eye, RefreshCw, UserCheck, LogIn, CloudUpload, LogOut, Grid } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { OnboardingStep, RestaurantProfile } from "../../types";
import { Button } from "../ui/Button";

export interface NavbarProps {
  profile: RestaurantProfile;
  currentStep: OnboardingStep;
  onSelectStep: (step: OnboardingStep) => void;
  showLiveMobilePreview: boolean;
  onToggleMobilePreview: () => void;
  onResetToDemo: () => void;
  currentUser?: User | null;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
  onOpenWorkerDashboard?: () => void;
  onOpenCustomerMenu?: () => void;
}

export function Navbar({
  profile,
  currentStep,
  onSelectStep,
  showLiveMobilePreview,
  onToggleMobilePreview,
  onResetToDemo,
  currentUser,
  onOpenAuthModal,
  onSignOut,
  onPublish,
  isPublishing = false,
  onOpenWorkerDashboard,
  onOpenCustomerMenu,
}: NavbarProps) {
  // Extract initials
  const initials = (profile.name || "Maitre D")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "MD";

  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/10 flex items-center justify-between px-4 sm:px-8 bg-[#080808]">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-white flex items-center justify-center rounded-sm shrink-0">
          <div className="w-4 h-4 border-2 border-black rotate-45"></div>
        </div>
        <span className="text-lg font-serif italic tracking-tight text-white">Maitre D&apos;</span>
        <span className="text-xs uppercase tracking-widest text-white/40 ml-4 border-l border-white/20 pl-4 hidden sm:inline-block">
          Partner Portal
        </span>
      </div>

      {/* Right: Establishment & Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="text-right hidden md:block">
          <p className="text-xs text-white/40 uppercase tracking-tighter">Restaurant</p>
          <p className="text-sm font-medium text-white truncate max-w-[140px] lg:max-w-[200px]">
            {profile.name || "L'Artiste Brasserie"}
          </p>
        </div>

        {/* Supabase Owner Profile / Auth Button */}
        {currentUser ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-mono transition-colors cursor-pointer"
              title={`Logged in as ${currentUser.email}. Click to manage account.`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="truncate max-w-[110px] hidden sm:inline">
                {currentUser.email?.split("@")[0]}
              </span>
            </button>
            {onSignOut && (
              <button
                type="button"
                onClick={onSignOut}
                className="text-white/40 hover:text-white/80 p-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
                title="Sign out of Supabase"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : onOpenAuthModal ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAuthModal}
            leftIcon={<LogIn className="w-3.5 h-3.5 text-white/70" />}
            className="text-xs text-white/80 border-white/20"
          >
            Owner Login
          </Button>
        ) : null}

        <div className="h-6 w-px bg-white/10 hidden sm:block"></div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onResetToDemo}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white px-2.5 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            title="Reset to sample cafe data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="text-[11px] uppercase tracking-wider">Demo Data</span>
          </button>

          <Button
            type="button"
            variant={showLiveMobilePreview ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleMobilePreview}
            leftIcon={<Smartphone className="w-3.5 h-3.5" />}
            className="hidden lg:inline-flex"
          >
            {showLiveMobilePreview ? "Hide Preview" : "Side Preview"}
          </Button>

          {onOpenCustomerMenu && (
            <button
              type="button"
              onClick={onOpenCustomerMenu}
              className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer border border-white/10"
              title="Open Live Table Customer Menu"
            >
              <span>Menu (T-01)</span>
            </button>
          )}

          {onOpenWorkerDashboard && (
            <button
              type="button"
              onClick={onOpenWorkerDashboard}
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 transition-colors cursor-pointer border border-emerald-500/20 font-mono"
              title="Open Worker / Kitchen Orders Dashboard"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Kitchen Screen</span>
            </button>
          )}

          {currentStep !== 6 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelectStep(6)}
              leftIcon={<Grid className="w-3.5 h-3.5 text-white" />}
              className="text-white hover:bg-white/10"
            >
              Step 6 Tables
            </Button>
          )}

          {onPublish && (
            <Button
              type="button"
              size="sm"
              onClick={onPublish}
              disabled={isPublishing}
              leftIcon={
                isPublishing ? (
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CloudUpload className="w-3.5 h-3.5 text-black" />
                )
              }
              className="font-bold text-xs"
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
