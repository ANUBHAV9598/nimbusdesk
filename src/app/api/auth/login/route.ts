import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ILoginBody } from "@/types/types";


export async function POST(req: NextRequest) {
    try {
        const { email, password }: ILoginBody = await req.json();

        if(!email || !password) {
            return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
        }

        await connectDB();

        const user = await User.findOne({ email });

        if(!user) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if(!isMatch) {
            return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
        }

        const accessToken = jwt.sign({ userId: user._id, email: user.email }, process.env.ACCESS_SECRET!, { expiresIn: "1h" });
        const refreshToken = jwt.sign({ userId: user._id, email: user.email }, process.env.REFRESH_SECRET!, { expiresIn: "7d" });
        
        
        const response = NextResponse.json({
            success: true,
            message: "Login successful",
            user: {
                id: user._id,
                email: user.email,
            },
        });
        
        response.cookies.set("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60,
            path: "/"
        });
        
        response.cookies.set("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 7 * 24 * 60 * 60,
            path: "/"
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ message: "Internal server error" }, { status: 500 });
    }
}
