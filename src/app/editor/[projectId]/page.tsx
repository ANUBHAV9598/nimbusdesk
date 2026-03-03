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
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizingSidebar, setIsResizingSidebar] = useState(false);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(300);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < 1024);
        onResize();
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            setIsSidebarOpen(false);
        } else {
            setIsSidebarOpen(true);
        }
    }, [isMobile]);

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
        <div className="relative flex h-[calc(100dvh-64px)] min-h-0 overflow-hidden bg-[#070b13]">
            {isSidebarOpen && !isMobile && (
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

            {isSidebarOpen && isMobile && (
                <>
                    <button
                        type="button"
                        className="absolute inset-0 z-20 bg-black/50"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar overlay"
                    />
                    <div className="absolute left-0 top-0 z-30 h-full w-[min(86vw,22rem)] border-r border-white/10 shadow-2xl">
                        <FileSidebar projectId={projectId as string} />
                    </div>
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
                        className="absolute right-2 top-12 z-30 inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-white/10 bg-[#101826] px-2.5 text-[11px] text-zinc-200 shadow-lg hover:bg-[#172338] sm:hidden"
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
