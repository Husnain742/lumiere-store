"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import ProductSkeleton from "@/components/ProductSkeleton"; // <-- Skeleton component import kiya
import { Package, Loader2, X, Eye, Heart, SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner"; // <-- Sonner toast import kiya

function ProductsContent() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  
  // Full-screen Image Modal State
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Advanced Filters State
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState<number>(300000); // Default safe high limit
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'low-high', 'high-low'

  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  // Wishlist & Currency Context hooks
  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { convertPrice } = useCurrency();

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      const fetchedProducts = res.data.products || [];
      setProducts(fetchedProducts);

      if (fetchedProducts.length > 0) {
        const prices = fetchedProducts.map((p: any) => {
          const active = p.saleEndDate ? new Date().getTime() < new Date(p.saleEndDate).getTime() : false;
          const disc = Boolean(p.discountPercentage && p.discountPercentage > 0 && active);
          const effective = disc ? Number(p.price) - (Number(p.price) * p.discountPercentage) / 100 : Number(p.price);
          return effective || Number(p.price) || 0;
        });
        const highestPrice = Math.max(...prices);
        setMaxPrice(Math.max(highestPrice, 200000));
      }
    } catch (error) {
      console.error("Failed to fetch products:", error);
      toast.error("Network Error While Loading Products!");
    } finally {
      setLoading(false);
    }
  };

  const categories = useMemo(() => {
    const cats = products.map((p) => p.category || "General");
    return ["All", ...Array.from(new Set(cats))];
  }, [products]);

  const absoluteMaxPrice = useMemo(() => {
    if (products.length === 0) return 300000;
    const prices = products.map((p) => Number(p.price) || 0);
    const peak = Math.max(...prices);
    return Math.max(peak, 200000);
  }, [products]);

  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((product) => {
        const isSaleActive = product.saleEndDate ? new Date().getTime() < new Date(product.saleEndDate).getTime() : false;
        const hasDiscount = Boolean(product.discountPercentage && product.discountPercentage > 0 && isSaleActive);
        const originalPrice = Number(product.price);
        const effectivePrice = hasDiscount ? originalPrice - (originalPrice * product.discountPercentage) / 100 : originalPrice;

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchesSearch =
            product.title?.toLowerCase().includes(q) ||
            product.category?.toLowerCase().includes(q) ||
            product.description?.toLowerCase().includes(q);
          if (!matchesSearch) return false;
        }

        if (selectedCategory !== "All" && (product.category || "General") !== selectedCategory) {
          return false;
        }

        if (effectivePrice > maxPrice) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const getEffectivePrice = (p: any) => {
          const active = p.saleEndDate ? new Date().getTime() < new Date(p.saleEndDate).getTime() : false;
          const disc = Boolean(p.discountPercentage && p.discountPercentage > 0 && active);
          return disc ? Number(p.price) - (Number(p.price) * p.discountPercentage) / 100 : Number(p.price);
        };

        if (sortBy === "low-high") return getEffectivePrice(a) - getEffectivePrice(b);
        if (sortBy === "high-low") return getEffectivePrice(b) - getEffectivePrice(a);
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });
  }, [products, searchQuery, selectedCategory, maxPrice, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2C2420] font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-[#E5DFDA] pb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1A120E]">Our Products Catalog</h1>
            <p className="text-sm text-[#5E4E46] mt-1">
              {searchQuery ? `Search results for "${searchQuery}"` : "Explore curated luxury items with advanced filters"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/wishlist"
              className="bg-[#F7EBEF] hover:bg-[#8C5E73] text-[#8C5E73] hover:text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all border border-[#E5DFDA] flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Heart size={16} className="fill-current" /> My Wishlist ({mounted ? wishlist.length : 0})
            </Link>
            <Link
              href="/admin/add-product"
              className="bg-[#8C5E73] hover:bg-[#784E60] text-white text-sm font-medium px-5 py-2.5 rounded-full transition-all shadow-md shadow-[#8C5E73]/20 cursor-pointer"
            >
              + Add Product
            </Link>
          </div>
        </div>

        <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 mb-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#8C5E73] uppercase tracking-wider mr-2 flex items-center gap-1">
              <SlidersHorizontal size={14} /> Categories:
            </span>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all cursor-pointer border ${
                  selectedCategory === cat
                    ? "bg-[#8C5E73] text-white border-[#8C5E73] shadow-sm"
                    : "bg-[#FAF7F5] text-[#5E4E46] border-[#E5DFDA] hover:border-[#8C5E73]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 w-full lg:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-56">
              <div className="flex justify-between text-xs font-semibold text-[#5E4E46]">
                <span>Max Price</span>
                <span className="text-[#8C5E73] font-bold">{convertPrice(maxPrice)}</span>
              </div>
              <input
                type="range"
                min="500"
                max={absoluteMaxPrice}
                step="1000"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[#8C5E73] cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <ArrowUpDown size={16} className="text-[#8C5E73]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#FAF7F5] border border-[#E5DFDA] rounded-full text-xs font-semibold text-[#1A120E] px-4 py-2.5 focus:outline-none focus:border-[#8C5E73] cursor-pointer shadow-sm w-full sm:w-auto"
              >
                <option value="newest">Newest First</option>
                <option value="low-high">Price: Low to High</option>
                <option value="high-low">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          /* SKELETON LOADER GRID */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredAndSortedProducts.length === 0 ? (
          <div className="text-center py-20 bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl shadow-sm">
            <Package className="mx-auto text-[#B5A59E] mb-3" size={48} />
            <h2 className="text-lg font-semibold text-[#1A120E]">No products match your filter</h2>
            <p className="text-xs text-[#5E4E46] mt-1">
              Try adjusting your price range or clearing category filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("All");
                setMaxPrice(absoluteMaxPrice);
                setSortBy("newest");
              }}
              className="mt-4 bg-[#8C5E73] text-white text-xs font-semibold px-5 py-2.5 rounded-full transition hover:bg-[#784E60] cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredAndSortedProducts.map((product: any) => {
              const imageUrl =
                product.image ||
                (Array.isArray(product.images) && product.images.length > 0
                  ? product.images[0]
                  : null);

              const isFav = mounted && isInWishlist(product._id);

              const isSaleActive = product.saleEndDate ? new Date().getTime() < new Date(product.saleEndDate).getTime() : false;
              const hasDiscount = Boolean(product.discountPercentage && product.discountPercentage > 0 && isSaleActive);
              const originalPrice = Number(product.price);
              const discountPercent = product.discountPercentage || 0;
              const discountedPrice = hasDiscount ? originalPrice - (originalPrice * discountPercent) / 100 : originalPrice;

              return (
                <div
                  key={product._id}
                  className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col relative"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFav) {
                        removeFromWishlist(product._id);
                        toast.info("Removed from wishlist");
                      } else {
                        addToWishlist(product);
                        toast.success("Added to wishlist! ❤️");
                      }
                    }}
                    className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full transition-all shadow-sm hover:scale-110 cursor-pointer"
                    title={isFav ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    <Heart
                      size={18}
                      className={
                        isFav
                          ? "fill-red-500 text-red-500"
                          : "text-gray-600 hover:text-red-500"
                      }
                    />
                  </button>

                  <div 
                    onClick={() => imageUrl && setSelectedImage(imageUrl)}
                    className="w-full h-52 bg-[#FAF7F5] border-b border-[#E5DFDA] relative overflow-hidden flex items-center justify-center p-4 cursor-pointer group/img"
                  >
                    {imageUrl ? (
                      <>
                        <img
                          src={imageUrl}
                          alt={product.title}
                          className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-[#8C5E73] text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-lg flex items-center space-x-1">
                            <Eye size={14} />
                            <span>Click to Zoom</span>
                          </span>
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-[#8A7A72]">No Image</span>
                    )}
                    <span className="absolute top-3 left-3 bg-[#EFEAE5]/90 backdrop-blur-md text-[#8C5E73] text-[10px] font-bold px-2.5 py-1 rounded-full border border-[#E5DFDA] pointer-events-none">
                      {product.category || "General"}
                    </span>

                    {hasDiscount && (
                      <span className="absolute top-3 right-12 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md z-10 animate-pulse">
                        -{discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <h2 className="text-base font-bold text-[#1A120E] group-hover:text-[#8C5E73] transition-colors line-clamp-1">
                        {product.title}
                      </h2>
                      <p className="text-xs text-[#5E4E46] mt-1 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-4 border-t border-[#E5DFDA] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="text-[#1A120E] font-serif font-extrabold text-sm sm:text-base">
                          {convertPrice(discountedPrice)}
                        </div>
                        {hasDiscount && (
                          <span className="text-[11px] text-[#8A7A72] line-through font-serif">
                            {convertPrice(originalPrice)}
                          </span>
                        )}
                      </div>
                      <Link href={`/products/${product._id}`}>
                        <button className="bg-[#F7EBEF] hover:bg-[#8C5E73] text-[#8C5E73] hover:text-white text-xs font-semibold px-4 py-2 rounded-full border border-[#E5DFDA] transition-all cursor-pointer">
                          View Details
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedImage && (
          <div 
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl max-h-[90vh] bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-4 sm:p-6 shadow-2xl flex items-center justify-center"
            >
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 z-10 bg-[#E5DFDA] hover:bg-[#D9D3CE] text-[#1A120E] p-2.5 rounded-full transition-all cursor-pointer shadow-md"
              >
                <X size={20} />
              </button>
              <img
                src={selectedImage}
                alt="Full View"
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#8C5E73]" size={40} />
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}