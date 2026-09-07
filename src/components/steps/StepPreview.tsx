import React, { useState } from "react";
import {
  Smartphone,
  ArrowLeft,
  QrCode,
  Share2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Sparkles,
  Download,
  Building2,
  Palette,
  FolderTree,
  Utensils,
  Check,
  Grid3X3,
  Layers,
  ArrowRight,
  CloudUpload,
} from "lucide-react";
import confetti from "canvas-confetti";
import { RestaurantProfile, RestaurantTable } from "../../types";
import { PhoneSimulator } from "../preview/PhoneSimulator";
import { TableQrManager } from "../tables/TableQrManager";
import { Button } from "../ui/Button";
import { Modal } from "../ui/Modal";
import { QRCodeSVG } from "qrcode.react";

interface StepPreviewProps {
  profile: RestaurantProfile;
  onBack: () => void;
  onJumpToStep: (step: 1 | 2 | 3 | 4 | 5 | 6) => void;
  onGoToTables?: () => void;
  onPublish?: () => void;
  isPublishing?: boolean;
}

export function StepPreview({
  profile,
  onBack,
  onJumpToStep,
  onGoToTables,
  onPublish,
  isPublishing = false,
}: StepPreviewProps) {
  const [activeTab, setActiveTab] = useState<"simulator" | "tables">("simulator");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedQrUrl, setCopiedQrUrl] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [simulatedTableNumber, setSimulatedTableNumber] = useState<number>(1);
  const [tableCount, setTableCount] = useState<number>(profile.tableCount || 12);

  const restaurantSlug = profile.slug || "demo";
  const generalQrToken = "storefront";
  const generalQrUrl = `https://${restaurantSlug}.menuos.app/menu/${generalQrToken}`;
  const tenantUrl = `https://${restaurantSlug}.menuos.app`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(tenantUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyQrUrl = () => {
    navigator.clipboard.writeText(generalQrUrl);
    setCopiedQrUrl(true);
    setTimeout(() => setCopiedQrUrl(false), 2000);
  };

  const handleSimulateTable = (tableNumber: number) => {
    setSimulatedTableNumber(tableNumber);
    setActiveTab("simulator");
    window.scrollTo({ top: 120, behavior: "smooth" });
  };

  return (
    <div className="max-w-6xl mx-auto text-left animate-in fade-in slide-in-from-bottom-2 duration-300 pb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-medium">
              Step 05 · Table Deployment & Launch
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">
              Table QR & Live Digital Menu
            </h2>
            <p className="text-white/40 max-w-xl text-sm sm:text-base leading-relaxed">
              Configure table counts, generate unique QR tokens for each dining station, and test live customer mobile ordering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsQrModalOpen(true)}
              leftIcon={<QrCode className="w-4 h-4 text-white" />}
              className="text-xs"
            >
              General Storefront QR
            </Button>

            {onGoToTables && (
              <Button
                type="button"
                variant="secondary"
                onClick={onGoToTables}
                rightIcon={<ArrowRight className="w-4 h-4 text-white" />}
                className="text-xs font-medium"
              >
                Step 6: Tables Screen
              </Button>
            )}

            {onPublish && (
              <Button
                type="button"
                onClick={onPublish}
                disabled={isPublishing}
                leftIcon={
                  isPublishing ? (
                    <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CloudUpload className="w-4 h-4 text-black" />
                  )
                }
                className="text-xs font-semibold"
              >
                {isPublishing ? "Publishing..." : "Publish to Supabase"}
              </Button>
            )}
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-6 flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("simulator")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === "simulator"
                  ? "bg-white text-black font-semibold border-white shadow-xs"
                  : "bg-transparent text-white/50 border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Customer Mobile Simulator</span>
              {activeTab === "simulator" && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-black/15 text-black">
                  Table {simulatedTableNumber.toString().padStart(2, "0")}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tables")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
                activeTab === "tables"
                  ? "bg-white text-black font-semibold border-white shadow-xs"
                  : "bg-transparent text-white/50 border-transparent hover:text-white hover:bg-white/5"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Table QR Overview</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTab === "tables" ? "bg-black/15 text-black" : "bg-white/10 text-white/70"
                }`}
              >
                {tableCount} Tables
              </span>
            </button>
          </div>

          {onGoToTables && (
            <button
              type="button"
              onClick={onGoToTables}
              className="text-xs text-white/60 hover:text-white font-mono flex items-center gap-1.5 cursor-pointer py-1 px-2.5 rounded hover:bg-white/5"
            >
              <span>Dedicated Tables Screen</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Tab 1: Table-based QR Management System */}
      {activeTab === "tables" && (
        <div className="animate-in fade-in duration-200">
          <TableQrManager
            profile={profile}
            onOpenGeneralQrModal={() => setIsQrModalOpen(true)}
            onSimulateTable={handleSimulateTable}
            onUpdateTableCount={setTableCount}
          />
        </div>
      )}

      {/* Tab 2: Customer Mobile Simulator & Review */}
      {activeTab === "simulator" && (
        <div className="animate-in fade-in duration-200 space-y-6">
          {/* Active simulated table banner */}
          <div className="p-3.5 rounded-xl bg-[#0D0D0D] border border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-serif italic text-white text-sm">
                Simulating Table {simulatedTableNumber.toString().padStart(2, "0")}
              </span>
              <span className="text-[10px] font-mono text-white/40">
                Route: /menu/{profile.slug || "slug"}/tbl_{simulatedTableNumber.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("tables")}
                className="text-xs text-white/60 hover:text-white underline font-mono cursor-pointer"
              >
                ← Switch Table in QR Manager
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Setup Overview & Configuration Panels (5 cols) */}
            <div className="lg:col-span-5 space-y-5 order-2 lg:order-1">
              
              {/* Live Status Banner */}
              <div className="p-5 rounded-xl bg-[#0D0D0D] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">
                    Menu Status
                  </span>
                  <span
                    className={`text-[10px] uppercase font-mono tracking-wider px-2.5 py-0.5 rounded-full font-medium inline-flex items-center gap-1.5 border ${
                      isPublished
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-white/5 text-white/70 border-white/10"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`} />
                    {isPublished ? "Published & Live" : "Draft Preview Ready"}
                  </span>
                </div>

                <div>
                  <p className="text-xs text-white/40">Tenant Root Menu Link</p>
                  <div className="mt-1.5 flex items-center justify-between p-2.5 rounded-lg bg-[#111111] border border-white/10 text-xs font-mono">
                    <span className="text-white/90 truncate pr-2">{tenantUrl}</span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-white/40 hover:text-white p-1 hover:bg-white/5 rounded-full transition-colors cursor-pointer shrink-0"
                      title="Copy menu URL"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Configuration Review Summary */}
              <div className="p-5 rounded-xl bg-[#0D0D0D] border border-white/10 space-y-4">
                <h3 className="text-xs uppercase tracking-widest font-mono text-white/60">Onboarding Checklist</h3>

                <div className="divide-y divide-white/5 text-xs">
                  {/* Step 1 Review */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-[#111111] border border-white/10 flex items-center justify-center text-white/60">
                        <Building2 className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-medium text-white block">
                          {profile.name || "Unnamed"}
                        </span>
                        <span className="text-[11px] text-white/40 capitalize">
                          {profile.businessType.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJumpToStep(1)}
                      className="text-white/40 hover:text-white text-xs font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Step 2 Review */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-[#111111] border border-white/10 flex items-center justify-center text-white/60">
                        <Palette className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-white/20"
                          style={{ backgroundColor: profile.branding.primaryColor }}
                        />
                        <span className="font-medium text-white">Brand Accent</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJumpToStep(2)}
                      className="text-white/40 hover:text-white text-xs font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Step 3 Review */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-[#111111] border border-white/10 flex items-center justify-center text-white/60">
                        <FolderTree className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-medium text-white block">
                          {profile.categories.length} Categories
                        </span>
                        <span className="text-[11px] text-white/40">
                          {profile.categories.map((c) => c.name).slice(0, 2).join(", ")}
                          {profile.categories.length > 2 ? "..." : ""}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJumpToStep(3)}
                      className="text-white/40 hover:text-white text-xs font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Step 4 Review */}
                  <div className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-md bg-[#111111] border border-white/10 flex items-center justify-center text-white/60">
                        <Utensils className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-medium text-white block">
                          {profile.products.length} Menu Items
                        </span>
                        <span className="text-[11px] text-white/40">
                          Active dishes & beverages
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onJumpToStep(4)}
                      className="text-white/40 hover:text-white text-xs font-mono uppercase tracking-wider cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>

              {/* Interactive Simulation Guide */}
              <div className="p-4 rounded-xl bg-[#0D0D0D] border border-white/10 text-xs space-y-2">
                <p className="font-medium text-white">Interactive Mobile Simulator</p>
                <ul className="text-white/40 space-y-1.5 list-disc list-inside">
                  <li>Tap on any product to view ingredient breakdown modal</li>
                  <li>Click &ldquo;+&rdquo; to simulate customer ordering & cart total</li>
                  <li>Order dispatch simulates transmission directly for Table {simulatedTableNumber.toString().padStart(2, "0")}</li>
                  <li>Filter categories by tapping horizontal pill tags</li>
                </ul>
              </div>

              {/* Navigation buttons */}
              <div className="pt-2 flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  Back to Products
                </Button>

                {onGoToTables && (
                  <Button
                    type="button"
                    onClick={onGoToTables}
                    rightIcon={<ArrowRight className="w-4 h-4 text-black" />}
                    className="font-bold text-xs"
                  >
                    Next: Manage Tables (Step 6)
                  </Button>
                )}
              </div>
            </div>

            {/* Right Side: Phone Preview (7 cols) */}
            <div className="lg:col-span-7 flex justify-center order-1 lg:order-2">
              <PhoneSimulator
                profile={profile}
                simulatedTableNumber={simulatedTableNumber}
                isStandalone
              />
            </div>
          </div>
        </div>
      )}

      {/* General Storefront QR Code Modal (Preserved in General Form) */}
      <Modal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="Storefront General Menu QR Code"
        description="Universal QR code for your main entrance, window signage, counter register, and marketing flyers."
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center p-4">
          <div className="p-6 bg-[#080808] rounded-2xl flex flex-col items-center max-w-[280px] w-full border border-white/15 text-white shadow-2xl">
            {/* Mini Logo */}
            {profile.logoUrl && (
              <img
                src={profile.logoUrl}
                alt="Brand logo"
                className="w-12 h-12 rounded-xl object-cover mb-2 border border-white/20"
                referrerPolicy="no-referrer"
              />
            )}
            <h4 className="font-medium text-sm text-white tracking-tight">
              {profile.name || "Scan For Menu"}
            </h4>
            <p className="text-[10px] text-white/40 mb-4">
              General Storefront Menu & Dine-In Access
            </p>

            {/* Real, scannable QR code generated with qrcode.react */}
            <div className="p-3.5 bg-white rounded-xl border border-white/20 shadow-md flex items-center justify-center">
              <QRCodeSVG
                value={generalQrUrl}
                size={160}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>

            <span className="text-[10px] font-mono text-white/60 mt-3 truncate max-w-full px-2.5 py-1 bg-white/5 rounded-md border border-white/10 select-all">
              {generalQrUrl}
            </span>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                window.print();
              }}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Print General Poster
            </Button>
            <Button
              type="button"
              onClick={handleCopyQrUrl}
              leftIcon={copiedQrUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            >
              {copiedQrUrl ? "Copied QR URL!" : "Copy QR URL"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
