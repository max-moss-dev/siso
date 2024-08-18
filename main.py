from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow the React app's origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize context blocks
context_blocks = {
    "Block 1": {"content": "This is the first context block.", "prompt": "Use this information:"},
    "Block 2": {"content": "This is the second context block.", "prompt": "Consider this:"}
}

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[List[str]]
    selected_block: Optional[str] = None

class ContextBlock(BaseModel):
    name: str
    content: str
    prompt: str

@app.options("/chat")
async def chat_options():
    return {}  # This is needed to handle the preflight request

@app.post("/chat")
async def chat(request: ChatRequest):
    if request.selected_block is None or request.selected_block not in context_blocks:
        context = "No context block selected. Proceeding with general conversation."
    else:
        context = f"{context_blocks[request.selected_block]['prompt']} {context_blocks[request.selected_block]['content']}"
    
    messages = [
        {"role": "system", "content": context},
        *[{"role": "user" if i % 2 == 0 else "assistant", "content": m} for pair in request.history for i, m in enumerate(pair)],
        {"role": "user", "content": request.message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    
    bot_message = response.choices[0].message.content
    return {"response": bot_message}

@app.get("/context_blocks")
async def get_context_blocks():
    return context_blocks

@app.post("/context_blocks")
async def add_context_block(block: ContextBlock):
    if block.name in context_blocks:
        raise HTTPException(status_code=400, detail="Block with this name already exists")
    context_blocks[block.name] = {"content": block.content, "prompt": block.prompt}
    return {"message": "Block added successfully"}

@app.put("/context_blocks/{name}")
async def update_context_block(name: str, block: ContextBlock):
    if name not in context_blocks:
        raise HTTPException(status_code=404, detail="Block not found")
    context_blocks[name] = {"content": block.content, "prompt": block.prompt}
    return {"message": "Block updated successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)