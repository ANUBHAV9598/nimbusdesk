import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { getUserFromRequest } from "@/lib/getUser";
import { Project } from "@/models/Project";
import { File } from "@/models/File";

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getUserFromRequest(req);
        const { id } = await context.params;
        const { title } = await req.json();

        const nextTitle = String(title || "").trim();
        if (!nextTitle) {
            return NextResponse.json(
                { message: "Project title is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const project = await Project.findOneAndUpdate(
            { _id: id, userId: user.userId },
            { $set: { title: nextTitle } },
            { new: true }
        );

        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, project });
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

        const project = await Project.findOneAndDelete({
            _id: id,
            userId: user.userId,
        });

        if (!project) {
            return NextResponse.json({ message: "Project not found" }, { status: 404 });
        }

        await File.deleteMany({
            projectId: id,
            userId: user.userId,
        });

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
}
