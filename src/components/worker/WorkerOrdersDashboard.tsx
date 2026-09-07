import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  Clock,
  CheckCircle2,
  ChefHat,
  ArrowRight,
  Flame,
  Volume2,
  VolumeX,
  RefreshCw,
  ArrowLeft,
  Filter,
  Check,
  PackageCheck,
  AlertTriangle,
  Play,
  Sparkles,
} from "lucide-react";
import { Order, OrderStatus } from "../../types";
import { supabase } from "../../lib/supabase";
import {
  fetchRestaurantOrders,
  updateOrderStatus,
  fetchSingleOrderWithDetails,
} from "../../lib/orderService";
import { playNewOrderAlertSound, flashTabTitle, stopFlashingTitle } from "../../lib/sound";
import { Button } from "../ui/Button";

interface WorkerOrdersDashboardProps {
  restaurantId: string;
  onNavigateHome?: () => void;
  onOpenCustomerMenu?: () => void;
}

export function WorkerOrdersDashboard({
  restaurantId,
  onNavigateHome,
  onOpenCustomerMenu,
}: WorkerOrdersDashboardProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | OrderStatus>("all");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [restaurantName, setRestaurantName] = useState<string>("Kitchen Orders");
  const [currency, setCurrency] = useState<string>("USD");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  // Load restaurant details & initial orders
  const loadOrders = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      // 1. Fetch restaurant info
      const { data: rest } = await supabase
        .from("restaurants")
        .select("name, currency")
        .eq("id", restaurantId)
        .maybeSingle();

      if (rest) {
        setRestaurantName(rest.name || "Kitchen Orders");
        setCurrency(rest.currency || "USD");
      }

      // 2. Fetch all orders with relations
      const fetchedOrders = await fetchRestaurantOrders(restaurantId);
      setOrders(fetchedOrders);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading worker orders:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();

    // 2. Subscribe to Supabase Realtime on orders table filtered to this restaurant_id
    const channel = supabase
      .channel(`worker-orders-${restaurantId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          const eventType = payload.eventType;
          const newRow = payload.new as any;
          const oldRow = payload.old as any;

          if (eventType === "INSERT") {
            // When a new row with status "pending" arrives:
            // 1. Fetch full details (joined table number + order items)
            const fullOrder = await fetchSingleOrderWithDetails(newRow.id);

            if (fullOrder) {
              setOrders((prev) => {
                // Prevent duplicate insertions
                if (prev.some((o) => o.id === fullOrder.id)) return prev;
                return [fullOrder, ...prev];
              });
            } else {
              // Fallback with payload row
              const simpleOrder: Order = {
                id: newRow.id,
                restaurant_id: newRow.restaurant_id,
                table_id: newRow.table_id,
                status: newRow.status,
                total: Number(newRow.total) || 0,
                daily_order_number: newRow.daily_order_number,
                created_at: newRow.created_at || new Date().toISOString(),
                table_number: 1,
                order_items: [],
              };
              setOrders((prev) => [simpleOrder, ...prev]);
            }

            // Play alert sound + flash tab title if status is pending
            if (newRow.status === "pending") {
              if (soundEnabledRef.current) {
                playNewOrderAlertSound();
              }
              const orderNum = newRow.daily_order_number || "NEW";
              flashTabTitle(`Order #${orderNum} Pending!`);
            }
          } else if (eventType === "UPDATE") {
            // Update order status/total in state
            setOrders((prev) =>
              prev.map((o) =>
                o.id === newRow.id
                  ? {
                      ...o,
                      status: newRow.status,
                      total: Number(newRow.total) || o.total,
                      daily_order_number: newRow.daily_order_number || o.daily_order_number,
                      updated_at: newRow.updated_at,
                    }
                  : o
              )
            );
          } else if (eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== oldRow.id));
          }
        }
      )
      .subscribe();

    // 3. Fail-safe periodic polling every 6 seconds in background
    const interval = setInterval(() => {
      loadOrders(true);
    }, 6000);

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
      stopFlashingTitle();
    };
  }, [restaurantId]);

  // Handle order status progression directly via Supabase update
  const handleStatusChange = async (orderId: string, nextStatus: OrderStatus) => {
    // Optimistic UI update
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );

    const res = await updateOrderStatus(orderId, nextStatus);
    if (!res.success) {
      alert("Could not update order status in database: " + res.error);
      loadOrders(true);
    }
  };

  // Test Simulation: Create a test pending order to verify sound, real-time prepend, and tab title flash!
  const handleSimulatePendingOrder = async () => {
    try {
      // Find a table for this restaurant
      const { data: table } = await supabase
        .from("restaurant_tables")
        .select("id, table_number")
        .eq("restaurant_id", restaurantId)
        .limit(1)
        .maybeSingle();

      // Find a product
      const { data: prod } = await supabase
        .from("products")
        .select("id, name, price")
        .eq("restaurant_id", restaurantId)
        .limit(1)
        .maybeSingle();

      const tableId = table?.id || "00000000-0000-0000-0000-000000000000";
      const prodId = prod?.id || "00000000-0000-0000-0000-000000000000";
      const prodName = prod?.name || "Artisan Coffee Batch";

      // 1. Insert order with status: "pending", total: 0
      const { data: newOrder, error: oErr } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurantId,
          table_id: tableId,
          status: "pending",
          total: 0,
        })
        .select()
        .single();

      if (oErr || !newOrder) {
        console.error("Simulation order insert error:", oErr);
        // If foreign key fails because test restaurant isn't in DB, simulate locally:
        const dummyOrder: Order = {
          id: "sim-" + Date.now(),
          restaurant_id: restaurantId,
          table_id: "tbl-sim",
          status: "pending",
          total: 12.5,
          daily_order_number: Math.floor(Math.random() * 90) + 10,
          created_at: new Date().toISOString(),
          table_number: Math.floor(Math.random() * 8) + 1,
          order_items: [
            { product_id: "p1", product_name_snapshot: "Iced Caramel Macchiato", quantity: 2 },
            { product_id: "p2", product_name_snapshot: "Butter Croissant", quantity: 1 },
          ],
        };
        setOrders((prev) => [dummyOrder, ...prev]);
        if (soundEnabled) playNewOrderAlertSound();
        flashTabTitle(`Order #${dummyOrder.daily_order_number} Pending!`);
        return;
      }

      // 2. Insert order items
      await supabase.from("order_items").insert({
        order_id: newOrder.id,
        product_id: prodId,
        product_name_snapshot: prodName,
        quantity: 2,
      });

      // Realtime subscription will receive and trigger sound automatically!
    } catch (err) {
      console.error("Simulation error:", err);
    }
  };

  const currencySymbol = currency === "EUR" ? "€" : "$";

  // Filter orders by active tab
  const filteredOrders = orders.filter((o) => {
    if (activeTab === "all") return true;
    return o.status === activeTab;
  });

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const preparingCount = orders.filter((o) => o.status === "preparing").length;
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const completedCount = orders.filter((o) => o.status === "completed").length;

  return (
    <div className="min-h-screen bg-[#050505] text-[#ECECEC] flex flex-col selection:bg-white/20 selection:text-white pb-16">
      {/* Top App Header */}
      <header className="sticky top-0 z-40 bg-[#090909]/95 backdrop-blur-md border-b border-white/10 px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {onNavigateHome && (
              <button
                type="button"
                onClick={onNavigateHome}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Return to Owner Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <ChefHat className="w-4 h-4 text-emerald-400 shrink-0" />
                <h1 className="text-sm sm:text-base font-bold text-white truncate">
                  {restaurantName} · Kitchen Orders
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Realtime Active
                </span>
              </div>
              <p className="text-[11px] text-white/40 font-mono truncate">
                Route: /dashboard/{restaurantId.slice(0, 8)}.../orders
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Sound Toggle */}
            <button
              type="button"
              onClick={() => {
                setSoundEnabled(!soundEnabled);
                if (!soundEnabled) playNewOrderAlertSound();
              }}
              className={`p-2 rounded-lg border text-xs flex items-center gap-1.5 cursor-pointer transition-colors ${
                soundEnabled
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-white/40"
              }`}
              title={soundEnabled ? "Audio alert chime active" : "Audio alert chime muted"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="hidden md:inline font-mono text-[11px]">
                {soundEnabled ? "Chime On" : "Muted"}
              </span>
            </button>

            {/* Simulate Incoming Order */}
            <button
              type="button"
              onClick={handleSimulatePendingOrder}
              className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Test Realtime Sound & Tab Title Flash"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate Order</span>
            </button>

            {/* Refresh Orders */}
            <button
              type="button"
              onClick={() => loadOrders(false)}
              disabled={isRefreshing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-colors cursor-pointer"
              title="Refresh database records"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-white" : ""}`} />
            </button>

            {/* Open Customer Menu Link */}
            {onOpenCustomerMenu && (
              <button
                type="button"
                onClick={onOpenCustomerMenu}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black font-semibold text-xs transition-colors cursor-pointer"
              >
                <span>Customer Menu</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Board Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 flex-1">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "all"
                ? "bg-white text-black font-semibold border-white"
                : "bg-white/5 text-white/60 border-white/10 hover:text-white"
            }`}
          >
            <span>All Orders</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/15">
              {orders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "pending"
                ? "bg-amber-500 text-black font-bold border-amber-500"
                : "bg-white/5 text-amber-400/80 border-white/10 hover:text-amber-400"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Pending</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20">
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("preparing")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "preparing"
                ? "bg-blue-500 text-white font-bold border-blue-500"
                : "bg-white/5 text-blue-400/80 border-white/10 hover:text-blue-400"
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Preparing</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20">
              {preparingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ready")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "ready"
                ? "bg-emerald-500 text-black font-bold border-emerald-500"
                : "bg-white/5 text-emerald-400/80 border-white/10 hover:text-emerald-400"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for Pickup</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-black/20">
              {readyCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("completed")}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 cursor-pointer border ${
              activeTab === "completed"
                ? "bg-white/30 text-white font-bold border-white/40"
                : "bg-white/5 text-white/50 border-white/10 hover:text-white"
            }`}
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Completed</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/10">
              {completedCount}
            </span>
          </button>
        </div>

        {/* Orders List / Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-white/50 space-y-3">
            <div className="w-10 h-10 rounded-full border-2 border-white/20 border-t-white animate-spin" />
            <p className="text-xs font-mono">Syncing Kitchen Orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-20 rounded-2xl border border-dashed border-white/10 p-8 space-y-3">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-white/30">
              <ChefHat className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-white">No active orders in this view</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto">
              New customer orders submitted from table QR codes will instantly ring here in real-time.
            </p>
            <button
              type="button"
              onClick={handleSimulatePendingOrder}
              className="mt-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Send a test simulation order
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredOrders.map((order) => {
              const tableNum =
                order.table_number ||
                order.restaurant_tables?.table_number ||
                1;

              // Format date
              const orderTime = new Date(order.created_at);
              const timeString = isNaN(orderTime.getTime())
                ? "Just now"
                : orderTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-xl ${
                    order.status === "pending"
                      ? "bg-[#110F0A] border-amber-500/40 shadow-amber-500/5 ring-1 ring-amber-500/20"
                      : order.status === "preparing"
                      ? "bg-[#0A0E14] border-blue-500/30"
                      : order.status === "ready"
                      ? "bg-[#0A120D] border-emerald-500/30"
                      : "bg-[#0C0C0C] border-white/10 opacity-70"
                  }`}
                >
                  {/* Card Header: Table, Daily Order #, Timestamp */}
                  <div className="p-4 sm:p-5 border-b border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      {/* Daily Order Number Pill */}
                      <div className="flex items-center gap-2">
                        <span className="text-xl sm:text-2xl font-serif italic font-bold text-white tracking-tight">
                          #{order.daily_order_number || "—"}
                        </span>
                        <div className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-xs font-mono font-bold text-white">
                          Table {tableNum.toString().padStart(2, "0")}
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border ${
                          order.status === "pending"
                            ? "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse"
                            : order.status === "preparing"
                            ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                            : order.status === "ready"
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-white/10 text-white/60 border-white/15"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-white/50 font-mono">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                        {timeString}
                      </span>
                      <span className="text-white font-bold text-sm">
                        {currencySymbol}
                        {order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Card Body: Order Items List */}
                  <div className="p-4 sm:p-5 flex-1 space-y-2.5">
                    <p className="text-[10px] uppercase font-mono tracking-wider text-white/40">
                      Ordered Items ({order.order_items?.length || 0})
                    </p>

                    {order.order_items && order.order_items.length > 0 ? (
                      <div className="space-y-2">
                        {order.order_items.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-start justify-between text-xs sm:text-sm font-medium"
                          >
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center font-mono text-xs font-bold text-white shrink-0">
                                {item.quantity}x
                              </span>
                              <span className="text-white">
                                {item.product_name_snapshot}
                              </span>
                            </div>
                            {item.price_snapshot != null && (
                              <span className="font-mono text-xs text-white/50">
                                {currencySymbol}
                                {(item.price_snapshot * item.quantity).toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-white/40 italic">
                        No item breakdown available.
                      </p>
                    )}
                  </div>

                  {/* Card Footer: Step Progression Buttons (Accept → Preparing → Ready → Completed) */}
                  <div className="p-4 bg-black/40 border-t border-white/10 space-y-2">
                    <p className="text-[9px] uppercase font-mono tracking-wider text-white/40">
                      Status Progression
                    </p>
                    <div className="grid grid-cols-4 gap-1.5">
                      {/* 1. Accept */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "accepted")}
                        className={`py-2 px-1 text-[11px] font-mono rounded-lg transition-all text-center cursor-pointer border ${
                          order.status === "accepted"
                            ? "bg-white text-black font-bold border-white"
                            : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Accept
                      </button>

                      {/* 2. Preparing */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "preparing")}
                        className={`py-2 px-1 text-[11px] font-mono rounded-lg transition-all text-center cursor-pointer border ${
                          order.status === "preparing"
                            ? "bg-blue-500 text-white font-bold border-blue-400"
                            : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Preparing
                      </button>

                      {/* 3. Ready */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "ready")}
                        className={`py-2 px-1 text-[11px] font-mono rounded-lg transition-all text-center cursor-pointer border ${
                          order.status === "ready"
                            ? "bg-emerald-500 text-black font-bold border-emerald-400"
                            : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Ready
                      </button>

                      {/* 4. Completed */}
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "completed")}
                        className={`py-2 px-1 text-[11px] font-mono rounded-lg transition-all text-center cursor-pointer border ${
                          order.status === "completed"
                            ? "bg-white/40 text-white font-bold border-white/50"
                            : "bg-white/5 text-white/60 border-white/10 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        Done
                      </button>
                    </div>

                    {/* Quick Next Stage Action Button */}
                    {order.status === "pending" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "preparing")}
                        className="w-full mt-2 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Accept & Start Preparing</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {order.status === "preparing" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "ready")}
                        className="w-full mt-2 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Mark Dishes Ready for Table {tableNum}</span>
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {order.status === "ready" && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(order.id, "completed")}
                        className="w-full mt-2 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-xs font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Deliver & Mark Completed</span>
                        <PackageCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
