import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";
import { IUser } from "@/types/types";


export async function POST(request: NextRequest) {
    try {
        const { email, password }: IUser = await request.json();

        if(!email || !password) {
            return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
        }

        await connectDB();

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if(existingUser) {
            return NextResponse.json({ success: false, message: "User already exists" }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ email, password: hashedPassword });
        await newUser.save();

        return NextResponse.json({ success: true, message: "User registered successfully", data: { id: newUser._id, email: newUser.email } }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ success: false, message: "Error registering user" }, { status: 500 });
    }
}