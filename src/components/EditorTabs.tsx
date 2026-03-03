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
            className="h-11 min-w-0 flex items-stretch border-b border-white/10 bg-[#0f1626] text-white"
        >
            <div className="flex shrink-0 items-center border-r border-white/10 px-2">
                <button
                    onClick={onToggleSidebar}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-300 transition-colors hover:bg-[#1a2740]"
                    aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                >
                    {isSidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
                </button>
            </div>

            <div className="flex min-w-0 flex-1 items-stretch overflow-x-auto">
                {openTabs.map((tab) => {
                    const isUnsaved = tab.content !== tab.savedContent;
                    const isActive = activeTab?._id === tab._id;

                    return (
                        <button
                            key={tab._id}
                            className={`group relative inline-flex min-w-0 items-center gap-2 border-r border-white/10 px-2.5 text-sm transition-colors sm:px-4 ${
                                isActive
                                    ? "bg-[#16213a] text-white shadow-[inset_0_-2px_0_0_rgba(34,211,238,0.9)]"
                                    : "bg-transparent text-zinc-300 hover:bg-[#111d32]"
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            <span className="max-w-28 truncate sm:max-w-44">{tab.name}</span>
                            {isUnsaved && <span className="text-amber-400">*</span>}
                            <X
                                size={14}
                                className="text-zinc-400 opacity-100 transition hover:text-red-400 md:opacity-0 md:group-hover:opacity-100"
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
