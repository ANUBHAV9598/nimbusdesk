import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { File } from "@/models/File";
import { Project } from "@/models/Project";
import { getUserFromRequest } from "@/lib/getUser";

const isValidObjectId = (value: string) => Types.ObjectId.isValid(value);

export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        const { name, path, language, projectId, type } = await req.json();

        if (!name || !path || !projectId) {
            return NextResponse.json({ message: "Missing fields" }, { status: 400 });
        }

        if (!isValidObjectId(projectId)) {
            return NextResponse.json(
                { message: "Invalid project ID" },
                { status: 400 }
            );
        }

        await connectDB();

        const project = await Project.findOne({
            _id: projectId,
            userId: user.userId,
        });

        if (!project) {
            return NextResponse.json(
                { message: "Project not found" },
                { status: 404 }
            );
        }

        if (type === "folder") {
            const folder = await File.create({
                name,
                path,
                type: "folder",
                projectId,
                userId: user.userId,
            });

            return NextResponse.json({ success: true, file: folder });
        }

        const newFile = await File.create({
            name,
            path,
            language,
            type: "file",
            content: "",
            projectId,
            userId: user.userId,
        });

        return NextResponse.json({ success: true, file: newFile });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { message: "Error creating file" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        const projectId = req.nextUrl.searchParams.get("projectId");

        if (!projectId) {
            return NextResponse.json(
                { message: "Project ID is required" },
                { status: 400 }
            );
        }

        if (!isValidObjectId(projectId)) {
            return NextResponse.json(
                { message: "Invalid project ID" },
                { status: 400 }
            );
        }

        await connectDB();

        const files = await File.find({
            projectId,
            userId: user.userId,
        }).sort({ createdAt: -1 });

        return NextResponse.json({ files });
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        return NextResponse.json(
            { message: "Error fetching files" },
            { status: 500 }
        );
    }
}
