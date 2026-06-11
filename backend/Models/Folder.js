const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
    name: { type: String, required: true },
    parentId: { type: mongoose.Schema.ObjectId, ref: "folder",default:null},
    userId:{type:mongoose.Schema.ObjectId,ref:"user",required:true}
})
module.exports = mongoose.model("folder", folderSchema)