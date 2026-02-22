"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";
import { useEditorStore } from "@/store/editorStore";
import { buildFileTree, FileItem } from "@/utils/buildFileTree";
import FileTree from "./FileTree";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { FilePlus2, FolderPlus } from "lucide-react";

interface Props {
    projectId: string;
}

type CreateType = "file" | "folder";

type ContextMenuState = {
    x: number;
    y: number;
    item: FileItem;
};

export default function FileSidebar({ projectId }: Props) {
    const router = useRouter();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [createType, setCreateType] = useState<CreateType | null>(null);
    const [createName, setCreateName] = useState("");
    const [createParentPath, setCreateParentPath] = useState("");
    const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
    const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState("");
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    const { selectedPath, openFile, closeTab, renameOpenFile } = useEditorStore();
    const tree = buildFileTree(files);

    useEffect(() => {
        fetchFiles();
    }, [projectId]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "F2" || !selectedItem) return;
            e.preventDefault();
            startRename(selectedItem);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedItem]);

    useEffect(() => {
        const closeContextMenu = () => setContextMenu(null);
        window.addEventListener("click", closeContextMenu);
        return () => window.removeEventListener("click", closeContextMenu);
    }, []);

    const fetchFiles = async () => {
        try {
            const res = await axios.get(`/api/files?projectId=${projectId}`);
            setFiles(res.data.files);
        } catch (error: any) {
            if (error?.response?.status === 401) {
                router.push("/");
                return;
            }
            throw error;
        }
    };

    const normalizeParentPath = (item: FileItem | null) => {
        if (!item) return selectedPath || "";
        if (item.type === "folder") return item.path;
        const lastSlash = item.path.lastIndexOf("/");
        return lastSlash > -1 ? item.path.slice(0, lastSlash) : "";
    };

    const startCreate = (type: CreateType, item: FileItem | null = null) => {
        const parent = normalizeParentPath(item);
        setCreateType(type);
        setCreateParentPath(parent);
        setCreateName("");
        setContextMenu(null);

        if (parent) {
            setOpenFolders((prev) => ({ ...prev, [parent]: true }));
        }
    };

    const cancelCreate = () => {
        setCreateType(null);
        setCreateName("");
        setCreateParentPath("");
    };

    const submitCreate = async () => {
        if (!createType) return;

        const trimmed = createName.trim();
        if (!trimmed) {
            cancelCreate();
            return;
        }

        const fullPath = createParentPath ? `${createParentPath}/${trimmed}` : trimmed;

        if (createType === "file") {
            const language = trimmed.split(".").pop();
            const res = await axios.post("/api/files", {
                name: trimmed,
                path: fullPath,
                language,
                projectId,
            });

            openFile(res.data.file);
        } else {
            await axios.post("/api/files", {
                name: trimmed,
                path: fullPath,
                type: "folder",
                projectId,
            });
            setOpenFolders((prev) => ({ ...prev, [fullPath]: true }));
        }

        await fetchFiles();
        cancelCreate();
    };

    const deleteFile = async (id: string) => {
        await axios.delete(`/api/files/${id}`);
        await fetchFiles();
        closeTab(id);
        if (selectedItem?._id === id) setSelectedItem(null);
        if (renamingId === id) {
            setRenamingId(null);
            setRenameValue("");
        }
    };

    const toggleFolder = (path: string) => {
        setOpenFolders((prev) => ({
            ...prev,
            [path]: !prev[path],
        }));
    };

    const startRename = (item: FileItem) => {
        setContextMenu(null);
        setSelectedItem(item);
        setRenamingId(item._id);
        setRenameValue(item.name);
    };

    const cancelRename = () => {
        setRenamingId(null);
        setRenameValue("");
    };

    const submitRename = async () => {
        if (!renamingId) return;

        const nextName = renameValue.trim();
        if (!nextName) {
            cancelRename();
            return;
        }

        try {
            const res = await axios.patch(`/api/files/${renamingId}`, {
                name: nextName,
            });
            const updated = res.data.file as FileItem;
            renameOpenFile(updated._id, updated.name, updated.path);
            setSelectedItem(updated);
            await fetchFiles();
        } finally {
            cancelRename();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.24 }}
            className="w-full h-full bg-[#0d1422] text-white p-3 relative border-r border-white/10 overflow-y-auto"
        >
            <div className="flex justify-between items-center mb-3 sticky top-0 bg-[#0d1422] py-1 z-10">
                <h2 className="font-semibold tracking-wide text-zinc-200">Explorer</h2>

                <div className="flex gap-2">
                    <button
                        onClick={() => startCreate("file", selectedItem)}
                        className="inline-flex items-center justify-center rounded-md w-8 h-8 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-all hover:scale-[1.05] active:scale-95"
                        aria-label="Create file"
                    >
                        <FilePlus2 size={16} />
                    </button>

                    <button
                        onClick={() => startCreate("folder", selectedItem)}
                        className="inline-flex items-center justify-center rounded-md w-8 h-8 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 transition-all hover:scale-[1.05] active:scale-95"
                        aria-label="Create folder"
                    >
                        <FolderPlus size={16} />
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {createType && (
                    <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className="mb-2 rounded-md border border-white/10 bg-[#101a2a] p-2 shadow-lg"
                    >
                        <p className="text-[11px] text-zinc-400 mb-1">
                            {createType === "file" ? "New File" : "New Folder"}
                            {createParentPath ? ` in ${createParentPath}` : " in root"}
                        </p>
                        <input
                            className="w-full rounded-md px-2.5 py-1.5 bg-[#111a2b] border border-white/15 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                            placeholder={createType === "file" ? "file name..." : "folder name..."}
                            value={createName}
                            onChange={(e) => setCreateName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") submitCreate();
                                if (e.key === "Escape") cancelCreate();
                            }}
                            autoFocus
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <FileTree
                node={tree}
                openFolders={openFolders}
                selectedId={selectedItem?._id || null}
                renamingId={renamingId}
                renameValue={renameValue}
                onRenameValueChange={setRenameValue}
                onStartRename={startRename}
                onRenameSubmit={submitRename}
                onRenameCancel={cancelRename}
                onToggleFolder={toggleFolder}
                onDelete={deleteFile}
                onSelect={setSelectedItem}
                onOpenContextMenu={(e, item) => {
                    setContextMenu({ x: e.clientX, y: e.clientY, item });
                }}
            />

            <AnimatePresence>
                {contextMenu && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="fixed z-50 bg-[#121d2f] border border-white/15 rounded-lg shadow-2xl text-sm overflow-hidden"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {contextMenu.item.type === "folder" && (
                            <>
                                <button
                                    className="block w-full text-left px-3 py-2 hover:bg-[#1d2b43] text-emerald-300 transition-colors"
                                    onClick={() => startCreate("file", contextMenu.item)}
                                >
                                    New File
                                </button>
                                <button
                                    className="block w-full text-left px-3 py-2 hover:bg-[#1d2b43] text-cyan-300 transition-colors"
                                    onClick={() => startCreate("folder", contextMenu.item)}
                                >
                                    New Folder
                                </button>
                            </>
                        )}
                        <button
                            className="block w-full text-left px-3 py-2 hover:bg-[#1d2b43] transition-colors"
                            onClick={() => startRename(contextMenu.item)}
                        >
                            Rename
                        </button>
                        <button
                            className="block w-full text-left px-3 py-2 hover:bg-[#1d2b43] text-red-400 transition-colors"
                            onClick={() => {
                                deleteFile(contextMenu.item._id);
                                setContextMenu(null);
                            }}
                        >
                            Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
