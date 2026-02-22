import { NextRequest } from "next/server";
import { verifyAccessToken } from "./auth";
import { IJwtPayload } from "@/types/types";
import { getToken } from "next-auth/jwt";

export const getUserFromRequest = async (req: NextRequest): Promise<IJwtPayload> => {
    const token = req.cookies.get("accessToken")?.value;

    if (token) {
        const decoded = verifyAccessToken(token);
        return decoded;
    }

    const nextAuthToken = await getToken({
        req: req as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!nextAuthToken) throw new Error("Unauthorized");

    const userId = String((nextAuthToken as any).userId || nextAuthToken.sub || "");
    const email = String(nextAuthToken.email || "");

    if (!userId || !email) throw new Error("Unauthorized");

    return { userId, email };
};
