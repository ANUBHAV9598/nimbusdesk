import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/getUser";

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        return NextResponse.json({ success: true, message: "Protected data", user, data: "This is protected data that only authenticated users can see."});
    } catch (error: any) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }
}
