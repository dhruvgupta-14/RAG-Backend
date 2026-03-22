import express from "express";

import { deleteLocalFile, upload } from "../middleware/multer.js";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedAndStore } from "../controller/embedAndStore.js";
import { index } from "../utils/Pinecone.js";
import verifyToken from "../middleware/verifyToken.js";
import {getLoader} from "../utils/loader.js"
import { clearMemory } from "../controller/memory.controller.js";

const fileRouter = express.Router();



fileRouter.post(
  "/upload",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const filePath = req.file.path;
      const loader = getLoader(filePath, req.file.mimetype);
      const docs = await loader.load();
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100,
      });
      const chunks = await splitter.splitDocuments(docs);
      console.log("Total chunks:", chunks.length);
      await embedAndStore(chunks, req.file.originalname);
      await deleteLocalFile(filePath);
      res.status(200).json({ message: "File uploaded successfully" });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to upload file" });
    }
  },
);

fileRouter.delete("/delete/:filename", verifyToken, async (req, res) => {
  const { filename } = req.params;
  try {
    filename=filename.replace(/[^a-zA-Z0-9_-]/g, "_");
    await index.namespace(filename).deleteAll();
    res.status(200).json({ message: "File and history deleted successfully" });
  } catch (err) {
    console.log("Pinecone delete:", err.message);
    res.status(200).json({ message: "File removed successfully" });
  } finally {
    await clearMemory(req.user.uid);
  }
});

export default fileRouter;
