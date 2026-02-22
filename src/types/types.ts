import { Types } from "mongoose";

export interface IUser {
    _id?: Types.ObjectId;
    email: string;
    password: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IProject {
    _id?: Types.ObjectId;
    title: string;
    userId: Types.ObjectId;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IFile {
    _id?: string;
    name: string;
    path: string;
    content?: string;
    language?: string;
    type?: "file" | "folder";
    projectId: string;
    userId?: string;
}

/* 🔐 JWT Payload */
export interface IAuthTokenPayload {
    userId: string;
    email: string;
}

/* 🌍 Generic API Response */
export interface IApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
}

export interface ILoginBody {
    email: string;
    password: string;
}

export interface IJwtPayload {
    userId: string;
    email: string;
}
