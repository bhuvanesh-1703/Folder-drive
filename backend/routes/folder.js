const express = require("express");
const router = express.Router();
const folderController = require("../controllers/folderController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.post("/", folderController.createFolder);
router.put("/:id", folderController.renameFolder);
router.delete("/:id", folderController.deleteFolder);
router.get("/all", folderController.getAllFolders);
router.get("/content", folderController.getFolderContent);

module.exports = router;
