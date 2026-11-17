"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProductSkeleton from "@/components/ProductSkeleton";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, ShoppingBag, Eye, Loader2, Clock, Search, X, Heart } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { useWishlist } from "@/context/WishlistContext";
import { useCurrency } from "@/context/CurrencyContext";
import { toast } from "sonner";

const backgroundImages = [
  "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1555529771-835f59fc5efe?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0a67d553c2a5?q=80&w=1600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1534452203293-494d7ddbf7e0?q=80&w=1600&auto=format&fit=crop"
];

export default function Home() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const { wishlist, addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { convertPrice } = useCurrency();

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString());
    };
    updateClock();
    const clockTimer = setInterval(updateClock, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Products load karne mein masla hua!");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2C2420] flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      {/* Hero Section - Added proper pt-24 / sm:pt-28 to prevent navbar overlap */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative overflow-hidden pt-24 sm:pt-28 pb-12 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"
      >
        <div className="relative rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden bg-[#EFEAE5] border border-[#E5DFDA] shadow-sm py-12 sm:py-16 px-5 sm:px-12 backdrop-blur-md flex flex-col justify-center">
          <div className="absolute inset-0 z-0">
            {backgroundImages.map((img, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                  index === currentImageIndex ? "opacity-50 scale-105" : "opacity-0 scale-100"
                }`}
              >
                <img src={img} alt="Slider Background" className="w-full h-full object-cover" />
              </div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FAF7F5]/90 via-[#FAF7F5]/70 to-transparent" />
          </div>

          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-2.5 mb-5"
            >
              <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-[#8C5E73]/10 border border-[#8C5E73]/20 text-[#8C5E73] text-[11px] sm:text-sm font-medium">
                <Sparkles size={14} />
                <span>Next-Gen E-Commerce Experience</span>
              </div>

              <div className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[11px] sm:text-sm font-semibold">
                <Clock size={14} className="animate-pulse" />
                <span>{currentTime || "Loading time..."}</span>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-3xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight leading-tight text-[#2C2420]"
            >
              Discover Modern & <br />
              <span className="italic font-light text-[#8C5E73]">
                Premium Products
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
              className="mt-4 sm:mt-6 text-xs sm:text-base text-[#5E4E46] max-w-xl mx-auto leading-relaxed px-2"
            >
              Explore our curated catalog featuring ultra-fast delivery, encrypted authentication, and seamless animated UI crafted for tech lovers.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/products" className="w-full sm:w-auto">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-[#8C5E73] hover:bg-[#784E60] text-white font-medium px-8 py-3.5 rounded-full shadow-md shadow-[#8C5E73]/25 transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
                >
                  <span>Shop Catalog</span>
                  <ArrowRight size={18} />
                </motion.button>
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Trending Products Section */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.8 }}
        className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex-grow"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-[#E5DFDA] pb-6">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-[#8C5E73] font-semibold">Featured Items</span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A120E] mt-1">Trending Products</h2>
            <p className="text-xs text-[#5E4E46] mt-1">Search our top-rated items or browse store catalog</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Link
              href="/wishlist"
              className="bg-[#F7EBEF] hover:bg-[#8C5E73] text-[#8C5E73] hover:text-white text-xs font-medium px-4 py-2.5 rounded-full transition-all border border-[#E5DFDA] flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <Heart size={16} className="fill-current" /> Wishlist ({mounted ? wishlist.length : 0})
            </Link>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-3 text-[#7A6A62]" size={18} />
              <input
                type="text"
                placeholder="Search products by title/category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#EFEAE5] border border-[#E5DFDA] rounded-full py-2.5 pl-10 pr-10 text-xs sm:text-sm text-[#1A120E] placeholder-[#8A7A72] focus:outline-none focus:border-[#8C5E73] transition-all shadow-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-3 text-[#7A6A62] hover:text-[#1A120E] cursor-pointer"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl shadow-sm">
            <ShoppingBag size={40} className="mx-auto text-[#B5A59E] mb-3" />
            <p className="text-sm font-semibold text-[#1A120E]">No matching products found</p>
            <p className="text-xs text-[#5E4E46] mt-1">Try searching with a different keyword</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => {
              const imageUrl = product.image || (Array.isArray(product.images) && product.images[0]) || null;
              const isFav = mounted && isInWishlist(product._id);

              const isSaleActive = product.saleEndDate ? new Date().getTime() < new Date(product.saleEndDate).getTime() : false;
              const hasDiscount = Boolean(product.discountPercentage && product.discountPercentage > 0 && isSaleActive);
              const originalPrice = Number(product.price);
              const discountPercent = product.discountPercentage || 0;
              const discountedPrice = hasDiscount ? originalPrice - (originalPrice * discountPercent) / 100 : originalPrice;

              return (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-4 flex flex-col justify-between hover:shadow-xl transition-all group relative"
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
                    className="absolute top-6 right-6 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full transition-all shadow-sm hover:scale-110 cursor-pointer"
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

                  <div>
                    <div 
                      onClick={() => imageUrl && setSelectedImage(imageUrl)}
                      className="w-full h-52 bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl overflow-hidden mb-4 flex items-center justify-center p-3 relative cursor-pointer group/img"
                    >
                      {imageUrl ? (
                        <>
                          <img src={imageUrl} alt={product.title} className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300" />
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
                      <span className="absolute top-3 left-3 bg-[#EFEAE5]/90 backdrop-blur-md border border-[#E5DFDA] text-[#8C5E73] text-[10px] font-bold px-2.5 py-1 rounded-full">
                        {product.category || "General"}
                      </span>

                      {hasDiscount && (
                        <span className="absolute bottom-3 left-3 bg-rose-600 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-full shadow-md z-10 animate-pulse">
                          -{discountPercent}% OFF
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[#1A120E] line-clamp-1 mb-1">{product.title}</h3>
                    <p className="text-xs text-[#5E4E46] line-clamp-2 mb-4">{product.description}</p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#E5DFDA]">
                    <div className="flex items-center gap-2">
                      <span className="text-[#1A120E] font-serif font-extrabold text-sm sm:text-base">
                        {convertPrice(discountedPrice)}
                      </span>
                      {hasDiscount && (
                        <span className="text-[11px] text-[#8A7A72] line-through font-serif">
                          {convertPrice(originalPrice)}
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/products/${product._id}`}
                      className="bg-[#F7EBEF] hover:bg-[#8C5E73] text-[#8C5E73] hover:text-white text-xs font-semibold px-3.5 py-2 rounded-full transition-all flex items-center space-x-1 cursor-pointer"
                    >
                      <Eye size={14} />
                      <span>View</span>
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Full-Screen Image Lightbox Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}