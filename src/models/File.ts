import { Schema, model, models } from "mongoose";
import { IFile } from "@/types/types";

const fileSchema = new Schema(
    {
        name: String,
        path: String,
        content: { type: String, default: "" },
        language: String,
        projectId: {
            type: Schema.Types.ObjectId,
            ref: "Project",
        },
        type: {
            type: String,
            enum: ["file", "folder"],
            default: "file",
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
        }
    },
    { timestamps: true }
);
export const File = models.File || model<IFile>("File", fileSchema);