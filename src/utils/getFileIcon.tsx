import {
    MdCss,
    MdDataObject,
    MdDescription,
    MdFolder,
    MdHtml,
    MdImage,
    MdInsertDriveFile,
    MdSettings,
} from "react-icons/md";
import { FaJava } from "react-icons/fa6";
import {
    SiC,
    SiCplusplus,
    SiGnubash,
    SiJavascript,
    SiPython,
    SiTypescript,
} from "react-icons/si";

const iconClass = "w-4 h-4 shrink-0";

const normalize = (value?: string) => String(value || "").toLowerCase();

export const getFileIcon = (name: string, type: string, language?: string) => {
    const lowerName = name.toLowerCase();
    const lowerLang = normalize(language);
    const extension = lowerName.includes(".") ? lowerName.split(".").pop() || "" : "";

    if (type === "folder") {
        return <MdFolder className={`${iconClass} text-amber-300`} />;
    }

    if (["package.json", "tsconfig.json", ".eslintrc", ".prettierrc"].some((n) => lowerName.includes(n))) {
        return <MdSettings className={`${iconClass} text-zinc-300`} />;
    }

    if (
        lowerName.endsWith(".ts") ||
        lowerName.endsWith(".tsx") ||
        ["ts", "typescript", "tsx"].includes(lowerLang) ||
        ["ts", "tsx"].includes(extension)
    ) {
        return <SiTypescript className={`${iconClass} text-[#3178C6]`} />;
    }

    if (
        lowerName.endsWith(".js") ||
        lowerName.endsWith(".jsx") ||
        lowerName.endsWith(".mjs") ||
        ["js", "javascript", "jsx", "node", "nodejs", "mjs", "cjs"].includes(lowerLang) ||
        ["js", "jsx", "mjs", "cjs"].includes(extension)
    ) {
        return <SiJavascript className={`${iconClass} text-[#F7DF1E]`} />;
    }

    if (lowerName.endsWith(".json") || lowerLang === "json" || extension === "json") {
        return <MdDataObject className={`${iconClass} text-emerald-300`} />;
    }

    if (
        lowerName.endsWith(".html") ||
        lowerName.endsWith(".htm") ||
        ["html", "htm"].includes(lowerLang) ||
        ["html", "htm"].includes(extension)
    ) {
        return <MdHtml className={`${iconClass} text-orange-400`} />;
    }

    if (
        lowerName.endsWith(".css") ||
        lowerName.endsWith(".scss") ||
        ["css", "scss", "sass"].includes(lowerLang) ||
        ["css", "scss", "sass"].includes(extension)
    ) {
        return <MdCss className={`${iconClass} text-blue-400`} />;
    }

    if (lowerName.endsWith(".py") || ["py", "python"].includes(lowerLang) || extension === "py") {
        return <SiPython className={`${iconClass} text-[#4B8BBE]`} />;
    }

    if (
        lowerName.endsWith(".sh") ||
        lowerName.endsWith(".bash") ||
        ["bash", "shell", "sh", "zsh"].includes(lowerLang) ||
        ["sh", "bash", "zsh"].includes(extension)
    ) {
        return <SiGnubash className={`${iconClass} text-zinc-200`} />;
    }

    if (
        lowerName.endsWith(".java") ||
        lowerLang === "java" ||
        extension === "java"
    ) {
        return <FaJava className={`${iconClass} text-[#ED8B00]`} />;
    }

    if (
        lowerName.endsWith(".cpp") ||
        lowerName.endsWith(".cc") ||
        lowerName.endsWith(".cxx") ||
        ["cpp", "c++", "cc", "cxx"].includes(lowerLang) ||
        ["cpp", "cc", "cxx"].includes(extension)
    ) {
        return <SiCplusplus className={`${iconClass} text-blue-400`} />;
    }

    if (
        lowerName.endsWith(".c") ||
        lowerLang === "c" ||
        extension === "c"
    ) {
        return <SiC className={`${iconClass} text-sky-300`} />;
    }

    if (
        lowerName.endsWith(".png") ||
        lowerName.endsWith(".jpg") ||
        lowerName.endsWith(".jpeg") ||
        lowerName.endsWith(".svg") ||
        lowerName.endsWith(".webp")
    ) {
        return <MdImage className={`${iconClass} text-pink-300`} />;
    }

    if (lowerName.endsWith(".md") || lowerName.endsWith(".txt")) {
        return <MdDescription className={`${iconClass} text-zinc-300`} />;
    }

    return <MdInsertDriveFile className={`${iconClass} text-zinc-400`} />;
};
