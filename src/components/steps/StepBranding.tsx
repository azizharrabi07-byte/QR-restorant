import React, { useState } from "react";
import { ArrowLeft, ArrowRight, Palette, Check, SlidersHorizontal, Image as ImageIcon } from "lucide-react";
import { RestaurantProfile } from "../../types";
import { COLOR_PRESETS, COVER_PRESETS } from "../../lib/constants";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { ImageUpload } from "../ui/ImageUpload";

interface StepBrandingProps {
  profile: RestaurantProfile;
  onUpdate: (data: Partial<RestaurantProfile>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StepBranding({ profile, onUpdate, onContinue, onBack }: StepBrandingProps) {
  const [customHex, setCustomHex] = useState(profile.branding.primaryColor || "#D97706");
  const [showCustomHexInput, setShowCustomHexInput] = useState(false);

  const handleSelectColor = (hex: string) => {
    setCustomHex(hex);
    onUpdate({
      branding: {
        ...profile.branding,
        primaryColor: hex,
      },
    });
  };

  const handleCustomHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomHex(val);
    if (/^#[0-9A-F]{6}$/i.test(val)) {
      onUpdate({
        branding: {
          ...profile.branding,
          primaryColor: val,
        },
      });
    }
  };

  const handleCoverChange = (url: string) => {
    onUpdate({
      branding: {
        ...profile.branding,
        coverImage: url,
      },
    });
  };

  const handleTaglineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({
      branding: {
        ...profile.branding,
        tagline: e.target.value,
      },
    });
  };

  return (
    <div className="max-w-2xl mx-auto text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-medium">
          Step 02 · Aesthetics
        </p>
        <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">
          Define your look and feel
        </h2>
        <p className="text-white/40 max-w-lg text-sm sm:text-base leading-relaxed">
          Select your signature accent color and hero banner to craft a tailored digital dining atmosphere.
        </p>
      </div>

      <div className="space-y-6">
        {/* Primary Color Section */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Primary Brand Accent</h3>
              <p className="text-xs text-white/40 mt-0.5">
                Applied to category pills, call-to-action highlights, and customer order badges.
              </p>
            </div>
            {/* Active Color Sample Pill */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#111111] border border-white/10 shrink-0">
              <span
                className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-xs"
                style={{ backgroundColor: profile.branding.primaryColor || "#D97706" }}
              />
              <span className="text-xs font-mono text-white/80 uppercase">
                {profile.branding.primaryColor || "#D97706"}
              </span>
            </div>
          </div>

          {/* Preset Swatches */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            {COLOR_PRESETS.map((p) => {
              const isSelected =
                (profile.branding.primaryColor || "").toLowerCase() === p.hex.toLowerCase();
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectColor(p.hex)}
                  className={`p-3 rounded-lg border flex items-center gap-3 transition-all cursor-pointer text-left ${
                    isSelected
                      ? "bg-[#1A1A1A] border-white/40 ring-1 ring-white/20 shadow-sm"
                      : "bg-[#111111] border-white/10 hover:border-white/20"
                  }`}
                >
                  <div
                    className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 shadow-xs border border-white/10"
                    style={{ backgroundColor: p.hex }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-white truncate">{p.name}</p>
                    <p className="text-[10px] text-white/40 font-mono uppercase">{p.hex}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Color Toggle */}
          <div className="pt-3 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowCustomHexInput(!showCustomHexInput)}
              className="text-xs text-white/50 hover:text-white inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{showCustomHexInput ? "Hide custom HEX picker" : "Use custom HEX color code"}</span>
            </button>

            {showCustomHexInput && (
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customHex.startsWith("#") ? customHex : "#D97706"}
                  onChange={(e) => handleSelectColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-white/20 bg-transparent cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={customHex}
                  onChange={handleCustomHexChange}
                  placeholder="#D97706"
                  maxLength={7}
                  className="w-28 bg-[#111111] border border-white/10 text-xs font-mono text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-white/30"
                />
              </div>
            )}
          </div>
        </div>

        {/* Cover Image Section */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Hero Backdrop Banner</h3>
            <p className="text-xs text-white/40 mt-0.5">
              Displays as a cinematic backdrop banner at the top of your mobile QR menu.
            </p>
          </div>

          <ImageUpload
            value={profile.branding.coverImage}
            onChange={handleCoverChange}
            aspectRatio="banner"
            presets={COVER_PRESETS}
            hint="Landscape photography recommended (1200x500px). Select from curated sample presets or upload your own."
          />
        </div>

        {/* Tagline / Bio */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
          <Input
            label="Tagline or Welcome Memo"
            id="tagline-input"
            value={profile.branding.tagline || ""}
            onChange={handleTaglineChange}
            placeholder="e.g., Artisan single-origins & seasonal French pastries."
            hint="A warm 1-2 sentence subtitle displayed below your establishment title."
          />

          <div className="pt-3 border-t border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white/80 block">Table QR Ordering Mode</span>
              <span className="text-[11px] text-white/40">
                Display table number badges and allow customers to send orders directly to counter.
              </span>
            </div>
            <button
              type="button"
              onClick={() => onUpdate({ tableOrdering: !profile.tableOrdering })}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                profile.tableOrdering ? "bg-white" : "bg-white/20"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full transition-transform absolute top-1 ${
                  profile.tableOrdering ? "left-6 bg-black" : "left-1 bg-white"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex items-center justify-between border-t border-white/5">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back to Identity
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={onContinue}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="min-w-[200px]"
          >
            Continue to Categories
          </Button>
        </div>
      </div>
    </div>
  );
}
