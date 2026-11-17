import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import { ratelimit } from '@/lib/ratelimit'; // Rate limiter import kiya

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check (Spamming rokne ke liye)
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Bohat ziyaada requests aa gayi hain. Baraye meharbaani kuch der baad koshish karein." 
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
    const { email } = await req.json();

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found!" }, { status: 400 });
    }

    // Naya 6-digit OTP generate karein
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email bhejna
    await transporter.sendMail({
      from: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
      to: email,
      subject: 'Resend: Verify your E-Commerce Account OTP',
      html: `<h2>Your New OTP Code is: <b>${otp}</b></h2><p>Valid for 10 minutes.</p>`,
    });

    return NextResponse.json({ message: "OTP resent successfully!" }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}