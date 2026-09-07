import React, { useState } from "react";
import {
  Utensils,
  Plus,
  Pencil,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Search,
  Check,
  Tag,
  Sparkles,
  DollarSign,
  Eye,
  AlertCircle,
} from "lucide-react";
import { Category, DietaryTag, Product, RestaurantProfile } from "../../types";
import { formatPrice } from "../../lib/utils";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { ImageUpload, PresetOption } from "../ui/ImageUpload";
import { DEFAULT_PRODUCTS } from "../../lib/constants";

interface StepProductsProps {
  profile: RestaurantProfile;
  onUpdate: (data: Partial<RestaurantProfile>) => void;
  onContinue: () => void;
  onBack: () => void;
}

const AVAILABLE_TAGS: DietaryTag[] = [
  "Popular",
  "Vegan",
  "Gluten-Free",
  "Organic",
  "Chef's Special",
  "New",
  "Spicy",
];

const DISH_IMAGE_PRESETS: PresetOption[] = [
  {
    id: "cortado",
    title: "Cortado",
    url: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "coldbrew",
    title: "Cold Foam Brew",
    url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "croissant",
    title: "Almond Croissant",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "avotoast",
    title: "Avocado Toast",
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "latteart",
    title: "Pour-over / Drip",
    url: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "matcha",
    title: "Matcha Drink",
    url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "pasta",
    title: "Artisan Pasta",
    url: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "burger",
    title: "Craft Burger",
    url: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
  },
];

export function StepProducts({ profile, onUpdate, onContinue, onBack }: StepProductsProps) {
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [formPrice, setFormPrice] = useState<string>("");
  const [formCategoryId, setFormCategoryId] = useState<string>("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formTags, setFormTags] = useState<DietaryTag[]>([]);
  const [formAvailable, setFormAvailable] = useState(true);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormPrice("");
    setFormCategoryId(
      selectedFilterCategory !== "all"
        ? selectedFilterCategory
        : profile.categories[0]?.id || ""
    );
    setFormDesc("");
    setFormImage("");
    setFormTags([]);
    setFormAvailable(true);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormPrice(prod.price.toString());
    setFormCategoryId(prod.categoryId);
    setFormDesc(prod.description || "");
    setFormImage(prod.imageUrl || "");
    setFormTags(prod.tags || []);
    setFormAvailable(prod.isAvailable);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const toggleTag = (tag: DietaryTag) => {
    setFormTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formName.trim()) {
      errors.name = "Product name is required.";
    }

    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      errors.price = "Please enter a valid price (e.g. 5.50).";
    }

    if (!formCategoryId) {
      errors.category = "Please assign a category.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    if (editingProduct) {
      // Edit
      const updated = profile.products.map((p) =>
        p.id === editingProduct.id
          ? {
              ...p,
              name: formName.trim(),
              price: parsedPrice,
              categoryId: formCategoryId,
              description: formDesc.trim(),
              imageUrl: formImage,
              tags: formTags,
              isAvailable: formAvailable,
            }
          : p
      );
      onUpdate({ products: updated });
    } else {
      // Create new
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName.trim(),
        price: parsedPrice,
        categoryId: formCategoryId,
        description: formDesc.trim(),
        imageUrl: formImage,
        tags: formTags,
        isAvailable: formAvailable,
      };
      onUpdate({ products: [...profile.products, newProd] });
    }

    setIsModalOpen(false);
  };

  const handleDeleteProduct = (prodId: string) => {
    onUpdate({
      products: profile.products.filter((p) => p.id !== prodId),
    });
    setDeleteConfirmId(null);
  };

  const toggleProductAvailability = (prodId: string) => {
    onUpdate({
      products: profile.products.map((p) =>
        p.id === prodId ? { ...p, isAvailable: !p.isAvailable } : p
      ),
    });
  };

  const filteredProducts = profile.products.filter((p) => {
    const matchesCategory =
      selectedFilterCategory === "all" || p.categoryId === selectedFilterCategory;
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const getCategoryName = (catId: string) => {
    return profile.categories.find((c) => c.id === catId)?.name || "Uncategorized";
  };

  return (
    <div className="max-w-4xl mx-auto text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-medium">
              Step 04 · Products
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif italic text-white mb-2">
              Add your menu items
            </h2>
            <p className="text-white/40 max-w-lg text-sm sm:text-base leading-relaxed">
              Define your signature dishes, coffees, pricing, descriptions, and dietary badges.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={openCreateModal}
              leftIcon={<Plus className="w-4 h-4" />}
              className="shrink-0"
            >
              Add Product
            </Button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-4 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              placeholder="Search dishes or drinks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111111] border border-white/10 text-xs text-white placeholder:text-white/30 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:border-white/30"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-white/40 font-mono">
            <span>{filteredProducts.length} items listed</span>
            {profile.products.length === 0 && (
              <button
                type="button"
                onClick={() => onUpdate({ products: DEFAULT_PRODUCTS })}
                className="text-white hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                Load Sample Items
              </button>
            )}
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          <button
            type="button"
            onClick={() => setSelectedFilterCategory("all")}
            className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-colors cursor-pointer ${
              selectedFilterCategory === "all"
                ? "bg-white text-black font-bold shadow-xs"
                : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
            }`}
          >
            All ({profile.products.length})
          </button>
          {profile.categories.map((c) => {
            const count = profile.products.filter((p) => p.categoryId === c.id).length;
            const isSelected = selectedFilterCategory === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedFilterCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isSelected
                    ? "bg-white text-black font-bold shadow-xs"
                    : "bg-white/5 border border-white/10 text-white/50 hover:text-white"
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid / Cards */}
      {filteredProducts.length === 0 ? (
        <div className="bg-[#0D0D0D] border border-white/10 rounded-xl p-10 text-center">
          <Utensils className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <h3 className="text-lg font-serif italic text-white">No products found</h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto mt-1 mb-5">
            {searchQuery
              ? "No items match your query. Try clearing the search filter."
              : "Get started by adding your first signature coffee, dish, or pastry."}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button type="button" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
              Add Product
            </Button>
            {profile.products.length === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onUpdate({ products: DEFAULT_PRODUCTS })}
                leftIcon={<Sparkles className="w-4 h-4 text-white" />}
              >
                Populate Sample Menu
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-[#0D0D0D] border border-white/10 hover:border-white/20 rounded-xl p-4 transition-colors flex gap-3.5 group relative"
            >
              {/* Product thumbnail */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-[#141414] shrink-0 border border-white/10">
                {prod.imageUrl ? (
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Utensils className="w-6 h-6" />
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-medium text-white leading-snug truncate">
                      {prod.name}
                    </h4>
                    <span className="text-sm font-mono text-white font-bold shrink-0">
                      {formatPrice(prod.price, profile.currency)}
                    </span>
                  </div>

                  <span className="text-[10px] uppercase tracking-widest text-white/40 block mt-0.5">
                    in {getCategoryName(prod.categoryId)}
                  </span>

                  {prod.description && (
                    <p className="text-xs text-white/40 line-clamp-2 mt-1 leading-relaxed">
                      {prod.description}
                    </p>
                  )}

                  {/* Dietary Tags */}
                  {prod.tags && prod.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {prod.tags.map((t) => (
                        <span
                          key={t}
                          className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-white/60 border border-white/10 font-mono"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Card Actions */}
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => toggleProductAvailability(prod.id)}
                    className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer border ${
                      prod.isAvailable
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {prod.isAvailable ? "Available" : "Sold Out"}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEditModal(prod)}
                      className="p-1.5 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors cursor-pointer"
                      title="Edit Product"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(prod.id)}
                      className="p-1.5 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors cursor-pointer"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Navigation Footer */}
      <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
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
          disabled={profile.products.length === 0}
        >
          Continue to Live Preview
        </Button>
      </div>

      {/* Add/Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? "Edit Menu Item" : "Add New Menu Item"}
        description="Configure product details, pricing, category and presentation."
        maxWidth="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <Input
              label="Item Name *"
              placeholder="e.g. Vanilla Bean Oat Cortado"
              value={formName}
              onChange={(e) => {
                setFormName(e.target.value);
                if (formErrors.name) setFormErrors({ ...formErrors, name: "" });
              }}
              error={formErrors.name}
              autoFocus
            />

            <Input
              label={`Price (${profile.currency}) *`}
              placeholder="5.25"
              type="number"
              step="0.01"
              min="0"
              value={formPrice}
              onChange={(e) => {
                setFormPrice(e.target.value);
                if (formErrors.price) setFormErrors({ ...formErrors, price: "" });
              }}
              error={formErrors.price}
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] uppercase tracking-widest text-white/60 font-medium">
              Category *
            </label>
            <select
              value={formCategoryId}
              onChange={(e) => {
                setFormCategoryId(e.target.value);
                if (formErrors.category) setFormErrors({ ...formErrors, category: "" });
              }}
              className="w-full bg-[#111111] text-white border border-white/10 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-white/30"
            >
              {profile.categories.length === 0 ? (
                <option value="">No categories created yet</option>
              ) : (
                profile.categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#111111] text-white">
                    {c.name}
                  </option>
                ))
              )}
            </select>
            {formErrors.category && (
              <p className="text-xs text-red-400 font-medium">{formErrors.category}</p>
            )}
          </div>

          <Textarea
            label="Description"
            placeholder="e.g. Double extracted Ethiopian Guji espresso poured over lightly steamed oat milk with notes of bergamot."
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
            hint="Describe preparation, origin, flavor profile, or allergen notes."
          />

          {/* Image Upload for Product */}
          <div className="pt-1">
            <ImageUpload
              label="Dish / Beverage Image (Optional)"
              value={formImage}
              onChange={setFormImage}
              aspectRatio="wide"
              presets={DISH_IMAGE_PRESETS}
              hint="High resolution photo showcasing the dish. Select a food preset or upload your own."
            />
          </div>

          {/* Dietary Tags */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] uppercase tracking-widest text-white/60 font-medium block">
              Dietary & Highlight Badges
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = formTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer border ${
                      isSelected
                        ? "bg-white text-black font-bold border-white"
                        : "bg-[#111111] text-white/50 border-white/10 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/5">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingProduct ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Menu Item?"
        description="Are you sure you want to remove this product? It will no longer appear on the live QR menu."
        maxWidth="sm"
      >
        <div className="flex items-center justify-end gap-2.5 pt-4">
          <Button type="button" variant="ghost" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => deleteConfirmId && handleDeleteProduct(deleteConfirmId)}
          >
            Delete Item
          </Button>
        </div>
      </Modal>
    </div>
  );
}
