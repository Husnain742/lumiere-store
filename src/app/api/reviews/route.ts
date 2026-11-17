import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Review from "@/models/Review";
import { redis } from "@/lib/redis";

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!MONGODB_URI) throw new Error("Please define MONGODB_URI");
  await mongoose.connect(MONGODB_URI);
}

// GET: Fetch reviews for a specific product (With Redis Cache)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ message: "Product ID is required" }, { status: 400 });
    }

    const cacheKey = `reviews_${productId}`;

    // 1. Pehle Redis Cache check karein
    const cachedReviews = await redis.get(cacheKey);
    if (cachedReviews) {
      return NextResponse.json({ reviews: cachedReviews, source: "redis-cache" }, { status: 200 });
    }

    // 2. Agar cache mein nahi hai, toh MongoDB se fetch karein
    await connectDB();
    const reviews = await Review.find({ productId }).sort({ createdAt: -1 });

    // 3. Reviews ko Redis mein save kar dein (e.g., 300 seconds / 5 mins expiry)
    await redis.set(cacheKey, reviews, { ex: 300 });

    return NextResponse.json({ reviews, source: "mongodb" }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}

// POST: Add a new review (With Cache Invalidation)
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { productId, customerName, rating, comment, image } = body;

    if (!productId || !customerName || !rating || !comment) {
      return NextResponse.json({ message: "All required fields must be filled" }, { status: 400 });
    }

    const newReview = await Review.create({
      productId,
      customerName,
      rating,
      comment,
      image: image || "",
    });

    // 4. Jaise hi naya review aaye, us product ka purana reviews cache delete kar dein
    await redis.del(`reviews_${productId}`);

    return NextResponse.json({ message: "Review added successfully", review: newReview }, { status: 201 });
  } catch (error: any) {
    console.error("Error saving review:", error);
    return NextResponse.json({ message: "Internal Server Error", error: error.message }, { status: 500 });
  }
}