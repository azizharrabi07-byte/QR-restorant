import React, { useState } from "react";
import { Download, Copy, Check, ExternalLink, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { RestaurantTable, TableItem } from "../../types";
import { getTableFullUrl, getTableRelativePath, downloadQrImage, generateQrDataUrl } from "../../lib/tableManager";

export interface TableQrCardProps {
  key?: React.Key;
  table: RestaurantTable | TableItem;
  restaurantSlug: string;
  restaurantName: string;
  primaryColor?: string;
  qrDataUrl?: string;
  onSimulateTable?: (tableNumber: number) => void;
  onOpenCustomerMenu?: (slug: string, token: string) => void;
}

export function TableQrCard({
  table,
  restaurantSlug,
  restaurantName,
  primaryColor = "#D97706",
  qrDataUrl,
  onSimulateTable,
  onOpenCustomerMenu,
}: TableQrCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const tableNum = table.table_number ?? (table as any).tableNumber ?? 1;
  const token = table.qr_token ?? (table as any).token ?? "default";

  const fullUrl = getTableFullUrl(restaurantSlug, token);
  const relativePath = getTableRelativePath(restaurantSlug, token);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloading(true);
      const cleanSlug = restaurantSlug || "menu";
      const filename = `${cleanSlug}-table-${tableNum.toString().padStart(2, "0")}-qr.png`;
      const urlToDownload = qrDataUrl || (await generateQrDataUrl(fullUrl));
      if (urlToDownload) {
        downloadQrImage(urlToDownload, filename);
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-[#0D0D0D] border border-white/10 hover:border-white/20 rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-200 group relative">
      {/* Card Header: Table Number & Status */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-serif italic text-white text-base sm:text-lg font-medium">
              Table {tableNum.toString().padStart(2, "0")}
            </span>
          </div>

          <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">
            Dine-In
          </span>
        </div>

        {/* QR Code Preview Box */}
        <div className="bg-white rounded-xl p-3.5 flex flex-col items-center justify-center aspect-square max-w-[200px] mx-auto border border-white/20 shadow-lg relative group-hover:scale-[1.02] transition-transform">
          <QRCodeSVG
            value={fullUrl}
            size={160}
            level="M"
            bgColor="#FFFFFF"
            fgColor="#000000"
            className="w-full h-full object-contain"
          />

          {/* Tiny Table Badge pinned on top of QR code */}
          <div
            className="absolute -bottom-2 bg-[#0A0A0A] text-white px-2.5 py-0.5 rounded-full text-[10px] font-mono border border-white/20 tracking-wider shadow-md"
          >
            T-{tableNum.toString().padStart(2, "0")}
          </div>
        </div>

        {/* Unique Menu URL section */}
        <div className="mt-5 space-y-1.5 text-left">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/40 uppercase font-mono tracking-wider text-[10px]">
              Menu Route
            </span>
            <span className="text-[10px] font-mono text-white/40 truncate max-w-[120px]">
              {token}
            </span>
          </div>

          <div className="flex items-center justify-between gap-1.5 p-2 rounded-lg bg-[#141414] border border-white/10 text-xs font-mono">
            <span
              className="text-white/80 truncate text-[11px]"
              title={fullUrl}
            >
              {relativePath}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="text-white/40 hover:text-white p-1 hover:bg-white/10 rounded transition-colors cursor-pointer shrink-0"
              title="Copy table menu URL"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 py-2 px-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98] disabled:opacity-40"
        >
          <Download className="w-3.5 h-3.5 text-white/70" />
          <span>{downloading ? "Exporting..." : "Download PNG"}</span>
        </button>

        {onOpenCustomerMenu && (
          <button
            type="button"
            onClick={() => onOpenCustomerMenu(restaurantSlug, token)}
            className="py-2 px-2.5 rounded-full bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/30 text-xs font-mono transition-colors cursor-pointer"
            title={`Launch Live Customer Menu for Table ${tableNum}`}
          >
            Order
          </button>
        )}

        {onSimulateTable && (
          <button
            type="button"
            onClick={() => onSimulateTable(tableNum)}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white/60 hover:text-white transition-colors cursor-pointer"
            title={`Preview Table ${tableNum} in Mobile Simulator`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
