import mongoose, { Schema, models, model } from "mongoose";
import { IUser } from "@/types/types";

const userSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

export const User = models.User || model<IUser>("User", userSchema);