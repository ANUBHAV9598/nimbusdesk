import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";

const handler = NextAuth({
    secret: process.env.NEXTAUTH_SECRET || process.env.ACCESS_SECRET,
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        GitHubProvider({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        }),
    ],
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user }) {
            try {
                if (!user?.email) return false;

                await connectDB();
                const existing = await User.findOne({ email: user.email });

                if (!existing) {
                    const randomPassword = Math.random().toString(36) + Date.now().toString(36);
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);
                    await User.create({
                        email: user.email,
                        password: hashedPassword,
                    });
                }

                return true;
            } catch {
                return false;
            }
        },
        async jwt({ token }) {
            if (token?.email) {
                await connectDB();
                const dbUser = await User.findOne({ email: token.email });
                if (dbUser) {
                    (token as any).userId = String(dbUser._id);
                }
            }
            return token;
        },
    },
});

export { handler as GET, handler as POST };
