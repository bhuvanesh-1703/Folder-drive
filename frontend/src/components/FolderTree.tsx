import React, { useState } from "react";
import { FiFolder, FiFolderPlus, FiEdit2, FiTrash2, FiChevronRight, FiChevronDown } from "react-icons/fi";

export interface Folder {
  _id: string;
  name: string;
  parentId: string | null;
  userId: string;
  size?: number;
}

interface FolderTreeProps {
  folders: Folder[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  selectedFolderId,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
}) => {
  const folderIds = new Set(folders.map((f) => f._id));
  const rootFolders = folders.filter((f) => !f.parentId || !folderIds.has(f.parentId));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between px-2 py-1.5 mb-2">
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
          Folders
        </span>
        <button
          onClick={() => onCreateFolder(null)}
          title="Create Root Folder"
          className="p-1 rounded text-neutral-400 hover:text-violet-400 hover:bg-neutral-800 transition-colors"
        >
          <FiFolderPlus size={16} />
        </button>
      </div>
      
      {rootFolders.length === 0 ? (
        <div className="text-sm text-neutral-500 italic px-2 py-1">
          No folders created yet.
        </div>
      ) : (
        rootFolders.map((folder) => (
          <FolderTreeNode
            key={folder._id}
            folder={folder}
            allFolders={folders}
            depth={0}
            selectedFolderId={selectedFolderId}
            onSelectFolder={onSelectFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onCreateFolder={onCreateFolder}
          />
        ))
      )}
    </div>
  );
};

interface FolderTreeNodeProps {
  folder: Folder;
  allFolders: Folder[];
  depth: number;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
  onRenameFolder: (folder: Folder) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateFolder: (parentId: string | null) => void;
}

const FolderTreeNode: React.FC<FolderTreeNodeProps> = ({
  folder,
  allFolders,
  depth,
  selectedFolderId,
  onSelectFolder,
  onRenameFolder,
  onDeleteFolder,
  onCreateFolder,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const children = allFolders.filter((f) => f.parentId === folder._id);
  const isSelected = selectedFolderId === folder._id;
  const hasChildren = children.length > 0;

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  const formatSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "";
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="select-none">
      <div
        onClick={() => onSelectFolder(folder._id)}
        className={`group flex items-center justify-between rounded-lg px-2 py-1.5 cursor-pointer text-sm font-medium transition-all duration-150 ${
          isSelected
            ? "bg-violet-600/20 text-violet-300 border border-violet-500/20"
            : "text-neutral-300 hover:bg-neutral-800/60 hover:text-white"
        }`}
        style={{ paddingLeft: `${Math.max(8, depth * 12 + 8)}px` }}
      >
        <div className="flex items-center space-x-2 min-w-0">
          <button
            onClick={handleToggleExpand}
            className={`p-0.5 rounded hover:bg-neutral-700 text-neutral-400 transition-transform ${
              !hasChildren && "opacity-0 cursor-default"
            }`}
            disabled={!hasChildren}
          >
            {isOpen ? <FiChevronDown size={14} /> : <FiChevronRight size={14} />}
          </button>

          <FiFolder
            size={16}
            className={isSelected ? "text-violet-400 fill-violet-400/10" : "text-neutral-400"}
          />

          <span className="truncate" title={folder.name}>
            {folder.name}
          </span>

          {folder.size !== undefined && folder.size > 0 && (
            <span className="text-[10px] text-neutral-500 bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
              {formatSize(folder.size)}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateFolder(folder._id);
            }}
            title="Create Subfolder"
            className="p-1 rounded text-neutral-400 hover:text-violet-400 hover:bg-neutral-700 transition-colors"
          >
            <FiFolderPlus size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRenameFolder(folder);
            }}
            title="Rename Folder"
            className="p-1 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-700 transition-colors"
          >
            <FiEdit2 size={13} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFolder(folder._id);
            }}
            title="Delete Folder"
            className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-700 transition-colors"
          >
            <FiTrash2 size={13} />
          </button>
        </div>
      </div>

      {hasChildren && isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {children.map((child) => (
            <FolderTreeNode
              key={child._id}
              folder={child}
              allFolders={allFolders}
              depth={depth + 1}
              selectedFolderId={selectedFolderId}
              onSelectFolder={onSelectFolder}
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateFolder={onCreateFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
};
