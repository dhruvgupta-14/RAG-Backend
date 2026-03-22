import { RunnableSequence } from "@langchain/core/runnables";
import { prompt } from "../prompt/ragPrompt.js";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PineconeStore } from "@langchain/pinecone";
import { index } from "../utils/Pinecone.js";
import { model } from "../utils/ChatModel.js";
import { getMessagesFromFirestore, saveMessage } from "./memory.controller.js";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { TaskType } from "@google/generative-ai";


const queryEmbeddings = new GoogleGenerativeAIEmbeddings({
  model: "gemini-embedding-001",
  apiKey: process.env.GEMINI_API_KEY,
  taskType: TaskType.RETRIEVAL_QUERY,
});


export async function retrieveRelevantDocs(userQuery, namespace) {
  if (!namespace) throw new Error("Namespace is required");
  
  const vectorStore = await PineconeStore.fromExistingIndex(queryEmbeddings, {
    pineconeIndex: index,
    namespace,
  });

  return await vectorStore.similaritySearch(userQuery, 5);
}


const chain = RunnableSequence.from([
  prompt,
  model,
  new StringOutputParser(),
]);

function truncateContext(text, maxChars = 12000) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

export async function answerQueryWithMemory(userInput, namespace ,userId) {

  const allMessages = await getMessagesFromFirestore(userId);

  // 2. Send only last 10 to Gemini
  const chat_history = allMessages.slice(-10).map(msg => ({
    role: msg.role,
    content: msg.content,
  }));

  // Retrieve relevant docs
  const docs = await retrieveRelevantDocs(userInput, namespace);

  if (!docs || docs.length === 0) {
    return "I couldn't find the answer based on the provided context.";
  }

  // Build context
const context = docs
  .map((doc, i) => `--- Chunk ${i + 1}:\n${doc.pageContent}`)
  .join("\n\n");

  const trimmedContext = truncateContext(context);

  // Retrieve past messages
 await saveMessage(userId, "human", userInput);



  // Run model chain
  const result = await chain.invoke({
    context: trimmedContext,
    question: userInput,
    chat_history,
  });

  // Update memory

  await saveMessage(userId, "ai", result);

  return result;
}