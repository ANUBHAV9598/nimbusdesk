import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
    throw new Error("Please define the MONGODB_URI environment variable");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially.
 */
declare global {
  // eslint-disable-next-line no-var
    var mongooseCache:
        | {
              conn: typeof mongoose | null;
              promise: Promise<typeof mongoose> | null;
          }
        | undefined;
}

const cached = global.mongooseCache ?? { conn: null, promise: null };
global.mongooseCache = cached;

export async function connectDB(): Promise<typeof mongoose> {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, {
        dbName: "cloud-editor",
        bufferCommands: false,
        });
    }

    cached.conn = await cached.promise;
    return cached.conn;
}
