import { NextResponse } from "next/server";
import mongoose from "mongoose";
import axios from "axios";
import { getServerSession } from "next-auth";
import { ratelimit } from "@/lib/ratelimit";

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }
  if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
  }
  await mongoose.connect(MONGODB_URI, { bufferCommands: false });
}

// Product Reference Schema
const ProductSchema = new mongoose.Schema({
  title: String,
  price: Number,
  stock: Number,
  images: [String],
  image: String,
  discountPercentage: Number,
  saleEndDate: Date,
}, { strict: false });

if (mongoose.models.Product) {
  delete mongoose.models.Product;
}
const Product = mongoose.model("Product", ProductSchema);

// Coupon Schema
const CouponSchema = new mongoose.Schema({
  code: String,
  discountPercentage: Number,
  expiryDate: Date,
  isActive: Boolean,
});

if (mongoose.models.Coupon) {
  delete mongoose.models.Coupon;
}
const Coupon = mongoose.model("Coupon", CouponSchema);

// Order Schema
const OrderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  customerDetails: {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    city: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true },
  },
  paymentInfo: {
    method: { type: String, default: "cod" },
    paymentStatus: { type: String, default: "Pending" },
    last4: { type: String },
  },
  items: { type: Array, required: true },
  couponApplied: { type: String, default: null },
  discountAmount: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  status: { type: String, default: "Pending" },
  createdAt: { type: Date, default: Date.now },
});

if (mongoose.models.Order) {
  delete mongoose.models.Order;
}
const Order = mongoose.model("Order", OrderSchema);

// Helper function to format WhatsApp numbers for UltraMsg
function formatWhatsAppNumber(phone: string): string {
  if (!phone) return "";
  let cleaned = phone.trim().replace(/[\s\-\+\(\)]/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "92" + cleaned.slice(1);
  } else if (cleaned.length === 10 && cleaned.startsWith("3")) {
    cleaned = "92" + cleaned;
  }
  return cleaned;
}

// Helper function to send WhatsApp notifications via UltraMsg
async function sendWhatsAppNotification(phone: string, message: string) {
  try {
    const instanceId = process.env.WHATSAPP_INSTANCE_ID;
    const token = process.env.WHATSAPP_TOKEN;

    if (!instanceId || !token) {
      console.warn("WhatsApp credentials missing in .env");
      return;
    }

    const formattedPhone = formatWhatsAppNumber(phone);
    const url = `https://api.ultramsg.com/${instanceId}/messages/chat`;

    const response = await axios.post(url, {
      token: token,
      to: formattedPhone,
      body: message,
    });

    console.log("✅ UltraMsg WhatsApp message sent successfully:", response.data);
  } catch (error: any) {
    console.error("❌ UltraMsg notification failed:", error?.response?.data || error?.message || error);
  }
}

// POST: Order Creation (Stock instantly decreases here)
export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { message: "Bohat ziyaada order requests aa gayi hain. Baraye meharbaani kuch der baad koshish karein." }, 
        { status: 429 }
      );
    }

    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized: Please sign in to place an order." }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { customerDetails, items, paymentInfo, couponCode } = body;

    if (!customerDetails || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: "Invalid order data or empty cart" }, { status: 400 });
    }

    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const quantity = Number(item.quantity);
      const prodId = item._id || item.productId;
      
      if (!prodId || isNaN(quantity) || quantity <= 0) {
        return NextResponse.json({ message: "Invalid item quantity or product ID detected." }, { status: 400 });
      }

      // Safe query with MongoDB ObjectId validation
      const dbProduct = await Product.findById(prodId);
      if (!dbProduct) {
        console.error(`❌ Product not found for ID: ${prodId}`);
        return NextResponse.json({ message: `Product not found: ${prodId}` }, { status: 404 });
      }

      if ((dbProduct.stock ?? 0) < quantity) {
        return NextResponse.json({ message: `Insufficient stock for "${dbProduct.title}". Available: ${dbProduct.stock}` }, { status: 400 });
      }

      const isSaleActive = dbProduct.saleEndDate ? new Date().getTime() < new Date(dbProduct.saleEndDate).getTime() : false;
      const hasDiscount = Boolean(dbProduct.discountPercentage && dbProduct.discountPercentage > 0 && isSaleActive);
      const originalPrice = Number(dbProduct.price);
      const effectivePrice = hasDiscount ? originalPrice - (originalPrice * dbProduct.discountPercentage) / 100 : originalPrice;

      subtotal += effectivePrice * quantity;
      verifiedItems.push({
        _id: dbProduct._id,
        title: dbProduct.title,
        price: effectivePrice,
        originalPrice: originalPrice,
        quantity: quantity,
        image: dbProduct.images?.[0] || dbProduct.image || "",
      });
    }

    let discountAmount = 0;
    let appliedCouponName = null;

    if (couponCode) {
      const validCoupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim(), isActive: true });
      if (validCoupon && new Date() <= new Date(validCoupon.expiryDate)) {
        discountAmount = (subtotal * validCoupon.discountPercentage) / 100;
        appliedCouponName = validCoupon.code;
      }
    }

    const finalTotalAmount = Math.max(0, subtotal - discountAmount);

    // INSTANT STOCK DECREASE WHEN ORDER IS PLACED
    for (const vItem of verifiedItems) {
      const updateResult = await Product.findByIdAndUpdate(vItem._id, {
        $inc: { stock: -vItem.quantity },
      });
      console.log(`📦 Stock updated for product ${vItem.title}: -${vItem.quantity}`, updateResult);
    }

    const isCard = customerDetails.paymentMethod === "card";
    const newOrder = await Order.create({
      userEmail: session.user.email,
      customerDetails,
      paymentInfo: {
        method: isCard ? "card" : "cod",
        paymentStatus: isCard ? "Paid" : "Pending",
        last4: isCard && paymentInfo?.last4 ? String(paymentInfo.last4).slice(-4) : undefined,
      },
      items: verifiedItems,
      couponApplied: appliedCouponName,
      discountAmount: Number(discountAmount.toFixed(2)),
      totalAmount: Number(finalTotalAmount.toFixed(2)),
      status: "Pending",
    });

    if (customerDetails.phone) {
      const orderShortId = newOrder._id.toString().slice(-6).toUpperCase();
      const paymentText = isCard ? "Paid via Card" : "Cash on Delivery";
      const message = `Hello ${customerDetails.fullName}! ✨ Aapka Lumière store par order #${orderShortId} (${paymentText}) successfully place ho gaya hai. Total Amount: Rs. ${finalTotalAmount.toLocaleString()}. Shukriya!`;

      sendWhatsAppNotification(customerDetails.phone, message).catch((err) =>
        console.error("Background WhatsApp Error:", err)
      );
    }

    return NextResponse.json({ message: "Order placed successfully", orderId: newOrder._id }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error saving order / decreasing stock:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// GET: Secure Order Fetching
export async function GET(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const isAdmin = session.user.email === ADMIN_EMAIL;

    const query = isAdmin
      ? {}
      : {
          $or: [
            { userEmail: session.user.email },
            { "customerDetails.email": session.user.email },
          ],
        };

    const orders = await Order.find(query).sort({ createdAt: -1 });
    return NextResponse.json({ orders }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ message: "Failed to fetch orders", error: error.message }, { status: 500 });
  }
}

// PATCH: Admin Status Update (Handles Admin changes cleanly without messing with stock)
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession();
    if (!session || session.user?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ message: "Forbidden: Admin only." }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ message: "Order ID and status are required" }, { status: 400 });
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // If admin explicitly cancels an order from dashboard, restore stock back
    if (status === "Cancelled" && existingOrder.status !== "Cancelled") {
      if (existingOrder.items && Array.isArray(existingOrder.items)) {
        for (const item of existingOrder.items) {
          const productId = item._id || item.productId;
          const qty = Number(item.quantity) || 1;
          if (productId) {
            await Product.findByIdAndUpdate(productId, {
              $inc: { stock: qty }
            });
            console.log(`🔄 Stock restored for cancelled order item ${productId}: +${qty}`);
          }
        }
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

    const customerPhone = updatedOrder.customerDetails?.phone;
    const customerName = updatedOrder.customerDetails?.fullName || "Customer";

    if (customerPhone) {
      const orderShortId = updatedOrder._id.toString().slice(-6).toUpperCase();
      const message = `Hello ${customerName}! 📦 Aapka Lumière store ka order #${orderShortId} ka status update ho kar *${status}* ho gaya hai. Shukriya! ✨`;

      sendWhatsAppNotification(customerPhone, message).catch((err) =>
        console.error("Background Status WhatsApp Error:", err)
      );
    }

    return NextResponse.json({ message: "Order status updated successfully", order: updatedOrder }, { status: 200 });
  } catch (error: any) {
    console.error("Error updating order status:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}