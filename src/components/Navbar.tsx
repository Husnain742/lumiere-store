"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  LogOut,
  Menu,
  X,
  Search,
  PlusCircle,
  LayoutDashboard,
  PackageCheck,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";
import axios from "axios";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || "husnaingill565656@gmail.com";

export default function Navbar() {
  const { data: session } = useSession();
  const { cart, showCartReminder, setShowCartReminder } = useCart();
  const { currency, setCurrency } = useCurrency();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [announcement, setAnnouncement] = useState<{ text: string; couponCode: string; isActive: boolean } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
    fetchAnnouncement();

    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setAllProducts(res.data.products || []);
    } catch (err) {
      console.error("Failed to fetch products for navbar search:", err);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const res = await axios.get("/api/announcement");
      if (res.data.success) {
        setAnnouncement(res.data.banner);
      }
    } catch (err) {
      console.error("Failed to fetch announcement banner:", err);
    }
  };

  const totalItemsCount = cart.reduce((total: number, item: any) => total + item.quantity, 0);
  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const filteredProducts = searchQuery.trim() === "" ? [] : allProducts.filter((product) =>
    product.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* 🌟 FIXED NAVBAR */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#E5DDD5]/95 backdrop-blur-md border-b border-[#EFECE6] shadow-sm transition-all duration-300">
        
        {announcement?.isActive && (
          <div className="bg-[#8C5E73] text-white text-center py-2 px-4 text-xs font-medium tracking-wide flex items-center justify-center space-x-2 shadow-inner">
            <span>{announcement.text} <strong className="underline uppercase font-bold tracking-wider">{announcement.couponCode}</strong> ✨</span>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            <Link href="/" className="flex items-center space-x-2.5 group">
              <motion.div
                whileHover={{ rotate: 8, scale: 1.05 }}
                className="p-2.5 bg-[#8C5E73] rounded-2xl text-white shadow-md shadow-[#8C5E73]/20"
              >
                <ShoppingBag size={20} />
              </motion.div>
              <span className="text-2xl font-serif tracking-wide text-[#4A403A] group-hover:text-[#8C5E73] transition-colors">
                Lumière
              </span>
            </Link>

            <div className="hidden md:flex flex-1 max-w-sm mx-6 relative" ref={searchRef}>
              <div className="relative w-full">
                <Search
                  className="absolute left-4 top-3 text-[#9A8A82]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search luxury products..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="w-full bg-[#F3ECE7] border border-[#E5DDD7] rounded-full py-2.5 pl-11 pr-10 text-xs sm:text-sm text-[#4A403A] placeholder-[#A3958D] focus:outline-none focus:border-[#8C5E73] focus:bg-white transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-3 text-[#9A8A82] hover:text-[#4A403A] cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <AnimatePresence>
                {isSearching && searchQuery.trim() !== "" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    className="absolute top-14 left-0 right-0 bg-white border border-[#EFECE6] rounded-3xl shadow-xl overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-[#F5F2EE]"
                  >
                    {filteredProducts.length === 0 ? (
                      <div className="p-4 text-center text-xs text-[#8C7A72]">
                        No products found matching "{searchQuery}"
                      </div>
                    ) : (
                      filteredProducts.map((product) => {
                        const img = product.image || product.images?.[0] || "https://placehold.co/100";
                        return (
                          <Link
                            key={product._id}
                            href={`/products/${product._id}`}
                            onClick={() => {
                              setIsSearching(false);
                              setSearchQuery("");
                            }}
                            className="flex items-center justify-between p-3.5 hover:bg-[#FAF7F5] transition-colors cursor-pointer"
                          >
                            <div className="flex items-center space-x-3">
                              <img src={img} alt={product.title} className="w-10 h-10 rounded-xl object-cover border border-[#EFECE6]" />
                              <div>
                                <p className="text-xs font-medium text-[#4A403A] line-clamp-1">{product.title}</p>
                                <span className="text-[10px] text-[#8C5E73] uppercase font-semibold px-2 py-0.5 bg-[#F7EBEF] rounded-md">
                                  {product.category || "General"}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs font-bold text-[#8C5E73]">Rs. {product.price?.toLocaleString()}</p>
                          </Link>
                        );
                      })
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/"
                className="text-sm font-medium text-[#6B5E57] hover:text-[#8C5E73] transition-colors"
              >
                Home
              </Link>
              <Link
                href="/products"
                className="text-sm font-medium text-[#6B5E57] hover:text-[#8C5E73] transition-colors"
              >
                Shop
              </Link>

              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[#F3ECE7] border border-[#E5DDD7] text-[#4A403A] text-xs font-bold rounded-xl px-2.5 py-2 focus:outline-none focus:border-[#8C5E73] cursor-pointer shadow-inner"
              >
                <option value="PKR">PKR (Rs.)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
              </select>

              <Link
                href="/cart"
                className="relative p-2 text-[#6B5E57] hover:text-[#8C5E73] transition-colors"
              >
                <ShoppingBag size={21} />
                {mounted && totalItemsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#8C5E73] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                    {totalItemsCount}
                  </span>
                )}
              </Link>

              {session ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none cursor-pointer"
                  >
                    {session.user?.image ? (
                      <img
                        src={session.user.image}
                        alt={session.user.name || "User"}
                        className="w-9 h-9 rounded-full border-2 border-[#8C5E73]/40 object-cover shadow-sm"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#8C5E73] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#8C5E73]/20">
                        {session.user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </button>

                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-56 bg-white border border-[#EFECE6] rounded-2xl shadow-xl py-2 z-50"
                      >
                        <div className="px-4 py-2.5 border-b border-[#F5F2EE]">
                          <p className="text-sm font-semibold text-[#4A403A] truncate">
                            {session.user?.name}
                          </p>
                          <p className="text-xs text-[#8C7A72] truncate">
                            {session.user?.email}
                          </p>
                        </div>

                        <Link
                          href="/orders"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-[#6B5E57] hover:bg-[#FAF7F5] hover:text-[#8C5E73] transition-colors"
                        >
                          <PackageCheck size={16} className="text-[#8C5E73]" />
                          <span>My Orders</span>
                        </Link>

                        {isAdmin && (
                          <>
                            <Link
                              href="/admin/dashboard"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-[#8C5E73] hover:bg-[#FAF7F5] font-semibold transition-colors"
                            >
                              <LayoutDashboard size={16} />
                              <span>Admin Dashboard</span>
                            </Link>

                            <Link
                              href="/admin/add-product"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-[#6B5E57] hover:bg-[#FAF7F5] hover:text-[#8C5E73] transition-colors"
                            >
                              <PlusCircle size={16} />
                              <span>Add Product</span>
                            </Link>
                          </>
                        )}

                        <button
                          onClick={() => signOut()}
                          className="w-full text-left flex items-center space-x-2.5 px-4 py-2.5 text-xs sm:text-sm text-rose-600 hover:bg-rose-50 transition-colors border-t border-[#F5F2EE] mt-1 cursor-pointer"
                        >
                          <LogOut size={16} />
                          <span>Sign Out</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="bg-[#8C5E73] hover:bg-[#784E60] text-white text-xs sm:text-sm font-medium px-5 py-2.5 rounded-full shadow-md shadow-[#8C5E73]/25 transition-all cursor-pointer"
                  >
                    Sign In
                  </motion.button>
                </Link>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-3">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-[#F3ECE7] border border-[#E5DDD7] text-[#4A403A] text-[11px] font-bold rounded-lg px-2 py-1.5 focus:outline-none"
              >
                <option value="PKR">PKR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>

              <Link
                href="/cart"
                className="relative p-2 text-[#6B5E57]"
              >
                <ShoppingBag size={21} />
                {mounted && totalItemsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#8C5E73] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </Link>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-[#6B5E57] hover:text-[#4A403A] p-2 cursor-pointer"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-[#FAF7F5] border-b border-[#EFECE6] px-5 pt-3 pb-6 space-y-4 shadow-lg"
            >
              <div className="relative w-full">
                <Search
                  className="absolute left-3.5 top-2.5 text-[#9A8A82]"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-[#EFECE6] rounded-full py-2 pl-10 pr-4 text-xs text-[#4A403A] placeholder-[#A3958D] focus:outline-none focus:border-[#8C5E73]"
                />
              </div>

              {searchQuery.trim() !== "" && (
                <div className="bg-white rounded-2xl p-2 space-y-2 max-h-60 overflow-y-auto border border-[#EFECE6]">
                  {filteredProducts.map((p) => (
                    <Link
                      key={p._id}
                      href={`/products/${p._id}`}
                      onClick={() => {
                        setMobileMenuOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-center space-x-2 text-xs text-[#4A403A] p-2 hover:bg-[#FAF7F5] rounded-xl"
                    >
                      <img src={p.image || p.images?.[0]} alt={p.title} className="w-8 h-8 rounded-lg object-cover" />
                      <span className="truncate">{p.title}</span>
                    </Link>
                  ))}
                </div>
              )}

              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-[#4A403A] py-1 font-medium"
              >
                Home
              </Link>

              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm text-[#4A403A] py-1 font-medium"
              >
                Shop Catalog
              </Link>

              {session ? (
                <div className="pt-2 border-t border-[#EFECE6] space-y-2">
                  <p className="text-xs text-[#8C7A72]">
                    Signed in as <span className="text-[#4A403A] font-semibold">{session.user?.email}</span>
                  </p>

                  <Link
                    href="/orders"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 text-sm text-[#4A403A] py-1"
                  >
                    <PackageCheck size={16} className="text-[#8C5E73]" />
                    <span>My Orders</span>
                  </Link>

                  {isAdmin && (
                    <>
                      <Link
                        href="/admin/dashboard"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-sm text-[#8C5E73] py-1 font-semibold"
                      >
                        <LayoutDashboard size={16} />
                        <span>Admin Dashboard</span>
                      </Link>

                      <Link
                        href="/admin/add-product"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center space-x-2 text-sm text-[#4A403A] py-1"
                      >
                        <PlusCircle size={16} />
                        <span>Add Product</span>
                      </Link>
                    </>
                  )}
                  <button
                    onClick={() => signOut()}
                    className="flex items-center space-x-2 text-sm text-rose-600 py-1 cursor-pointer"
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center bg-[#8C5E73] text-white text-sm font-medium py-2.5 rounded-full mt-2"
                >
                  Sign In
                </Link>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ⚠️ Yeh line neechay wala content navbar ke neechay chupne se bachayegi */}
      <div className="pt-6 sm:pt-28" />

      {/* Abandoned Cart Recovery Floating Popup */}
      <AnimatePresence>
        {mounted && showCartReminder && cart.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#EFEAE5] border-2 border-[#8C5E73]/30 rounded-3xl p-5 shadow-2xl backdrop-blur-md"
          >
            <button
              onClick={() => setShowCartReminder(false)}
              className="absolute top-3.5 right-3.5 text-[#8A7A72] hover:text-[#1A120E] p-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>

            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-[#8C5E73] text-white rounded-2xl shadow-md shrink-0">
                <Sparkles size={20} />
              </div>
              <div className="space-y-1.5 pr-4">
                <h4 className="text-sm font-serif font-bold text-[#1A120E]">
                  Your luxury items are waiting!
                </h4>
                <p className="text-xs text-[#5E4E46] leading-relaxed">
                  You have <strong className="text-[#8C5E73]">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</strong> saved in your cart. Complete your order before they run out!
                </p>
                <div className="pt-2 flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowCartReminder(false);
                      router.push("/cart");
                    }}
                    className="bg-[#8C5E73] hover:bg-[#784E60] text-white text-xs font-semibold px-4 py-2 rounded-full shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Checkout Now</span>
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setShowCartReminder(false)}
                    className="text-xs font-medium text-[#8A7A72] hover:text-[#1A120E] cursor-pointer"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}