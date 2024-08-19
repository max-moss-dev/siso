from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Union
from openai import OpenAI
import os
from dotenv import load_dotenv
import json
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Load context blocks from file or initialize with default values
def load_context_blocks():
    if os.path.exists("context_blocks.json"):
        with open("context_blocks.json", "r") as f:
            return json.load(f)
    return {}

# Save context blocks to file
def save_context_blocks(blocks):
    with open("context_blocks.json", "w") as f:
        json.dump(blocks, f)

# Initialize context blocks
context_blocks = load_context_blocks()

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
    type: str  # Can be 'string' or 'list'

class ImproveBlockRequest(BaseModel):
    block_name: str

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
    context_blocks[block.name] = {"content": block.content, "prompt": block.prompt, "type": block.type}
    save_context_blocks(context_blocks)
    return {"message": "Block added successfully"}

@app.put("/context_blocks/{name}")
async def update_context_block(name: str, block: ContextBlock):
    if name not in context_blocks:
        raise HTTPException(status_code=404, detail="Block not found")
    context_blocks[name] = {"content": block.content, "prompt": block.prompt, "type": block.type}
    save_context_blocks(context_blocks)
    return {"message": "Block updated successfully"}

@app.delete("/context_blocks/{block_name}")
async def delete_context_block(block_name: str):
    logger.info(f"Attempting to delete block: {block_name}")
    logger.info(f"Current context blocks: {list(context_blocks.keys())}")
    if block_name not in context_blocks:
        logger.warning(f"Block {block_name} not found")
        raise HTTPException(status_code=404, detail="Context block not found")
    del context_blocks[block_name]
    save_context_blocks(context_blocks)
    logger.info(f"Block {block_name} deleted successfully")
    logger.info(f"Updated context blocks: {list(context_blocks.keys())}")
    return {"message": f"Context block '{block_name}' deleted successfully"}

@app.post("/improve_block")
async def improve_block(request: ImproveBlockRequest):
    if request.block_name not in context_blocks:
        raise HTTPException(status_code=404, detail="Block not found")
    
    block = context_blocks[request.block_name]
    current_content = block['content']
    current_prompt = block['prompt']
    block_type = block['type']
    other_blocks = {name: block for name, block in context_blocks.items() if name != request.block_name}
    
    # Define schema based on block type
    if block_type == 'string':
        schema = {
            "type": "object",
            "properties": {
                "content": {"type": "string"}
            },
            "required": ["content"]
        }
    elif block_type == 'list':
        schema = {
            "type": "object",
            "properties": {
                "items": {
                    "type": "array",
                    "items": {"type": "string"}
                }
            },
            "required": ["items"]
        }
    else:
        raise HTTPException(status_code=400, detail="Invalid block type")

    system_message = f"""You are an AI assistant tasked with improving or generating content for a context block.
    Your task is to provide concise, relevant, and factual content without any conversational elements.
    
    Current block name: {request.block_name}
    Current block type: {block_type}
    Current block content: {current_content}
    Current block prompt: {current_prompt}
    
    Other context blocks:
    {json.dumps(other_blocks, indent=2)}
    
    Guidelines:
    1. Generate content specifically for the block named "{request.block_name}".
    2. The content should be in {block_type} format.
    3. Focus on providing clear, concise, and relevant information related to the block's name and prompt.
    4. Do not include any conversational phrases, greetings, or offers to help.
    5. The content should be self-contained and not refer to any external conversation or context.
    6. If the current content is empty, generate appropriate content based on the block's name and prompt.
    7. If the current content exists, improve it by adding relevant details, correcting any errors, or reorganizing for clarity.
    8. Ensure the improved content aligns with and complements the information in other context blocks.
    9. Keep the content factual and avoid speculative or opinion-based statements.
    
    Provide the improved or new content for the block in the specified format."""

    messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": f"Generate or improve the content for the context block named '{request.block_name}'."}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4-0613",
        messages=messages,
        functions=[{
            "name": "improve_context_block",
            "description": "Improve or generate content for a context block",
            "parameters": schema
        }],
        function_call={"name": "improve_context_block"}
    )
    
    improved_content = json.loads(response.choices[0].message.function_call.arguments)
    return {"improved_content": improved_content}

@app.delete("/context_blocks")
async def clear_all_context_blocks():
    global context_blocks
    context_blocks = {}
    save_context_blocks(context_blocks)
    logger.info("All context blocks have been cleared")
    return {"message": "All context blocks have been cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)