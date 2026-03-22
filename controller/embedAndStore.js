import { PineconeStore } from "@langchain/pinecone";
import { index } from "../utils/Pinecone.js";
import { embeddings } from "../utils/EmbeddingModel.js";

export async function embedAndStore(docs,namespace) {
  try {
    console.log("Embedding and storing chunks...");
        const safeNamespace = namespace.replace(/[^a-zA-Z0-9_-]/g, "_");
     console.log(`Embedding ${docs.length} chunks into namespace: ${safeNamespace}`);

    // ← ADD THIS: test embedding one chunk first
    const testVector = await embeddings.embedQuery(docs[0].pageContent);
    console.log("Test embedding dimension:", testVector.length);
    console.log("Test embedding first value:", testVector[0]);

    const vectorStore = await PineconeStore.fromDocuments(docs, embeddings, {
      pineconeIndex: index,
      namespace: safeNamespace
    });
    console.log("Embedding & storage complete.");
    return vectorStore;
  } catch (err) {
    console.error("Failed to embed and store:", err);
    throw err;
  }
}


