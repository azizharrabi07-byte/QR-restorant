import React, { useState } from "react";
import { ArrowRight, Coffee, Store, Utensils, Sparkles, Building2, Globe, DollarSign } from "lucide-react";
import { BusinessType, RestaurantProfile } from "../../types";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { ImageUpload } from "../ui/ImageUpload";
import { LOGO_PRESETS } from "../../lib/constants";

interface StepIdentityProps {
  profile: RestaurantProfile;
  onUpdate: (data: Partial<RestaurantProfile>) => void;
  onContinue: () => void;
}

const BUSINESS_TYPES: { type: BusinessType; label: string; icon: React.ReactNode; desc: string }[] = [
  {
    type: "specialty_coffee",
    label: "Specialty Coffee & Roastery",
    icon: <Coffee className="w-4 h-4" />,
    desc: "Espresso, pour-overs, cold brews & beans",
  },
  {
    type: "artisan_bakery",
    label: "Bakery & Patisserie",
    icon: <Store className="w-4 h-4" />,
    desc: "Sourdough breads, croissants & daily bakes",
  },
  {
    type: "casual_dining",
    label: "Casual Dining & Bistro",
    icon: <Utensils className="w-4 h-4" />,
    desc: "Full service restaurant & lunch spots",
  },
  {
    type: "fine_dining",
    label: "Fine Dining & Tasting Lounge",
    icon: <Sparkles className="w-4 h-4" />,
    desc: "Curated multi-course menus & wine pairings",
  },
];

const CURRENCIES = [
  { code: "USD", symbol: "$", label: "USD ($)" },
  { code: "EUR", symbol: "€", label: "EUR (€)" },
  { code: "GBP", symbol: "£", label: "GBP (£)" },
  { code: "CAD", symbol: "CA$", label: "CAD ($)" },
  { code: "AUD", symbol: "AU$", label: "AUD ($)" },
];

export function StepIdentity({ profile, onUpdate, onContinue }: StepIdentityProps) {
  const [error, setError] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    if (error) setError("");

    // Auto generate clean slug if user hasn't manually diverged
    const generatedSlug = newName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    onUpdate({
      name: newName,
      slug: generatedSlug,
    });
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const clean = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
    onUpdate({ slug: clean });
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile.name.trim()) {
      setError("Please provide your restaurant or coffee shop name to continue.");
      return;
    }
    onContinue();
  };

  return (
    <div className="max-w-2xl mx-auto text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Step Header */}
      <div className="mb-8">
        <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-medium">
          Step 01 · Identity
        </p>
        <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">
          Name your establishment
        </h2>
        <p className="text-white/40 max-w-lg text-sm sm:text-base leading-relaxed">
          Configure the core identity for your restaurant or lounge. Guests will see this when scanning your QR menu.
        </p>
      </div>

      <form onSubmit={handleContinue} className="space-y-6">
        {/* Business Name Input */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
          <Input
            label="Establishment Name *"
            id="business-name"
            placeholder="e.g., L'Artiste Brasserie, Nomad Roasters"
            value={profile.name}
            onChange={handleNameChange}
            error={error}
            hint="This appears prominently at the top of your digital QR menu."
            autoFocus
          />

          {/* Subdomain Slug preview */}
          <div className="pt-3 border-t border-white/5">
            <label className="text-[11px] uppercase tracking-widest text-white/60 font-medium block mb-1.5">
              Online Menu URL & QR Link
            </label>
            <div className="flex items-center rounded-lg bg-[#111111] border border-white/10 overflow-hidden text-sm focus-within:border-white/30">
              <span className="pl-3.5 pr-1 text-white/40 font-mono text-xs flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                https://
              </span>
              <input
                type="text"
                value={profile.slug}
                onChange={handleSlugChange}
                placeholder="my-restaurant"
                className="flex-1 bg-transparent py-2.5 text-xs sm:text-sm font-mono text-white focus:outline-none"
              />
              <span className="pr-3.5 pl-1 text-white/40 font-mono text-xs">.menuos.app</span>
            </div>
            <p className="text-xs text-white/40 mt-1.5">
              Guests scanning your QR stands will immediately load this address.
            </p>
          </div>
        </div>

        {/* Business Type Selector */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-3">
          <label className="text-[11px] uppercase tracking-widest text-white/60 font-medium block">
            Establishment Archetype
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUSINESS_TYPES.map((b) => {
              const isSelected = profile.businessType === b.type;
              return (
                <button
                  key={b.type}
                  type="button"
                  onClick={() => onUpdate({ businessType: b.type })}
                  className={`p-3.5 rounded-lg border text-left flex items-start gap-3 transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#1A1A1A] border-white/40 text-white ring-1 ring-white/20"
                      : "bg-[#111111] border-white/10 hover:border-white/20 text-white/50 hover:text-white/80"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? "bg-white text-black"
                        : "bg-[#1A1A1A] text-white/40"
                    }`}
                  >
                    {b.icon}
                  </div>
                  <div className="min-w-0">
                    <p
                      className={`text-xs font-semibold tracking-tight ${
                        isSelected ? "text-white" : "text-white/80"
                      }`}
                    >
                      {b.label}
                    </p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-snug">{b.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Logo Upload Section */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Brand Emblem / Monogram</h3>
            <p className="text-xs text-white/40 mt-0.5">
              Upload your establishment badge or monogram. Displays on the phone preview and QR stands.
            </p>
          </div>

          <ImageUpload
            value={profile.logoUrl}
            onChange={(url) => onUpdate({ logoUrl: url })}
            aspectRatio="square"
            presets={LOGO_PRESETS}
            hint="Square asset recommended. PNG with transparency or clean JPG."
          />
        </div>

        {/* Currency Preference */}
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-[11px] uppercase tracking-widest text-white/60 font-medium block">
                Menu Currency
              </label>
              <p className="text-xs text-white/40 mt-0.5">
                All prices on customer menus will format with this currency symbol.
              </p>
            </div>
            <div className="flex items-center gap-1 bg-[#111111] p-1 rounded-full border border-white/10">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => onUpdate({ currency: c.code })}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-medium transition-all cursor-pointer ${
                    profile.currency === c.code
                      ? "bg-white text-black font-bold shadow-xs"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 flex items-center justify-between border-t border-white/5">
          <span className="text-xs text-white/40 uppercase tracking-widest font-mono">
            Next: Brand Aesthetics
          </span>
          <Button
            type="submit"
            size="lg"
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="min-w-[200px]"
          >
            Continue to Branding
          </Button>
        </div>
      </form>
    </div>
  );
}
