import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import { User } from "@supabase/supabase-js";
import { OnboardingStep, RestaurantProfile, RestaurantTable } from "./types";
import { INITIAL_RESTAURANT_DATA } from "./lib/constants";
import { syncTables } from "./lib/tableManager";
import { 
  getCurrentUser, 
  onAuthStateChange, 
  signOut, 
  publishToSupabase, 
  PublishResult,
  supabase
} from "./lib/supabase";
import { Navbar } from "./components/layout/Navbar";
import { Stepper } from "./components/layout/Stepper";
import { StepIdentity } from "./components/steps/StepIdentity";
import { StepBranding } from "./components/steps/StepBranding";
import { StepCategories } from "./components/steps/StepCategories";
import { StepProducts } from "./components/steps/StepProducts";
import { StepPreview } from "./components/steps/StepPreview";
import { StepTables } from "./components/steps/StepTables";
import { PhoneSimulator } from "./components/preview/PhoneSimulator";
import { OwnerAuthModal } from "./components/auth/OwnerAuthModal";
import { PublishModal } from "./components/publish/PublishModal";
import { CustomerMenuPage } from "./components/customer/CustomerMenuPage";
import { WorkerOrdersDashboard } from "./components/worker/WorkerOrdersDashboard";

export type AppRoute =
  | { type: "onboarding" }
  | { type: "customer_menu"; slug: string; qrToken: string }
  | { type: "worker_dashboard"; restaurantId: string };

function parseCurrentRoute(): AppRoute {
  if (typeof window === "undefined") {
    return { type: "onboarding" };
  }

  // 1. Pathname check: /menu/:slug/:qr_token
  const path = window.location.pathname;
  const menuMatch = path.match(/^\/menu\/([^/]+)\/([^/]+)\/?$/);
  if (menuMatch) {
    return {
      type: "customer_menu",
      slug: decodeURIComponent(menuMatch[1]),
      qrToken: decodeURIComponent(menuMatch[2]),
    };
  }

  // Pathname check: /dashboard/:restaurant_id/orders
  const dashboardMatch = path.match(/^\/dashboard\/([^/]+)\/orders\/?$/);
  if (dashboardMatch) {
    return {
      type: "worker_dashboard",
      restaurantId: decodeURIComponent(dashboardMatch[1]),
    };
  }

  // 2. Hash routing check fallback: #/menu/:slug/:qr_token or #/dashboard/:restaurant_id/orders
  const hash = window.location.hash.replace(/^#/, "");
  const hashMenuMatch = hash.match(/^\/?menu\/([^/]+)\/([^/]+)\/?$/);
  if (hashMenuMatch) {
    return {
      type: "customer_menu",
      slug: decodeURIComponent(hashMenuMatch[1]),
      qrToken: decodeURIComponent(hashMenuMatch[2]),
    };
  }
  const hashDashboardMatch = hash.match(/^\/?dashboard\/([^/]+)\/orders\/?$/);
  if (hashDashboardMatch) {
    return {
      type: "worker_dashboard",
      restaurantId: decodeURIComponent(hashDashboardMatch[1]),
    };
  }

  // 3. Query params check fallback: ?route=menu&slug=...&token=...
  const params = new URLSearchParams(window.location.search);
  if (params.get("route") === "menu" && params.get("slug") && (params.get("token") || params.get("qr_token"))) {
    return {
      type: "customer_menu",
      slug: params.get("slug")!,
      qrToken: params.get("token") || params.get("qr_token")!,
    };
  }
  if (params.get("route") === "dashboard" && params.get("restaurant_id")) {
    return {
      type: "worker_dashboard",
      restaurantId: params.get("restaurant_id")!,
    };
  }

  return { type: "onboarding" };
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(() => parseCurrentRoute());
  const [profile, setProfile] = useState<RestaurantProfile>(INITIAL_RESTAURANT_DATA);
  const [tables, setTables] = useState<RestaurantTable[]>(() =>
    syncTables(INITIAL_RESTAURANT_DATA.tableCount || 12, INITIAL_RESTAURANT_DATA.slug, INITIAL_RESTAURANT_DATA.tables || [])
  );
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [showLiveSidePreview, setShowLiveSidePreview] = useState(false);

  // Supabase Auth & Cloud State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishStepNum, setPublishStepNum] = useState(1);
  const [publishStatusText, setPublishStatusText] = useState("");
  const [publishResult, setPublishResult] = useState<PublishResult | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [syncedRestaurantId, setSyncedRestaurantId] = useState<string | null>(null);

  // Sync route on popstate (browser Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseCurrentRoute());
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Listen to Supabase Auth state & look up user's restaurant if published
  useEffect(() => {
    getCurrentUser().then(async (user) => {
      setCurrentUser(user);
      if (user?.id) {
        const { data: existingRest } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (existingRest?.id) {
          setSyncedRestaurantId(existingRest.id);
        }
      }
    });

    const { data: { subscription } } = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user?.id) {
        const { data: existingRest } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (existingRest?.id) {
          setSyncedRestaurantId(existingRest.id);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Navigation handlers
  const navigateToCustomerMenu = (slug: string, qrToken: string) => {
    const newPath = `/menu/${encodeURIComponent(slug)}/${encodeURIComponent(qrToken)}`;
    window.history.pushState({}, "", newPath);
    setRoute({ type: "customer_menu", slug, qrToken });
    window.scrollTo(0, 0);
  };

  const navigateToWorkerDashboard = (restaurantId: string) => {
    const newPath = `/dashboard/${encodeURIComponent(restaurantId)}/orders`;
    window.history.pushState({}, "", newPath);
    setRoute({ type: "worker_dashboard", restaurantId });
    window.scrollTo(0, 0);
  };

  const navigateToHome = () => {
    window.history.pushState({}, "", "/");
    setRoute({ type: "onboarding" });
    window.scrollTo(0, 0);
  };

  const handleUpdateProfile = (partial: Partial<RestaurantProfile>) => {
    setProfile((prev) => {
      const updated = {
        ...prev,
        ...partial,
        branding: {
          ...prev.branding,
          ...(partial.branding || {}),
        },
      };

      // If slug or tableCount changed, keep tables synced
      if (partial.slug && partial.slug !== prev.slug) {
        setTables((prevTables) => syncTables(updated.tableCount || 12, partial.slug!, prevTables));
      } else if (partial.tableCount && partial.tableCount !== prev.tableCount) {
        setTables((prevTables) => syncTables(partial.tableCount!, updated.slug, prevTables));
      }

      return updated;
    });
  };

  const handleUpdateTables = (newTables: RestaurantTable[]) => {
    setTables(newTables);
    setProfile((prev) => ({
      ...prev,
      tables: newTables,
      tableCount: newTables.length,
    }));
  };

  const handleResetToDemo = () => {
    setProfile(INITIAL_RESTAURANT_DATA);
    setTables(syncTables(INITIAL_RESTAURANT_DATA.tableCount || 12, INITIAL_RESTAURANT_DATA.slug, []));
    setCurrentStep(1);
  };

  const nextStep = () => {
    if (currentStep < 6) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePublish = async () => {
    // If not authenticated, open owner login modal first
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsPublishing(true);
    setIsPublishModalOpen(true);
    setPublishResult(null);
    setPublishStepNum(1);
    setPublishStatusText("Verifying owner session...");

    try {
      const result = await publishToSupabase(profile, tables, currentUser, (status, step) => {
        setPublishStatusText(status);
        setPublishStepNum(step);
      });
      setPublishResult(result);
      if (result.success) {
        if (result.restaurantId) {
          setSyncedRestaurantId(result.restaurantId);
        }
        confetti({
          particleCount: 110,
          spread: 80,
          origin: { y: 0.6 },
          colors: [profile.branding.primaryColor || "#D97706", "#10B981", "#FFFFFF"],
        });
      }
    } catch (err: any) {
      setPublishResult({
        success: false,
        error: err.message || "Failed to commit database transaction",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAuthSuccess = (user: User) => {
    setCurrentUser(user);
    if (currentStep === 5 || currentStep === 6) {
      setTimeout(() => {
        handlePublish();
      }, 300);
    }
  };

  // Determine current active restaurant ID for worker dashboard navigation
  const activeRestaurantId =
    syncedRestaurantId ||
    publishResult?.restaurantId ||
    "11111111-1111-1111-1111-111111111111";

  // First table token for customer menu shortcut
  const firstTableToken = tables[0]?.qr_token || "DEMOTOKEN";

  // ==========================================
  // VIEW ROUTE 1: Customer-Facing Menu Page (/menu/{slug}/{qr_token})
  // ==========================================
  if (route.type === "customer_menu") {
    return (
      <CustomerMenuPage
        slug={route.slug}
        qrToken={route.qrToken}
        onNavigateHome={navigateToHome}
        onNavigateToWorkerDashboard={navigateToWorkerDashboard}
        demoProfileFallback={profile}
      />
    );
  }

  // ==========================================
  // VIEW ROUTE 2: Worker Orders Dashboard (/dashboard/{restaurant_id}/orders)
  // ==========================================
  if (route.type === "worker_dashboard") {
    return (
      <WorkerOrdersDashboard
        restaurantId={route.restaurantId}
        onNavigateHome={navigateToHome}
        onOpenCustomerMenu={() => navigateToCustomerMenu(profile.slug, firstTableToken)}
      />
    );
  }

  // ==========================================
  // VIEW ROUTE 3: Owner Onboarding & Management Dashboard
  // ==========================================
  return (
    <div className="min-h-screen bg-[#050505] text-[#E5E5E5] flex flex-col selection:bg-white/20 selection:text-white">
      {/* Top Navigation Bar */}
      <Navbar
        profile={profile}
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        showLiveMobilePreview={showLiveSidePreview}
        onToggleMobilePreview={() => setShowLiveSidePreview(!showLiveSidePreview)}
        onResetToDemo={handleResetToDemo}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={async () => {
          await signOut();
          setCurrentUser(null);
        }}
        onPublish={handlePublish}
        isPublishing={isPublishing}
        onOpenCustomerMenu={() => navigateToCustomerMenu(profile.slug, firstTableToken)}
        onOpenWorkerDashboard={() => navigateToWorkerDashboard(activeRestaurantId)}
      />

      {/* 6-Step Process Stepper */}
      <Stepper
        currentStep={currentStep}
        onSelectStep={setCurrentStep}
        primaryColor={profile.branding.primaryColor}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Step 5: Live Customer Preview */}
        {currentStep === 5 && (
          <StepPreview
            profile={profile}
            onBack={prevStep}
            onJumpToStep={(step) => setCurrentStep(step as OnboardingStep)}
            onGoToTables={() => setCurrentStep(6)}
            onPublish={handlePublish}
            isPublishing={isPublishing}
          />
        )}

        {/* Step 6: Dining Tables & QR Management */}
        {currentStep === 6 && (
          <StepTables
            profile={profile}
            tables={tables}
            onUpdateProfile={handleUpdateProfile}
            onUpdateTables={handleUpdateTables}
            onBack={prevStep}
            onPublish={handlePublish}
            isPublishing={isPublishing}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onJumpToStep={(step) => setCurrentStep(step as OnboardingStep)}
            onOpenCustomerMenu={(slug, token) => navigateToCustomerMenu(slug, token)}
            onOpenWorkerDashboard={() => navigateToWorkerDashboard(activeRestaurantId)}
          />
        )}

        {/* Steps 1-4 with optional side-by-side phone preview */}
        {currentStep <= 4 && (
          <div
            className={`grid grid-cols-1 ${
              showLiveSidePreview ? "lg:grid-cols-12 gap-8 items-start" : ""
            }`}
          >
            {/* Step Form Column */}
            <div className={showLiveSidePreview ? "lg:col-span-7" : "w-full"}>
              {currentStep === 1 && (
                <StepIdentity
                  profile={profile}
                  onUpdate={handleUpdateProfile}
                  onContinue={nextStep}
                />
              )}

              {currentStep === 2 && (
                <StepBranding
                  profile={profile}
                  onUpdate={handleUpdateProfile}
                  onContinue={nextStep}
                  onBack={prevStep}
                />
              )}

              {currentStep === 3 && (
                <StepCategories
                  profile={profile}
                  onUpdate={handleUpdateProfile}
                  onContinue={nextStep}
                  onBack={prevStep}
                />
              )}

              {currentStep === 4 && (
                <StepProducts
                  profile={profile}
                  onUpdate={handleUpdateProfile}
                  onContinue={nextStep}
                  onBack={prevStep}
                />
              )}
            </div>

            {/* Optional Side-by-side Live Preview on Steps 1-4 */}
            {showLiveSidePreview && (
              <aside className="hidden lg:flex lg:col-span-5 flex-col items-center sticky top-24 animate-in fade-in slide-in-from-right-3 duration-300">
                <div className="w-full flex items-center justify-between pb-3 px-2 text-xs">
                  <div className="inline-flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">Syncing Live</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    className="text-[11px] uppercase tracking-wider text-white/60 hover:text-white cursor-pointer font-medium transition-colors"
                  >
                    Open Step 5 →
                  </button>
                </div>
                <PhoneSimulator profile={profile} />
              </aside>
            )}
          </div>
        )}
      </main>

      {/* Supabase Owner Auth Modal */}
      <OwnerAuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onUserChanged={(user) => {
          setCurrentUser(user);
          if (user) {
            handleAuthSuccess(user);
          }
        }}
        primaryColor={profile.branding.primaryColor}
      />

      {/* Supabase Publish Progress & Confirmation Modal */}
      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        statusText={publishStatusText}
        stepNum={publishStepNum}
        result={publishResult}
        restaurantSlug={profile.slug}
        restaurantName={profile.name}
        onViewTables={() => {
          setIsPublishModalOpen(false);
          setCurrentStep(6);
        }}
        onOpenCustomerMenu={() => {
          setIsPublishModalOpen(false);
          navigateToCustomerMenu(profile.slug, firstTableToken);
        }}
        onOpenWorkerDashboard={(restId) => {
          setIsPublishModalOpen(false);
          navigateToWorkerDashboard(restId);
        }}
      />
    </div>
  );
}

