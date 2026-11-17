import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Product from "@/models/Products";
import { redis } from "@/lib/redis";

// Single Product Fetch karne ke liye (GET with Redis Cache)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cacheKey = `product_${id}`;

    // 1. Pehle Redis Cache check karein
    const cachedProduct = await redis.get(cacheKey);
    if (cachedProduct) {
      return NextResponse.json({ success: true, product: cachedProduct, source: "redis-cache" }, { status: 200 });
    }

    // 2. Agar cache mein nahi hai, toh MongoDB se fetch karein
    await dbConnect();
    const product = await Product.findById(id);

    if (!product) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // 3. Product ko Redis mein save kar dein (e.g., 300 seconds / 5 mins expiry)
    await redis.set(cacheKey, product, { ex: 300 });

    return NextResponse.json({ success: true, product, source: "mongodb" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [GET SINGLE PRODUCT ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Product Update (Edit) karne ke liye (PUT with Cache Invalidation)
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const { title, price, description, discountPercentage, saleEndDate, category, image, stock } = body;

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { 
        title, 
        price: price !== undefined ? Number(price) : undefined, 
        description, 
        stock: stock !== undefined ? Number(stock) : undefined,
        discountPercentage: discountPercentage !== undefined ? Number(discountPercentage) : 0,
        saleEndDate: saleEndDate ? new Date(saleEndDate) : null,
        category,
        image
      },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // 4. Purana cache clear kar dein (both single product and main products list)
    await redis.del(`product_${id}`);
    await redis.del("all_products");

    return NextResponse.json({ success: true, message: "Product updated successfully", product: updatedProduct }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [UPDATE PRODUCT ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// Product Delete karne ke liye (DELETE with Cache Invalidation)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 });
    }

    // 5. Delete hone par bhi cache clear kar dein
    await redis.del(`product_${id}`);
    await redis.del("all_products");

    return NextResponse.json({ success: true, message: "Product deleted successfully" }, { status: 200 });
  } catch (error: any) {
    console.error("❌ [DELETE PRODUCT ERROR]:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}