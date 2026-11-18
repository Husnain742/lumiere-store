import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import Product from "@/models/Products";

// Order Schema matching your order creation route
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

const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// Order Status Update (PUT) - Order cancel/update + Safe Stock Restoring
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // 1. Fetch existing order to check previous status
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // 2. Update order status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    // 3. If order is newly cancelled, safely restore product stock using item._id
    if (status === "Cancelled" && existingOrder.status !== "Cancelled") {
      if (updatedOrder.items && Array.isArray(updatedOrder.items)) {
        for (const item of updatedOrder.items) {
          const productId = item._id || item.productId || item.id;
          const qty = Number(item.quantity) || 1;

          if (productId) {
            await Product.findByIdAndUpdate(productId, {
              $inc: { stock: qty } // Stock safely gets restored back
            });
          }
        }
      }
    }

    return NextResponse.json(
      { success: true, message: "Order status updated and stock restored successfully", order: updatedOrder },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ [UPDATE ORDER STATUS ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}