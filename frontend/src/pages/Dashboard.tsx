import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { API_URL } from "../Api/api";
import { FolderTree } from "../components/FolderTree";
import type { Folder } from "../components/FolderTree";
import { 
  FiFolder, 
  FiFolderPlus, 
  FiTrash2, 
  FiUpload, 
  FiEdit, 
  FiHome, 
  FiImage, 
  FiX, 
  FiEye,
  FiGrid,
  FiUser,
  FiLogOut
} from "react-icons/fi";
import { toast, Toaster } from "react-hot-toast";

interface UserProfile {
  id?: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface FileItem {
  _id: string;
  name: string;
  imageUrl: string;
  size: number;
  folderId: string | null;
  userId: string;
  createdAt?: string;
}

const BACKEND_BASE = API_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"drive" | "profile">("drive");

  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [currentContent, setCurrentContent] = useState<{ folders: Folder[]; files: FileItem[] }>({
    folders: [],
    files: [],
  });
  const [contentLoading, setContentLoading] = useState<boolean>(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [folderToRename, setFolderToRename] = useState<Folder | null>(null);
  
  const [folderNameInput, setFolderNameInput] = useState("");

  const [uploading, setUploading] = useState(false);

  const [activeLightboxImage, setActiveLightboxImage] = useState<FileItem | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      try {
        const res = await axios.get(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(res.data);
      } catch (err) {
        console.error("Profile Fetch Error:", err);
        localStorage.removeItem("token");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);

  const fetchAllFolders = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API_URL}/folders/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setFolders(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching all folders:", err);
      toast.error("Failed to load folder structure");
    }
  };

  const fetchCurrentFolderContent = async (folderId: string | null) => {
    setContentLoading(true);
    try {
      const token = localStorage.getItem("token");
      const url = `${API_URL}/folders/content?parentId=${folderId || "null"}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setCurrentContent(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching contents:", err);
      toast.error("Failed to fetch folder contents");
    } finally {
      setContentLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchAllFolders();
      fetchCurrentFolderContent(selectedFolderId);
    }
  }, [selectedFolderId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/folders`,
        {
          name: folderNameInput.trim(),
          parentId: createParentId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Folder created successfully!");
        setFolderNameInput("");
        setIsCreateOpen(false);
        fetchAllFolders();
        fetchCurrentFolderContent(selectedFolderId);
      }
    } catch (err: any) {
      console.error("Folder creation error:", err);
      toast.error(err.response?.data?.message || "Failed to create folder");
    }
  };

  const handleRenameFolderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderNameInput.trim() || !folderToRename) return;

    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `${API_URL}/folders/${folderToRename._id}`,
        { name: folderNameInput.trim() },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Folder renamed successfully!");
        setFolderNameInput("");
        setIsRenameOpen(false);
        setFolderToRename(null);
        fetchAllFolders();
        fetchCurrentFolderContent(selectedFolderId);
      }
    } catch (err: any) {
      console.error("Folder rename error:", err);
      toast.error(err.response?.data?.message || "Failed to rename folder");
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!window.confirm("Are you sure you want to delete this folder? This will recursively delete all subfolders and files inside it!")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_URL}/folders/${folderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success("Folder deleted!");
        if (selectedFolderId === folderId) {
          const deletedFolder = folders.find((f) => f._id === folderId);
          setSelectedFolderId(deletedFolder?.parentId || null);
        } else {
          fetchAllFolders();
          fetchCurrentFolderContent(selectedFolderId);
        }
      }
    } catch (err: any) {
      console.error("Folder deletion error:", err);
      toast.error(err.response?.data?.message || "Failed to delete folder");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file only.");
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    if (selectedFolderId) {
      formData.append("folderId", selectedFolderId);
    }

    setUploading(true);
    const toastId = toast.loading("Uploading image...");

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(`${API_URL}/files/upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data.success) {
        toast.success("Image uploaded successfully!", { id: toastId });
        fetchAllFolders();
        fetchCurrentFolderContent(selectedFolderId);
      }
    } catch (err: any) {
      console.error("Upload failed:", err);
      toast.error(err.response?.data?.message || "Failed to upload image", { id: toastId });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.delete(`${API_URL}/files/${fileId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        toast.success("Image deleted successfully");
        fetchAllFolders();
        fetchCurrentFolderContent(selectedFolderId);
      }
    } catch (err: any) {
      console.error("File deletion error:", err);
      toast.error(err.response?.data?.message || "Failed to delete image");
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getBreadcrumbs = () => {
    const crumbs: Folder[] = [];
    let currentId = selectedFolderId;
    while (currentId) {
      const folder = folders.find((f) => f._id === currentId);
      if (folder) {
        crumbs.unshift(folder);
        currentId = folder.parentId;
      } else {
        break;
      }
    }
    return crumbs;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const currentFolderName = selectedFolderId
    ? folders.find((f) => f._id === selectedFolderId)?.name || "Folder"
    : "Root Drive";

  const renderProfile = () => {
    return (
      <div className="space-y-6 max-w-2xl animate-fadeIn">
        <div>
          <h2 className="text-2xl font-extrabold text-white">Profile Details</h2>
          <p className="text-sm text-neutral-400 mt-1">View your secure workspace account information</p>
        </div>

        <div className="border-t border-neutral-800"></div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Full Name</label>
            <input
              type="text"
              readOnly
              value={user?.name || ""}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800/40 px-3 py-2.5 text-neutral-300 focus:outline-none cursor-not-allowed font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              readOnly
              value={user?.email || ""}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800/40 px-3 py-2.5 text-neutral-300 focus:outline-none cursor-not-allowed font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Account Role</label>
            <input
              type="text"
              readOnly
              value="DEVELOPER / OWNER"
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800/40 px-3 py-2.5 text-violet-400 focus:outline-none cursor-not-allowed font-bold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Date Joined</label>
            <input
              type="text"
              readOnly
              value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { dateStyle: "long" }) : "N/A"}
              className="block w-full rounded-lg border border-neutral-700 bg-neutral-800/40 px-3 py-2.5 text-neutral-300 focus:outline-none cursor-not-allowed font-medium"
            />
          </div>
        </div>
      </div>
    );
  };

  const renderDrive = () => {
    return (
      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 animate-fadeIn">
        <div className="w-full lg:w-72 flex-shrink-0 bg-neutral-900/30 border border-neutral-800/80 rounded-xl p-4 flex flex-col h-[28rem] lg:h-auto overflow-hidden">
          <button
            onClick={() => setSelectedFolderId(null)}
            className={`w-full flex items-center space-x-3 rounded-lg px-3 py-2 border transition-all duration-150 text-sm font-semibold ${
              selectedFolderId === null
                ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                : "bg-neutral-800/40 text-neutral-300 border-transparent hover:bg-neutral-800/80"
            }`}
          >
            <FiHome size={16} />
            <span>Root Drive</span>
          </button>

          <div className="border-b border-neutral-800 my-3"></div>

          <div className="flex-1 overflow-y-auto pr-1">
            <FolderTree
              folders={folders}
              selectedFolderId={selectedFolderId}
              onSelectFolder={setSelectedFolderId}
              onRenameFolder={(folder) => {
                setFolderToRename(folder);
                setFolderNameInput(folder.name);
                setIsRenameOpen(true);
              }}
              onDeleteFolder={handleDeleteFolder}
              onCreateFolder={(parentId) => {
                setCreateParentId(parentId);
                setFolderNameInput("");
                setIsCreateOpen(true);
              }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div className="flex flex-wrap items-center text-sm font-medium text-neutral-400 space-x-1.5 min-w-0">
              <button
                onClick={() => setSelectedFolderId(null)}
                className="hover:text-violet-400 transition-colors flex items-center"
              >
                <FiHome className="mr-1" />
                <span>Root</span>
              </button>
              
              {getBreadcrumbs().map((crumb) => (
                <div key={crumb._id} className="flex items-center space-x-1.5">
                  <span className="text-neutral-600">/</span>
                  <button
                    onClick={() => setSelectedFolderId(crumb._id)}
                    className="hover:text-violet-400 transition-colors truncate max-w-[100px]"
                    title={crumb.name}
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setCreateParentId(selectedFolderId);
                  setFolderNameInput("");
                  setIsCreateOpen(true);
                }}
                className="flex items-center space-x-1 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold px-3 py-2 rounded-lg border border-neutral-700 transition-colors"
              >
                <FiFolderPlus size={14} />
                <span>New Folder</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={triggerUploadClick}
                disabled={uploading}
                className="flex items-center space-x-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-md transition-all"
              >
                <FiUpload size={14} />
                <span>Upload Image</span>
              </button>
            </div>
          </div>

          <div className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-neutral-400 text-[11px] font-mono">
            <div>
              <span>Current: </span>
              <span className="text-neutral-200">{currentFolderName}</span>
            </div>
            {selectedFolderId && (
              <div>
                <span>Size: </span>
                <span className="text-violet-400 font-bold">
                  {formatSize(folders.find((f) => f._id === selectedFolderId)?.size || 0)}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto mt-2">
            {contentLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="w-8 h-8 border-3 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="space-y-6">
                
                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center">
                    <FiFolder className="mr-1.5 text-violet-400" /> Subfolders ({currentContent.folders.length})
                  </h3>
                  {currentContent.folders.length === 0 ? (
                    <div className="text-xs text-neutral-500 italic p-3 bg-neutral-900/10 rounded-lg border border-neutral-800/30">
                      No subfolders inside this folder.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                      {currentContent.folders.map((folder) => (
                        <div
                          key={folder._id}
                          onClick={() => setSelectedFolderId(folder._id)}
                          className="group flex items-center justify-between bg-neutral-900/30 hover:bg-neutral-800/30 border border-neutral-800/60 hover:border-neutral-700/80 p-3.5 rounded-xl cursor-pointer transition-all duration-150"
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <FiFolder size={20} className="text-violet-400 group-hover:scale-105 transition-transform" />
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-neutral-200 truncate" title={folder.name}>
                                {folder.name}
                              </p>
                              {folder.size !== undefined && folder.size > 0 && (
                                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                                  {formatSize(folder.size)}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setFolderToRename(folder);
                                setFolderNameInput(folder.name);
                                setIsRenameOpen(true);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 transition-colors"
                            >
                              <FiEdit size={13} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder._id);
                              }}
                              className="p-1 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                            >
                              <FiTrash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3 flex items-center">
                    <FiImage className="mr-1.5 text-violet-400" /> Images ({currentContent.files.length})
                  </h3>
                  {currentContent.files.length === 0 ? (
                    <div className="text-xs text-neutral-500 italic p-6 text-center bg-neutral-900/10 rounded-lg border border-neutral-800/30">
                      No images inside this folder.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                      {currentContent.files.map((file) => (
                        <div
                          key={file._id}
                          className="group relative bg-neutral-900/30 border border-neutral-800/60 hover:border-neutral-700/80 rounded-xl overflow-hidden flex flex-col transition-all duration-150"
                        >
                          <div 
                            onClick={() => setActiveLightboxImage(file)}
                            className="aspect-square w-full bg-neutral-950 flex items-center justify-center relative overflow-hidden group-hover:opacity-90 cursor-pointer"
                          >
                            <img
                              src={`${BACKEND_BASE}${file.imageUrl}`}
                              alt={file.name}
                              className="w-full h-full object-cover transition-transform duration-250 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <span className="p-1.5 rounded-full bg-neutral-800 text-white hover:bg-violet-600 transition-colors">
                                <FiEye size={14} />
                              </span>
                            </div>
                          </div>

                          <div className="p-2.5 flex flex-col flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-neutral-200 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[9px] text-neutral-500 font-mono">
                                {formatSize(file.size)}
                              </span>
                              <button
                                onClick={() => handleDeleteFile(file._id)}
                                className="p-0.5 rounded text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                                title="Delete Image"
                              >
                                <FiTrash2 size={12} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-neutral-400 font-medium text-sm">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      <Toaster position="top-right" toastOptions={{ style: { background: "#1f2937", color: "#f3f4f6" } }} />

      <nav className="border-b border-neutral-800 bg-neutral-900/40 backdrop-blur-md sticky top-0 z-45">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 rounded-lg text-white">
                <FiHome size={20} />
              </div>
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-xl font-extrabold text-transparent">
                Folder-Drive
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-xs text-neutral-400 font-mono bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-full">
                Secure Session
              </span>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 md:p-6 gap-6 min-h-0">
        
        <aside className="w-full md:w-80 flex-shrink-0 bg-neutral-900/40 border border-neutral-800 rounded-2xl flex flex-col backdrop-blur-sm overflow-hidden">
          <div className="flex flex-col items-center p-6 bg-neutral-900/60 border-b border-neutral-800">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-extrabold mb-3 shadow-lg shadow-violet-500/20">
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <h3 className="text-base font-bold text-neutral-100">{user?.name || "User"}</h3>
            <p className="text-xs text-neutral-400 mt-1">{user?.email || "No Email"}</p>
          </div>

          <nav className="flex-grow p-4 space-y-2 flex flex-col justify-between">
            <div className="space-y-1.5">
              <button
                onClick={() => setActiveTab("drive")}
                className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 border ${
                  activeTab === "drive"
                    ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                    : "text-neutral-400 hover:bg-neutral-800/60 hover:text-white border-transparent"
                }`}
              >
                <FiGrid size={18} />
                <span>My Drive</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-150 border ${
                  activeTab === "profile"
                    ? "bg-violet-600/20 text-violet-300 border-violet-500/30"
                    : "text-neutral-400 hover:bg-neutral-800/60 hover:text-white border-transparent"
                }`}
              >
                <FiUser size={18} />
                <span>My Profile</span>
              </button>
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 rounded-xl px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all duration-150"
              >
                <FiLogOut size={18} />
                <span>Disconnect</span>
              </button>
            </div>
          </nav>
        </aside>

        <main className="flex-1 flex flex-col bg-neutral-900/20 border border-neutral-800 rounded-2xl p-6 backdrop-blur-sm min-w-0">
          {activeTab === "drive" && renderDrive()}
          {activeTab === "profile" && renderProfile()}
        </main>

      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <FiX size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Create New Folder</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all duration-200"
                  placeholder="Folder name"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-md"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRenameOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-2xl relative">
            <button
              onClick={() => {
                setIsRenameOpen(false);
                setFolderToRename(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
            >
              <FiX size={18} />
            </button>
            <h3 className="text-lg font-bold text-white mb-4">Rename Folder</h3>
            <form onSubmit={handleRenameFolderSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  New Folder Name
                </label>
                <input
                  type="text"
                  required
                  value={folderNameInput}
                  onChange={(e) => setFolderNameInput(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white placeholder-neutral-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all duration-200"
                  placeholder="New name"
                  autoFocus
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRenameOpen(false);
                    setFolderToRename(null);
                  }}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white transition-all shadow-md"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeLightboxImage && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
          <button
            onClick={() => setActiveLightboxImage(null)}
            className="absolute top-6 right-6 p-2 rounded-full bg-neutral-800/80 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          >
            <FiX size={24} />
          </button>
          
          <div className="max-w-4xl max-h-[80vh] flex items-center justify-center p-2 rounded-2xl bg-neutral-900 border border-neutral-800 shadow-2xl overflow-hidden">
            <img
              src={`${BACKEND_BASE}${activeLightboxImage.imageUrl}`}
              alt={activeLightboxImage.name}
              className="max-w-full max-h-[75vh] object-contain rounded-xl"
            />
          </div>

          <div className="mt-4 text-center">
            <p className="text-sm font-semibold text-neutral-200">{activeLightboxImage.name}</p>
            <p className="text-xs text-neutral-500 mt-1">Size: {formatSize(activeLightboxImage.size)}</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
