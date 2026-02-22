"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";
import { Code2, ShieldCheck, Sparkles } from "lucide-react";
import { signIn } from "next-auth/react";

export default function AuthForm() {
    const router = useRouter();

    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [oauthLoading, setOauthLoading] = useState<"google" | "github" | "">("");
    const [error, setError] = useState("");

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setError("");
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");

        if (isSignup && password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const payload = { email, password };

            if (isSignup) {
                await axios.post("/api/auth/signup", payload);
                await axios.post("/api/auth/login", payload);
            } else {
                await axios.post("/api/auth/login", payload);
            }

            resetForm();
            router.push("/dashboard");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh w-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_left,#16346b_0%,#0c1322_40%,#070b13_100%)] px-4">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-blue-500/10 blur-3xl" />

            <div className="relative z-10 min-h-dvh grid place-items-center">
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="w-full max-w-md"
                >
                    <div className="mb-5 text-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-1.5 text-cyan-200 text-xs tracking-[0.16em] uppercase">
                            <Sparkles size={13} />
                            NimbusDesk
                        </div>
                        <h1 className="mt-3 text-3xl font-semibold text-white tracking-tight">
                            {isSignup ? "Create Your Workspace" : "Welcome Back to NimbusDesk"}
                        </h1>
                        <p className="mt-2 text-sm text-slate-300">
                            AI-powered cloud IDE for modern development.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#111827]/75 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.45)] p-6">
                        <div className="mb-5 grid grid-cols-2 gap-2 rounded-lg bg-black/20 p-1">
                            <button
                                type="button"
                                onClick={() => setIsSignup(false)}
                                className={`rounded-md py-2 text-sm transition ${
                                    !isSignup ? "bg-cyan-500 text-black font-medium" : "text-zinc-300 hover:bg-white/5"
                                }`}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsSignup(true)}
                                className={`rounded-md py-2 text-sm transition ${
                                    isSignup ? "bg-cyan-500 text-black font-medium" : "text-zinc-300 hover:bg-white/5"
                                }`}
                            >
                                Sign Up
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.form
                                key={isSignup ? "signup" : "login"}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.22 }}
                                onSubmit={handleSubmit}
                                className="space-y-3"
                            >
                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5">Email</label>
                                    <input
                                        type="email"
                                        placeholder="you@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-3 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-zinc-400 mb-1.5">Password</label>
                                    <input
                                        type="password"
                                        placeholder="Enter password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-3 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                    />
                                </div>

                                {isSignup && (
                                    <div>
                                        <label className="block text-xs text-zinc-400 mb-1.5">Confirm Password</label>
                                        <input
                                            type="password"
                                            placeholder="Re-enter password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full px-3 py-2.5 rounded-lg bg-[#0f172a] border border-white/10 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                        />
                                    </div>
                                )}

                                {error && (
                                    <p className="text-red-400 text-xs rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-2">
                                        {error}
                                    </p>
                                )}

                                <button
                                    disabled={loading}
                                    className="w-full mt-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2.5 disabled:opacity-60 transition"
                                >
                                    {loading
                                        ? "Please wait..."
                                        : isSignup
                                        ? "Create Account"
                                        : "Sign In"}
                                </button>
                            </motion.form>
                        </AnimatePresence>

                        <div className="my-4 flex items-center gap-3">
                            <div className="h-px flex-1 bg-white/10" />
                            <span className="text-[11px] text-zinc-500 uppercase tracking-[0.15em]">
                                or continue with
                            </span>
                            <div className="h-px flex-1 bg-white/10" />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={async () => {
                                    setOauthLoading("google");
                                    await signIn("google", { callbackUrl: "/dashboard" });
                                }}
                                disabled={oauthLoading !== ""}
                                className="rounded-lg border border-white/15 bg-[#0f172a] hover:bg-[#162239] text-zinc-100 py-2 text-sm disabled:opacity-60"
                            >
                                {oauthLoading === "google" ? "Connecting..." : "Google"}
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    setOauthLoading("github");
                                    await signIn("github", { callbackUrl: "/dashboard" });
                                }}
                                disabled={oauthLoading !== ""}
                                className="rounded-lg border border-white/15 bg-[#0f172a] hover:bg-[#162239] text-zinc-100 py-2 text-sm disabled:opacity-60"
                            >
                                {oauthLoading === "github" ? "Connecting..." : "GitHub"}
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-zinc-400">
                            <div className="rounded-md border border-white/10 bg-black/20 p-2 inline-flex items-center gap-1.5">
                                <ShieldCheck size={12} />
                                Secure Auth
                            </div>
                            <div className="rounded-md border border-white/10 bg-black/20 p-2 inline-flex items-center gap-1.5">
                                <Code2 size={12} />
                                Cloud Coding
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
