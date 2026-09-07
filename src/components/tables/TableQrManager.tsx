import React, { useState, useEffect, useMemo } from "react";
import {
  QrCode,
  Download,
  Printer,
  Plus,
  Minus,
  Search,
  Check,
  Sparkles,
  Layers,
  ArrowUpDown,
  RefreshCw,
} from "lucide-react";
import { RestaurantTable, RestaurantProfile } from "../../types";
import {
  syncTables,
  generateQrDataUrl,
  downloadQrImage,
  getTableFullUrl,
} from "../../lib/tableManager";
import { TableQrCard } from "./TableQrCard";
import { PrintTableStandsModal } from "./PrintTableStandsModal";
import { Button } from "../ui/Button";

interface TableQrManagerProps {
  profile: RestaurantProfile;
  onOpenGeneralQrModal?: () => void;
  onSimulateTable?: (tableNumber: number) => void;
  onUpdateTableCount?: (count: number) => void;
  onUpdateTables?: (tables: RestaurantTable[]) => void;
  onOpenCustomerMenu?: (slug: string, token: string) => void;
}

const PRESET_TABLE_COUNTS = [4, 8, 12, 16, 24, 32];

export function TableQrManager({
  profile,
  onOpenGeneralQrModal,
  onSimulateTable,
  onUpdateTableCount,
  onUpdateTables,
  onOpenCustomerMenu,
}: TableQrManagerProps) {
  // Table count state (default to 12 or stored count)
  const [tableCount, setTableCount] = useState<number>(profile.tableCount || 12);
  const [tables, setTables] = useState<RestaurantTable[]>(() =>
    syncTables(profile.tableCount || 12, profile.slug, profile.tables || [])
  );
  const [qrDataUrls, setQrDataUrls] = useState<Record<string, string>>({});
  const [isGeneratingQrs, setIsGeneratingQrs] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);

  // Synchronize tables when tableCount or profile.slug changes
  useEffect(() => {
    const updatedTables = syncTables(tableCount, profile.slug, tables);
    setTables(updatedTables);
    if (onUpdateTableCount) {
      onUpdateTableCount(tableCount);
    }
    if (onUpdateTables) {
      onUpdateTables(updatedTables);
    }
  }, [tableCount, profile.slug]);

  // Generate QR codes for all tables
  useEffect(() => {
    let isCancelled = false;

    async function generateAllQrs() {
      setIsGeneratingQrs(true);
      const newUrls: Record<string, string> = {};

      for (const table of tables) {
        if (isCancelled) return;
        const fullUrl = getTableFullUrl(profile.slug, table.qr_token);
        const dataUrl = await generateQrDataUrl(fullUrl);
        newUrls[table.id] = dataUrl;
      }

      if (!isCancelled) {
        setQrDataUrls(newUrls);
        setIsGeneratingQrs(false);
      }
    }

    generateAllQrs();

    return () => {
      isCancelled = true;
    };
  }, [tables, profile.slug]);

  // Adjust table count handlers
  const handleCountChange = (newCount: number) => {
    const clamped = Math.max(1, Math.min(100, newCount));
    setTableCount(clamped);
  };

  // Download all QR codes sequentially
  const handleDownloadAll = async () => {
    if (isDownloadingAll || tables.length === 0) return;
    setIsDownloadingAll(true);
    setDownloadProgress(`Preparing ${tables.length} table QRs...`);

    const cleanSlug = profile.slug || "menu";

    for (let i = 0; i < tables.length; i++) {
      const table = tables[i];
      const dataUrl = qrDataUrls[table.id] || (await generateQrDataUrl(getTableFullUrl(cleanSlug, table.qr_token)));

      if (dataUrl) {
        setDownloadProgress(`Downloading Table ${table.table_number} of ${tables.length}...`);
        const filename = `${cleanSlug}-table-${table.table_number.toString().padStart(2, "0")}-qr.png`;
        downloadQrImage(dataUrl, filename);
        // Stagger downloads by 180ms to avoid browser blocking multiple simultaneous downloads
        await new Promise((resolve) => setTimeout(resolve, 180));
      }
    }

    setDownloadProgress("All Table QRs downloaded!");
    setTimeout(() => {
      setIsDownloadingAll(false);
      setDownloadProgress(null);
    }, 2000);
  };

  // Filtered table list by search query
  const filteredTables = useMemo(() => {
    if (!searchQuery.trim()) return tables;
    const query = searchQuery.toLowerCase().trim();
    return tables.filter((t) => {
      const tableMatch = `table ${t.table_number}`.toLowerCase().includes(query);
      const numMatch = t.table_number.toString().includes(query);
      const tokenMatch = t.qr_token.toLowerCase().includes(query);
      return tableMatch || numMatch || tokenMatch;
    });
  }, [tables, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Configuration & Action Control Center */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#0D0D0D] border border-white/10 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">
                Table QR Management System
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/70">
                {tables.length} {tables.length === 1 ? "Table" : "Tables"} Active
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif italic text-white">
              Dining Table QR Codes
            </h3>
            <p className="text-xs text-white/40 mt-1 max-w-xl leading-relaxed">
              Every table is provisioned with a secure, unique identifier (<span className="font-mono text-white/60">/menu/{profile.slug || "slug"}/[uniqueToken]</span>) for contactless ordering directly to kitchen tickets.
            </p>
          </div>

          {/* Top Actions: Print All & Download All */}
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={onOpenGeneralQrModal}
              leftIcon={<QrCode className="w-4 h-4 text-white/70" />}
              className="text-xs"
            >
              General Storefront QR
            </Button>

            <Button
              type="button"
              variant="secondary"
              onClick={handleDownloadAll}
              disabled={isDownloadingAll || isGeneratingQrs}
              leftIcon={<Download className="w-4 h-4 text-white" />}
              className="text-xs"
            >
              {isDownloadingAll ? (downloadProgress || "Downloading...") : `Download All (${tables.length})`}
            </Button>

            <Button
              type="button"
              onClick={() => setIsPrintModalOpen(true)}
              disabled={isGeneratingQrs}
              leftIcon={<Printer className="w-4 h-4 text-black" />}
              className="text-xs font-semibold"
            >
              Print All Table Stands
            </Button>
          </div>
        </div>

        {/* Number of Tables Configuration Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
          {/* Left: Table Count Controls (7 cols) */}
          <div className="md:col-span-7 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-white/70 uppercase font-mono tracking-wider">
                1. Number of Dining Tables
              </label>
              <span className="text-[11px] font-mono text-white/40">
                Range: 1 – 100 tables
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Stepper Input */}
              <div className="flex items-center bg-[#141414] border border-white/10 rounded-full p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleCountChange(tableCount - 1)}
                  disabled={tableCount <= 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                  title="Decrease table count"
                >
                  <Minus className="w-4 h-4" />
                </button>

                <div className="px-4 min-w-[70px] text-center font-mono text-base font-bold text-white">
                  {tableCount}
                </div>

                <button
                  type="button"
                  onClick={() => handleCountChange(tableCount + 1)}
                  disabled={tableCount >= 100}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30 transition-colors cursor-pointer"
                  title="Increase table count"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Preset buttons */}
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_TABLE_COUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleCountChange(preset)}
                    className={`px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer border ${
                      tableCount === preset
                        ? "bg-white text-black font-bold border-white shadow-xs"
                        : "bg-[#141414] text-white/60 border-white/10 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    {preset} Tables
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Quick Table Search / Filter (5 cols) */}
          <div className="md:col-span-5 space-y-2">
            <label className="text-xs font-medium text-white/70 uppercase font-mono tracking-wider block">
              Search or Filter Tables
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="text"
                placeholder="Find table (e.g. '3', 'Table 08', 'tbl_')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#141414] border border-white/10 rounded-full pl-9 pr-4 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 transition-colors font-mono"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Download notification bar if in progress */}
        {downloadProgress && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono flex items-center gap-2 animate-in fade-in duration-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{downloadProgress}</span>
          </div>
        )}
      </div>

      {/* Grid of Tables */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-white/40" />
            <h4 className="text-xs uppercase font-mono tracking-widest text-white/60">
              Active Dining Tables ({filteredTables.length} of {tables.length})
            </h4>
          </div>

          <span className="text-[11px] text-white/40 font-mono">
            Unique tokens generated locally
          </span>
        </div>

        {filteredTables.length === 0 ? (
          <div className="py-12 text-center bg-[#0D0D0D] rounded-2xl border border-dashed border-white/10 p-6">
            <QrCode className="w-10 h-10 text-white/20 mx-auto mb-2" />
            <p className="text-sm font-medium text-white/60">No tables matching &ldquo;{searchQuery}&rdquo;</p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-3 text-xs text-white/40 hover:text-white underline cursor-pointer"
            >
              Reset search filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredTables.map((table) => (
              <TableQrCard
                key={table.id}
                table={table}
                restaurantSlug={profile.slug}
                restaurantName={profile.name}
                primaryColor={profile.branding.primaryColor}
                qrDataUrl={qrDataUrls[table.id]}
                onSimulateTable={onSimulateTable}
                onOpenCustomerMenu={onOpenCustomerMenu}
              />
            ))}
          </div>
        )}
      </div>

      {/* Printable Stands Modal */}
      <PrintTableStandsModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        tables={tables}
        profile={profile}
        qrDataUrls={qrDataUrls}
      />
    </div>
  );
}
