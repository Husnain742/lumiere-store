import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { ratelimit } from '@/lib/ratelimit'; // Rate limiter import kar liya

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check (IP based)
    const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Bohat ziyaada requests aa gayi hain. Baraye meharbaani kuch der baad koshish karein." 
        }, 
        { 
          status: 429, // 429 Too Many Requests
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": reset.toString(),
          }
        }
      );
    }

    await dbConnect();
    const { name, email, password } = await req.json();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists!" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 6-digit OTP generate karna
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user',
      isVerified: false,
      otp,
      otpExpires,
    });

    // Nodemailer transporter setup
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NEXT_PUBLIC_ADMIN_EMAIL,
        pass: process.env.EMAIL_PASS, // Gmail App Password
      },
    });

    // Email bhejna
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your E-Commerce Account OTP',
      html: `<h2>Your OTP Code is: <b>${otp}</b></h2><p>Valid for 10 minutes.</p>`,
    });

    return NextResponse.json({ message: "OTP sent to your email!" }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}