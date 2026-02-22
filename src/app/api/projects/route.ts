import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Project } from "@/models/Project";
import { getUserFromRequest } from "@/lib/getUser";

// This Endpoint creates a new project for the authenticated user. It expects a JSON body with a "title" field. If the title is missing, it returns a 400 Bad Request response. If the user is not authenticated, it returns a 401 Unauthorized response.
export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        const { title } = await req.json();

        if (!title) {
            return NextResponse.json(
                { message: "Project title is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const newProject = await Project.create({
            title,
            userId: user.userId,
        });

        return NextResponse.json({
            success: true,
            project: newProject,
        });
    } catch (error) {
        return NextResponse.json(
            { message: "Unauthorized or server error" },
            { status: 401 }
        );
    }
}

// This Endpoint retrieves all projects for the authenticated user, sorted by creation date in descending order. If the user is not authenticated, it returns a 401 Unauthorized response.
export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);

        await connectDB();

        const projects = await Project.find({userId: user.userId,}).sort({ createdAt: -1 });

        return NextResponse.json({ projects });
    } catch (error: any) {
        return NextResponse.json(
            { message: "Unauthorized" },
            { status: 401 }
        );
    }
}
