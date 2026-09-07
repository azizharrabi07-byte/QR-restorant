import React, { useState } from "react";
import { 
  QrCode, 
  Download, 
  Printer, 
  ArrowLeft, 
  CloudUpload, 
  Sparkles, 
  Layers, 
  Check, 
  ShieldCheck, 
  Database,
  ExternalLink,
  UserPlus
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { RestaurantProfile, RestaurantTable } from "../../types";
import { TableQrManager } from "../tables/TableQrManager";
import { Button } from "../ui/Button";

interface StepTablesProps {
  profile: RestaurantProfile;
  tables: RestaurantTable[];
  onUpdateProfile: (partial: Partial<RestaurantProfile>) => void;
  onUpdateTables: (tables: RestaurantTable[]) => void;
  onBack: () => void;
  onPublish: () => void;
  isPublishing?: boolean;
  currentUser: User | null;
  onOpenAuthModal: () => void;
  onSimulateTable?: (tableNum: number) => void;
  onJumpToStep?: (step: number) => void;
  onOpenCustomerMenu?: (slug: string, token: string) => void;
  onOpenWorkerDashboard?: () => void;
  onOpenInviteWorker?: () => void;
}

export function StepTables({
  profile,
  tables,
  onUpdateProfile,
  onUpdateTables,
  onBack,
  onPublish,
  isPublishing = false,
  currentUser,
  onOpenAuthModal,
  onSimulateTable,
  onJumpToStep,
  onOpenCustomerMenu,
  onOpenWorkerDashboard,
  onOpenInviteWorker,
}: StepTablesProps) {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with Navigation & Supabase Cloud Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs uppercase font-mono tracking-widest text-white/40">
              Step 06 of 06
            </span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <Database className="w-3 h-3" />
              Supabase Ready
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif italic text-white">
            Dining Tables &amp; QR Codes
          </h2>
          <p className="text-sm text-white/50 mt-1 max-w-2xl leading-relaxed">
            Configure dining tables with random 8-character tokens. Each table maps 1:1 onto the <code className="text-white/80 font-mono bg-white/5 px-1.5 py-0.5 rounded text-xs">restaurant_tables</code> Supabase database schema.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
          {onOpenInviteWorker && (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenInviteWorker}
              leftIcon={<UserPlus className="w-4 h-4 text-emerald-400" />}
              className="text-white border-white/20 hover:bg-white/10 text-xs"
            >
              Invite Worker
            </Button>
          )}

          {onOpenWorkerDashboard && (
            <Button
              type="button"
              variant="outline"
              onClick={onOpenWorkerDashboard}
              className="text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 font-mono text-xs"
            >
              Kitchen Screen
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Preview
          </Button>

          <Button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            leftIcon={
              isPublishing ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4 text-black" />
              )
            }
            className="font-bold shadow-lg"
          >
            {isPublishing ? "Publishing to Supabase..." : "Publish to Supabase"}
          </Button>
        </div>
      </div>

      {/* Supabase Owner Auth Banner if not authenticated */}
      {!currentUser && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200 text-xs">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Owner Supabase Authentication:</strong> Log in or create an owner account to link this restaurant and table setup to your database.
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenAuthModal}
            className="shrink-0 text-amber-200 border-amber-500/30 hover:bg-amber-500/20"
          >
            Owner Sign In / Sign Up
          </Button>
        </div>
      )}

      {/* Main Table Management Component */}
      <TableQrManager
        profile={profile}
        onSimulateTable={onSimulateTable}
        onUpdateTableCount={(count) => onUpdateProfile({ tableCount: count })}
        onUpdateTables={onUpdateTables}
        onOpenCustomerMenu={onOpenCustomerMenu}
      />

      {/* Bottom Sticky-style Navigation Bar */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
          <span>{tables.length} tables configured</span>
          <span>•</span>
          <span>Target table: <span className="text-white/70">restaurant_tables</span></span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
            className="flex-1 sm:flex-none"
          >
            Previous (Step 5)
          </Button>

          <Button
            type="button"
            onClick={onPublish}
            disabled={isPublishing}
            leftIcon={<CloudUpload className="w-4 h-4 text-black" />}
            className="flex-1 sm:flex-none font-bold"
          >
            {isPublishing ? "Syncing with Cloud..." : "Publish Restaurant to Supabase"}
          </Button>
        </div>
      </div>
    </div>
  );
}
