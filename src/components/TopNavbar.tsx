"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { AnimatePresence, motion } from "framer-motion";
import { signOut } from "next-auth/react";

type SessionUser = {
    email: string;
    userId: string;
};

const initialsFromEmail = (email?: string) => {
    if (!email) return "GU";
    const first = email[0] || "G";
    const domain = email.split("@")[0]?.[1] || "U";
    return `${first}${domain}`.toUpperCase();
};

export default function TopNavbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState<SessionUser | null>(null);

    const hiddenRoutes = useMemo(() => new Set(["/"]), []);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const shouldHide = hiddenRoutes.has(pathname);

    useEffect(() => {
        if (shouldHide) return;

        const fetchSession = async () => {
            try {
                const res = await axios.get("/api/protected");
                setUser(res.data?.user || null);
            } catch {
                setUser(null);
            }
        };

        fetchSession();
    }, [shouldHide, pathname]);

    useEffect(() => {
        setMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!menuOpen) return;

        const onPointerDown = (event: MouseEvent) => {
            if (!menuRef.current) return;
            const target = event.target as Node;
            if (!menuRef.current.contains(target)) {
                setMenuOpen(false);
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        return () => document.removeEventListener("mousedown", onPointerDown);
    }, [menuOpen]);

    if (shouldHide) return null;

    const onLogout = async () => {
        try {
            setLoading(true);
            await signOut({ redirect: false });
            await axios.post("/api/auth/logout");
            setUser(null);
            router.push("/");
        } finally {
            setLoading(false);
            setMenuOpen(false);
        }
    };

    return (
        <header className="sticky top-0 z-50 h-16 border-b border-white/10 bg-[#0a0f18]/85 backdrop-blur-xl shadow-[0_8px_28px_rgba(0,0,0,0.35)]">
            <div className="mx-auto max-w-7xl h-full px-4 flex items-center justify-between">
                <button
                    className="text-left transition-transform duration-200 hover:scale-[1.01]"
                    onClick={() => router.push("/dashboard")}
                >
                    <p className="text-[11px] uppercase tracking-[0.22em] text-cyan-300">NimbusDesk</p>
                    <p className="text-sm text-zinc-300">Developer Workspace</p>
                </button>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="px-3 py-1.5 rounded-lg border border-transparent text-zinc-200 hover:bg-[#172235] hover:border-white/10 text-sm transition-colors"
                    >
                        Dashboard
                    </button>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setMenuOpen((prev) => !prev)}
                            className="group flex items-center gap-2 rounded-xl border border-white/10 bg-[#101a2a] px-2.5 py-1.5 hover:bg-[#162339] transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-cyan-500 text-black font-semibold grid place-items-center text-xs shadow-[0_0_0_3px_rgba(34,211,238,0.15)] group-hover:shadow-[0_0_0_4px_rgba(34,211,238,0.24)] transition-shadow">
                                {initialsFromEmail(user?.email)}
                            </div>
                            <div className="text-left hidden sm:block">
                                <p className="text-xs text-zinc-200 leading-none">
                                    {user?.email || "Guest"}
                                </p>
                                <p className="text-[11px] text-zinc-400 mt-1 leading-none">
                                    {user ? "Authenticated" : "Not signed in"}
                                </p>
                            </div>
                        </button>

                        <AnimatePresence>
                        {menuOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                                transition={{ duration: 0.18 }}
                                className="absolute right-0 mt-2 w-72 rounded-xl border border-white/10 bg-[#101a2a] shadow-2xl p-3"
                            >
                                <p className="text-xs text-zinc-400">Account</p>
                                <p className="text-sm text-zinc-100 mt-1 break-all">
                                    {user?.email || "No active account"}
                                </p>
                                <p className="text-xs text-zinc-500 mt-1 break-all">
                                    ID: {user?.userId || "-"}
                                </p>

                                <div className="mt-3 border-t border-white/10 pt-3 flex flex-col gap-2">
                                    <button
                                        className="w-full rounded-lg bg-[#192437] hover:bg-[#22324c] text-zinc-100 px-3 py-2 text-sm text-left transition-colors"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            router.push("/dashboard");
                                        }}
                                    >
                                        Manage Projects
                                    </button>
                                    <button
                                        className="w-full rounded-lg bg-[#192437] hover:bg-[#22324c] text-zinc-100 px-3 py-2 text-sm text-left transition-colors"
                                        onClick={() => {
                                            setMenuOpen(false);
                                            window.location.reload();
                                        }}
                                    >
                                        Refresh Account
                                    </button>
                                    <button
                                        disabled={loading}
                                        className="w-full rounded-lg bg-rose-500/90 hover:bg-rose-500 text-white px-3 py-2 text-sm text-left disabled:opacity-60 transition-colors"
                                        onClick={onLogout}
                                    >
                                        {loading ? "Signing out..." : "Sign Out"}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
