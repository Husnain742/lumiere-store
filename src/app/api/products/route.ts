import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Products";
import { redis } from "@/lib/redis";

export async function GET() {
  try {
    // 1. Pehle Redis Cache check karein
    const cachedProducts = await redis.get("all_products");
    if (cachedProducts) {
      return NextResponse.json({ success: true, products: cachedProducts, source: "redis-cache" }, { status: 200 });
    }

    // 2. Agar cache mein nahi hai, toh MongoDB se fetch karo
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 });

    // 3. Data ko Redis mein save kar do (5 mins expiry)
    await redis.set("all_products", products, { ex: 300 });

    return NextResponse.json({ success: true, products, source: "mongodb" }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching products:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}