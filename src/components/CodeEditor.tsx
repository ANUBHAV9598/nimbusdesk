"use client";

import { useEffect, useRef, useState } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useEditorStore } from "@/store/editorStore";
import axios from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bot,
    Check,
    Code2,
    Eye,
    PanelBottomClose,
    PanelBottomOpen,
    Play,
    Save,
    Copy,
    Send,
    Settings2,
    TerminalSquare,
    Type,
    WrapText,
    Minimize2,
    Columns2,
    Rows2,
    PanelRightClose,
    PanelRightOpen,
} from "lucide-react";

type RunResult = {
    mode?: "text" | "preview";
    output?: string;
    previewHtml?: string;
};

type ChatResult = {
    reply?: string;
};

type BottomView = "output" | "preview";
type OutputDock = "bottom" | "right";
type SaveState = "idle" | "saving" | "saved" | "error";

type EditorTheme = "vs-dark" | "hc-black" | "ce-midnight" | "ce-carbon";
type ChatMessage = { role: "user" | "assistant"; content: string };

type EditorSettings = {
    theme: EditorTheme;
    minimap: boolean;
    wordWrap: boolean;
    fontSize: number;
};

const OUTPUT_MIN = 140;
const OUTPUT_MAX = 520;
const OUTPUT_WIDTH_MIN = 280;
const OUTPUT_WIDTH_MAX = 720;
const AI_PANEL_WIDTH_MIN = 320;
const AI_PANEL_WIDTH_MAX = 760;
const SETTINGS_KEY = "cloud-editor.settings.v1";

const defaultSettings: EditorSettings = {
    theme: "vs-dark",
    minimap: false,
    wordWrap: false,
    fontSize: 14,
};

const themeOptions: { value: EditorTheme; label: string }[] = [
    { value: "vs-dark", label: "Dark+" },
    { value: "ce-midnight", label: "Midnight Blue" },
    { value: "ce-carbon", label: "Carbon Night" },
    { value: "hc-black", label: "High Contrast Dark" },
];

const defineCustomThemes = (monaco: any) => {
    monaco.editor.defineTheme("ce-midnight", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "5C7A99" },
            { token: "keyword", foreground: "7AA2F7" },
            { token: "string", foreground: "9ECE6A" },
            { token: "number", foreground: "E0AF68" },
            { token: "type", foreground: "BB9AF7" },
        ],
        colors: {
            "editor.background": "#0B1020",
            "editor.foreground": "#D9E6FF",
            "editor.lineHighlightBackground": "#151D36",
            "editorLineNumber.foreground": "#4B5E86",
            "editorCursor.foreground": "#7AA2F7",
            "editor.selectionBackground": "#2A3A5E",
        },
    });

    monaco.editor.defineTheme("ce-carbon", {
        base: "vs-dark",
        inherit: true,
        rules: [
            { token: "comment", foreground: "7D8597" },
            { token: "keyword", foreground: "58A6FF" },
            { token: "string", foreground: "7EE787" },
            { token: "number", foreground: "D2A8FF" },
            { token: "type", foreground: "79C0FF" },
        ],
        colors: {
            "editor.background": "#0D1117",
            "editor.foreground": "#E6EDF3",
            "editor.lineHighlightBackground": "#161B22",
            "editorLineNumber.foreground": "#6E7681",
            "editorCursor.foreground": "#58A6FF",
            "editor.selectionBackground": "#264F78",
        },
    });
};

export default function CodeEditor() {
    const { activeTab, openTabs, updateFileContent, markFileSaved } = useEditorStore();
    const [output, setOutput] = useState("");
    const [previewHtml, setPreviewHtml] = useState("");
    const [running, setRunning] = useState(false);
    const [chatLoading, setChatLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
        {
            role: "assistant",
            content: "NimbusDesk Chatbot ready. Ask me to debug, optimize, refactor, or explain your code.",
        },
    ]);
    const [bottomView, setBottomView] = useState<BottomView>("output");
    const [isOutputOpen, setIsOutputOpen] = useState(true);
    const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
    const [outputDock, setOutputDock] = useState<OutputDock>("bottom");
    const [outputHeight, setOutputHeight] = useState(240);
    const [outputWidth, setOutputWidth] = useState(420);
    const [isResizingOutput, setIsResizingOutput] = useState(false);
    const [isResizingOutputWidth, setIsResizingOutputWidth] = useState(false);
    const [aiPanelWidth, setAiPanelWidth] = useState(420);
    const [isResizingAiPanel, setIsResizingAiPanel] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [saveState, setSaveState] = useState<SaveState>("idle");
    const [settings, setSettings] = useState<EditorSettings>(defaultSettings);
    const [cursorInfo, setCursorInfo] = useState({ line: 1, col: 1 });
    const [copiedMsgIndex, setCopiedMsgIndex] = useState<number | null>(null);

    const shellRef = useRef<HTMLDivElement | null>(null);
    const dragStartY = useRef(0);
    const dragStartHeight = useRef(240);
    const dragStartX = useRef(0);
    const dragStartWidth = useRef(420);
    const aiDragStartX = useRef(0);
    const aiDragStartWidth = useRef(420);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const settingsRef = useRef<HTMLDivElement | null>(null);
    const chatEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (!raw) return;
        try {
            const parsed = JSON.parse(raw) as Partial<EditorSettings>;
            setSettings((prev) => ({
                theme: (parsed.theme as EditorTheme) || prev.theme,
                minimap: typeof parsed.minimap === "boolean" ? parsed.minimap : prev.minimap,
                wordWrap: typeof parsed.wordWrap === "boolean" ? parsed.wordWrap : prev.wordWrap,
                fontSize:
                    typeof parsed.fontSize === "number" && parsed.fontSize >= 11 && parsed.fontSize <= 22
                        ? parsed.fontSize
                        : prev.fontSize,
            }));
        } catch {
            // ignore invalid local settings
        }
    }, []);

    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, chatLoading]);

    useEffect(() => {
        if (!isResizingOutput) return;
        const onMove = (event: MouseEvent) => {
            const delta = dragStartY.current - event.clientY;
            const base = dragStartHeight.current + delta;
            const containerHeight = shellRef.current?.clientHeight || 800;
            const max = Math.min(OUTPUT_MAX, Math.max(OUTPUT_MIN, containerHeight - 180));
            setOutputHeight(Math.min(max, Math.max(OUTPUT_MIN, base)));
        };
        const onUp = () => setIsResizingOutput(false);
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp);
        document.body.style.userSelect = "none";
        document.body.style.cursor = "row-resize";
        return () => {
            window.removeEventListener("mousemove", onMove);
            window.removeEventListener("mouseup", onUp);
            document.body.style.userSelect = "";
            document.body.style.cursor = "";
        };
    }, [isResizingOutput]);

    useEffect(() => {
        if (!isResizingOutputWidth) return;
        const onMove = (event: MouseEvent) => {
            const delta = dragStartX.current - event.clientX;
            const base = dragStartWidth.current + delta;
            const containerWidth = shellRef.current?.clientWidth || 1200;
            const max = Math.min(OUTPUT_WIDTH_MAX, Math.max(OUTPUT_WIDTH_MIN, containerWidth - 320));
            setOutputWidth(Math.min(max, Math.max(OUTPUT_WIDTH_MIN, base)));
        };
        const onUp = () => setIsResizingOutputWidth(false);
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
    }, [isResizingOutputWidth]);

    useEffect(() => {
        if (!isResizingAiPanel) return;

        const onMove = (event: MouseEvent) => {
            const delta = aiDragStartX.current - event.clientX;
            const base = aiDragStartWidth.current + delta;
            const containerWidth = shellRef.current?.clientWidth || 1200;
            const max = Math.min(
                AI_PANEL_WIDTH_MAX,
                Math.max(AI_PANEL_WIDTH_MIN, containerWidth - 380)
            );
            setAiPanelWidth(Math.min(max, Math.max(AI_PANEL_WIDTH_MIN, base)));
        };

        const onUp = () => setIsResizingAiPanel(false);

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
    }, [isResizingAiPanel]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            const isCmdOrCtrl = event.metaKey || event.ctrlKey;
            if (!activeTab) return;
            if (isCmdOrCtrl && event.key.toLowerCase() === "enter") {
                event.preventDefault();
                runCode();
            }
            if (isCmdOrCtrl && event.key.toLowerCase() === "s") {
                event.preventDefault();
                saveFile(activeTab._id, activeTab.content || "");
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [activeTab]);

    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, []);

    useEffect(() => {
        if (!settingsOpen) return;
        const onPointerDown = (event: MouseEvent) => {
            if (!settingsRef.current) return;
            const target = event.target as Node;
            if (!settingsRef.current.contains(target)) setSettingsOpen(false);
        };
        const onEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") setSettingsOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onEscape);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onEscape);
        };
    }, [settingsOpen]);

    const saveFile = async (id: string, content: string) => {
        try {
            setSaveState("saving");
            await axios.put(`/api/files/${id}`, { content });
            markFileSaved(id, content);
            setSaveState("saved");
            setTimeout(() => setSaveState("idle"), 1200);
        } catch {
            setSaveState("error");
        }
    };

    const scheduleSave = (id: string, content: string) => {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => saveFile(id, content), 600);
    };

    const handleChange = (value: string | undefined) => {
        if (!activeTab) return;
        const newContent = value || "";
        updateFileContent(activeTab._id, newContent);
        scheduleSave(activeTab._id, newContent);
    };

    const runCode = async () => {
        if (!activeTab) return;
        try {
            setRunning(true);
            const res = await axios.post<RunResult>("/api/run", {
                code: activeTab.content || "",
                language: activeTab.language || "",
                files: openTabs.map((tab) => ({
                    _id: tab._id,
                    name: tab.name,
                    language: tab.language,
                    content: tab.content,
                })),
            });
            const data = res.data;
            const hasPreview = data.mode === "preview" && !!data.previewHtml;
            setOutput(data.output || "No output");
            setPreviewHtml(hasPreview ? data.previewHtml || "" : "");
            setBottomView(hasPreview ? "preview" : "output");
            setIsOutputOpen(true);
        } catch (error: any) {
            setPreviewHtml("");
            setBottomView("output");
            setIsOutputOpen(true);
            setOutput(error?.response?.data?.output || error?.response?.data?.message || "Execution failed");
        } finally {
            setRunning(false);
        }
    };

    const sendChat = async () => {
        if (!activeTab) return;
        const message = chatInput.trim();
        if (!message) return;
        setChatInput("");
        setChatLoading(true);
        setIsAiPanelOpen(true);
        setChatMessages((prev) => [...prev, { role: "user", content: message }]);

        try {
            const res = await axios.post<ChatResult>("/api/ai/chat", {
                message,
                code: activeTab.content || "",
                language: activeTab.language || "",
                fileName: activeTab.name,
                output: output || "",
            });
            setChatMessages((prev) => [
                ...prev,
                { role: "assistant", content: res.data.reply || "No reply generated." },
            ]);
        } catch (error: any) {
            setChatMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: error?.response?.data?.message || "Chat request failed.",
                },
            ]);
        } finally {
            setChatLoading(false);
        }
    };

    const handleEditorMount: OnMount = (editor) => {
        editor.onDidChangeCursorPosition((e: any) => {
            setCursorInfo({ line: e.position.lineNumber, col: e.position.column });
        });
    };

    if (!activeTab) {
        return <div className="flex-1 flex items-center justify-center text-zinc-300">Open a file to start</div>;
    }

    const saveLabel =
        saveState === "saving"
            ? "Saving..."
            : saveState === "saved"
            ? "Saved"
            : saveState === "error"
            ? "Save failed"
            : "Ready";

    const hasPreview = Boolean(previewHtml);

    const outputTabs = (
        <div className="h-10 border-b border-white/10 bg-zinc-950/80 px-2 flex items-center gap-1">
            <button
                onClick={() => setBottomView("output")}
                className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs ${
                    bottomView === "output" ? "bg-zinc-700 text-white" : "text-zinc-300 hover:bg-zinc-800"
                }`}
            >
                <TerminalSquare size={13} />
                Output
            </button>
            {hasPreview && (
                <button
                    onClick={() => setBottomView("preview")}
                    className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-xs ${
                        bottomView === "preview" ? "bg-zinc-700 text-white" : "text-zinc-300 hover:bg-zinc-800"
                    }`}
                >
                    <Eye size={13} />
                    Preview
                </button>
            )}
        </div>
    );

    const chatView = (
        <div className="h-full flex flex-col bg-[#0c1322]">
            <div className="flex-1 overflow-auto p-3 space-y-2">
                {chatMessages.map((m, i) => (
                    <div
                        key={`${m.role}-${i}`}
                        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                            m.role === "user"
                                ? "ml-auto bg-cyan-500/20 text-cyan-100 border border-cyan-500/30"
                                : "mr-auto bg-[#172338] text-zinc-100 border border-white/10"
                        }`}
                    >
                        {m.role === "assistant" ? (
                            <div className="space-y-2">
                                <div className="overflow-auto rounded-md bg-[#0b1020] border border-white/10 p-2">
                                    <pre className="m-0 text-xs text-zinc-100 whitespace-pre-wrap">
                                        {m.content}
                                    </pre>
                                </div>
                                <button
                                    onClick={async () => {
                                        await navigator.clipboard.writeText(m.content);
                                        setCopiedMsgIndex(i);
                                        setTimeout(() => setCopiedMsgIndex(null), 1200);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-md bg-[#1d2b43] hover:bg-[#253a5c] px-2 py-1 text-[11px] text-zinc-100"
                                >
                                    {copiedMsgIndex === i ? <Check size={12} /> : <Copy size={12} />}
                                    {copiedMsgIndex === i ? "Copied" : "Copy"}
                                </button>
                            </div>
                        ) : (
                            m.content
                        )}
                    </div>
                ))}
                {chatLoading && (
                    <div className="mr-auto rounded-lg px-3 py-2 text-sm bg-[#172338] text-zinc-300 border border-white/10">
                        Thinking...
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <div className="border-t border-white/10 p-2 flex items-end gap-2">
                <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChat();
                        }
                    }}
                    placeholder="Ask chatbot about current code..."
                    className="flex-1 rounded-md border border-white/15 bg-[#111a2b] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/60 resize-none min-h-10 max-h-32"
                />
                <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    className="inline-flex items-center gap-1 rounded-md bg-cyan-500 px-3 py-2 text-sm font-medium text-black hover:bg-cyan-400 disabled:opacity-60"
                >
                    <Send size={14} />
                    Send
                </button>
            </div>
        </div>
    );

    const outputBody = (
        <div className="flex-1 min-h-0">
            <AnimatePresence mode="wait">
                {bottomView === "preview" && hasPreview ? (
                    <motion.div key="preview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full bg-white">
                        <iframe title="code-preview" className="w-full h-full" sandbox="allow-scripts" srcDoc={previewHtml} />
                    </motion.div>
                ) : (
                    <motion.pre
                        key="output"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full m-0 bg-black text-emerald-400 p-3 overflow-auto whitespace-pre-wrap text-sm"
                    >
                        {output || "Output will appear here"}
                    </motion.pre>
                )}
            </AnimatePresence>
        </div>
    );

    const clearChat = () => {
        setChatMessages([
            {
                role: "assistant",
                content: "NimbusDesk Chatbot ready. Ask me to debug, optimize, refactor, or explain your code.",
            },
        ]);
        setChatInput("");
    };

    return (
        <motion.div ref={shellRef} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }} className="h-full flex flex-col bg-[#0d111b]">
            <div className="sticky top-0 z-20 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl">
                <div className="px-3 py-2 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-sm text-zinc-100 truncate">{activeTab.name}</p>
                        <div className="flex items-center gap-2 text-xs text-zinc-400">
                            <Code2 size={12} />
                            <span>{activeTab.language || "plaintext"}</span>
                            <span className="text-zinc-600">|</span>
                            <span>Ln {cursorInfo.line}, Col {cursorInfo.col}</span>
                            <span className="text-zinc-600">|</span>
                            <span>{saveLabel}</span>
                        </div>
                    </div>

                    <div ref={settingsRef} className="relative flex items-center gap-2">
                        <button onClick={() => setSettingsOpen((p) => !p)} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#121a29] px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-[#18233a]">
                            <Settings2 size={14} />
                            Editor
                        </button>
                        <button
                            onClick={() => setIsAiPanelOpen((prev) => !prev)}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#121a29] px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-[#18233a]"
                        >
                            {isAiPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
                            AI Panel
                        </button>
                        <button
                            onClick={() => {
                                setOutputDock((prev) => (prev === "bottom" ? "right" : "bottom"));
                                setIsOutputOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#121a29] px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-[#18233a]"
                        >
                            {outputDock === "bottom" ? <Columns2 size={14} /> : <Rows2 size={14} />}
                            {outputDock === "bottom" ? "Dock Right" : "Dock Bottom"}
                        </button>
                        <button onClick={() => setIsOutputOpen((p) => !p)} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#121a29] px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-[#18233a]">
                            {isOutputOpen ? <PanelBottomClose size={14} /> : <PanelBottomOpen size={14} />}
                            {isOutputOpen ? "Hide Output" : "Show Output"}
                        </button>
                        <button onClick={() => saveFile(activeTab._id, activeTab.content || "")} className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-[#121a29] px-2.5 py-1.5 text-xs text-zinc-200 hover:bg-[#18233a]">
                            <Save size={14} />
                            Save
                        </button>
                        <button onClick={runCode} disabled={running} className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400 disabled:opacity-60">
                            <Play size={14} />
                            {running ? "Running..." : "Run"}
                        </button>

                        <AnimatePresence>
                            {settingsOpen && (
                                <motion.div initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.98 }} className="absolute right-0 top-11 w-72 rounded-xl border border-white/10 bg-[#111827] p-3 shadow-2xl">
                                    <p className="text-xs text-zinc-400 mb-2">Editor Preferences</p>
                                    <label className="block text-xs text-zinc-400 mb-1">Theme</label>
                                    <select
                                        value={settings.theme}
                                        onChange={(e) => setSettings((prev) => ({ ...prev, theme: e.target.value as EditorTheme }))}
                                        className="w-full mb-2 rounded-md border border-white/15 bg-[#0f172a] px-2 py-1.5 text-sm text-zinc-100"
                                    >
                                        {themeOptions.map((opt) => (
                                            <option key={opt.value} value={opt.value}>
                                                {opt.label}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <button onClick={() => setSettings((prev) => ({ ...prev, wordWrap: !prev.wordWrap }))} className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs ${settings.wordWrap ? "bg-cyan-500/20 text-cyan-200" : "bg-[#0f172a] text-zinc-300"}`}>
                                            <WrapText size={13} />
                                            Wrap
                                        </button>
                                        <button onClick={() => setSettings((prev) => ({ ...prev, minimap: !prev.minimap }))} className={`inline-flex items-center justify-center gap-1 rounded-md px-2 py-1.5 text-xs ${settings.minimap ? "bg-cyan-500/20 text-cyan-200" : "bg-[#0f172a] text-zinc-300"}`}>
                                            <Minimize2 size={13} />
                                            Minimap
                                        </button>
                                    </div>
                                    <label className="block text-xs text-zinc-400 mb-1">Font Size</label>
                                    <div className="flex items-center gap-2">
                                        <Type size={14} className="text-zinc-400" />
                                        <input type="range" min={11} max={22} value={settings.fontSize} onChange={(e) => setSettings((prev) => ({ ...prev, fontSize: Number(e.target.value) }))} className="w-full" />
                                        <span className="text-xs text-zinc-300 w-6 text-right">{settings.fontSize}</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            <div className="flex-1 min-h-0 min-w-0 flex">
                <div className="flex-1 min-h-0 min-w-0 flex flex-col">
                    {outputDock === "right" && isOutputOpen ? (
                        <div className="flex-1 min-h-0 min-w-0 flex">
                            <div className="flex-1 min-h-0 min-w-0 border-b border-white/10">
                                <Editor
                                    beforeMount={defineCustomThemes}
                                    onMount={handleEditorMount}
                                    height="100%"
                                    theme={settings.theme}
                                    language={activeTab.language || "plaintext"}
                                    value={activeTab.content}
                                    onChange={handleChange}
                                    options={{
                                        minimap: { enabled: settings.minimap },
                                        fontSize: settings.fontSize,
                                        fontFamily:
                                            "var(--font-jetbrains-mono), 'JetBrains Mono', Consolas, 'Courier New', monospace",
                                        smoothScrolling: true,
                                        scrollBeyondLastLine: false,
                                        wordWrap: settings.wordWrap ? "on" : "off",
                                    }}
                                />
                            </div>
                            <div
                                className="w-1 h-full shrink-0 cursor-col-resize bg-transparent hover:bg-cyan-500/40"
                                onMouseDown={(event) => {
                                    dragStartX.current = event.clientX;
                                    dragStartWidth.current = outputWidth;
                                    setIsResizingOutputWidth(true);
                                }}
                            />
                            <div
                                className="shrink-0 min-h-0 flex flex-col border-l border-white/10"
                                style={{ width: outputWidth }}
                            >
                                {outputTabs}
                                {outputBody}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 min-h-0 min-w-0 border-b border-white/10">
                                <Editor
                                    beforeMount={defineCustomThemes}
                                    onMount={handleEditorMount}
                                    height="100%"
                                    theme={settings.theme}
                                    language={activeTab.language || "plaintext"}
                                    value={activeTab.content}
                                    onChange={handleChange}
                                    options={{
                                        minimap: { enabled: settings.minimap },
                                        fontSize: settings.fontSize,
                                        fontFamily:
                                            "var(--font-jetbrains-mono), 'JetBrains Mono', Consolas, 'Courier New', monospace",
                                        smoothScrolling: true,
                                        scrollBeyondLastLine: false,
                                        wordWrap: settings.wordWrap ? "on" : "off",
                                    }}
                                />
                            </div>
                            {isOutputOpen && (
                                <>
                                    <div
                                        className="h-1 shrink-0 cursor-row-resize bg-transparent hover:bg-cyan-500/40"
                                        onMouseDown={(event) => {
                                            dragStartY.current = event.clientY;
                                            dragStartHeight.current = outputHeight;
                                            setIsResizingOutput(true);
                                        }}
                                    />
                                    <div
                                        className="shrink-0 min-h-0 flex flex-col"
                                        style={{ height: outputHeight }}
                                    >
                                        {outputTabs}
                                        {outputBody}
                                    </div>
                                </>
                            )}
                        </>
                    )}
                </div>

                {isAiPanelOpen && (
                    <>
                        <div
                            className="w-1 h-full shrink-0 cursor-col-resize bg-transparent hover:bg-cyan-500/40"
                            onMouseDown={(event) => {
                                aiDragStartX.current = event.clientX;
                                aiDragStartWidth.current = aiPanelWidth;
                                setIsResizingAiPanel(true);
                            }}
                        />
                        <aside
                            className="shrink-0 h-full border-l border-white/10 bg-[#0f1728]"
                            style={{ width: aiPanelWidth }}
                        >
                            <div className="h-full flex flex-col">
                                <div className="h-10 border-b border-white/10 px-2.5 flex items-center justify-between">
                                    <div className="inline-flex items-center gap-2 text-xs text-cyan-200">
                                        <Bot size={13} />
                                        AI Chat
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={clearChat}
                                            className="text-zinc-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            onClick={() => setIsAiPanelOpen(false)}
                                            className="text-zinc-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-white/10"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                                {chatView}
                            </div>
                        </aside>
                    </>
                )}
            </div>
        </motion.div>
    );
}
