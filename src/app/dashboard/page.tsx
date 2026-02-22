"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import axios from "@/lib/axios";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

type Project = {
    _id: string;
    title: string;
    createdAt?: string;
    updatedAt?: string;
};

const formatDate = (value?: string) => {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
};

export default function DashboardPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState("");
    const [error, setError] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [savingId, setSavingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    const latestUpdated = useMemo(() => {
        if (!projects.length) return "No projects yet";
        const sorted = [...projects].sort((a, b) => {
            const aTs = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const bTs = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return bTs - aTs;
        });
        return formatDate(sorted[0].updatedAt || sorted[0].createdAt);
    }, [projects]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const res = await axios.get("/api/projects");
            setProjects(res.data.projects || []);
            setError("");
        } catch (err: any) {
            if (err?.response?.status === 401) {
                router.push("/");
                return;
            }
            setError("Unable to load projects.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        const closeMenu = () => setOpenMenuId(null);
        window.addEventListener("click", closeMenu);
        return () => window.removeEventListener("click", closeMenu);
    }, []);

    const createProject = async () => {
        const nextTitle = title.trim();
        if (!nextTitle) return;

        try {
            setCreating(true);
            const res = await axios.post("/api/projects", { title: nextTitle });
            const project = res.data.project as Project;
            setProjects((prev) => [project, ...prev]);
            setTitle("");
            setError("");
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to create project.");
        } finally {
            setCreating(false);
        }
    };

    const startRename = (project: Project) => {
        setEditingId(project._id);
        setEditingTitle(project.title);
    };

    const cancelRename = () => {
        setEditingId(null);
        setEditingTitle("");
    };

    const submitRename = async () => {
        if (!editingId) return;
        const nextTitle = editingTitle.trim();
        if (!nextTitle) return;

        try {
            setSavingId(editingId);
            const res = await axios.patch(`/api/projects/${editingId}`, {
                title: nextTitle,
            });

            const updated = res.data.project as Project;
            setProjects((prev) =>
                prev.map((project) =>
                    project._id === updated._id ? updated : project
                )
            );
            cancelRename();
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to rename project.");
        } finally {
            setSavingId(null);
        }
    };

    const deleteProject = async (projectId: string) => {
        const confirmed = window.confirm(
            "Delete this project and all its files permanently?"
        );
        if (!confirmed) return;

        try {
            setDeletingId(projectId);
            await axios.delete(`/api/projects/${projectId}`);
            setProjects((prev) => prev.filter((project) => project._id !== projectId));
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to delete project.");
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#10274a_0%,_#0a0d14_35%,_#05070c_100%)] text-white">
            <div className="mx-auto max-w-6xl px-6 py-10">
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 md:p-8"
                >
                    <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-cyan-300 text-sm tracking-[0.18em] uppercase">Workspace</p>
                            <h1 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">
                                Build Faster, Ship Cleaner
                            </h1>
                            <p className="mt-2 text-zinc-300 max-w-xl">
                                Create coding projects, jump into the editor, and iterate without friction.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                                <p className="text-xs text-zinc-400">Projects</p>
                                <p className="text-2xl font-semibold">{projects.length}</p>
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-3">
                                <p className="text-xs text-zinc-400">Last Updated</p>
                                <p className="text-sm font-medium">{latestUpdated}</p>
                            </div>
                        </div>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.06 }}
                    className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:p-5"
                >
                    <div className="flex flex-col gap-3 md:flex-row">
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && createProject()}
                            placeholder="New project name"
                            className="flex-1 rounded-xl border border-white/15 bg-black/30 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <button
                            onClick={createProject}
                            disabled={creating}
                            className="rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-semibold px-5 py-3 disabled:opacity-60"
                        >
                            {creating ? "Creating..." : "Create Project"}
                        </button>
                    </div>
                    {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
                </motion.section>

                <section className="mt-8">
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-xl font-semibold tracking-tight">Your Projects</h2>
                        <button
                            onClick={fetchProjects}
                            className="text-sm text-cyan-300 hover:text-cyan-200"
                        >
                            Refresh
                        </button>
                    </div>

                    {loading ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-zinc-300">
                            Loading projects...
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center text-zinc-300">
                            No projects yet. Create your first project above.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project, index) => (
                                <motion.article
                                    key={project._id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.35, delay: index * 0.04 }}
                                    className="relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-5 flex flex-col cursor-pointer hover:border-cyan-400/40 hover:bg-white/[0.08] transition-colors"
                                    onClick={() => {
                                        if (editingId === project._id) return;
                                        router.push(`/editor/${project._id}`);
                                    }}
                                >
                                    <div className="absolute top-3 right-3">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId((prev) =>
                                                    prev === project._id ? null : project._id
                                                );
                                            }}
                                            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-zinc-300 hover:bg-white/10"
                                            aria-label="Project actions"
                                        >
                                            <MoreVertical size={16} />
                                        </button>

                                        {openMenuId === project._id && editingId !== project._id && (
                                            <div
                                                className="absolute right-0 mt-1 w-36 rounded-lg border border-white/15 bg-[#121a2a] shadow-xl overflow-hidden"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => {
                                                        startRename(project);
                                                        setOpenMenuId(null);
                                                    }}
                                                    className="w-full px-3 py-2 text-left text-xs text-zinc-200 hover:bg-[#1c2a42] inline-flex items-center gap-2"
                                                >
                                                    <Pencil size={13} />
                                                    Rename
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        deleteProject(project._id);
                                                        setOpenMenuId(null);
                                                    }}
                                                    disabled={deletingId === project._id}
                                                    className="w-full px-3 py-2 text-left text-xs text-rose-300 hover:bg-[#1c2a42] inline-flex items-center gap-2 disabled:opacity-60"
                                                >
                                                    <Trash2 size={13} />
                                                    {deletingId === project._id ? "Deleting..." : "Delete"}
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    <p className="text-xs uppercase tracking-[0.12em] text-cyan-300">Project</p>
                                    {editingId === project._id ? (
                                        <input
                                            value={editingTitle}
                                            onChange={(e) => setEditingTitle(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") submitRename();
                                                if (e.key === "Escape") cancelRename();
                                            }}
                                            className="mt-2 w-full rounded-md border border-white/20 bg-black/30 px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                            autoFocus
                                        />
                                    ) : (
                                        <h3 className="mt-2 text-lg font-semibold truncate">{project.title}</h3>
                                    )}
                                    <p className="mt-1 text-xs text-zinc-400">
                                        Updated {formatDate(project.updatedAt || project.createdAt)}
                                    </p>

                                    <div className="mt-5 flex gap-2 flex-wrap">
                                        {editingId === project._id ? (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        submitRename();
                                                    }}
                                                    disabled={savingId === project._id}
                                                    className="rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-medium px-3 py-2 disabled:opacity-60"
                                                >
                                                    {savingId === project._id ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        cancelRename();
                                                    }}
                                                    className="rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-medium px-3 py-2"
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </motion.article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
