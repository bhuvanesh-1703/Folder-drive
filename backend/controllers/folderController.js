const Folder = require("../Models/Folder");
const File = require("../Models/File");

const deleteFolderRecursive = async (folderId) => {
  const subfolders = await Folder.find({ parentId: folderId });
  for (const subfolder of subfolders) {
    await deleteFolderRecursive(subfolder._id);
  }

  await File.deleteMany({ folderId: folderId });
  await Folder.findByIdAndDelete(folderId);
};

const getFolderSizeRecursive = async (folderId) => {
  const files = await File.find({ folderId: folderId });
  let totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);

  const subfolders = await Folder.find({ parentId: folderId });
  for (const subfolder of subfolders) {
    totalSize += await getFolderSizeRecursive(subfolder._id);
  }

  return totalSize;
};

exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Folder name is required" });
    }

    const userId = req.user;

    if (parentId) {
      const parentFolder = await Folder.findOne({ _id: parentId, userId });
      if (!parentFolder) {
        return res.status(404).json({ success: false, message: "Parent folder not found" });
      }
    }

    const newFolder = await Folder.create({
      name,
      parentId: parentId || null,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "Folder created successfully",
      data: newFolder,
    });
  } catch (error) {
    console.error("Folder creation failed:", error);
    res.status(500).json({ success: false, message: "Server error during folder creation", error: error.message });
  }
};

exports.renameFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Folder name is required" });
    }

    const userId = req.user;

    const folder = await Folder.findOneAndUpdate(
      { _id: id, userId },
      { name },
      { new: true }
    );

    if (!folder) {
      return res.status(404).json({ success: false, message: "Folder not found or unauthorized" });
    }

    res.json({
      success: true,
      message: "Folder renamed successfully",
      data: folder,
    });
  } catch (error) {
    console.error("Folder rename failed:", error);
    res.status(500).json({ success: false, message: "Server error during folder rename", error: error.message });
  }
};

exports.deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const folder = await Folder.findOne({ _id: id, userId });
    if (!folder) {
      return res.status(404).json({ success: false, message: "Folder not found or unauthorized" });
    }

    await deleteFolderRecursive(id);

    res.json({
      success: true,
      message: "Folder and all its contents deleted successfully",
    });
  } catch (error) {
    console.error("Folder deletion failed:", error);
    res.status(500).json({ success: false, message: "Server error during folder deletion", error: error.message });
  }
};

exports.getAllFolders = async (req, res) => {
  try {
    const userId = req.user;
    const folders = await Folder.find({ userId });

    const foldersWithSizes = [];
    for (const folder of folders) {
      const size = await getFolderSizeRecursive(folder._id);
      foldersWithSizes.push({
        ...folder.toObject(),
        size,
      });
    }

    res.json({
      success: true,
      data: foldersWithSizes,
    });
  } catch (error) {
    console.error("Fetching folders failed:", error);
    res.status(500).json({ success: false, message: "Server error fetching folders", error: error.message });
  }
};

exports.getFolderContent = async (req, res) => {
  try {
    const parentId = req.query.parentId === "null" || !req.query.parentId ? null : req.query.parentId;
    const userId = req.user;

    const folders = await Folder.find({ userId, parentId });
    const files = await File.find({ userId, folderId: parentId });

    const foldersWithSizes = [];
    for (const folder of folders) {
      const size = await getFolderSizeRecursive(folder._id);
      foldersWithSizes.push({
        ...folder.toObject(),
        size,
      });
    }

    res.json({
      success: true,
      data: {
        folders: foldersWithSizes,
        files,
      },
    });
  } catch (error) {
    console.error("Fetching folder content failed:", error);
    res.status(500).json({ success: false, message: "Server error fetching folder content", error: error.message });
  }
};
