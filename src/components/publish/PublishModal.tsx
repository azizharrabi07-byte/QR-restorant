import React from "react";
import confetti from "canvas-confetti";
import { CheckCircle2, CloudUpload, ExternalLink, Loader2, Sparkles, Database, ArrowRight, ShieldCheck } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { PublishResult } from "../../lib/supabase";

interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusText: string;
  stepNum: number;
  result: PublishResult | null;
  restaurantSlug: string;
  restaurantName: string;
  onViewTables?: () => void;
  onOpenCustomerMenu?: () => void;
  onOpenWorkerDashboard?: (restaurantId: string) => void;
}

export function PublishModal({
  isOpen,
  onClose,
  statusText,
  stepNum,
  result,
  restaurantSlug,
  restaurantName,
  onViewTables,
  onOpenCustomerMenu,
  onOpenWorkerDashboard,
}: PublishModalProps) {
  const isFinished = !!result;
  const isSuccess = result?.success === true;
  const hasError = result && !result.success;

  const publicUrl = `https://${restaurantSlug || "menu"}.menuos.app`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isFinished ? onClose : () => {}}
      title={isFinished ? (isSuccess ? "Published to Supabase!" : "Publish Failed") : "Publishing to Supabase"}
      description={
        isFinished
          ? isSuccess
            ? "Your restaurant, categories, products, and tables are live in the database."
            : "There was a problem synchronizing with the Supabase database."
          : "Writing data models directly to your PostgreSQL cloud instance..."
      }
      maxWidth="md"
    >
      <div className="py-4 space-y-6">
        {!isFinished ? (
          /* Ongoing Progress Animation */
          <div className="space-y-6 text-center py-4">
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
              <Database className="w-8 h-8 text-emerald-400 animate-pulse" />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white">{statusText}</p>
              <p className="text-xs font-mono text-white/40">
                Phase {stepNum} of 5 • Real-time database write
              </p>
            </div>

            <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(stepNum / 5) * 100}%` }}
              />
            </div>
          </div>
        ) : isSuccess ? (
          /* Successful State */
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <span className="font-semibold text-emerald-300 block">
                  Synchronized with Supabase Schema
                </span>
                <p className="text-emerald-400/80 leading-relaxed">
                  The restaurant profile, all categories, dish items, and table QR tokens are stored in their respective tables.
                </p>
              </div>
            </div>

            {/* Sync Summary Pills */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <span className="block text-lg font-bold font-mono text-white">
                  {result.categoriesCount ?? 0}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                  Categories
                </span>
              </div>
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <span className="block text-lg font-bold font-mono text-white">
                  {result.productsCount ?? 0}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                  Products
                </span>
              </div>
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl">
                <span className="block text-lg font-bold font-mono text-emerald-400">
                  {result.tablesCount ?? 0}
                </span>
                <span className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                  Tables
                </span>
              </div>
            </div>

            {/* Public Live URL Box */}
            <div className="p-3.5 rounded-xl bg-[#080808] border border-white/10 space-y-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 block">
                Live Storefront URL
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-mono text-white/90 truncate">
                  {publicUrl}
                </span>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(publicUrl)}
                  className="text-xs text-emerald-400 hover:underline shrink-0 cursor-pointer font-mono"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Live Testing Direct Action Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {onOpenCustomerMenu && (
                <button
                  type="button"
                  onClick={onOpenCustomerMenu}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-white/20"
                >
                  <span>Open Customer Menu (Table 1)</span>
                </button>
              )}
              {onOpenWorkerDashboard && result?.restaurantId && (
                <button
                  type="button"
                  onClick={() => onOpenWorkerDashboard(result.restaurantId!)}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-500/30"
                >
                  <span>Open Kitchen Orders Screen</span>
                </button>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {onViewTables && (
                <Button type="button" variant="outline" onClick={onViewTables}>
                  Manage Tables
                </Button>
              )}
              <Button type="button" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Error State */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
              <strong className="block mb-1">Database Error:</strong>
              {result?.error || "Failed to commit changes to Supabase."}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
