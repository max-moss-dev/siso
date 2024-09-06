from fastapi import FastAPI, HTTPException, Depends, Path
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Union, Any
from openai import OpenAI
import os
from dotenv import load_dotenv
import logging
from sqlalchemy import create_engine, Column, String, JSON, ForeignKey, inspect, Integer, func, text, Text
from sqlalchemy.orm import sessionmaker, Session, relationship, declarative_base
from uuid import uuid4
from sqlalchemy.exc import SQLAlchemyError
from datetime import datetime, timezone
import json
from fastapi.responses import JSONResponse
import ast
import re

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

# Database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./persistent_db.sqlite"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class ProjectModel(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)

class ContextBlockModel(Base):
    __tablename__ = "context_blocks"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    title = Column(String, index=True)
    content = Column(JSON)
    type = Column(String)
    order = Column(Integer)

    project = relationship("ProjectModel", back_populates="context_blocks")

ProjectModel.context_blocks = relationship("ContextBlockModel", back_populates="project")

class ChatMessageModel(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"))
    role = Column(String)
    content = Column(Text)
    timestamp = Column(String)
    context_update = Column(JSON)

    project = relationship("ProjectModel", back_populates="chat_messages")

ProjectModel.chat_messages = relationship("ChatMessageModel", back_populates="project", cascade="all, delete-orphan")

def recreate_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        create_default_project(db)
    finally:
        db.close()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ContextBlock(BaseModel):
    title: str
    content: Union[str, List[str]]
    type: str

class ChatRequest(BaseModel):
    message: str

class GenerateContentRequest(BaseModel):
    block_id: str

class ProjectCreate(BaseModel):
    name: str

class ProjectUpdate(BaseModel):
    name: str

class ReorderBlocksRequest(BaseModel):
    blocks: List[str]

class ContextUpdate(BaseModel):
    block_id: str
    block_title: str
    new_content: str

class ChatResponse(BaseModel):
    response: str
    context_updates: Optional[List[ContextUpdate]] = None

def add_order_column_if_not_exists(engine):
    inspector = inspect(engine)
    if 'order' not in [column['name'] for column in inspector.get_columns('context_blocks')]:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE context_blocks ADD COLUMN 'order' INTEGER"))
            conn.commit()

def initialize_block_order(db: Session):
    projects = db.query(ProjectModel).all()
    for project in projects:
        blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project.id).all()
        for index, block in enumerate(blocks):
            block.order = index
    db.commit()

@app.on_event("startup")
async def startup_event():
    create_tables()
    add_order_column_if_not_exists(engine)
    add_context_update_column_if_not_exists(engine)
    db = SessionLocal()
    try:
        projects = db.query(ProjectModel).all()
        if not projects:
            create_default_project(db)
        initialize_block_order(db)
    finally:
        db.close()

def create_tables():
    Base.metadata.create_all(bind=engine)

@app.post("/projects/{project_id}/context_blocks")
async def add_context_block(project_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    max_order = db.query(func.max(ContextBlockModel.order)).filter(ContextBlockModel.project_id == project_id).scalar() or -1
    db_block = ContextBlockModel(
        id=str(uuid4()),
        project_id=project_id,
        title=block.title,
        content=block.content,
        type=block.type,
        order=max_order + 1
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@app.get("/projects/{project_id}/context_blocks")
async def get_context_blocks(project_id: str, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).order_by(ContextBlockModel.order).all()
    return blocks

@app.put("/projects/{project_id}/context_blocks/{block_id}")
async def update_context_block(project_id: str, block_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.project_id == project_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")
    db_block.title = block.title
    db_block.content = block.content
    db_block.type = block.type
    db.commit()
    db.refresh(db_block)
    return db_block

@app.delete("/projects/{project_id}/context_blocks/{block_id}")
async def delete_context_block(project_id: str, block_id: str, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.project_id == project_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")
    db.delete(db_block)
    db.commit()
    return {"message": "Context block deleted successfully"}

@app.post("/projects/{project_id}/chat")
async def chat(project_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).all()
    context = "\n".join([f"Block ID: {block.id}, Title: {block.title}, Content: {block.content}" for block in blocks])
    
    chat_history = db.query(ChatMessageModel).filter(ChatMessageModel.project_id == project_id).order_by(ChatMessageModel.timestamp).all()
    
    messages = [
        {"role": "system", "content": f"""Project: {project.name}
Context Blocks:
{context}

Use the above context to answer the user's questions. If you need to update multiple context blocks, respond with a JSON object in the following format:
{{
    "response": "Your response to the user",
    "context_updates": [
        {{"block_id": "id1", "new_content": "updated content for block 1"}},
        {{"block_id": "id2", "new_content": "updated content for block 2"}}
    ]
}}
Make sure to use the correct block IDs when suggesting updates."""},
        *[{"role": msg.role, "content": msg.content} for msg in chat_history if msg.content is not None],
        {"role": "user", "content": request.message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages,
        functions=[
            {
                "name": "update_context_blocks",
                "description": "Update multiple context blocks with new content",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "response": {"type": "string"},
                        "context_updates": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "block_id": {"type": "string"},
                                    "new_content": {"type": "string"}
                                },
                                "required": ["block_id", "new_content"]
                            }
                        }
                    },
                    "required": ["response", "context_updates"]
                }
            }
        ]
    )
    
    bot_message = response.choices[0].message.content
    context_updates = None

    if response.choices[0].message.function_call:
        function_args = json.loads(response.choices[0].message.function_call.arguments)
        bot_message = function_args.get("response", "")
        raw_context_updates = function_args.get("context_updates", [])

        context_updates = []
        for update in raw_context_updates:
            db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == update["block_id"], ContextBlockModel.project_id == project_id).first()
            if db_block:
                context_updates.append({
                    "block_id": db_block.id,
                    "block_title": db_block.title,
                    "new_content": update["new_content"]
                })
                db_block.pending_content = update["new_content"]

    new_user_message = ChatMessageModel(
        id=str(uuid4()),
        project_id=project_id,
        role="user",
        content=request.message,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    new_bot_message = ChatMessageModel(
        id=str(uuid4()),
        project_id=project_id,
        role="assistant",
        content=bot_message,
        context_update=context_updates,
        timestamp=datetime.now(timezone.utc).isoformat()
    )
    db.add(new_user_message)
    db.add(new_bot_message)
    db.commit()

    return ChatResponse(response=bot_message, context_updates=context_updates)

def process_context_update(db: Session, project_id: str, block_id: str, new_content: str):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.project_id == project_id).first()
    if db_block:
        context_update = {
            "block_id": db_block.id,
            "block_title": db_block.title
        }
        db_block.pending_content = new_content
        logger.info("Context update prepared for block '%s'", db_block.title)
        return context_update
    else:
        logger.warning("Context block with ID '%s' not found", block_id)
        return None

@app.get("/projects/{project_id}/chat_history")
async def get_chat_history(project_id: str, db: Session = Depends(get_db)):
    chat_history = db.query(ChatMessageModel).filter(ChatMessageModel.project_id == project_id).order_by(ChatMessageModel.timestamp).all()
    return [{"role": msg.role, "content": msg.content, "context_updates": msg.context_update} for msg in chat_history]

@app.delete("/projects/{project_id}/chat_history")
async def clear_chat_history(project_id: str, db: Session = Depends(get_db)):
    db.query(ChatMessageModel).filter(ChatMessageModel.project_id == project_id).delete()
    db.commit()
    return {"message": "Chat history cleared successfully"}

@app.post("/projects/{project_id}/generate_content")
async def generate_content(project_id: str, request: GenerateContentRequest, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == request.block_id, ContextBlockModel.project_id == project_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")

    # Fetch all context blocks for the project
    all_blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).order_by(ContextBlockModel.order).all()
    
    # Fetch recent chat messages (e.g., last 10 messages)
    recent_messages = db.query(ChatMessageModel).filter(ChatMessageModel.project_id == project_id).order_by(ChatMessageModel.timestamp.desc()).limit(10).all()
    recent_messages.reverse()  # Reverse to get chronological order

    # Prepare context information
    context_info = "\n\n".join([
        f"Context Block '{block.title}':\n{block.content}"
        for block in all_blocks if block.id != db_block.id
    ])

    chat_context = "\n".join([
        f"{msg.role.capitalize()}: {msg.content}"
        for msg in recent_messages
    ])

    prompt = f"""
    Project Context:
    {context_info}

    Recent Chat History:
    {chat_context}

    Now, generate content for a context block with the title '{db_block.title}'. The content should be in {db_block.type} format.
    Make sure the generated content is coherent with the existing context and recent conversations.
    Important: Do not include the title in the generated content. Start directly with the relevant information.
    """

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates content for context blocks. Use the provided context to create relevant and coherent content."},
            {"role": "user", "content": prompt}
        ]
    )
    
    generated_content = response.choices[0].message.content
    
    if db_block.type == 'list':
        generated_content = generated_content.split('\n')
    
    db_block.content = generated_content
    db.commit()
    db.refresh(db_block)
    
    return {"content": generated_content}

@app.post("/projects")
async def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    new_project = ProjectModel(id=str(uuid4()), name=project.name)
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@app.get("/projects")
async def get_projects(db: Session = Depends(get_db)):
    projects = db.query(ProjectModel).all()
    return projects

@app.get("/projects/{project_id}/context_blocks")
async def get_context_blocks(project_id: str, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).all()
    return blocks

@app.post("/projects/{project_id}/context_blocks")
async def add_context_block(project_id: str, block: ContextBlock, db: Session = Depends(get_db)):
    db_block = ContextBlockModel(
        id=str(uuid4()),
        project_id=project_id,
        title=block.title,
        content=block.content,
        type=block.type
    )
    db.add(db_block)
    db.commit()
    db.refresh(db_block)
    return db_block

@app.post("/projects/{project_id}/chat")
async def chat(project_id: str, request: ChatRequest, db: Session = Depends(get_db)):
    blocks = db.query(ContextBlockModel).filter(ContextBlockModel.project_id == project_id).all()
    context = "\n".join([f"{block.title}: {block.content}" for block in blocks])
    
    messages = [
        {"role": "system", "content": f"Context:\n{context}\n\nUse the above context to answer the user's questions."},
        *request.history,
        {"role": "user", "content": request.message}
    ]
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=messages
    )
    
    bot_message = response.choices[0].message.content
    return {"response": bot_message}

@app.post("/projects/{project_id}/generate_content")
async def generate_content(project_id: str, request: GenerateContentRequest, db: Session = Depends(get_db)):
    db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == request.block_id, ContextBlockModel.project_id == project_id).first()
    if db_block is None:
        raise HTTPException(status_code=404, detail="Context block not found")

    prompt = f"Generate content for a context block with the title '{db_block.title}'. The content should be in {db_block.type} format."
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that generates content for context blocks."},
            {"role": "user", "content": prompt}
        ]
    )
    
    generated_content = response.choices[0].message.content
    
    if db_block.type == 'list':
        generated_content = generated_content.split('\n')
    
    db_block.content = generated_content
    db.commit()
    db.refresh(db_block)
    
    return {"content": generated_content}

@app.put("/projects/{project_id}")
async def update_project(project_id: str, project: ProjectUpdate, db: Session = Depends(get_db)):
    db_project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db_project.name = project.name
    db.commit()
    db.refresh(db_project)
    return db_project

@app.delete("/projects/{project_id}")
async def delete_project(project_id: str, db: Session = Depends(get_db)):
    db_project = db.query(ProjectModel).filter(ProjectModel.id == project_id).first()
    if db_project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(db_project)
    db.commit()
    return {"message": "Project deleted successfully"}

def create_default_project(db: Session):
    default_project = ProjectModel(id=str(uuid4()), name="Default Project")
    db.add(default_project)
    db.commit()
    db.refresh(default_project)
    return default_project

@app.post("/projects/{project_id}/fix_content")
async def fix_content(project_id: str, request: dict, db: Session = Depends(get_db)):
    block_id = request.get('block_id')
    content = request.get('content')
    
    # Call your AI model to fix the content
    fixed_content = await call_ai_model_to_fix(content)
    
    # We're not updating the database here anymore
    # Instead, we're just returning the fixed content
    return {"fixed_content": fixed_content}

async def call_ai_model_to_fix(content: str):
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are an AI that fixes semantic issues and typos in text. Respond only with the corrected text, without any explanations or additional comments."},
            {"role": "user", "content": f"Fix any semantic issues and typos in the following text:\n\n{content}"}
        ]
    )
    return response.choices[0].message.content

@app.put("/projects/{project_id}/reorder_blocks")
async def reorder_blocks(project_id: str, request: ReorderBlocksRequest, db: Session = Depends(get_db)):
    blocks = request.blocks
    for index, block_id in enumerate(blocks):
        db_block = db.query(ContextBlockModel).filter(ContextBlockModel.id == block_id, ContextBlockModel.project_id == project_id).first()
        if db_block is None:
            raise HTTPException(status_code=404, detail=f"Context block with id {block_id} not found")
        db_block.order = index
    db.commit()
    return {"message": "Blocks reordered successfully"}

def add_context_update_column_if_not_exists(engine):
    inspector = inspect(engine)
    if 'context_update' not in [column['name'] for column in inspector.get_columns('chat_messages')]:
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE chat_messages ADD COLUMN context_update JSON"))
            conn.commit()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)