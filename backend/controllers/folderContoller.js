const Folder = require("../Models/folder");

//create folder
module.exports.createFolder = async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: " Folder name is required" });
    }
    const userId = req.user.id;
    const newFolder = await Folder.create({
      name,
      parentId: parentId || null,
      userId: userId,
    });
    res
      .status(201)
      .json({
        success: true,
        message: " Folder created successfully",
        data: newFolder,
      });
  } catch (error) {
    console.log("folder creation failed:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: " Internal server error",
        error: error,
      });
  }

  //get folder and file
  exports.getContent = async (req, res) => {
    try {
      const parentId = req.query.parentId || null;

      const userFolders = await Folder.find({
        userId: req.userId,
        parentId: parentId,
      });
      const userFiles = await File.find({
        userId: req.userId,
        folderId: parentId,
      });

      const foldersWithSizes = [];
      for (let folder of userFolders) {
        const size = await calculateFolderSize(folder._id);
        foldersWithSizes.push({
          _id: folder._id,
          name: folder.name,
          parentId: folder.parentId,
          userId: folder.userId,
          size: size,
        });
      }

      res.json({ success: true, message: "folders and files are", foldersData: foldersWithSizes, filesData: userFiles });
    } catch (err) {
      res.status(500).json({success:false, message: "Server Error", error: err.message });
    }
  };
};
