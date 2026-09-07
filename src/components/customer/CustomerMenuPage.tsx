import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Sparkles,
  Utensils,
  ChevronRight,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  resolveCustomerMenu,
  submitCustomerOrder,
  CustomerMenuResolvedData,
  SubmitOrderResult,
} from "../../lib/orderService";
import { Product, Category, CustomerCartItem, RestaurantProfile } from "../../types";
import { INITIAL_RESTAURANT_DATA } from "../../lib/constants";
import { Button } from "../ui/Button";

interface CustomerMenuPageProps {
  slug: string;
  qrToken: string;
  onNavigateHome?: () => void;
  onNavigateToWorkerDashboard?: (restaurantId: string) => void;
  demoProfileFallback?: RestaurantProfile;
}

export function CustomerMenuPage({
  slug,
  qrToken,
  onNavigateHome,
  onNavigateToWorkerDashboard,
  demoProfileFallback,
}: CustomerMenuPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [menuData, setMenuData] = useState<CustomerMenuResolvedData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cart, setCart] = useState<CustomerCartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<SubmitOrderResult | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<CustomerCartItem[]>([]);
  const [isDemoFallback, setIsDemoFallback] = useState(false);

  // Load menu data on mount or when slug/qrToken change
  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError(null);

      const result = await resolveCustomerMenu(slug, qrToken);

      if (!isMounted) return;

      if (result.data) {
        setMenuData(result.data);
        setIsDemoFallback(false);
        setLoading(false);
      } else {
        // If not found in Supabase (e.g. before cloud publish), provide graceful fallback with demo data
        const fallback = demoProfileFallback || INITIAL_RESTAURANT_DATA;
        setIsDemoFallback(true);
        setMenuData({
          restaurant: {
            id: "demo-restaurant-local",
            name: fallback.name,
            slug: fallback.slug || slug,
            currency: fallback.currency || "USD",
            business_type: fallback.businessType,
            logo_url: fallback.logoUrl,
            cover_image: fallback.branding.coverImage,
            primary_color: fallback.branding.primaryColor || "#D97706",
            tagline: fallback.branding.tagline,
            menu_layout_theme: fallback.branding.menuLayoutTheme,
          },
          table: {
            id: "demo-table-1",
            restaurant_id: "demo-restaurant-local",
            table_number: 1,
            qr_token: qrToken,
          },
          categories: fallback.categories,
          products: fallback.products.filter((p) => p.isAvailable),
        });
        setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [slug, qrToken, demoProfileFallback]);

  // Cart helper functions
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      );
    });
  };

  const getItemQuantity = (productId: string): number => {
    const item = cart.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = cart.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

  // Submit order to Supabase
  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !menuData) return;

    setIsSubmitting(true);
    const currentCartSnapshot = [...cart];

    try {
      if (isDemoFallback) {
        // Simulated local order for previewing prior to database publishing
        await new Promise((resolve) => setTimeout(resolve, 800));
        const simOrderNumber = Math.floor(Math.random() * 80) + 1;
        setConfirmedItems(currentCartSnapshot);
        setConfirmedOrder({
          success: true,
          orderId: "sim-" + Date.now(),
          daily_order_number: simOrderNumber,
          total: totalCartPrice,
        });
        setCart([]);
        setIsCartOpen(false);
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      } else {
        // Real Supabase insert: orders + order_items
        const result = await submitCustomerOrder({
          restaurant_id: menuData.restaurant.id,
          table_id: menuData.table.id,
          items: currentCartSnapshot.map((item) => ({
            product_id: item.product.id,
            product_name_snapshot: item.product.name,
            quantity: item.quantity,
          })),
        });

        if (result.success) {
          setConfirmedItems(currentCartSnapshot);
          setConfirmedOrder(result);
          setCart([]);
          setIsCartOpen(false);
          confetti({
            particleCount: 90,
            spread: 70,
            origin: { y: 0.6 },
            colors: [menuData.restaurant.primary_color || "#D97706", "#FFFFFF", "#10B981"],
          });
        } else {
          alert(result.error || "Failed to submit order. Please try again.");
        }
      }
    } catch (err: any) {
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="w-16 h-16 rounded-full border-2 border-white/10 border-t-white animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <Utensils className="w-6 h-6 text-white/50" />
          </div>
        </div>
        <p className="text-sm font-medium tracking-wide text-white/80">Connecting to Dining Station...</p>
        <p className="text-xs text-white/40 mt-1 font-mono">Token: {qrToken}</p>
      </div>
    );
  }

  if (error && !menuData) {
    return (
      <div className="min-h-screen bg-[#080808] text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold mb-2">Dining Table Not Found</h2>
        <p className="text-sm text-white/60 mb-6 leading-relaxed">{error}</p>
        <div className="flex gap-3">
          {onNavigateHome && (
            <Button variant="outline" onClick={onNavigateHome}>
              Return to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  const primaryColor = menuData?.restaurant.primary_color || "#D97706";
  const currencySymbol = menuData?.restaurant.currency === "EUR" ? "€" : "$";

  // Filter products by active category
  const filteredProducts =
    activeCategory === "all"
      ? menuData?.products || []
      : (menuData?.products || []).filter((p) => p.categoryId === activeCategory);

  return (
    <div className="min-h-screen bg-[#070707] text-[#ECECEC] flex flex-col pb-28 selection:bg-white/20 selection:text-white">
      {/* Top Floating Control Bar */}
      <header className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-white/10 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-white tracking-tight">
                  {menuData?.restaurant.name}
                </h1>
                {isDemoFallback && (
                  <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    Preview Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 font-mono">
                {menuData?.restaurant.tagline || "Digital QR Menu"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Table Badge */}
            <div
              className="px-3 py-1 rounded-full text-xs font-bold text-white border border-white/20 shadow-xs flex items-center gap-1.5"
              style={{ backgroundColor: `${primaryColor}25` }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: primaryColor }}
              />
              <span className="font-mono">
                Table {menuData?.table.table_number.toString().padStart(2, "0")}
              </span>
            </div>

            {/* Quick link to Worker Dashboard for this restaurant */}
            {onNavigateToWorkerDashboard && menuData && (
              <button
                type="button"
                onClick={() => onNavigateToWorkerDashboard(menuData.restaurant.id)}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-white/60 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1 rounded-full border border-white/10 transition-colors cursor-pointer"
                title="Open Worker / Kitchen Orders Dashboard"
              >
                <span>Kitchen Screen</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-3xl mx-auto w-full px-4 pt-4">
        {/* Restaurant Hero Banner */}
        {menuData?.restaurant.cover_image && (
          <div className="relative h-44 sm:h-56 rounded-2xl overflow-hidden mb-6 border border-white/10">
            <img
              src={menuData.restaurant.cover_image}
              alt={menuData.restaurant.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
              <div className="flex items-center gap-3">
                {menuData.restaurant.logo_url && (
                  <img
                    src={menuData.restaurant.logo_url}
                    alt="Logo"
                    className="w-12 h-12 rounded-xl object-cover bg-black/60 border border-white/20 p-1 backdrop-blur-sm"
                  />
                )}
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif italic text-white drop-shadow-md">
                    {menuData.restaurant.name}
                  </h2>
                  <p className="text-xs text-white/70">
                    Seated at Station #{menuData.table.table_number} · Ready for orders
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Category Horizontal Navigation */}
        <div className="sticky top-[57px] z-30 bg-[#070707]/95 backdrop-blur-md py-3 -mx-4 px-4 border-b border-white/5 mb-6 overflow-x-auto no-scrollbar flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border ${
              activeCategory === "all"
                ? "bg-white text-black font-semibold border-white"
                : "bg-white/5 text-white/60 border-white/10 hover:text-white"
            }`}
          >
            All Dishes ({menuData?.products.length || 0})
          </button>
          {menuData?.categories.map((cat) => {
            const count = (menuData?.products || []).filter(
              (p) => p.categoryId === cat.id
            ).length;
            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all shrink-0 cursor-pointer border flex items-center gap-1.5 ${
                  isActive
                    ? "bg-white text-black font-semibold border-white"
                    : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                }`}
              >
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-black/15 text-black" : "bg-white/10 text-white/50"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Product Cards Grid */}
        <div className="space-y-3 sm:space-y-4">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl p-6">
              <Utensils className="w-8 h-8 text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/50">No items in this category yet.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const qty = getItemQuantity(product.id);

              return (
                <div
                  key={product.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-[#0F0F0F] border border-white/10 hover:border-white/20 transition-all flex gap-3.5 sm:gap-4 items-center group"
                >
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden shrink-0 bg-white/5 border border-white/10 relative">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                        {product.name}
                      </h3>
                      <span className="text-sm font-mono font-bold text-white shrink-0">
                        {currencySymbol}
                        {product.price.toFixed(2)}
                      </span>
                    </div>

                    {product.description && (
                      <p className="text-xs text-white/50 line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    {/* Dietary Tags */}
                    {product.tags && product.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {product.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-mono bg-white/5 text-white/60 border border-white/10"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add / Quantity Stepper Button */}
                  <div className="shrink-0 flex items-center">
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="w-9 h-9 rounded-full bg-white/10 hover:bg-white text-white hover:text-black transition-all flex items-center justify-center cursor-pointer border border-white/10 active:scale-95"
                        title="Add to order"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-full border border-white/20">
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-mono font-bold text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar (if items in cart) */}
      {cart.length > 0 && !confirmedOrder && (
        <aside aria-label="Customer Order Cart" className="fixed bottom-4 left-4 right-4 z-40 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-white text-black shadow-2xl flex items-center justify-between cursor-pointer hover:bg-white/95 transition-all font-medium active:scale-[0.99] border border-black/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-xs font-mono font-bold">
                {totalCartCount}
              </div>
              <span className="text-sm font-bold tracking-tight">View Your Order</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-mono font-bold">
                {currencySymbol}
                {totalCartPrice.toFixed(2)}
              </span>
              <ChevronRight className="w-4 h-4 text-black/60" />
            </div>
          </button>
        </aside>
      )}

      {/* Cart Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full max-w-lg bg-[#0E0E0E] border border-white/15 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <h3 className="text-lg font-bold text-white">Table Order Summary</h3>
                <p className="text-xs text-white/50 font-mono">
                  Table {menuData?.table.table_number.toString().padStart(2, "0")} · {totalCartCount} item(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 no-scrollbar">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/5"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-sm font-medium text-white truncate">
                      {item.product.name}
                    </p>
                    <p className="text-xs font-mono text-white/50">
                      {currencySymbol}
                      {item.product.price.toFixed(2)} each
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 bg-white/10 p-1 rounded-full border border-white/15">
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(item.product)}
                        className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-sm font-mono font-bold text-white w-16 text-right">
                      {currencySymbol}
                      {(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Drawer Footer & Checkout */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/60">Order Total</span>
                <span className="text-xl font-mono font-bold text-white">
                  {currencySymbol}
                  {totalCartPrice.toFixed(2)}
                </span>
              </div>

              <Button
                type="button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 text-sm font-bold shadow-lg"
                leftIcon={
                  isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShoppingBag className="w-4 h-4 text-black" />
                  )
                }
              >
                {isSubmitting
                  ? "Transmitting Order to Kitchen..."
                  : `Submit Order to Table ${menuData?.table.table_number}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Order Confirmation Screen */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0D0D0D] border border-white/20 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl relative">
            {/* Pulsing Success Badge */}
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
            </div>

            <div>
              <p className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold mb-1">
                Order Received · Dispatched to Kitchen
              </p>
              <h2 className="text-3xl font-serif italic text-white mb-2">
                Order #{confirmedOrder.daily_order_number}
              </h2>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/70">
                <span>Table {menuData?.table.table_number.toString().padStart(2, "0")}</span>
                <span>•</span>
                <span className="text-emerald-400 font-semibold">Status: Pending</span>
              </div>
            </div>

            {/* Ordered Items Breakdown */}
            <div className="text-left bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/40 mb-2">
                Dishes in this batch
              </p>
              {confirmedItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between text-xs font-medium"
                >
                  <span className="text-white">
                    {item.quantity}x {item.product.name}
                  </span>
                  <span className="font-mono text-white/60">
                    {currencySymbol}
                    {(item.product.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold text-white">
                <span>Batch Total</span>
                <span className="font-mono">
                  {currencySymbol}
                  {(confirmedOrder.total || totalCartPrice).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                onClick={() => setConfirmedOrder(null)}
                className="w-full py-3 text-xs font-bold"
              >
                Order More Items
              </Button>

              {onNavigateToWorkerDashboard && menuData && (
                <button
                  type="button"
                  onClick={() => onNavigateToWorkerDashboard(menuData.restaurant.id)}
                  className="w-full py-2.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-mono transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Worker Kitchen View</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
