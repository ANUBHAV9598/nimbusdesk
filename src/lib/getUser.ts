import { NextRequest } from "next/server";
import { verifyAccessToken } from "./auth";
import { IJwtPayload } from "@/types/types";

export const getUserFromRequest = (req: NextRequest): IJwtPayload => {
    const token = req.cookies.get("accessToken")?.value;

    if (!token) throw new Error("Unauthorized");

    const decoded = verifyAccessToken(token);

    return decoded;
};