import React, { useState } from "react";
import {
  FolderTree,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeft,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { Category, RestaurantProfile } from "../../types";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { Badge } from "../ui/Badge";

interface StepCategoriesProps {
  profile: RestaurantProfile;
  onUpdate: (data: Partial<RestaurantProfile>) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StepCategories({ profile, onUpdate, onContinue, onBack }: StepCategoriesProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formError, setFormError] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDesc("");
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormDesc(cat.description || "");
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError("Category title is required.");
      return;
    }

    if (editingCategory) {
      // Edit
      const updated = profile.categories.map((c) =>
        c.id === editingCategory.id
          ? { ...c, name: formName.trim(), description: formDesc.trim() }
          : c
      );
      onUpdate({ categories: updated });
    } else {
      // Create new
      const newCat: Category = {
        id: `cat-${Date.now()}`,
        name: formName.trim(),
        description: formDesc.trim(),
        sortOrder: profile.categories.length + 1,
      };
      onUpdate({ categories: [...profile.categories, newCat] });
    }

    setIsModalOpen(false);
  };

  const handleDeleteCategory = (categoryId: string) => {
    // Filter out category
    const remainingCats = profile.categories.filter((c) => c.id !== categoryId);
    
    // Check if products belong to it
    const remainingProducts = profile.products.map((p) => {
      if (p.categoryId === categoryId) {
        // assign to first remaining category or keep unassigned
        return {
          ...p,
          categoryId: remainingCats[0]?.id || "uncategorized",
        };
      }
      return p;
    });

    onUpdate({
      categories: remainingCats,
      products: remainingProducts,
    });
    setDeleteConfirmId(null);
  };

  const moveCategory = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= profile.categories.length) return;

    const list = [...profile.categories];
    const item = list[index];
    list.splice(index, 1);
    list.splice(targetIndex, 0, item);

    // Update sortOrder
    const reordered = list.map((c, idx) => ({ ...c, sortOrder: idx + 1 }));
    onUpdate({ categories: reordered });
  };

  const loadPresetCategories = (type: "cafe" | "bistro") => {
    if (type === "cafe") {
      const cafeCats: Category[] = [
        { id: `cat-${Date.now()}-1`, name: "Espresso & Pourovers", description: "Freshly roasted single origins", sortOrder: 1 },
        { id: `cat-${Date.now()}-2`, name: "Cold Brews & Tonics", description: "Slow steeped signature drinks", sortOrder: 2 },
        { id: `cat-${Date.now()}-3`, name: "Pastries & Croissants", description: "Oven fresh morning bakes", sortOrder: 3 },
        { id: `cat-${Date.now()}-4`, name: "Artisan Sandwiches", description: "Toasted sourdough & panini", sortOrder: 4 },
      ];
      onUpdate({ categories: cafeCats });
    } else {
      const bistroCats: Category[] = [
        { id: `cat-${Date.now()}-1`, name: "Small Plates & Starters", description: "Appetizers and shareables", sortOrder: 1 },
        { id: `cat-${Date.now()}-2`, name: "Main Courses", description: "Chef selections & seasonal mains", sortOrder: 2 },
        { id: `cat-${Date.now()}-3`, name: "Sides & Greens", description: "Fresh farm salads and roasted greens", sortOrder: 3 },
        { id: `cat-${Date.now()}-4`, name: "Signature Cocktails & Wine", description: "Handcrafted libations & cellar picks", sortOrder: 4 },
      ];
      onUpdate({ categories: bistroCats });
    }
  };

  return (
    <div className="max-w-2xl mx-auto text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-medium">
              Step 03 · Categories
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">
              Organize your menu
            </h2>
            <p className="text-white/40 max-w-lg text-sm sm:text-base leading-relaxed">
              Create and manage sections like Starters, Mains, Pastries, or Cocktails.
            </p>
          </div>
          <Button
            type="button"
            onClick={openCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shrink-0"
          >
            Add Category
          </Button>
        </div>
      </div>

      {/* Category List */}
      <div className="space-y-4">
        {profile.categories.length === 0 ? (
          <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-8 text-center">
            <FolderTree className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <h3 className="text-lg font-serif italic text-white">No categories yet</h3>
            <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-5">
              Categories organize your dishes so guests can easily browse your digital menu.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Button type="button" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
                Create Custom Category
              </Button>
              <button
                type="button"
                onClick={() => loadPresetCategories("cafe")}
                className="text-xs text-white/60 hover:text-white px-3.5 py-2 rounded-full bg-[#111111] border border-white/10 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Coffee Bar Presets
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-3 sm:p-4 divide-y divide-white/5">
            {profile.categories.map((cat, index) => {
              const productCount = profile.products.filter((p) => p.categoryId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className="py-3 px-3 flex items-center justify-between gap-3 group transition-colors hover:bg-white/[0.02] rounded-lg"
                >
                  {/* Reorder and Title */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Move up/down buttons */}
                    <div className="flex flex-col gap-0.5 text-white/30 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => moveCategory(index, "up")}
                        className="hover:text-white disabled:opacity-20 p-0.5 transition-colors cursor-pointer"
                        title="Move category up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === profile.categories.length - 1}
                        onClick={() => moveCategory(index, "down")}
                        className="hover:text-white disabled:opacity-20 p-0.5 transition-colors cursor-pointer"
                        title="Move category down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Category Details */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white truncate">{cat.name}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10">
                          {productCount} {productCount === 1 ? "item" : "items"}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-xs text-white/40 truncate mt-0.5">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(cat)}
                      className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                      title="Edit Category"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(cat.id)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                      title="Delete Category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Quick presets helper */}
        <div className="flex items-center justify-between px-2 pt-1 text-xs text-white/40">
          <span>Need preset ideas?</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => loadPresetCategories("cafe")}
              className="text-[11px] uppercase tracking-wider text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              + Coffee Bar Presets
            </button>
            <span className="text-white/20">·</span>
            <button
              type="button"
              onClick={() => loadPresetCategories("bistro")}
              className="text-[11px] uppercase tracking-wider text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              + Bistro Presets
            </button>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="pt-6 flex items-center justify-between border-t border-white/5">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          <Button
            type="button"
            size="lg"
            onClick={onContinue}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="min-w-[200px]"
            disabled={profile.categories.length === 0}
          >
            Continue to Products
          </Button>
        </div>
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? "Edit Category" : "New Menu Category"}
        description="Categories organize your items on the customer QR view."
      >
        <form onSubmit={handleSaveCategory} className="space-y-4">
          <Input
            label="Category Name *"
            placeholder="e.g. Specialty Cold Brew, Wood-Fired Mains"
            value={formName}
            onChange={(e) => {
              setFormName(e.target.value);
              if (formError) setFormError("");
            }}
            error={formError}
            autoFocus
          />

          <Textarea
            label="Description (Optional)"
            placeholder="e.g. Steeped for 18 hours using filtered mountain water and single-origin beans"
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            hint="Displays subtly beneath the section title on the guest phone menu."
          />

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCategory ? "Update Category" : "Create Category"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Category?"
        description="Are you sure you want to remove this category? Products currently assigned to it will be preserved."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-2.5 pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDeleteConfirmId(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => deleteConfirmId && handleDeleteCategory(deleteConfirmId)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
