import React, { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  UserPlus,
  QrCode,
  Clock,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChefHat,
  Receipt,
  Shield,
  Sparkles,
  Download,
} from "lucide-react";
import { User } from "@supabase/supabase-js";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { WorkerInvite, WorkerRole, RestaurantProfile } from "../../types";
import {
  createWorkerInvite,
  fetchWorkerInvites,
  revokeWorkerInvite,
  getInviteStatus,
} from "../../lib/workerService";
import { supabase, generateUUID } from "../../lib/supabase";

interface InviteWorkerModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string | null;
  profile: RestaurantProfile;
  currentUser: User | null;
  onOpenAuthModal?: () => void;
  onNavigateToJoin?: (inviteToken: string) => void;
}

export function InviteWorkerModal({
  isOpen,
  onClose,
  restaurantId: initialRestaurantId,
  profile,
  currentUser,
  onOpenAuthModal,
  onNavigateToJoin,
}: InviteWorkerModalProps) {
  const [selectedRole, setSelectedRole] = useState<WorkerRole>("kitchen");
  const [invites, setInvites] = useState<WorkerInvite[]>([]);
  const [activeInvite, setActiveInvite] = useState<WorkerInvite | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvites, setLoadingInvites] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [resolvedRestaurantId, setResolvedRestaurantId] = useState<string | null>(initialRestaurantId);

  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Sync resolvedRestaurantId when prop changes
  useEffect(() => {
    if (initialRestaurantId) {
      setResolvedRestaurantId(initialRestaurantId);
    }
  }, [initialRestaurantId]);

  // Load existing invites whenever modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    async function init() {
      setErrorMsg(null);
      let targetRestId = resolvedRestaurantId;

      // If we don't have a restaurantId yet, attempt to find or create one for the logged in owner
      if (!targetRestId && currentUser?.id) {
        try {
          const { data: existingRest } = await supabase
            .from("restaurants")
            .select("id")
            .eq("owner_id", currentUser.id)
            .maybeSingle();

          if (existingRest?.id) {
            targetRestId = existingRest.id;
            setResolvedRestaurantId(targetRestId);
          } else {
            // Auto-create a base restaurant entry for this owner so invites can link to a valid FK
            const newId = generateUUID();
            const { data: createdRest, error: createErr } = await supabase
              .from("restaurants")
              .insert({
                id: newId,
                owner_id: currentUser.id,
                name: profile.name || "My Restaurant",
                slug: profile.slug || "restaurant-" + Date.now(),
                business_type: profile.businessType || "casual_dining",
                currency: profile.currency || "USD",
                primary_color: profile.branding?.primaryColor || "#D97706",
              })
              .select("id")
              .single();

            if (createdRest?.id) {
              targetRestId = createdRest.id;
              setResolvedRestaurantId(targetRestId);
            } else if (createErr) {
              console.warn("Could not auto-create restaurant for invites:", createErr);
            }
          }
        } catch (err) {
          console.warn("Error resolving restaurant:", err);
        }
      }

      if (targetRestId && isMounted) {
        loadInvites(targetRestId);
      }
    }

    init();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentUser, resolvedRestaurantId, profile]);

  const loadInvites = async (rId: string) => {
    setLoadingInvites(true);
    try {
      const data = await fetchWorkerInvites(rId);
      setInvites(data);
    } catch (err) {
      console.error("Error loading invites:", err);
    } finally {
      setLoadingInvites(false);
    }
  };

  const handleGenerateInvite = async () => {
    setErrorMsg(null);

    // If not logged in, prompt to log in
    if (!currentUser) {
      if (onOpenAuthModal) {
        onOpenAuthModal();
      } else {
        setErrorMsg("Please authenticate as the restaurant owner first.");
      }
      return;
    }

    let targetRestId = resolvedRestaurantId;
    if (!targetRestId) {
      // Ensure restaurant row exists
      try {
        const { data: existingRest } = await supabase
          .from("restaurants")
          .select("id")
          .eq("owner_id", currentUser.id)
          .maybeSingle();

        if (existingRest?.id) {
          targetRestId = existingRest.id;
          setResolvedRestaurantId(targetRestId);
        } else {
          const newId = generateUUID();
          const { data: createdRest } = await supabase
            .from("restaurants")
            .insert({
              id: newId,
              owner_id: currentUser.id,
              name: profile.name || "My Restaurant",
              slug: profile.slug || "restaurant-" + Date.now(),
              business_type: profile.businessType || "casual_dining",
              currency: profile.currency || "USD",
              primary_color: profile.branding?.primaryColor || "#D97706",
            })
            .select("id")
            .single();

          if (createdRest?.id) {
            targetRestId = createdRest.id;
            setResolvedRestaurantId(targetRestId);
          }
        }
      } catch (err) {
        console.error("Error resolving restaurant ID:", err);
      }
    }

    if (!targetRestId) {
      setErrorMsg("Could not verify your restaurant. Please publish your restaurant first.");
      return;
    }

    setLoading(true);
    try {
      const { invite, error } = await createWorkerInvite(targetRestId, selectedRole);
      if (error || !invite) {
        setErrorMsg(error || "Failed to generate invite. Please try again.");
      } else {
        setActiveInvite(invite);
        // Prepend to invites list
        setInvites((prev) => [invite, ...prev]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    setRevokingId(inviteId);
    try {
      const { success, error } = await revokeWorkerInvite(inviteId);
      if (success) {
        setInvites((prev) => prev.filter((i) => i.id !== inviteId));
        if (activeInvite?.id === inviteId) {
          setActiveInvite(null);
        }
      } else {
        setErrorMsg(error || "Failed to revoke invite");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to revoke invite");
    } finally {
      setRevokingId(null);
    }
  };

  const copyInviteLink = (inviteToken: string) => {
    const url = `https://app.menuos.app/join/${inviteToken}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(inviteToken);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const downloadQrCode = (inviteToken: string, role: string) => {
    const svgElement = qrContainerRef.current?.querySelector("svg");
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    canvas.width = 600;
    canvas.height = 600;

    img.onload = () => {
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 40, 40, 520, 520);
        const pngUrl = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `MenuOS-Staff-Invite-${role}-${inviteToken}.png`;
        downloadLink.href = pngUrl;
        downloadLink.click();
      }
    };

    img.src = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;
  };

  const formatRemainingTime = (expiresAt: string) => {
    const diffMs = new Date(expiresAt).getTime() - Date.now();
    if (diffMs <= 0) return "Expired";
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m left`;
  };

  const getRoleIcon = (role: WorkerRole) => {
    switch (role) {
      case "kitchen":
        return <ChefHat className="w-4 h-4 text-emerald-400" />;
      case "cashier":
        return <Receipt className="w-4 h-4 text-amber-400" />;
      case "manager":
        return <Shield className="w-4 h-4 text-purple-400" />;
    }
  };

  const roleLabels: Record<WorkerRole, { label: string; desc: string }> = {
    kitchen: {
      label: "Kitchen Staff",
      desc: "Live order board, ticket prep & status advancement",
    },
    cashier: {
      label: "Cashier",
      desc: "Order settlement, table billing & payment handling",
    },
    manager: {
      label: "Store Manager",
      desc: "Full kitchen, orders, operations & floor supervision",
    },
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Staff Member"
      description="Create single-use 24-hour QR passes for kitchen, cashiers, and managers to access live orders."
      maxWidth="lg"
    >
      <div className="space-y-6">
        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMsg}</div>
          </div>
        )}

        {/* Top Generator Section */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-emerald-400" />
                <span>Generate Worker Invite Pass</span>
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Each token is valid for 24 hours and can be scanned from mobile or desktop.
              </p>
            </div>

            {/* Role Picker Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="worker-role-select" className="text-xs text-neutral-400 whitespace-nowrap">
                Role:
              </label>
              <select
                id="worker-role-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as WorkerRole)}
                className="bg-[#141414] border border-white/15 text-white text-xs rounded-xl px-3 py-2 font-medium focus:outline-hidden focus:border-white/40 cursor-pointer"
              >
                <option value="kitchen">Kitchen Staff</option>
                <option value="cashier">Cashier</option>
                <option value="manager">Store Manager</option>
              </select>
            </div>
          </div>

          {/* Role details pill */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center gap-2.5 text-xs text-neutral-300">
            {getRoleIcon(selectedRole)}
            <div>
              <span className="font-medium text-white">{roleLabels[selectedRole].label}:</span>{" "}
              <span className="text-neutral-400">{roleLabels[selectedRole].desc}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <div className="text-xs text-neutral-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Token expires exactly 24 hours after generation</span>
            </div>

            <Button
              type="button"
              onClick={handleGenerateInvite}
              disabled={loading}
              className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Invite...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Invite Pass</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Active Generated Invite Card */}
        {activeInvite && (
          <div className="p-5 rounded-2xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-emerald-500/40 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-white tracking-wide uppercase">
                  Active Staff Pass Generated
                </span>
              </div>
              <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase font-medium">
                {activeInvite.role}
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* QR Code Graphic */}
              <div
                ref={qrContainerRef}
                className="bg-white p-3.5 rounded-2xl shadow-xl shrink-0 flex flex-col items-center justify-center border-4 border-white"
              >
                <QRCodeSVG
                  value={`https://app.menuos.app/join/${activeInvite.invite_token}`}
                  size={150}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Details & Actions */}
              <div className="flex-1 space-y-3 w-full text-center md:text-left">
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-neutral-400 font-mono">
                    Staff Invite URL
                  </div>
                  <div className="text-sm font-mono text-emerald-400 font-semibold break-all mt-0.5">
                    https://app.menuos.app/join/{activeInvite.invite_token}
                  </div>
                </div>

                <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-neutral-300">
                  <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Expires in 24 hours</span>
                  </div>
                  <div className="text-neutral-500">•</div>
                  <div className="text-neutral-400">
                    Valid until: {new Date(activeInvite.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} tomorrow
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => copyInviteLink(activeInvite.invite_token)}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
                  >
                    {copiedToken === activeInvite.invite_token ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied Link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadQrCode(activeInvite.invite_token, activeInvite.role)}
                    className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-white font-medium text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Save QR Image</span>
                  </button>

                  {onNavigateToJoin && (
                    <button
                      type="button"
                      onClick={() => onNavigateToJoin(activeInvite.invite_token)}
                      className="py-2 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-300 hover:text-black font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer border border-emerald-500/30"
                      title="Test redemption in this applet"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Test / Open Invite Page</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Existing Invites History List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <QrCode className="w-3.5 h-3.5" />
              <span>Existing Staff Passes ({invites.length})</span>
            </h4>

            {resolvedRestaurantId && (
              <button
                type="button"
                onClick={() => loadInvites(resolvedRestaurantId)}
                disabled={loadingInvites}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3 h-3 ${loadingInvites ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>

          {loadingInvites && invites.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-500">
              <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-neutral-400" />
              <span>Loading existing invites...</span>
            </div>
          ) : invites.length === 0 ? (
            <div className="py-8 px-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-neutral-500">
              No staff invites created yet. Select a role above and generate your first pass.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1 divide-y divide-white/5">
              {invites.map((inv) => {
                const status = getInviteStatus(inv);
                const isPending = status === "Pending";
                const isUsed = status === "Used";
                const isExpired = status === "Expired";

                return (
                  <div
                    key={inv.id}
                    className="pt-2 pb-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-white font-semibold">
                          {inv.invite_token}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-neutral-300 font-medium capitalize text-[11px]">
                          {inv.role}
                        </span>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                            <span>Pending</span>
                            <span className="text-amber-400/80 font-normal">
                              ({formatRemainingTime(inv.expires_at)})
                            </span>
                          </span>
                        )}
                        {isUsed && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>
                              Used
                              {inv.used_by_name || inv.used_by_email
                                ? ` by ${inv.used_by_name || inv.used_by_email}`
                                : inv.used_by
                                ? ` (ID: ${inv.used_by.slice(0, 8)}...)`
                                : ""}
                            </span>
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-white/10 text-[10px]">
                            Expired
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-neutral-500">
                        Created {new Date(inv.created_at).toLocaleDateString()} at{" "}
                        {new Date(inv.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        {isUsed && inv.used_by_email && (
                          <span className="ml-2 text-neutral-400">
                            • Claimed by {inv.used_by_email}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isPending && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyInviteLink(inv.invite_token)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition-colors cursor-pointer"
                            title="Copy link"
                          >
                            {copiedToken === inv.invite_token ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {onNavigateToJoin && (
                            <button
                              type="button"
                              onClick={() => onNavigateToJoin(inv.invite_token)}
                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                              title="Test invite"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleRevoke(inv.id)}
                            disabled={revokingId === inv.id}
                            className="py-1 px-2.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-xs transition-colors flex items-center gap-1 cursor-pointer"
                            title="Revoke and delete unused invite"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>{revokingId === inv.id ? "Revoking..." : "Revoke"}</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
