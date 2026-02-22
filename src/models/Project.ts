import { Schema, model, models } from "mongoose";
import { IProject } from "@/types/types";

const projectSchema = new Schema<IProject>(
    {
        title: {
            type: String,
            required: true,
        },
        userId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: "User",
        },
    },
    { timestamps: true }
);

export const Project = models.Project || model<IProject>("Project", projectSchema);