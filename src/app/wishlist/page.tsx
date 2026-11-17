"use client";

import React, { useState, useEffect } from "react";
import { useWishlist } from "@/context/WishlistContext";
import Link from "next/link";
import { Heart, Trash2, ShoppingBag } from "lucide-react";
import Navbar from "@/components/Navbar";
import { toast } from "sonner"; // <-- Sonner toast import kiya

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2C2420] font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8 border-b border-[#E5DFDA] pb-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-[#1A120E]">My Wishlist</h1>
            <p className="text-sm text-[#5E4E46] mt-1">
              Save your favorite luxury pieces for later. ({wishlist.length} items)
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-[#8C5E73] hover:underline"
          >
            Continue Shopping &rarr;
          </Link>
        </div>

        {wishlist.length === 0 ? (
          <div className="text-center py-20 bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl shadow-sm p-8">
            <Heart className="w-16 h-16 text-[#8C5E73] mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-serif text-[#1A120E]">Your wishlist is empty</h3>
            <p className="text-[#5E4E46] text-xs mt-2 mb-6">
              Explore our collection and tap the heart icon on items you love.
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#8C5E73] text-white px-6 py-3 rounded-full text-xs font-semibold hover:bg-[#754b5f] transition shadow-md"
            >
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const imageUrl = item.images?.[0] || item.image || "";
              return (
                <div
                  key={item._id}
                  className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl overflow-hidden shadow-sm hover:shadow-lg transition flex flex-col relative"
                >
                  <button
                    onClick={() => {
                      removeFromWishlist(item._id);
                      toast.info("Removed from wishlist");
                    }}
                    className="absolute top-3 right-3 z-10 bg-white/80 backdrop-blur-md p-2 rounded-full text-red-500 hover:bg-white transition shadow-sm cursor-pointer"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="relative h-52 w-full bg-[#FAF7F5] border-b border-[#E5DFDA] p-4 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={item.title}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-xs text-[#8A7A72]">No Image</span>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow justify-between">
                    <div>
                      <h3 className="font-serif font-bold text-[#1A120E] text-base line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-[#8C5E73] font-serif font-extrabold text-base mt-2">
                        Rs. {Number(item.price).toLocaleString()}
                      </p>
                    </div>
                    <Link
                      href={`/products/${item._id}`}
                      className="mt-4 w-full flex items-center justify-center gap-2 bg-[#F7EBEF] hover:bg-[#8C5E73] text-[#8C5E73] hover:text-white py-2.5 rounded-full text-xs font-semibold border border-[#E5DFDA] transition"
                    >
                      <ShoppingBag className="w-4 h-4" /> View Product
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}