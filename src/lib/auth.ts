import jwt from "jsonwebtoken";
import { IJwtPayload } from "@/types/types";

export const verifyAccessToken = (token: string): IJwtPayload => {
    const decoded = jwt.verify(
        token,
        process.env.ACCESS_SECRET as string
    );

    if (typeof decoded === "string") {
        throw new Error("Invalid token");
    }

    return decoded as IJwtPayload;
};