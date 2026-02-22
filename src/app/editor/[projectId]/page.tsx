"use client";

import { MouseEvent as ReactMouseEvent, useEffect, useRef, useState } from "react";
import FileSidebar from "@/components/FileSidebar";
import CodeEditor from "@/components/CodeEditor";
import EditorTabs from "@/components/EditorTabs";
import { useParams } from "next/navigation";
import { PanelLeftOpen } from "lucide-react";

const SIDEBAR_MIN = 220;
const SIDEBAR_MAX = 520;

export default function EditorPage() {
    const { projectId } = useParams();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(300);

    useEffect(() => {
        if (!isResizingSidebar) return;

        const onMove = (event: MouseEvent) => {
            const delta = event.clientX - dragStartX.current;
            const next = Math.min(
                SIDEBAR_MAX,
                Math.max(SIDEBAR_MIN, dragStartWidth.current + delta)
            );
            setSidebarWidth(next);
        };

        const onUp = () => setIsResizingSidebar(false);

        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "col-resize";

        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isResizingSidebar]);

    const startSidebarResize = (event: ReactMouseEvent) => {
        dragStartX.current = event.clientX;
        dragStartWidth.current = sidebarWidth;
        setIsResizingSidebar(true);
    };

    return (
        <div className="relative flex h-[calc(100dvh-64px)] overflow-hidden bg-[#070b13]">
            {isSidebarOpen && (
                <>
                    <div style={{ width: sidebarWidth }} className="h-full shrink-0">
                        <FileSidebar projectId={projectId as string} />
                    </div>
                    <div
                        className="w-1 h-full shrink-0 cursor-col-resize bg-transparent hover:bg-cyan-500/40"
                        onMouseDown={startSidebarResize}
                    />
                </>
            )}

            <div className="flex-1 flex flex-col min-w-0">
                <EditorTabs
                    isSidebarOpen={isSidebarOpen}
                    onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
                />

                {!isSidebarOpen && (
                    <button
                        onClick={() => setIsSidebarOpen(true)}
                        className="absolute left-3 top-14 z-30 inline-flex items-center gap-2 rounded-md bg-[#101826] border border-white/10 text-zinc-200 px-3 py-1.5 text-xs shadow-lg hover:bg-[#172338]"
                    >
                        <PanelLeftOpen size={14} />
                        Explorer
                    </button>
                )}

                <div className="flex-1 min-h-0">
                    <CodeEditor />
                </div>
            </div>
        </div>
    );
}
