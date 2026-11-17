import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ratelimit } from '@/lib/ratelimit'; // Rate limiter import kiya

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check (Brute-force OTP guessing rokne ke liye)
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Bohat ziyaada ghalat koshishein ho gayi hain. Baraye meharbaani 1 minute baad koshish karein." 
        }, 
        { 
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }

    await dbConnect();
    const { email, otp } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found!" }, { status: 400 });
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "User already verified!" }, { status: 200 });
    }

    // OTP aur Expiry check karein
    if (user.otp !== otp || new Date() > user.otpExpires) {
      return NextResponse.json({ error: "Invalid or expired OTP!" }, { status: 400 });
    }

    // Account verify kar dein aur OTP clear kar dein
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    return NextResponse.json({ message: "Account verified successfully!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}