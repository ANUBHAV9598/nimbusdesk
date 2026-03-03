const extensionToLanguage: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    mjs: "javascript",
    cjs: "javascript",
    py: "python",
    java: "java",
    cpp: "cpp",
    cc: "cpp",
    cxx: "cpp",
    c: "c",
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    json: "json",
    md: "markdown",
    txt: "plaintext",
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    yml: "yaml",
    yaml: "yaml",
    xml: "xml",
    sql: "sql",
    go: "go",
    rs: "rust",
    php: "php",
    rb: "ruby",
};

export const inferLanguageFromName = (name: string) => {
    const trimmed = String(name || "").trim().toLowerCase();
    const ext = trimmed.includes(".") ? trimmed.split(".").pop() || "" : "";
    return extensionToLanguage[ext] || "plaintext";
};
