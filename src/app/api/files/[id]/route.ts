import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { File } from "@/models/File";
import { getUserFromRequest } from "@/lib/getUser";

const escapeRegex = (value: string) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req);
        const { id } = await context.params;

        await connectDB();

        const file = await File.findOne({ _id: id, userId: user.userId });

        if (!file) {
            return NextResponse.json({ message: "File not found" }, { status: 404 });
        }

        return NextResponse.json({ file });
    } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}

export async function PUT(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req);
        const { id } = await context.params;

        const { content } = await req.json();

        await connectDB();
        const updatedFile = await File.findByIdAndUpdate(
            { _id: id, userId: user.userId },
            { $set: { content } },
            { new: true }
        );

        if (!updatedFile) {
            return NextResponse.json({ message: "File not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, file: updatedFile });
    } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req);
        const { id } = await context.params;
        const { name } = await req.json();

        const nextName = String(name || "").trim();
        if (!nextName || nextName.includes("/")) {
            return NextResponse.json({ message: "Invalid file name" }, { status: 400 });
        }

        await connectDB();
        const file = await File.findOne({ _id: id, userId: user.userId });

        if (!file) {
            return NextResponse.json({ message: "File not found" }, { status: 404 });
        }

        if (file.name === nextName) {
            return NextResponse.json({ success: true, file });
        }

        const parts = String(file.path).split("/");
        parts[parts.length - 1] = nextName;
        const newPath = parts.join("/");
        const oldPath = String(file.path);

        const conflict = await File.findOne({
            _id: { $ne: file._id },
            userId: user.userId,
            projectId: file.projectId,
            path: newPath,
        });

        if (conflict) {
            return NextResponse.json(
                { message: "A file or folder with this name already exists" },
                { status: 409 }
            );
        }

        file.name = nextName;
        file.path = newPath;
        await file.save();

        if (file.type === "folder") {
            const descendants = await File.find({
                userId: user.userId,
                projectId: file.projectId,
                path: { $regex: `^${escapeRegex(oldPath)}/` },
            });

            await Promise.all(
                descendants.map((descendant) => {
                    descendant.path = String(descendant.path).replace(oldPath, newPath);
                    return descendant.save();
                })
            );
        }

        return NextResponse.json({ success: true, file });
    } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}

export async function DELETE(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req);
        const { id } = await context.params;

        await connectDB();
        const file = await File.findOne({ _id: id, userId: user.userId });

        if (!file) {
            return NextResponse.json({ message: "File not found" }, { status: 404 });
        }

        await File.deleteOne({ _id: id, userId: user.userId });

        if (file.type === "folder") {
            await File.deleteMany({
                userId: user.userId,
                projectId: file.projectId,
                path: { $regex: `^${escapeRegex(file.path)}/` },
            });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}
