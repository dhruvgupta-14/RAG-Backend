# RAG Chatbot — Backend

A production-ready backend for a **Retrieval-Augmented Generation (RAG)** chatbot that allows users to upload documents and ask questions about their content. Built with Node.js, LangChain, Google Gemini, Pinecone, and Firebase.

---

## 🚀 Live Demo

- **Frontend**: (https://rag-frontend-bay.vercel.app/login)
- **Backend API**: (https://rag-backend-n2rm.onrender.com)

---

## 📌 What is RAG?

RAG (Retrieval-Augmented Generation) is an AI technique that:
1. **Indexes** documents by splitting them into chunks and storing vector embeddings in a database
2. **Retrieves** relevant chunks based on semantic similarity to the user's query
3. **Generates** accurate, context-aware answers using an LLM grounded in the retrieved content

This prevents hallucination by ensuring the AI only answers from the provided document context.

---

## 🏗️ Architecture

```
User Query
    ↓
Express API (/ask/ai)
    ↓
Firebase Auth (JWT verification)
    ↓
Gemini Embeddings (RETRIEVAL_QUERY)
    ↓
Pinecone Vector Search (top 5 chunks)
    ↓
LangChain Chain (prompt + chat history + context)
    ↓
Gemini 1.5 Flash (LLM)
    ↓
Response + Save to Firestore
```

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| **Node.js + Express** | Backend framework |
| **LangChain** | RAG pipeline orchestration |
| **Google Gemini** | LLM (gemini-1.5-flash) + Embeddings (gemini-embedding-001) |
| **Pinecone** | Vector database for semantic search |
| **Firebase Admin SDK** | JWT authentication + Firestore chat history |
| **Multer** | File upload handling |
| **pdf-parse** | PDF text extraction |
| **Mammoth** | DOCX text extraction |

---

## 📁 Project Structure

```
backend/
├── controller/
│   ├── embedAndStore.js        # Chunk embedding + Pinecone storage
│   ├── retreiveDocument.js     # RAG retrieval + LLM generation
│   └── memory.controller.js   # Firestore chat history management
├── middleware/
│   ├── multer.js               # File upload config (PDF/DOCX/TXT)
│   └── verifyToken.js          # Firebase JWT verification
├── prompts/
│   └── rag.prompt.js           # LangChain prompt template
├── routes/
│   ├── file.routes.js          # File upload + delete routes
│   └── query.routes.js         # AI query + chat history routes
├── utils/
│   ├── ChatModel.js            # Gemini chat model instance
│   ├── EmbeddingModel.js       # Gemini embedding model instance
│   ├── firebase.js             # Firebase Admin SDK setup
│   ├── loaders.js              # Document loaders (PDF/DOCX/TXT)
│   └── Pinecone.js             # Pinecone client setup
├── temp/                       # Temporary file storage (auto-deleted)
├── .env.example                # Environment variables template
├── index.js                    # Express app entry point
└── package.json
```

---

## 🔌 API Endpoints

### Authentication
All endpoints require a Firebase JWT token in the Authorization header:
```
Authorization: Bearer <firebase_id_token>
```

---

### File Management

#### Upload Document
```http
POST /file/upload
Content-Type: multipart/form-data

Body: file (PDF, DOCX, or TXT — max 40MB)
```

**What happens internally:**
1. Multer saves file to `/temp`
2. Appropriate loader extracts text (PDFLoader/DocxLoader/TextLoader)
3. RecursiveCharacterTextSplitter chunks text (1000 chars, 100 overlap)
4. Gemini embeds each chunk (gemini-embedding-001, 3072 dimensions)
5. Vectors stored in Pinecone under sanitized filename namespace
6. Temp file deleted

**Response:**
```json
{ "message": "File uploaded successfully" }
```

---

#### Delete Document
```http
DELETE /file/delete/:filename
```

**What happens internally:**
1. Pinecone namespace deleted
2. Firestore chat history cleared for user
3. User can upload fresh document

**Response:**
```json
{ "message": "File and history deleted successfully" }
```

---

### AI Query

#### Ask Question
```http
POST /ask/ai
Content-Type: application/json

{
  "query": "What is this document about?",
  "namespace": "filename_pdf"
}
```

**What happens internally:**
1. Query embedded with RETRIEVAL_QUERY taskType
2. Top 5 semantically similar chunks retrieved from Pinecone
3. Last 10 messages loaded from Firestore (token control)
4. LangChain chain invoked: prompt → Gemini → StringOutputParser
5. Response + messages saved to Firestore

**Response:**
```json
{ "answer": "This document is about..." }
```

---

#### Get Chat History
```http
GET /chat/history
```

Returns full conversation history from Firestore for display in frontend.

**Response:**
```json
{
  "messages": [
    { "role": "human", "content": "What is RAG?", "timestamp": "2026-03-22T..." },
    { "role": "ai", "content": "RAG stands for...", "timestamp": "2026-03-22T..." }
  ]
}
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- Pinecone account (free tier)
- Google AI Studio account (free tier)
- Firebase project

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/rag-backend.git
cd rag-backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Fill in your `.env`:
```env
PORT=3000

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=your_index_name

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Set up Pinecone Index
```
Dimensions: 3072
Metric: cosine
Type: Serverless
```

### 5. Run development server
```bash
npm run dev
```

### 6. Run production server
```bash
npm start
```

---

## 🔑 Environment Variables

| Variable | Description | Where to get |
|---|---|---|
| `PORT` | Server port | Any port e.g. 3000 |
| `GEMINI_API_KEY` | Google Gemini API key | aistudio.google.com |
| `PINECONE_API_KEY` | Pinecone API key | pinecone.io |
| `PINECONE_INDEX_NAME` | Pinecone index name | pinecone.io |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console → Settings |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Firebase Console → Service Accounts |
| `FIREBASE_PRIVATE_KEY` | Service account private key | Firebase Console → Service Accounts |

---

## 🧠 Key Design Decisions

### Why RAG over Fine-tuning?
- No model retraining needed — just update the document
- Works with private/recent data not in training set
- More cost-effective for document Q&A use cases

### Why Pinecone Namespaces?
Each uploaded document gets its own namespace (sanitized filename). This isolates documents so queries only search the relevant document's chunks.

### Why Firestore for Memory?
In-memory (RAM) storage is lost on server restart. Free tier servers spin down when idle. Firestore persists conversation history across restarts and scales automatically.

### Why Limit Chat History to 10 Messages?
Sending full history to Gemini every request increases token usage linearly. Limiting to last 10 messages keeps token usage stable while maintaining conversational context.

### Why Two TaskTypes for Embeddings?
- `RETRIEVAL_DOCUMENT` → optimizes chunk vectors for being retrieved
- `RETRIEVAL_QUERY` → optimizes query vectors for searching

Using the correct taskType improves semantic search quality.

### Chunking Strategy
```
chunkSize: 1000 characters
chunkOverlap: 100 characters
```
Overlap ensures context isn't lost at chunk boundaries. Larger chunks (1000) reduce the risk of splitting related content.

---

## 📊 Free Tier Limits

| Service | Free Limit |
|---|---|
| Gemini 1.5 Flash | 1500 requests/day |
| Gemini Embedding | Generous free tier |
| Pinecone | 2GB storage, 1 index |
| Firebase Firestore | 1GB storage, 50K reads/day |
| Render (backend) | 750 hours/month |

---

## 🐛 Known Issues & Tech Debt

- [ ] Chat history stored per user, not per document namespace — deleting a file clears ALL history for that user
- [ ] No rate limiting on API endpoints
- [ ] Memory not isolated per namespace (planned improvement)

---

## 🔮 Planned Improvements

- [ ] Store chat history per namespace (per document)
- [ ] Streaming responses for better UX
- [ ] Rate limiting middleware
- [ ] Support for more file types (PPTX, Excel)
- [ ] Multi-document querying

---

## 👨‍💻 Author

**Dhruv Gupta**
- 3rd Year Economics (BS), IIT Kharagpur
- GitHub: [@dhruvgupta-14](https://github.com/dhruvgupta-14)
- LinkedIn: [dhruv-gupta](https://www.linkedin.com/in/dhruv-gupta-9285692a2/)

---

