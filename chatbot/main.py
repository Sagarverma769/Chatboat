import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional

from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_community.vectorstores import PGVector
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-openai-key-here")
CONNECTION_STRING = "postgresql+psycopg2://postgres:postgrespassword@localhost:5432/enterprise_security"

app = FastAPI(title="Enterprise Security Chatbot API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = OpenAIEmbeddings(model="text-embedding-3-small", openai_api_key=OPENAI_API_KEY)
vector_store = PGVector(
    embedding_function=embeddings,
    collection_name="security_knowledge_base",
    connection_string=CONNECTION_STRING,
)

llm = ChatOpenAI(
    model="gpt-4o",
    temperature=0.1,
    streaming=True,
    openai_api_key=OPENAI_API_KEY,
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

SYSTEM_PROMPT = """You are an Enterprise Security Intelligence AI.
Answer security queries, threat reports, and operational questions strictly using internal context.

Context:
{context}
"""

prompt_template = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{question}"),
])

@app.post("/api/chat/stream")
async def stream_chat(payload: ChatRequest):
    try:
        retriever = vector_store.as_retriever(search_kwargs={"k": 4})
        retrieved_docs = retriever.invoke(payload.message)
        context_str = "\n\n".join([doc.page_content for doc in retrieved_docs])
        
        formatted_history = [
            (msg.role if msg.role != "assistant" else "ai", msg.content) 
            for msg in payload.history
        ]
        
        chain = prompt_template | llm

        async def response_generator():
            async for chunk in chain.astream({
                "context": context_str,
                "chat_history": formatted_history,
                "question": payload.message,
            }):
                if chunk.content:
                    yield f"data: {chunk.content}\n\n"
            yield "data: [DONE]\n\n"

        return StreamingResponse(response_generator(), media_type="text/event-stream")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
