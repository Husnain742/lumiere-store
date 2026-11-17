"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import OrderTimeline from "@/components/OrderTimeline"; // <-- Timeline component import kiya
import { motion } from "framer-motion";
import { Package, Loader2, ShoppingBag, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

export default function MyOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      toast.error("Please sign in to view your orders.");
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserOrders();
    }
  }, [session]);

  const fetchUserOrders = async () => {
    try {
      const res = await axios.get(`/api/orders?email=${session?.user?.email}`);
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch user orders:", err);
      toast.error("Orders load karne mein masla hua!");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#8C5E73]" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2C2420] font-sans flex flex-col">
      <Navbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full space-y-6">
        <div className="border-b border-[#E5DFDA] pb-4">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1A120E]">My Orders History</h1>
          <p className="text-xs sm:text-sm text-[#5E4E46] mt-1">Track the live status of your purchases and shipping updates.</p>
        </div>

        {orders.length === 0 ? (
          <div className="text-center py-20 bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl shadow-sm">
            <ShoppingBag size={48} className="mx-auto text-[#B5A59E] mb-3" />
            <p className="text-base font-serif font-bold text-[#1A120E]">You have not placed any orders yet.</p>
            <Link href="/products" className="mt-4 inline-block bg-[#8C5E73] hover:bg-[#784E60] text-white text-xs font-medium px-6 py-3 rounded-full transition-all shadow-md shadow-[#8C5E73]/20">
              Explore Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const orderStatus = order.status || "Pending";
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={order._id}
                  className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 shadow-sm space-y-4"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-[#E5DFDA] pb-3">
                    <div>
                      <span className="text-xs text-[#5E4E46] font-medium">Order ID: </span>
                      <span className="font-mono text-xs text-[#8C5E73] font-bold">#{order._id.slice(-6).toUpperCase()}</span>
                      <span className="text-xs text-[#8A7A72] ml-3 font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-bold ${
                      orderStatus === "Pending" ? "bg-amber-100/80 text-amber-800 border border-amber-300" :
                      orderStatus === "Shipped" ? "bg-blue-100/80 text-blue-800 border border-blue-300" :
                      orderStatus === "Delivered" ? "bg-emerald-100/80 text-emerald-800 border border-emerald-300" :
                      "bg-rose-100/80 text-rose-800 border border-rose-300"
                    }`}>
                      {orderStatus === "Pending" && <Clock size={13} />}
                      {orderStatus === "Shipped" && <Truck size={13} />}
                      {orderStatus === "Delivered" && <CheckCircle2 size={13} />}
                      {orderStatus === "Cancelled" && <XCircle size={13} />}
                      <span>{orderStatus}</span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="space-y-2">
                    {order.items?.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-xs sm:text-sm bg-[#FAF7F5] p-3 rounded-2xl border border-[#E5DFDA]">
                        <span className="text-[#1A120E] font-bold">{item.title} (x{item.quantity})</span>
                        <span className="text-[#8C5E73] font-serif font-extrabold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-[#E5DFDA] text-xs sm:text-sm">
                    <span className="text-[#5E4E46] font-medium">Total Bill: <strong className="text-[#1A120E] font-serif font-extrabold text-base">Rs. {order.totalAmount?.toLocaleString()}</strong></span>
                    <span className="text-[#8C5E73] uppercase tracking-wider text-[11px] font-semibold">Payment: {order.customerDetails?.paymentMethod || "COD"}</span>
                  </div>

                  {/* 🌟 Interactive Visual Timeline Added Here */}
                  <OrderTimeline status={orderStatus} />
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}