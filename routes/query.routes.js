import express from "express"
import { answerQueryWithMemory} from "../controller/retreiveDocument.js";
import verifyToken from "../middleware/verifyToken.js";
import { getMessagesFromFirestore } from "../controller/memory.controller.js";

const queryRouter=express.Router()

queryRouter.post("/ai", verifyToken , async (req, res) => {
  const { query,namespace } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }
  try {
    const answer = await answerQueryWithMemory(query,namespace,req.user.uid);
    res.status(200).json({ answer });
  } catch (err) {
    console.error("Error in /ask/ai:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

queryRouter.get("/history", verifyToken, async (req, res) => {
  try {
    const messages = await getMessagesFromFirestore(req.user.uid);
    res.status(200).json({ messages });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

export default queryRouter;