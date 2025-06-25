https://python.langchain.com/docs/tutorials/rag/

Multer handles PDF upload
Use LangChain.js PDFLoader to extract text
Use LangChain.js TextSplitter to chunk it
Use OpenAI/HF Embeddings to vectorize chunks
Store in Pinecone (or local MemoryVectorStore)
On user query:
   - Embed query
   - Search for similar chunks
   - Feed result into GPT (via LangChain)
Return response

Retrieval-Augmented Generation (RAG) - Project Overview
What is RAG?
RAG consists of two main components:
Indexing (Preprocessing)
Retrieval and Generation (Runtime)

1. Indexing Pipeline
This happens before user queries — usually offline. The goal is to ingest and prepare data for semantic search.

Steps Involved:
 a. Load Documents
   In this project, we use LangChain’s PDFLoader, which:
   Loads PDF files
   Works locally (from the file system only)
   Does not support cloud URLs directly

b. Split into Chunks
   Long documents are broken into smaller pieces for effective embedding.

   There are multiple chunking techniques:
    Length-based
    Text-based
    Document-based
    Semantic-based
    In this project, we use text-based recursive chunking, via RecursiveCharacterTextSplitter.
    This tries to split documents without breaking sentences or words, while keeping chunks within a size limit (e.g. 500 characters) and some overlap (e.g. 50 characters).

c. Generate Embeddings
    Each chunk is converted into a numerical vector using Azure OpenAI’s embedding model (text-embedding-small-3).

d. Store in Vector DB (Pinecone)
   We use Pinecone to store these embeddings.

  A namespace is used to logically separate data.
   In our case, each PDF gets its own namespace within the Pinecone index.

2. Retrieval & Generation Pipeline
This runs at runtime, when the user submits a query.

Steps:
User enters a question
We embed the question
We search Pinecone for similar chunks using vector similarity
The top-k relevant chunks are passed to the LLM (via prompt)
The model generates an answer grounded in your data


