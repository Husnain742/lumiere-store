"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  ShoppingBag, 
  Loader2, 
  PlusCircle, 
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Download,
  LayoutDashboard,
  Users,
  BarChart3,
  Store,
  Tag,
  Trash2,
  Megaphone,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar
} from "lucide-react";
import { 
  BarChart, 
  Bar,
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend,
  CartesianGrid
} from "recharts";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState("overview");
  const [dateFilter, setDateFilter] = useState("7days");
  const [mobileAdminMenuOpen, setMobileAdminMenuOpen] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [orderLoading, setOrderLoading] = useState(true);
  const [orderSearch, setOrderSearch] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [productLoading, setProductLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");

  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState({ code: "", discountPercentage: "", expiryDate: "" });
  const [isCreatingCoupon, setIsCreatingCoupon] = useState(false);

  const [announcementText, setAnnouncementText] = useState("✨ Special Offer: Use code at checkout to get 20% OFF!");
  const [announcementCode, setAnnouncementCode] = useState("LUMIERE20");
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({ title: "", price: "", stock: "", description: "", discountPercentage: "", saleEndDate: "" });
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      toast.error("Access Denied: Authorized Admin Only!");
      router.push("/");
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.email === ADMIN_EMAIL) {
      fetchOrders();
      fetchProducts();
      fetchCoupons();
      fetchAnnouncement();
    }
  }, [session]);

  const fetchOrders = async () => {
    try {
      const res = await axios.get("/api/orders");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error("Failed to fetch orders:", err);
      toast.error("Failed to fetch orders");
    } finally {
      setOrderLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Failed to fetch products:", err);
      toast.error("Failed to fetch products");
    } finally {
      setProductLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await axios.get("/api/coupons");
      setCoupons(res.data.coupons || []);
    } catch (err) {
      console.error("Failed to fetch coupons:", err);
    }
  };

  const fetchAnnouncement = async () => {
    try {
      const res = await axios.get("/api/announcement");
      if (res.data.success && res.data.banner) {
        setAnnouncementText(res.data.banner.text);
        setAnnouncementCode(res.data.banner.couponCode);
        setIsAnnouncementActive(res.data.banner.isActive);
      }
    } catch (err) {
      console.error("Failed to fetch announcement:", err);
    }
  };

  const handleSaveAnnouncement = async () => {
    setIsSavingAnnouncement(true);
    try {
      const res = await axios.post("/api/announcement", {
        text: announcementText,
        couponCode: announcementCode,
        isActive: isAnnouncementActive,
      });
      if (res.data.success) {
        toast.success("Announcement banner updated successfully!");
        router.refresh();
      }
    } catch (err) {
      toast.error("Failed to update announcement");
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponForm.code || !couponForm.discountPercentage || !couponForm.expiryDate) return;
    setIsCreatingCoupon(true);
    try {
      const res = await axios.post("/api/coupons", couponForm);
      if (res.data.success) {
        setCoupons([res.data.coupon, ...coupons]);
        setCouponForm({ code: "", discountPercentage: "", expiryDate: "" });
        toast.success("Coupon created successfully!");
        router.refresh();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create coupon");
    } finally {
      setIsCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon code?")) return;
    try {
      const res = await axios.delete(`/api/coupons?id=${id}`);
      if (res.data.success) {
        setCoupons(coupons.filter((c) => c._id !== id));
        toast.success("Coupon deleted");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete coupon:", err);
      toast.error("Failed to delete coupon");
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await axios.patch("/api/orders", { orderId, status: newStatus });
      if (res.status === 200) {
        setOrders(orders.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
        toast.success(`Order status updated to ${newStatus}`);
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      toast.error("Failed to update status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await axios.delete(`/api/products/${id}`);
      if (res.data.success) {
        setProducts(products.filter(p => p._id !== id));
        toast.success("Product deleted successfully");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to delete product:", err);
      toast.error("Failed to delete product");
    }
  };

  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setEditForm({ 
      title: product.title, 
      price: product.price, 
      stock: product.stock ?? 0,
      description: product.description || "",
      discountPercentage: product.discountPercentage ?? "",
      saleEndDate: product.saleEndDate ? new Date(product.saleEndDate).toISOString().slice(0, 16) : ""
    });
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsUpdatingProduct(true);
    try {
      const res = await axios.put(`/api/products/${editingProduct._id}`, {
        ...editForm,
        price: Number(editForm.price),
        stock: Number(editForm.stock),
        discountPercentage: editForm.discountPercentage ? Number(editForm.discountPercentage) : 0,
        saleEndDate: editForm.saleEndDate ? new Date(editForm.saleEndDate).toISOString() : null,
      });
      if (res.data.success) {
        setProducts(products.map(p => p._id === editingProduct._id ? res.data.product : p));
        setEditingProduct(null);
        toast.success("Product updated successfully! ✨");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update product:", err);
      toast.error("Failed to update product");
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const exportOrdersToCSV = async () => {
    try {
      const res = await axios.get("/api/orders");
      const allOrders = res.data.orders;
      if (!allOrders || allOrders.length === 0) {
        toast.info("No orders to export!");
        return;
      }
      const headers = ["Order ID", "Customer Name", "Email", "Phone", "City", "Address", "Total Amount (Rs.)", "Status"];
      const csvRows = allOrders.map((o: any) => [
        `"#${o._id.slice(-6).toUpperCase()}"`,
        `"${o.customerDetails?.fullName || 'N/A'}"`,
        `"${o.customerDetails?.email || 'N/A'}"`,
        `"${o.customerDetails?.phone || 'N/A'}"`,
        `"${o.customerDetails?.city || 'N/A'}"`,
        `"${(o.customerDetails?.address || 'N/A').replace(/"/g, '""')}"`,
        o.totalAmount?.toFixed(2),
        `"${o.status || 'Pending'}"`
      ].join(","));
      const blob = new Blob([[headers.join(","), ...csvRows].join("\n")], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Orders_Report.csv`;
      a.click();
      toast.success("Orders report downloaded successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export orders");
    }
  };

  if (status === "loading" || orderLoading || productLoading) {
    return (
      <div className="min-h-screen bg-[#FAF7F5] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="animate-spin text-[#8C5E73]" size={48} />
        <p className="text-sm text-[#5E4E46] font-medium">Loading Admin Portal...</p>
      </div>
    );
  }

  if (!session || session.user?.email !== ADMIN_EMAIL) return null;

  const now = new Date();
  const filteredByDateOrders = orders.filter((order) => {
    const orderDate = new Date(order.createdAt || Date.now());
    if (dateFilter === "today") {
      return orderDate.toDateString() === now.toDateString();
    } else if (dateFilter === "7days") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      return orderDate >= sevenDaysAgo;
    } else if (dateFilter === "30days") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      return orderDate >= thirtyDaysAgo;
    }
    return true;
  });

  const totalRevenue = filteredByDateOrders.reduce((acc, order) => acc + (order.totalAmount || 0), 0);
  const totalOrders = filteredByDateOrders.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  const pendingOrdersCount = orders.filter(o => !o.status || o.status === "Pending").length;
  const lowStockProducts = products.filter((p) => (p.stock ?? 0) < 5);

  const salesByDateMap: { [key: string]: number } = {};
  filteredByDateOrders.forEach((order) => {
    const dateStr = new Date(order.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    salesByDateMap[dateStr] = (salesByDateMap[dateStr] || 0) + (order.totalAmount || 0);
  });
  const salesLineChartData = Object.keys(salesByDateMap).map((date) => ({
    date,
    revenue: salesByDateMap[date],
  }));

  const customerBarChartData = filteredByDateOrders.map((order) => ({
    name: order.customerDetails?.fullName || `#${order._id.slice(-6).toUpperCase()}`,
    totalAmount: order.totalAmount || 0,
  }));

  const categoryData = products.reduce((acc: any, product: any) => {
    const cat = product.category || "General";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  const pieChartData = Object.keys(categoryData).map((key) => ({ name: key, value: categoryData[key] }));
  const COLORS = ["#E63946", "#F4A261", "#E9C46A", "#2A9D8F", "#457B9D", "#9b5de5"];

  const filteredOrders = orders.filter((o) => o._id.toLowerCase().includes(orderSearch.toLowerCase()) || o.customerDetails?.fullName?.toLowerCase().includes(orderSearch.toLowerCase()));
  const filteredProducts = products.filter((p) => p.title?.toLowerCase().includes(productSearch.toLowerCase()) || p.category?.toLowerCase().includes(productSearch.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#FAF7F5] text-[#2C2420] font-sans flex flex-col">
      <Navbar />

      <div className="flex flex-grow w-full relative">
        <aside className="w-64 bg-[#2A1424] text-[#EFEAE5] hidden md:flex flex-col justify-between p-6 border-r border-[#3D2036] shadow-2xl sticky top-[73px] h-[calc(100vh-73px)] flex-shrink-0">
          <div className="space-y-8">
            <div className="flex items-center space-x-3 px-2">
              <div className="p-2.5 bg-[#8C5E73] rounded-2xl text-white shadow-md">
                <Store size={22} />
              </div>
              <span className="font-serif text-xl font-bold tracking-wide text-white">Lumière</span>
            </div>

            <nav className="space-y-2">
              {[
                { id: "overview", label: "Overview", icon: LayoutDashboard },
                { id: "products", label: "Products", icon: Package },
                { id: "orders", label: "Orders", icon: ShoppingBag },
                { id: "coupons", label: "Coupons", icon: Tag },
                { id: "announcement", label: "Announcement Bar", icon: Megaphone },
                { id: "customers", label: "Customers", icon: Users },
                { id: "analytics", label: "Analytics", icon: BarChart3 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                      isActive 
                        ? "bg-[#542B49] text-white shadow-lg font-bold border border-[#753B64]" 
                        : "text-[#D9C4CF] hover:bg-[#3B1E34] hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
          <div className="pt-6 border-t border-[#3D2036] text-center">
            <p className="text-[11px] text-[#A88B9A] font-medium">Lumière Admin Panel</p>
          </div>
        </aside>

        <main className="flex-grow p-4 sm:p-8 pt-20 sm:pt-24 space-y-8 overflow-y-auto">
          
          <div className="md:hidden bg-[#2A1424] text-white p-4 rounded-2xl flex items-center justify-between shadow-md">
            <div className="flex items-center space-x-2">
              <Store size={18} className="text-[#D9C4CF]" />
              <span className="font-serif font-bold text-sm capitalize">{activeTab}</span>
            </div>
            <button
              onClick={() => setMobileAdminMenuOpen(!mobileAdminMenuOpen)}
              className="px-3.5 py-1.5 bg-[#8C5E73] rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <LayoutDashboard size={14} />
              <span>{mobileAdminMenuOpen ? "Close Menu" : "Admin Menu"}</span>
            </button>
          </div>

          {mobileAdminMenuOpen && (
            <div className="md:hidden bg-[#2A1424] text-[#EFEAE5] p-3 rounded-2xl grid grid-cols-2 gap-2 border border-[#3D2036] shadow-xl">
              {[
                { id: "overview", label: "Overview", icon: LayoutDashboard },
                { id: "products", label: "Products", icon: Package },
                { id: "orders", label: "Orders", icon: ShoppingBag },
                { id: "coupons", label: "Coupons", icon: Tag },
                { id: "announcement", label: "Announcement", icon: Megaphone },
                { id: "customers", label: "Customers", icon: Users },
                { id: "analytics", label: "Analytics", icon: BarChart3 },
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileAdminMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#8C5E73] text-white shadow-md"
                        : "bg-[#3B1E34]/60 text-[#D9C4CF] hover:text-white"
                    }`}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === "overview" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#EFEAE5] border border-[#E5DFDA] p-6 sm:p-8 rounded-3xl shadow-sm">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#F7EBEF] border border-[#E5DFDA] text-[#8C5E73] text-xs font-semibold mb-2">
                    <ShieldCheck size={14} />
                    <span>Verified Admin Portal</span>
                  </div>
                  <h1 className="text-3xl font-serif font-bold text-[#1A120E]">Dashboard Overview</h1>
                  <p className="text-xs sm:text-sm text-[#5E4E46] mt-1">Monitor store activity, revenue trends, and order progress.</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="flex items-center bg-[#FAF7F5] border border-[#E5DFDA] rounded-full px-4 py-2 text-xs font-bold text-[#5E4E46]">
                    <Calendar size={14} className="mr-2 text-[#8C5E73]" />
                    <select 
                      value={dateFilter} 
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="bg-transparent border-none outline-none cursor-pointer text-[#1A120E]"
                    >
                      <option value="today">Today</option>
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>

                  <Link href="/admin/add-product">
                    <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="bg-[#8C5E73] hover:bg-[#784E60] text-white font-medium px-5 py-2.5 rounded-full shadow-md text-xs flex items-center space-x-2 cursor-pointer whitespace-nowrap">
                      <PlusCircle size={16} />
                      <span>Add Product</span>
                    </motion.button>
                  </Link>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-amber-50 border border-amber-200 p-5 rounded-3xl flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-amber-100 rounded-2xl text-amber-800"><Clock size={22} /></div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold text-amber-900">Pending Fulfillment</h4>
                      <p className="text-[11px] text-amber-700">{pendingOrdersCount} order(s) need to be shipped.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("orders")} className="px-4 py-2 bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-full font-bold text-xs cursor-pointer">
                    Manage Orders
                  </button>
                </div>

                <div className={`border p-5 rounded-3xl flex items-center justify-between shadow-xs ${lowStockProducts.length > 0 ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${lowStockProducts.length > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                      {lowStockProducts.length > 0 ? <AlertTriangle size={22} /> : <CheckCircle2 size={22} />}
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-bold">Inventory Status</h4>
                      <p className="text-[11px]">{lowStockProducts.length > 0 ? `${lowStockProducts.length} product(s) stock < 5 (Low Stock)` : 'All product stocks are healthy!'}</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveTab("products")} className={`px-4 py-2 rounded-full font-bold text-xs cursor-pointer ${lowStockProducts.length > 0 ? 'bg-rose-200 hover:bg-rose-300 text-rose-900' : 'bg-emerald-200 hover:bg-emerald-300 text-emerald-900'}`}>
                    View Stock
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-[#EFEAE5] border border-[#E5DFDA] p-6 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#5E4E46] uppercase">Total Revenue</p>
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <TrendingUp size={10} className="mr-0.5" /> +12.5%
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#1A120E] mt-2">Rs. {totalRevenue.toLocaleString()}</h3>
                  </div>
                  <div className="p-4 bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl text-emerald-700 font-bold">Rs.</div>
                </div>
                
                <div className="bg-[#EFEAE5] border border-[#E5DFDA] p-6 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#5E4E46] uppercase">Total Orders</p>
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        <TrendingUp size={10} className="mr-0.5" /> +8.4%
                      </span>
                    </div>
                    <h3 className="text-3xl font-serif font-bold text-[#1A120E] mt-2">{totalOrders}</h3>
                  </div>
                  <div className="p-4 bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl text-[#8C5E73]"><Package size={28} /></div>
                </div>

                <div className="bg-[#EFEAE5] border border-[#E5DFDA] p-6 rounded-3xl shadow-sm flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-semibold text-[#5E4E46] uppercase">Avg. Order Value</p>
                      <span className="inline-flex items-center text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                        <TrendingDown size={10} className="mr-0.5" /> -2.1%
                      </span>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#1A120E] mt-2">Rs. {averageOrderValue.toLocaleString()}</h3>
                  </div>
                  <div className="p-4 bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl text-[#8C5E73]"><TrendingUp size={28} /></div>
                </div>
              </div>

              <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-serif font-bold text-[#1A120E]">Sales Revenue Over Time (Date-wise)</h3>
                  <span className="text-xs text-[#5E4E46] font-medium">Filtered by: {dateFilter.toUpperCase()}</span>
                </div>
                <div className="h-72 w-full">
                  {salesLineChartData.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-[#5E4E46]">No sales data available for this range.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={salesLineChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5DFDA" />
                        <XAxis dataKey="date" tick={{ fill: '#5E4E46', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#5E4E46', fontSize: 11 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#EFEAE5', borderColor: '#E5DFDA', borderRadius: '1rem', color: '#1A120E' }} />
                        <Line type="monotone" dataKey="revenue" stroke="#8C5E73" strokeWidth={3} dot={{ fill: '#8C5E73', r: 4 }} activeDot={{ r: 8 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <h3 className="text-lg font-serif font-bold text-[#1A120E]">Sales by Customer / Order</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={customerBarChartData}>
                        <XAxis dataKey="name" tick={{ fill: '#5E4E46', fontSize: 10 }} />
                        <YAxis tick={{ fill: '#5E4E46', fontSize: 12 }} />
                        <Tooltip contentStyle={{ backgroundColor: '#EFEAE5', borderColor: '#E5DFDA', borderRadius: '1rem', color: '#1A120E' }} />
                        <Bar dataKey="totalAmount" fill="#8C5E73" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                  <h3 className="text-lg font-serif font-bold text-[#1A120E]">Products by Category</h3>
                  <div className="h-64 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={5} dataKey="value" label>
                          {pieChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#EFEAE5', borderColor: '#E5DFDA', borderRadius: '1rem', color: '#1A120E' }} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-serif font-bold text-[#1A120E]">Recent Orders Feed</h3>
                  <button onClick={() => setActiveTab("orders")} className="text-xs font-bold text-[#8C5E73] hover:underline cursor-pointer">View All →</button>
                </div>
                {orders.length === 0 ? (
                  <p className="text-xs text-[#5E4E46]">No orders received yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#E5DFDA] text-[#5E4E46] uppercase text-[10px]">
                          <th className="pb-3">Order ID</th>
                          <th className="pb-3">Customer</th>
                          <th className="pb-3">Amount</th>
                          <th className="pb-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E5DFDA]">
                        {orders.slice(0, 5).map((o) => (
                          <tr key={o._id}>
                            <td className="py-3 font-mono font-bold text-[#8C5E73]">#{o._id.slice(-6).toUpperCase()}</td>
                            <td className="py-3 font-medium text-[#1A120E]">{o.customerDetails?.fullName}</td>
                            <td className="py-3 font-serif font-bold">Rs. {o.totalAmount?.toLocaleString()}</td>
                            <td className="py-3">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                o.status === "Delivered" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                              }`}>
                                {o.status || "Pending"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "products" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5DFDA] pb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#1A120E]">Manage Store Products ({products.length})</h2>
                  <p className="text-xs text-[#5E4E46] mt-0.5">Edit product details, stock levels (Items with stock less than 5 are highlighted in red).</p>
                </div>
                <input type="text" placeholder="Search products..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="w-full sm:w-64 bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl py-2.5 px-4 text-xs font-medium text-[#1A120E]" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E5DFDA] text-[#5E4E46] uppercase text-[11px] tracking-wider">
                      <th className="pb-4 font-semibold">Product</th>
                      <th className="pb-4 font-semibold">Category</th>
                      <th className="pb-4 font-semibold">Price</th>
                      <th className="pb-4 font-semibold">Stock</th>
                      <th className="pb-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFDA] text-[#2C2420]">
                    {filteredProducts.map((p) => {
                      const isLowStock = (p.stock ?? 0) < 5;
                      return (
                        <tr key={p._id} className={`hover:bg-[#FAF7F5]/60 transition-colors ${isLowStock ? 'bg-rose-50/50' : ''}`}>
                          <td className="py-4 flex items-center space-x-3">
                            <img src={p.images?.[0] || p.image || "https://placehold.co/100"} alt="" className="w-12 h-12 rounded-2xl object-cover border border-[#E5DFDA]" />
                            <div>
                              <p className="font-bold text-[#1A120E] line-clamp-1">{p.title}</p>
                              <p className="text-[11px] text-[#5E4E46] line-clamp-1">{p.description}</p>
                            </div>
                          </td>
                          <td className="py-4"><span className="px-3 py-1 bg-[#FAF7F5] border border-[#E5DFDA] text-[#8C5E73] rounded-full text-[11px] font-bold uppercase">{p.category || "General"}</span></td>
                          <td className="py-4 font-serif font-extrabold text-[#1A120E] text-sm sm:text-base">Rs. {p.price?.toLocaleString()}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isLowStock ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-emerald-100 text-emerald-800'}`}>
                              {p.stock ?? 0} left {isLowStock ? '⚠️' : ''}
                            </span>
                          </td>
                          <td className="py-4 text-right space-x-2">
                            <button onClick={() => openEditModal(p)} className="px-3.5 py-1.5 bg-[#FAF7F5] hover:bg-[#8C5E73] text-[#8C5E73] hover:text-white border border-[#E5DFDA] rounded-full font-semibold transition-all cursor-pointer text-xs">Edit</button>
                            <button onClick={() => handleDeleteProduct(p._id)} className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 rounded-full font-semibold transition-all cursor-pointer text-xs">Delete</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "orders" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5DFDA] pb-6">
                <div>
                  <h2 className="text-xl font-serif font-bold text-[#1A120E]">Customer Orders Management</h2>
                  <p className="text-xs text-[#5E4E46] mt-0.5">Change fulfillment status, view detailed receipts, or export sales report.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={exportOrdersToCSV} className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 font-semibold rounded-full text-xs flex items-center justify-center space-x-1 cursor-pointer">
                    <Download size={14} />
                    <span>Export CSV</span>
                  </button>
                  <input type="text" placeholder="Search orders..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} className="w-full sm:w-64 bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl py-2 px-4 text-xs font-medium" />
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#E5DFDA] text-[#5E4E46] uppercase text-[11px] tracking-wider">
                      <th className="pb-4 font-semibold">Order ID</th>
                      <th className="pb-4 font-semibold">Customer</th>
                      <th className="pb-4 font-semibold">Total</th>
                      <th className="pb-4 font-semibold">Status</th>
                      <th className="pb-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5DFDA] text-[#2C2420]">
                    {filteredOrders.map((o) => {
                      const currentStatus = o.status || "Pending";
                      return (
                        <tr key={o._id} className="hover:bg-[#FAF7F5]/60 transition-colors">
                          <td className="py-4 font-mono text-xs text-[#8C5E73] font-bold">#{o._id.slice(-6).toUpperCase()}</td>
                          <td className="py-4">
                            <p className="font-bold text-[#1A120E]">{o.customerDetails?.fullName}</p>
                            <p className="text-[11px] text-[#5E4E46]">{o.customerDetails?.phone}</p>
                          </td>
                          <td className="py-4 font-serif font-extrabold text-[#1A120E] text-base">Rs. {o.totalAmount?.toLocaleString()}</td>
                          <td className="py-4">
                            <select 
                              value={currentStatus} 
                              onChange={(e) => handleStatusChange(o._id, e.target.value)} 
                              className={`text-xs font-bold px-3.5 py-1.5 rounded-full border cursor-pointer transition-all ${
                                currentStatus === "Pending" ? "bg-amber-100 border-amber-300 text-amber-800" :
                                currentStatus === "Shipped" ? "bg-blue-100 border-blue-300 text-blue-800" :
                                currentStatus === "Delivered" ? "bg-emerald-100 border-emerald-300 text-emerald-800" :
                                "bg-rose-100 border-rose-300 text-rose-800"
                              }`}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="py-4 text-right">
                            <button onClick={() => setSelectedOrder(o)} className="px-4 py-1.5 bg-[#FAF7F5] hover:bg-[#8C5E73] text-[#8C5E73] hover:text-white border border-[#E5DFDA] rounded-full font-bold transition-all cursor-pointer text-xs shadow-xs">View Details</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {activeTab === "coupons" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm">
                <h2 className="text-xl font-serif font-bold text-[#1A120E] mb-1">Create Promo Coupon</h2>
                <p className="text-xs text-[#5E4E46] mb-6">Generate discount codes for customers to redeem during checkout.</p>

                <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Coupon Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. LUMIERE20"
                      value={couponForm.code}
                      onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                      className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-mono font-bold text-[#1A120E] uppercase"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Discount (%)</label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      required
                      placeholder="e.g. 20"
                      value={couponForm.discountPercentage}
                      onChange={(e) => setCouponForm({ ...couponForm, discountPercentage: e.target.value })}
                      className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Expiry Date</label>
                    <input
                      type="datetime-local"
                      required
                      value={couponForm.expiryDate}
                      onChange={(e) => setCouponForm({ ...couponForm, expiryDate: e.target.value })}
                      className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isCreatingCoupon}
                    className="w-full bg-[#8C5E73] hover:bg-[#784E60] text-white font-bold py-3 rounded-2xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    {isCreatingCoupon ? "Creating..." : "+ Create Coupon"}
                  </button>
                </form>
              </div>

              <div className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg font-serif font-bold text-[#1A120E] mb-4">Active Promo Codes ({coupons.length})</h3>
                {coupons.length === 0 ? (
                  <p className="text-xs text-[#5E4E46]">No coupons created yet. Add one above!</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {coupons.map((c) => {
                      const isExpired = new Date() > new Date(c.expiryDate);
                      return (
                        <div key={c._id} className="bg-[#FAF7F5] border border-[#E5DFDA] p-4 rounded-2xl flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-extrabold text-sm text-[#8C5E73]">{c.code}</span>
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                {c.discountPercentage}% OFF
                              </span>
                            </div>
                            <p className={`text-[11px] mt-1 font-medium ${isExpired ? "text-rose-600" : "text-[#5E4E46]"}`}>
                              {isExpired ? "Expired" : `Expires: ${new Date(c.expiryDate).toLocaleDateString()}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteCoupon(c._id)}
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === "announcement" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6 max-w-xl">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1A120E]">📢 Manage Announcement Bar</h2>
                <p className="text-xs text-[#5E4E46] mt-0.5">Control the top notification banner text, featured coupon code, or turn it on/off.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Banner Message</label>
                  <input 
                    type="text" 
                    value={announcementText} 
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Featured Coupon Code</label>
                  <input 
                    type="text" 
                    value={announcementCode} 
                    onChange={(e) => setAnnouncementCode(e.target.value)}
                    className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-mono font-bold text-[#1A120E] uppercase"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <input 
                    type="checkbox" 
                    checked={isAnnouncementActive} 
                    onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                    className="w-5 h-5 text-[#8C5E73] accent-[#8C5E73] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#1A120E]">Show Banner on Website (On / Off)</span>
                </div>

                <button 
                  onClick={handleSaveAnnouncement}
                  disabled={isSavingAnnouncement}
                  className="w-full bg-[#8C5E73] hover:bg-[#784E60] text-white py-3 rounded-2xl text-xs font-bold cursor-pointer shadow-md transition-all mt-4"
                >
                  {isSavingAnnouncement ? "Saving..." : "Save & Update Banner"}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "customers" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-[#1A120E]">Registered Customers ({orders.length})</h2>
                <p className="text-xs text-[#5E4E46] mt-0.5">List of buyers who have completed orders on Lumière.</p>
              </div>
              <div className="bg-[#FAF7F5] p-4 rounded-2xl border border-[#E5DFDA] divide-y divide-[#E5DFDA]">
                {orders.map((o, i) => (
                  <div key={i} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3.5 px-2 text-xs gap-2">
                    <div>
                      <p className="font-bold text-[#1A120E] text-sm">{o.customerDetails?.fullName}</p>
                      <p className="text-[#5E4E46] text-xs">📧 {o.customerDetails?.email || "N/A"} | 📞 {o.customerDetails?.phone || "N/A"}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-[#EFEAE5] border border-[#E5DFDA] text-[#8C5E73] rounded-full font-bold text-xs uppercase">City: {o.customerDetails?.city || "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === "analytics" && (
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <h2 className="text-xl font-serif font-bold text-[#1A120E]">Store Analytics & Charts</h2>
              <p className="text-xs text-[#5E4E46]">In-depth performance analytics and sales breakdown.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80 w-full bg-[#FAF7F5] p-4 rounded-2xl border border-[#E5DFDA]">
                  <h3 className="text-sm font-bold mb-2 text-[#1A120E]">Sales Over Time</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <LineChart data={salesLineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis />
                      <Tooltip contentStyle={{ backgroundColor: '#EFEAE5', borderColor: '#E5DFDA', borderRadius: '1rem', color: '#1A120E' }} />
                      <Line type="monotone" dataKey="revenue" stroke="#8C5E73" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-80 w-full bg-[#FAF7F5] p-4 rounded-2xl border border-[#E5DFDA]">
                  <h3 className="text-sm font-bold mb-2 text-[#1A120E]">Category Distribution</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <PieChart>
                      <Pie data={pieChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value" label>
                        {pieChartData.map((_, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}
        </main>
      </div>

      <AnimatePresence>
        {editingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-xl space-y-4">
              <h3 className="text-xl font-serif font-bold text-[#1A120E]">Edit Product & Inventory</h3>
              <form onSubmit={handleUpdateProduct} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Product Title</label>
                  <input type="text" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Price (Rs.)</label>
                    <input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Stock Quantity</label>
                    <input type="number" min="0" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#8C5E73] mb-1 block">Discount Percentage (%)</label>
                    <input type="number" min="0" max="99" value={editForm.discountPercentage} onChange={(e) => setEditForm({ ...editForm, discountPercentage: e.target.value })} placeholder="e.g. 20" className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Flash Sale End Date</label>
                    <input type="datetime-local" value={editForm.saleEndDate} onChange={(e) => setEditForm({ ...editForm, saleEndDate: e.target.value })} className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E]" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#5E4E46] mb-1 block">Description</label>
                  <textarea rows={3} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full bg-[#FAF7F5] border border-[#E5DFDA] rounded-2xl p-3 text-xs font-medium text-[#1A120E] resize-none" />
                </div>
                <div className="flex justify-end space-x-2 pt-2">
                  <button type="button" onClick={() => setEditingProduct(null)} className="px-4 py-2 bg-[#FAF7F5] border border-[#E5DFDA] rounded-full text-xs font-bold text-[#5E4E46] cursor-pointer">Cancel</button>
                  <button type="submit" disabled={isUpdatingProduct} className="px-5 py-2 bg-[#8C5E73] text-white rounded-full text-xs font-bold cursor-pointer">Save Changes</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-[#EFEAE5] border border-[#E5DFDA] rounded-3xl p-6 sm:p-8 w-full max-w-xl shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-serif font-bold text-[#1A120E]">Order Receipt #{selectedOrder._id.slice(-6).toUpperCase()}</h3>
              <p className="text-xs text-[#5E4E46]">Customer: <strong className="text-[#1A120E]">{selectedOrder.customerDetails?.fullName}</strong> ({selectedOrder.customerDetails?.phone})</p>
              <div className="bg-[#FAF7F5] p-4 rounded-2xl border border-[#E5DFDA] space-y-2">
                {selectedOrder.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span>{item.title} (x{item.quantity})</span>
                    <span className="font-bold">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              {selectedOrder.couponApplied && (
                <div className="flex justify-between text-xs text-emerald-700 font-semibold px-1">
                  <span>Promo Applied ({selectedOrder.couponApplied})</span>
                  <span>- Rs. {selectedOrder.discountAmount?.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-[#E5DFDA]">
                <span className="text-xs font-bold uppercase text-[#5E4E46]">Total Amount</span>
                <span className="text-lg font-serif font-bold text-[#8C5E73]">Rs. {selectedOrder.totalAmount?.toLocaleString()}</span>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="w-full py-2.5 bg-[#8C5E73] text-white rounded-full text-xs font-bold cursor-pointer">Close</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}