import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import mongoose from "mongoose";
import Product from "@/models/Products"; // Products model import kar liya stock update karne ke liye

const OrderSchema = new mongoose.Schema({}, { strict: false, timestamps: true });
const Order = mongoose.models.Order || mongoose.model("Order", OrderSchema);

// Order Status Update (PUT) - Order cancel ya update karne ke liye + Stock Restore
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    // 1. Pehle purana order fetch karein taake status check kar sakein
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // 2. Order update karein
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    // 3. Agar status "Cancelled" ho gaya hai (aur pehle Cancelled nahi tha), toh stock wapas restore kar dein
    if (status === "Cancelled" && existingOrder.status !== "Cancelled") {
      if (updatedOrder.items && Array.isArray(updatedOrder.items)) {
        for (const item of updatedOrder.items) {
          // Item ke andar product id (productId ya _id) aur quantity honi chahiye
          const productId = item.productId || item._id;
          const qty = Number(item.quantity) || 1;

          if (productId) {
            await Product.findByIdAndUpdate(productId, {
              $inc: { stock: qty } // Stock mein quantity wapas add kar di
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