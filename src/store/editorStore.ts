import { create } from "zustand";

interface FileType {
  _id: string;
  name: string;
  path: string;
  type: "file" | "folder";
  content?: string;
  language?: string;
  savedContent?: string;
}

interface EditorState {
  openTabs: FileType[];
  activeTab: FileType | null;
  selectedPath: string;

  openFile: (file: FileType) => void;
  closeTab: (id: string) => void;
  setActiveTab: (file: FileType) => void;
  updateFileContent: (id: string, content: string) => void;
  markFileSaved: (id: string, content: string) => void;
  setSelectedPath: (path: string) => void;
  renameOpenFile: (id: string, name: string, path: string) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  openTabs: [],
  activeTab: null,
  selectedPath: "",

  setSelectedPath: (path: string) => set({ selectedPath: path }),

  openFile: (file: FileType) => {
    const exists = get().openTabs.find((f) => f._id === file._id);

    // ✅ If already open → just focus it
    if (exists) {
      set({ activeTab: exists });
      return;
    }

    // ✅ First time open
    const fileWithSaved = {
      ...file,
      content: file.content ?? "",
      savedContent: file.content ?? "",
    };

    set({
      openTabs: [...get().openTabs, fileWithSaved],
      activeTab: fileWithSaved,
    });
  },

  closeTab: (id: string) => {
    const tabs = get().openTabs.filter((tab) => tab._id !== id);
    const current = get().activeTab;

    set({
      openTabs: tabs,
      activeTab:
        current?._id === id
          ? tabs[tabs.length - 1] || null
          : current,
    });
  },

  setActiveTab: (file: FileType) => set({ activeTab: file }),

  updateFileContent: (id: string, content: string) => {
    const updatedTabs = get().openTabs.map((tab) =>
      tab._id === id ? { ...tab, content } : tab
    );

    set({
      openTabs: updatedTabs,
      activeTab:
        get().activeTab?._id === id
          ? { ...get().activeTab!, content }
          : get().activeTab,
    });
  },

  markFileSaved: (id: string, content: string) => {
    const updatedTabs = get().openTabs.map((tab) =>
      tab._id === id
        ? { ...tab, savedContent: content }
        : tab
    );

    set({
      openTabs: updatedTabs,
      activeTab:
        get().activeTab?._id === id
          ? { ...get().activeTab!, savedContent: content }
          : get().activeTab,
    });
  },

  renameOpenFile: (id: string, name: string, path: string) => {
    const updatedTabs = get().openTabs.map((tab) =>
      tab._id === id ? { ...tab, name, path } : tab
    );

    set({
      openTabs: updatedTabs,
      activeTab:
        get().activeTab?._id === id
          ? { ...get().activeTab!, name, path }
          : get().activeTab,
    });
  },
}));
