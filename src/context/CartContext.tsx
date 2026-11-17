"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext<any>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Lazy initialization taake initial render par hi localStorage se cart load ho jaye
  const [cart, setCart] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          return JSON.parse(savedCart);
        } catch (e) {
          console.error("Failed to parse cart from localStorage", e);
        }
      }
    }
    return [];
  });

  // Abandoned Cart Popup State
  const [showCartReminder, setShowCartReminder] = useState(false);

  // Save cart to localStorage whenever it changes & check for abandoned cart reminder
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cart", JSON.stringify(cart));

      // Agar cart mein items hain, aur user pehli baar wapas aaya hai toh reminder trigger karo
      const hasShownReminder = sessionStorage.getItem("cartReminderShown");
      if (cart.length > 0 && !hasShownReminder) {
        // Thora sa delay de kar popup show karein taake user site par settle ho jaye
        const timer = setTimeout(() => {
          setShowCartReminder(true);
          sessionStorage.setItem("cartReminderShown", "true");
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [cart]);

  // Add item to cart (Updated to check both product ID and selectedSize)
  const addToCart = (product: any, quantity = 1) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item._id === product._id && item.selectedSize === product.selectedSize
      );
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity
        };
        return updated;
      } else {
        return [...prevCart, { ...product, quantity: quantity }];
      }
    });
  };

  // Remove item from cart (Updated to check both id and size if needed, or by unique identifier)
  const removeFromCart = (id: string, selectedSize?: string) => {
    setCart((prev) => 
      prev.filter((item) => !(item._id === id && item.selectedSize === selectedSize))
    );
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setShowCartReminder(false);
  };

  return (
    <CartContext.Provider 
      value={{ 
        cart, 
        addToCart, 
        removeFromCart, 
        clearCart, 
        showCartReminder, 
        setShowCartReminder 
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}