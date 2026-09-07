import React, { useState } from "react";
import {
  Wifi,
  Battery,
  Sparkles,
  Search,
  Plus,
  Minus,
  ShoppingBag,
  Info,
  Check,
  Share2,
  ChevronRight,
  UtensilsCrossed,
  Clock,
  MapPin,
  X,
} from "lucide-react";
import { Product, RestaurantProfile } from "../../types";
import { formatPrice, cn } from "../../lib/utils";

interface PhoneSimulatorProps {
  profile: RestaurantProfile;
  className?: string;
  isStandalone?: boolean;
  simulatedTableNumber?: number;
}

export function PhoneSimulator({
  profile,
  className,
  isStandalone = false,
  simulatedTableNumber = 4,
}: PhoneSimulatorProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderSentNotification, setOrderSentNotification] = useState(false);

  const tableLabel = `Table ${simulatedTableNumber.toString().padStart(2, "0")}`;

  const primaryColor = profile.branding.primaryColor || "#D97706";

  const filteredProducts = profile.products.filter((p) => {
    const matchesCategory =
      selectedCategoryId === "all" || p.categoryId === selectedCategoryId;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const cartTotalItems: number = (Object.values(cart) as number[]).reduce((sum: number, count: number) => sum + count, 0);
  const cartTotalPrice: number = Object.entries(cart).reduce((total: number, [prodId, count]) => {
    const product = profile.products.find((p) => p.id === prodId);
    const quantity = typeof count === "number" ? count : 0;
    return total + (product ? product.price * quantity : 0);
  }, 0);

  const addToCart = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
  };

  const removeFromCart = (productId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCart((prev) => {
      const updated = { ...prev };
      if (updated[productId] > 1) {
        updated[productId] -= 1;
      } else {
        delete updated[productId];
      }
      return updated;
    });
  };

  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      {/* Phone Hardware Shell */}
      <div className="relative w-[340px] sm:w-[375px] h-[720px] bg-[#0A0A0A] rounded-[48px] p-3 shadow-2xl border-[6px] border-[#1C1C1C] ring-1 ring-white/10 flex flex-col overflow-hidden">
        {/* Hardware side buttons reflection */}
        <div className="absolute -left-[8px] top-24 w-[3px] h-10 bg-[#252525] rounded-l-sm" />
        <div className="absolute -left-[8px] top-38 w-[3px] h-12 bg-[#252525] rounded-l-sm" />
        <div className="absolute -right-[8px] top-28 w-[3px] h-16 bg-[#252525] rounded-r-sm" />

        {/* Screen Area */}
        <div className="relative w-full h-full bg-[#080808] rounded-[38px] overflow-hidden flex flex-col text-neutral-100 border border-white/5">
          
          {/* iOS / Phone Status Bar */}
          <div className="w-full bg-black/60 backdrop-blur-md px-6 pt-3 pb-2 flex items-center justify-between z-30 text-[11px] font-medium text-white/60">
            <span className="font-mono">9:41</span>
            {/* Dynamic Island */}
            <div className="w-20 h-4 bg-black rounded-full flex items-center justify-center gap-1.5 px-2 border border-white/10">
              <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" />
            </div>
            <div className="flex items-center gap-1.5 text-white/60">
              <Wifi className="w-3 h-3" />
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Toast / Order Sent Notification */}
          {orderSentNotification && (
            <div className="absolute top-12 inset-x-3 z-50 bg-[#141414] border border-white/20 rounded-xl p-3 shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-top-2 duration-200">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white">Order Sent to Kitchen</p>
                <p className="text-[10px] text-white/40">{tableLabel} receipt generated</p>
              </div>
            </div>
          )}

          {/* Scrollable Screen Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar pb-24 relative">
            
            {/* Cover Banner with Brand Tint */}
            <div className="relative h-44 w-full bg-[#111111] overflow-hidden">
              {profile.branding.coverImage ? (
                <img
                  src={profile.branding.coverImage}
                  alt="Cover banner"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div
                  className="w-full h-full opacity-60"
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor} 0%, #050505 100%)`,
                  }}
                />
              )}
              {/* Dark gradient for text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/40 to-transparent" />

              {/* Table / Dine-in tag */}
              <div className="absolute top-2.5 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] font-mono font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{tableLabel} · Dine-In</span>
              </div>
            </div>

            {/* Restaurant Profile Header */}
            <div className="px-4 -mt-12 relative z-10">
              <div className="flex items-end justify-between">
                {/* Logo Avatar */}
                <div
                  className="w-20 h-20 rounded-2xl bg-[#050505] p-1 shadow-xl border-2 overflow-hidden flex items-center justify-center shrink-0"
                  style={{ borderColor: primaryColor }}
                >
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={profile.name}
                      className="w-full h-full object-cover rounded-xl"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className="w-full h-full rounded-xl flex items-center justify-center text-white font-serif italic text-2xl font-bold"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {profile.name ? profile.name.charAt(0) : "M"}
                    </div>
                  )}
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 pb-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    Open Now
                  </span>
                </div>
              </div>

              {/* Title & Tagline */}
              <div className="mt-2.5">
                <h1 className="text-xl font-serif italic text-white tracking-tight leading-snug">
                  {profile.name || "Establishment Name"}
                </h1>
                {profile.branding.tagline && (
                  <p className="text-xs text-white/40 mt-0.5 line-clamp-2 leading-relaxed">
                    {profile.branding.tagline}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/40">
                  <span className="capitalize text-white/70">
                    {profile.businessType.replace("_", " ")}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-white/40">
                    {profile.slug ? `${profile.slug}.menuos.app` : "menuos.app"}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-3.5 relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  placeholder="Search dishes, coffees, drinks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111111] text-xs text-white placeholder:text-white/30 rounded-xl pl-8 pr-3 py-2 border border-white/10 focus:outline-none focus:border-white/30"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="mt-3 overflow-x-auto no-scrollbar -mx-4 px-4 flex items-center gap-1.5 pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId("all")}
                  className={cn(
                    "text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer",
                    selectedCategoryId === "all"
                      ? "text-white shadow-xs"
                      : "bg-[#141414] border border-white/10 text-white/50 hover:text-white"
                  )}
                  style={
                    selectedCategoryId === "all"
                      ? { backgroundColor: primaryColor }
                      : undefined
                  }
                >
                  All Items ({profile.products.length})
                </button>

                {profile.categories.map((cat) => {
                  const count = profile.products.filter((p) => p.categoryId === cat.id).length;
                  const isSelected = selectedCategoryId === cat.id;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={cn(
                        "text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap transition-all cursor-pointer",
                        isSelected
                          ? "text-white shadow-xs"
                          : "bg-[#141414] border border-white/10 text-white/50 hover:text-white"
                      )}
                      style={
                        isSelected ? { backgroundColor: primaryColor } : undefined
                      }
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Product Listing */}
              <div className="mt-3 space-y-2.5">
                {filteredProducts.length === 0 ? (
                  <div className="py-8 text-center bg-[#0C0C0C] rounded-xl border border-dashed border-white/10 p-4">
                    <UtensilsCrossed className="w-6 h-6 text-white/20 mx-auto mb-2" />
                    <p className="text-xs font-medium text-white/40">No menu items found</p>
                    <p className="text-[11px] text-white/30 mt-1">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Add products in Step 4 to populate your menu"}
                    </p>
                  </div>
                ) : (
                  filteredProducts.map((prod) => {
                    const quantityInCart = cart[prod.id] || 0;

                    return (
                      <div
                        key={prod.id}
                        onClick={() => setActiveProductDetail(prod)}
                        className="p-2.5 rounded-xl bg-[#0E0E0E] border border-white/10 hover:border-white/20 transition-all flex gap-3 cursor-pointer group"
                      >
                        {/* Text Details */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <h3 className="text-xs font-medium text-white group-hover:text-white transition-colors leading-snug">
                                {prod.name}
                              </h3>
                            </div>

                            {prod.description && (
                              <p className="text-[11px] text-white/40 line-clamp-2 mt-0.5 leading-relaxed">
                                {prod.description}
                              </p>
                            )}

                            {/* Tags */}
                            {prod.tags && prod.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {prod.tags.slice(0, 2).map((tag) => (
                                  <span
                                    key={tag}
                                    className="text-[9px] uppercase tracking-wider font-mono px-1.5 py-0.2 rounded bg-white/5 text-white/60 border border-white/10"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Price & Add to Cart button */}
                          <div className="flex items-center justify-between mt-2 pt-1">
                            <span className="text-xs font-mono text-white font-bold">
                              {formatPrice(prod.price, profile.currency)}
                            </span>

                            {quantityInCart > 0 ? (
                              <div
                                className="flex items-center gap-1.5 bg-[#161616] rounded-full p-0.5 border border-white/10"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => removeFromCart(prod.id, e)}
                                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/10 text-white/70"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-[11px] font-bold px-1 font-mono text-white">
                                  {quantityInCart}
                                </span>
                                <button
                                  type="button"
                                  onClick={(e) => addToCart(prod.id, e)}
                                  className="w-5 h-5 rounded-full flex items-center justify-center text-white"
                                  style={{ backgroundColor: primaryColor }}
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => addToCart(prod.id, e)}
                                className="text-[11px] px-2.5 py-1 rounded-full font-medium text-white flex items-center gap-1 shadow-xs hover:opacity-90 active:scale-95 transition-all"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Add</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Image Thumbnail */}
                        {prod.imageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-[#161616] shrink-0 border border-white/10">
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Sticky Simulated Floating Cart Bar */}
          {cartTotalItems > 0 && (
            <div className="absolute bottom-4 inset-x-3 z-30 animate-in slide-in-from-bottom-3 duration-200">
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="w-full py-2.5 px-4 rounded-full shadow-xl flex items-center justify-between text-white font-medium text-xs border border-white/10 active:scale-[0.98] transition-transform"
                style={{ backgroundColor: primaryColor }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center">
                    <ShoppingBag className="w-3.5 h-3.5" />
                  </div>
                  <span>
                    {cartTotalItems} {cartTotalItems === 1 ? "item" : "items"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono">
                  <span>{formatPrice(cartTotalPrice, profile.currency)}</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </button>
            </div>
          )}

          {/* Simulated Cart Modal / Sheet */}
          {isCartOpen && (
            <div className="absolute inset-0 z-40 bg-black/75 backdrop-blur-xs flex flex-col justify-end p-2 animate-in fade-in duration-200">
              <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 text-left max-h-[80%] flex flex-col shadow-2xl">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-white" />
                    <span className="text-xs font-serif italic text-white text-sm">Table Order ({tableLabel})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="overflow-y-auto no-scrollbar py-2 divide-y divide-white/5 max-h-56">
                  {Object.entries(cart).map(([prodId, count]) => {
                    const quantity = Number(count);
                    const prod = profile.products.find((p) => p.id === prodId);
                    if (!prod) return null;
                    return (
                      <div key={prodId} className="py-2 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate">{prod.name}</p>
                          <p className="text-[11px] font-mono text-white/40">
                            {formatPrice(prod.price * quantity, profile.currency)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-[#141414] border border-white/10 rounded-full p-0.5">
                          <button
                            type="button"
                            onClick={() => removeFromCart(prodId)}
                            className="w-5 h-5 rounded-full hover:bg-white/10 flex items-center justify-center text-xs text-white/70"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold px-1 font-mono text-white">{quantity}</span>
                          <button
                            type="button"
                            onClick={() => addToCart(prodId)}
                            className="w-5 h-5 rounded-full text-white flex items-center justify-center text-xs"
                            style={{ backgroundColor: primaryColor }}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-white">
                    <span>Subtotal</span>
                    <span className="font-mono text-white font-bold">
                      {formatPrice(cartTotalPrice, profile.currency)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCart({});
                      setIsCartOpen(false);
                      setOrderSentNotification(true);
                      setTimeout(() => setOrderSentNotification(false), 3500);
                    }}
                    className="w-full py-2.5 rounded-full font-medium text-xs text-white shadow-md cursor-pointer hover:opacity-95 active:scale-[0.99] transition-all"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Transmit Order to Kitchen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Item Detail Sheet */}
          {activeProductDetail && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-xs flex flex-col justify-end p-2 animate-in fade-in duration-200">
              <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-4 text-left shadow-2xl flex flex-col">
                {activeProductDetail.imageUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden mb-3 border border-white/10">
                    <img
                      src={activeProductDetail.imageUrl}
                      alt={activeProductDetail.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-base font-serif italic text-white">{activeProductDetail.name}</h4>
                    <span className="text-xs font-mono text-white/90">
                      {formatPrice(activeProductDetail.price, profile.currency)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveProductDetail(null)}
                    className="p-1 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeProductDetail.description && (
                  <p className="text-xs text-white/50 mt-2 leading-relaxed">
                    {activeProductDetail.description}
                  </p>
                )}

                {activeProductDetail.tags && activeProductDetail.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {activeProductDetail.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      addToCart(activeProductDetail.id);
                      setActiveProductDetail(null);
                    }}
                    className="flex-1 py-2.5 rounded-full text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 active:scale-[0.99] transition-all cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add to Order · {formatPrice(activeProductDetail.price, profile.currency)}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Home indicator bar */}
          <div className="absolute bottom-1 inset-x-0 flex justify-center py-1 pointer-events-none z-30">
            <div className="w-28 h-1 bg-white/20 rounded-full" />
          </div>
        </div>
      </div>
      <p className="text-[10px] text-white/40 mt-3 font-mono tracking-widest uppercase">
        Customer Mobile Viewport (375 × 667)
      </p>
    </div>
  );
}
