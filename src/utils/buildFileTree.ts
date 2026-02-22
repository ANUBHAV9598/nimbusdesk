export type FileItem = {
    _id: string;
    name: string;
    path: string;
    type: "file" | "folder";
    content?: string;
    language?: string;
    projectId: string;
};

export type FileTreeNode = {
    name: string;
    path: string;
    type: "file" | "folder";
    children: Record<string, FileTreeNode>;
    fileData: FileItem | null;
};

export const buildFileTree = (files: FileItem[]) => {
    const root: Record<string, FileTreeNode> = {};

    files.forEach((file) => {
        const parts = file.path.split("/").filter(Boolean);
        let current = root;
        let currentPath = "";

        parts.forEach((part, index) => {
            currentPath += (index === 0 ? "" : "/") + part;
            const isLeaf = index === parts.length - 1;
            const nodeType: "file" | "folder" = isLeaf ? file.type : "folder";

            if (!current[part]) {
                current[part] = {
                    name: part,
                    path: currentPath,
                    type: nodeType,
                    children: {},
                    fileData: isLeaf ? file : null,
                };
            } else if (isLeaf) {
                current[part].type = file.type;
                current[part].fileData = file;
            }

            current = current[part].children;
        });
    });

    return root;
};
