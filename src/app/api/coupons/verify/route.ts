import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Coupon from "@/models/Coupon";

export async function POST(req: Request) {
  try {
    await dbConnect();
    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ success: false, message: "Please provide a coupon code." }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

    if (!coupon) {
      return NextResponse.json({ success: false, message: "Invalid coupon code." }, { status: 404 });
    }

    // Check if expired
    if (new Date() > new Date(coupon.expiryDate)) {
      return NextResponse.json({ success: false, message: "This coupon has expired." }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discountPercentage: coupon.discountPercentage,
      message: `Coupon applied successfully! ${coupon.discountPercentage}% OFF`
    }, { status: 200 });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}