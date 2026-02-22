"use client";

import { KeyboardEvent, MouseEvent } from "react";
import { useEditorStore } from "@/store/editorStore";
import { getFileIcon } from "@/utils/getFileIcon";
import { FileItem, FileTreeNode } from "@/utils/buildFileTree";
import { Trash2 } from "lucide-react";

interface Props {
    node: Record<string, FileTreeNode>;
    openFolders: Record<string, boolean>;
    selectedId: string | null;
    renamingId: string | null;
    renameValue: string;
    onRenameValueChange: (value: string) => void;
    onStartRename: (file: FileItem) => void;
    onRenameSubmit: () => void;
    onRenameCancel: () => void;
    onToggleFolder: (path: string) => void;
    onDelete: (id: string) => void;
    onSelect: (file: FileItem) => void;
    onOpenContextMenu: (e: MouseEvent, file: FileItem) => void;
}

const getParentPath = (path: string) => {
    const idx = path.lastIndexOf("/");
    return idx > -1 ? path.slice(0, idx) : "";
};

export default function FileTree({
    node,
    openFolders,
    selectedId,
    renamingId,
    renameValue,
    onRenameValueChange,
    onStartRename,
    onRenameSubmit,
    onRenameCancel,
    onToggleFolder,
    onDelete,
    onSelect,
    onOpenContextMenu,
}: Props) {
    const { setSelectedPath, openFile } = useEditorStore();

    if (!node) return null;

    const handleRenameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") onRenameSubmit();
        if (e.key === "Escape") onRenameCancel();
    };

    return Object.values(node).map((item) => {
        const fileData = item.fileData;
        const isSelected = fileData?._id ? selectedId === fileData._id : false;
        const isRenaming = fileData?._id ? renamingId === fileData._id : false;

        return (
            <div key={item.path} className="ml-3">
                {item.type === "folder" ? (
                    <>
                        <div
                            className={`group cursor-pointer flex justify-between items-center rounded-md px-1 py-0.5 transition-colors ${
                                isSelected
                                    ? "bg-cyan-500/15 text-cyan-200"
                                    : "text-zinc-300 hover:bg-[#1a2740]"
                            }`}
                            onClick={() => {
                                onToggleFolder(item.path);
                                if (fileData) onSelect(fileData);
                                setSelectedPath(item.path);
                            }}
                            onContextMenu={(e) => {
                                if (!fileData) return;
                                e.preventDefault();
                                onSelect(fileData);
                                onOpenContextMenu(e, fileData);
                            }}
                        >
                            <span className="flex items-center gap-2 flex-1 min-w-0">
                                {getFileIcon(item.name, item.type, fileData?.language)}
                                {isRenaming ? (
                                    <input
                                        value={renameValue}
                                        onChange={(e) => onRenameValueChange(e.target.value)}
                                        onKeyDown={handleRenameKeyDown}
                                        onBlur={onRenameSubmit}
                                        className="w-full rounded px-2 py-1 bg-[#111a2b] border border-white/15 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                        autoFocus
                                    />
                                ) : (
                                    <span className="truncate">{item.name}</span>
                                )}
                            </span>

                            {fileData?._id && !isRenaming && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(fileData._id);
                                    }}
                                    className="text-red-400 p-1.5 rounded hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition"
                                    aria-label={`Delete ${item.name}`}
                                    title="Delete"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>

                        {openFolders[item.path] && (
                            <FileTree
                                node={item.children}
                                openFolders={openFolders}
                                selectedId={selectedId}
                                renamingId={renamingId}
                                renameValue={renameValue}
                                onRenameValueChange={onRenameValueChange}
                                onStartRename={onStartRename}
                                onRenameSubmit={onRenameSubmit}
                                onRenameCancel={onRenameCancel}
                                onToggleFolder={onToggleFolder}
                                onDelete={onDelete}
                                onSelect={onSelect}
                                onOpenContextMenu={onOpenContextMenu}
                            />
                        )}
                    </>
                ) : (
                    <div
                        className={`group cursor-pointer flex justify-between items-center rounded-md px-1 py-0.5 transition-colors ${
                            isSelected
                                ? "bg-cyan-500/15 text-cyan-100"
                                : "text-zinc-200 hover:bg-[#1a2740]"
                        }`}
                        onClick={() => {
                            if (!fileData) return;
                            onSelect(fileData);
                            setSelectedPath(getParentPath(item.path));
                            openFile(fileData);
                        }}
                        onContextMenu={(e) => {
                            if (!fileData) return;
                            e.preventDefault();
                            onSelect(fileData);
                            onOpenContextMenu(e, fileData);
                        }}
                    >
                        <span className="flex items-center gap-2 flex-1 min-w-0">
                            {getFileIcon(item.name, item.type, fileData?.language)}
                            {isRenaming ? (
                                <input
                                    value={renameValue}
                                    onChange={(e) => onRenameValueChange(e.target.value)}
                                    onKeyDown={handleRenameKeyDown}
                                    onBlur={onRenameSubmit}
                                    className="w-full rounded px-2 py-1 bg-[#111a2b] border border-white/15 text-zinc-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/60"
                                    autoFocus
                                />
                            ) : (
                                <span className="truncate">{item.name}</span>
                            )}
                        </span>

                        {fileData?._id && !isRenaming && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(fileData._id);
                                }}
                                className="text-red-400 p-1.5 rounded hover:bg-red-500/15 opacity-0 group-hover:opacity-100 transition"
                                aria-label={`Delete ${item.name}`}
                                title="Delete"
                            >
                                <Trash2 size={14} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        );
    });
}
