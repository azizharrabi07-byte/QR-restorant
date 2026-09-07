import React from "react";
import { Printer, X, Download, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { RestaurantTable, TableItem, RestaurantProfile } from "../../types";
import { Button } from "../ui/Button";
import { getTableFullUrl } from "../../lib/tableManager";

interface PrintTableStandsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: (RestaurantTable | TableItem)[];
  profile: RestaurantProfile;
  qrDataUrls?: Record<string, string>;
}

export function PrintTableStandsModal({
  isOpen,
  onClose,
  tables,
  profile,
  qrDataUrls,
}: PrintTableStandsModalProps) {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity no-print"
        onClick={onClose}
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-5xl bg-[#0D0D0D] border border-white/10 rounded-2xl shadow-2xl p-5 sm:p-7 text-left z-10 my-8 max-h-[90vh] flex flex-col no-print">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-white/40">
                Physical Print Kit
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/60 text-[10px] font-mono">
                {tables.length} Table Stands
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif italic text-white">
              Printable Dining Table Stands
            </h3>
            <p className="text-xs text-white/40 mt-1">
              High-resolution cards formatted for folding table tents or acrylic table holders.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handlePrint}
              leftIcon={<Printer className="w-4 h-4 text-black" />}
            >
              Print All Tables
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-white/40 hover:text-white p-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Preview of Stands */}
        <div className="flex-1 overflow-y-auto py-6 pr-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {tables.map((table) => {
              const qrUrl = qrDataUrls ? qrDataUrls[table.id] : undefined;
              const tableNum = table.table_number ?? (table as any).tableNumber ?? 1;
              const token = table.qr_token ?? (table as any).token ?? "default";
              const fullUrl = getTableFullUrl(profile.slug, token);

              return (
                <div
                  key={table.id}
                  className="bg-white text-black p-6 rounded-2xl shadow-xl flex flex-col items-center text-center border-2 border-dashed border-neutral-300 relative"
                >
                  {/* Cut Line Indicator */}
                  <div className="absolute top-2 left-3 text-[9px] font-mono text-neutral-400 uppercase tracking-widest">
                    ✂ Cut / Fold
                  </div>

                  {/* Restaurant Logo / Name */}
                  <div className="mt-2 mb-3 flex flex-col items-center">
                    {profile.logoUrl ? (
                      <img
                        src={profile.logoUrl}
                        alt={profile.name}
                        className="w-10 h-10 rounded-lg object-cover mb-1.5 border border-neutral-200"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-serif italic font-bold text-base mb-1.5"
                        style={{ backgroundColor: profile.branding.primaryColor || "#D97706" }}
                      >
                        {profile.name?.charAt(0) || "M"}
                      </div>
                    )}
                    <h4 className="font-bold text-sm tracking-tight text-neutral-900 line-clamp-1">
                      {profile.name || "Restaurant"}
                    </h4>
                    <p className="text-[10px] text-neutral-500 font-medium">
                      Table Dining Experience
                    </p>
                  </div>

                  {/* Prominent Table Number Badge */}
                  <div
                    className="w-full py-1.5 px-3 rounded-lg text-white font-mono font-bold text-sm tracking-wider uppercase mb-3 shadow-xs"
                    style={{ backgroundColor: "#0A0A0A" }}
                  >
                    TABLE {tableNum.toString().padStart(2, "0")}
                  </div>

                  {/* QR Code */}
                  <div className="p-2.5 bg-neutral-50 rounded-xl border border-neutral-200 shadow-inner flex items-center justify-center">
                    <QRCodeSVG
                      value={fullUrl}
                      size={160}
                      level="M"
                      bgColor="#FAFAFA"
                      fgColor="#000000"
                    />
                  </div>

                  {/* Instruction */}
                  <div className="mt-3 text-center">
                    <p className="text-[11px] font-bold tracking-tight text-neutral-900">
                      Scan Camera to View Menu & Order
                    </p>
                    <p className="text-[10px] text-neutral-500 mt-0.5">
                      No app download required
                    </p>
                  </div>

                  {/* URL */}
                  <div className="mt-3 pt-2 border-t border-neutral-200 w-full text-center">
                    <span className="text-[10px] font-mono text-neutral-600 block truncate">
                      {profile.slug || "menu"}.menuos.app
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 block truncate">
                      Token: {token}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Notes */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-white/40 shrink-0">
          <span>
            Tip: For best durability, print on heavy cardstock (250gsm+) or insert into acrylic T-stands.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-3.5 h-3.5 text-white" />}
          >
            Open System Print Dialog
          </Button>
        </div>
      </div>

      {/* Hidden Print Container that is ONLY visible during window.print() */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-4 z-[99999]">
        <div className="grid grid-cols-2 gap-8 page-break-after">
          {tables.map((table) => {
            const tableNum = table.table_number ?? (table as any).tableNumber ?? 1;
            const token = table.qr_token ?? (table as any).token ?? "default";
            const fullUrl = getTableFullUrl(profile.slug, token);

            return (
              <div
                key={table.id}
                className="bg-white text-black p-8 rounded-xl border-2 border-dashed border-gray-400 flex flex-col items-center text-center break-inside-avoid my-4"
              >
                <div className="mb-2">
                  <h2 className="font-bold text-xl tracking-tight text-black">
                    {profile.name || "Restaurant"}
                  </h2>
                  <p className="text-xs text-gray-600">Scan to browse menu & order</p>
                </div>

                <div className="bg-black text-white px-6 py-2 rounded-lg font-mono font-bold text-lg my-3">
                  TABLE {tableNum.toString().padStart(2, "0")}
                </div>

                <div className="p-3 bg-white border border-gray-200 rounded-xl my-3 flex items-center justify-center">
                  <QRCodeSVG
                    value={fullUrl}
                    size={220}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                </div>

                <p className="text-sm font-bold text-black mt-2">
                  Point your phone camera here to order
                </p>
                <p className="text-xs font-mono text-gray-700 mt-1 select-all">
                  {fullUrl}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
