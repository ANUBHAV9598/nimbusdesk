"use client";

import { useEditorStore } from "@/store/editorStore";
import { PanelLeft, PanelLeftClose, X } from "lucide-react";
import { motion } from "framer-motion";

interface Props {
    isSidebarOpen?: boolean;
    onToggleSidebar?: () => void;
}

export default function EditorTabs({ isSidebarOpen, onToggleSidebar }: Props) {
    const { openTabs, activeTab, setActiveTab, closeTab } = useEditorStore();

    return (
        <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="h-11 flex items-stretch bg-[#0f1626] border-b border-white/10 text-white"
        >
            <div className="flex items-center px-2 border-r border-white/10">
                <button
                    onClick={onToggleSidebar}
                    className="inline-flex items-center justify-center w-8 h-8 rounded-md text-zinc-300 hover:bg-[#1a2740] transition-colors"
                    aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                    {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
                </button>
            </div>

            <div className="flex-1 min-w-0 flex items-stretch overflow-x-auto">
                {openTabs.map((tab) => {
                    const isUnsaved = tab.content !== tab.savedContent;
                    const isActive = activeTab?._id === tab._id;

                    return (
                        <button
                            key={tab._id}
                            className={`group relative inline-flex items-center gap-2 px-4 text-sm border-r border-white/10 min-w-0 transition-colors ${
                                isActive
                                    ? "bg-[#16213a] text-white shadow-[inset_0_-2px_0_0_rgba(34,211,238,0.9)]"
                                    : "bg-transparent text-zinc-300 hover:bg-[#111d32]"
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            <span className="truncate max-w-44">{tab.name}</span>
                            {isUnsaved && <span className="text-amber-400">•</span>}
                            <X
                                size={14}
                                className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-red-400 transition"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    closeTab(tab._id);
                                }}
                            />
                        </button>
                    );
                })}
            </div>
        </motion.div>
    );
}
