import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Product from "@/models/Products";
import { redis } from "@/lib/redis";

// GET: Sab products fetch karne ke liye (Redis cache ke sath)
export async function GET() {
  try {
    const cachedProducts = await redis.get("all_products");
    
    if (cachedProducts) {
      const parsedProducts = typeof cachedProducts === "string" ? JSON.parse(cachedProducts) : cachedProducts;
      return NextResponse.json({ success: true, products: parsedProducts, source: "redis-cache" }, { status: 200 });
    }

    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 });

    await redis.set("all_products", JSON.stringify(products), { ex: 300 });

    return NextResponse.json({ success: true, products, source: "mongodb" }, { status: 200 });
  } catch (err: any) {
    console.error("Error fetching products:", err);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// POST: Naya product add karne ke liye (Ye zaroori tha!)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Naya product create karein
    const newProduct = await Product.create(body);

    // Jab naya product bane, toh Redis cache ko clear kar dein taake naya product foran list mein nazar aaye
    await redis.del("all_products");

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (err: any) {
    console.error("Error creating product:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}