import { PineconeStore } from "@langchain/pinecone";
import { index } from "../utils/Pinecone.js";
import { embeddings } from "../utils/EmbeddingModel.js";

export async function embedAndStore(docs,namespace) {
  try {
    console.log("Embedding and storing chunks...");
    const vectorStore = await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: namespace 
    });
    console.log("Embedding & storage complete.");
    return vectorStore;
  } catch (err) {
    console.error("Failed to embed and store:", err);
    throw err;
  }
}


