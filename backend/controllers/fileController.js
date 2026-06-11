const File = require("../Models/file");
const Folder = require("../Models/folder");
const fs = require("fs");
const path = require("path");

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const { folderId } = req.body;
    const userId = req.user;

    let verifiedFolderId = null;
    if (folderId && folderId !== "null" && folderId !== "undefined") {
      const folder = await Folder.findOne({ _id: folderId, userId });
      if (!folder) {
        const filePath = path.join(__dirname, "../uploads", req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(404).json({ success: false, message: "Target folder not found" });
      }
      verifiedFolderId = folder._id;
    }

    const newFile = await File.create({
      name: req.file.originalname,
      imageUrl: `/uploads/${req.file.filename}`,
      size: req.file.size,
      folderId: verifiedFolderId,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "File uploaded successfully",
      data: newFile,
    });
  } catch (error) {
    console.error("File upload failed:", error);
    res.status(500).json({ success: false, message: "Server error during file upload", error: error.message });
  }
};

exports.deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user;

    const file = await File.findOne({ _id: id, userId });
    if (!file) {
      return res.status(404).json({ success: false, message: "File not found or unauthorized" });
    }

    const filename = path.basename(file.imageUrl);
    const filePath = path.join(__dirname, "../uploads", filename);
    if (fs.existsSync(filePath)) {
      fs.unlink(filePath, (err) => {
        if (err) console.error("Failed to delete physical file:", err);
      });
    }

    await File.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("File deletion failed:", error);
    res.status(500).json({ success: false, message: "Server error during file deletion", error: error.message });
  }
};
