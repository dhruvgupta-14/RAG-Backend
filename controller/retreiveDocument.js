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

// Memory (in production, you'd store per user session)
const memory = new ChatMessageHistory();


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

You do **not** have access to any external data or internet. Use only the given context to answer.

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

export async function answerQueryWithMemory(userInput,namespace) {
  const docs = await retrieveRelevantDocs(userInput,namespace);
  const context = docs.map(doc => doc.pageContent).join("\n\n");
  const chat_history = await memory.getMessages();
  const result = await chain.invoke({
    context: context,
    question: userInput,
    chat_history
  });

  await memory.addUserMessage(userInput);
  await memory.addAIMessage(result);
  return result;
}