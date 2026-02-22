"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "@/lib/axios";
import { useRouter } from "next/navigation";

export default function AuthForm() {
    const router = useRouter();

    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
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
        <div className="min-h-dvh w-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-md"
            >
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl shadow-2xl p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isSignup ? "signup" : "login"}
                            initial={{ opacity: 0, x: 40 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -40 }}
                            transition={{ duration: 0.35 }}
                        >
                            <h2 className="text-3xl font-bold text-white text-center mb-2">
                                {isSignup ? "Create Account" : "Welcome Back"}
                            </h2>

                            <p className="text-slate-400 text-center mb-6 text-sm">
                                {isSignup ? "Sign up to get started" : "Login to your account"}
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <motion.div whileFocus={{ scale: 1.02 }}>
                                    <input
                                        type="email"
                                        placeholder="Email address"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                    />
                                </motion.div>

                                <motion.div whileFocus={{ scale: 1.02 }}>
                                    <input
                                        type="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                    />
                                </motion.div>

                                {isSignup && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                    >
                                        <input
                                            type="password"
                                            placeholder="Confirm Password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                                        />
                                    </motion.div>
                                )}

                                {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                                <motion.button
                                    whileHover={{ scale: 1.03 }}
                                    whileTap={{ scale: 0.97 }}
                                    disabled={loading}
                                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30 transition disabled:opacity-60"
                                >
                                    {loading ? "Please wait..." : isSignup ? "Sign Up" : "Sign In"}
                                </motion.button>
                            </form>

                            <div className="mt-6 text-center text-sm text-slate-400">
                                {isSignup ? "Already have an account?" : "Don't have an account?"}
                                <button
                                    type="button"
                                    onClick={() => setIsSignup(!isSignup)}
                                    className="ml-2 text-indigo-400 hover:text-indigo-300 font-medium transition"
                                >
                                    {isSignup ? "Sign In" : "Sign Up"}
                                </button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
