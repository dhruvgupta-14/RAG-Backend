import { RunnableSequence } from "@langchain/core/runnables";
import { ChatPromptTemplate, MessagesPlaceholder} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PineconeStore } from "@langchain/pinecone";
import { embeddings } from "../utils/EmbeddingModel.js";
import { index } from "../utils/Pinecone.js";
import { model } from "../utils/ChatModel.js";
import { ChatMessageHistory } from "langchain/memory";

export async function retrieveRelevantDocs(userQuery, namespace) {
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
    namespace,
  });
  const results = await vectorStore.similaritySearch(userQuery, 10); 
  return results;
}

// Global Memory 
const userMemoryMap=new Map();
export function getMemoryForUser(userId) {
  if (!userMemoryMap.has(userId)) {
    userMemoryMap.set(userId, new ChatMessageHistory());
  }
  return userMemoryMap.get(userId);
}


const prompt = ChatPromptTemplate.fromMessages([
["system", `You are an intelligent and reliable AI research assistant designed to help users gain deep, insightful understanding of technical and academic content. 

You will receive:
- A **context** (relevant chunk from a PDF or document)
- A **user question**, which may be part of a quiz or an exploratory query

Your responsibilities:
1. **Understand and answer based strictly on the given context.**
   - If the answer is not present in the context, respond with:
    "I couldn't find the answer based on the provided context."

2. **Adapt to user input.**
   - Users may ask follow-up questions that relate to the previous one, or shift to a new topic entirely.
   - Be flexible in handling both flows.

3. **Handle user mistakes.**
   - Users might make minor spelling or phrasing errors in their questions.
   - Use your understanding and the context intelligently to interpret and answer correctly — but do **not hallucinate** or assume facts beyond what is provided.

4. **Maintain a helpful and clear tone.**
   - Structure your answer in a way that not only provides the correct response but also helps the user understand the reasoning behind it if possible.

5. **Respond to greetings intelligently.**
 Be aware that users may greet you before asking a question. or ask some funny questions. between chat you have to act smartly and respond to them in a friendly manner.
 If the user sends a greeting (e.g., “Hi”, “Hello”, “Hey”), respond with a friendly greeting and include:
"I am an AI research assistant. How can I help you today?"

6.**For broad questions like "What is this paper about?"**
   - Summarize the context concisely.
   - If the summary isn’t clear, say:
     "I couldn’t find a direct summary; here’s what I inferred from the available content."

If you refer to something, structure it clearly and cite which part of the context it came from (e.g., page or section if available).

Guidelines:
- Do not hallucinate or assume beyond the given context.
- Structure the answer in a clear and explanatory tone.
- Focus on helping the user understand concepts deeply and correctly.
- When relevant, highlight the source insight or phrasing found in the context.

Begin only after carefully interpreting both the context and the query.
`],
  new MessagesPlaceholder("chat_history"),
  ["human", "Context:\n{context}\n\nQuestion:\n{question}"]
]);


const chain = RunnableSequence.from([
  prompt,
  model,
  new StringOutputParser(),
]);

function truncateContext(text, maxChars = 12000) {
  if (!text) return "";
  return text.length > maxChars ? text.slice(0, maxChars) : text;
}

export async function answerQueryWithMemory(userInput, namespace ,memory) {
  // Retrieve relevant docs
  const docs = await retrieveRelevantDocs(userInput, namespace);

  if (!docs || docs.length === 0) {
    return "I couldn't find the answer based on the provided context.";
  }

  // Build context
  const context = docs
    .map(
      (doc, i) =>
        `--- SOURCE: ${doc.metadata?.source || namespace} | chunk ${
          i + 1
        }\n${doc.pageContent}`
    )
    .join("\n\n");

  const trimmedContext = truncateContext(context);

  // Retrieve past messages
  const chat_history = await memory.getMessages();

  // Run model chain
  const result = await chain.invoke({
    context: trimmedContext,
    question: userInput,
    chat_history,
  });

  // Update memory
  await memory.addUserMessage(userInput);
  await memory.addAIMessage(result);

  return result;
}