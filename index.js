import express from "express";
import { index } from "./utils/Pinecone.js";
import { configDotenv } from "dotenv";
import { deleteLocalFile, upload } from "./middleware/multer.js";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { embedAndStore } from "./controller/embedAndStore.js";
import { answerQueryWithMemory, getMemoryForUser } from "./controller/retreiveDocument.js";
import cors from "cors";
import verifyToken from "./middleware/verifyToken.js";
configDotenv();
const app = express();
app.use(express.json());
app.use(cors());  
app.listen(process.env.PORT, () => {
  console.log("Server is listening at ", process.env.PORT);
});

app.post("/file/upload", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 50,
    });
    const chunks = await splitter.splitDocuments(docs);
    console.log("Total chunks:", chunks.length);
    await embedAndStore(chunks,req.file.originalname);
    await deleteLocalFile(filePath);
    res.status(200).json({ message:"File uploaded successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to upload file" });
  }
});

app.post("/ask/ai", verifyToken , async (req, res) => {
  const { query,namespace } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }
  try {
     const memory = getMemoryForUser(req.user.uid);
    const answer = await answerQueryWithMemory(query,namespace,memory);
    res.status(200).json({ answer });
  } catch (err) {
    console.error("Error in /ask/ai:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.delete("/file/delete/:filename", verifyToken, async (req, res) => {
  const { filename } = req.params;
  try {
     await index.namespace(filename).deleteAll();
    res.status(200).json({ message: "File deleted successfully" });
  } catch (err) {
    console.error("Error deleting file:", err);
    res.status(500).json({ error: "Failed to delete file" });
  }
});
